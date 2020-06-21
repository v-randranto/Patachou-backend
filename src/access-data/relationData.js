'use strict';
const mongoose = require('mongoose');
const Relation = require('../models/relationship');
const { logging } = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

/*=======================================================================================*
 *
 *  enregistrement d'une demande d'ajout d'ami
 *
 *=======================================================================================*/

exports.addOne = (sessionID, relation) => {
  
  logging('info', base, sessionID, 'Starting saving relation...', JSON.stringify(relation));
  return new Promise((resolve, reject) => {
    const newRelation = new Relation(relation);
    newRelation
      .save()
      .then(() => {
        logging('info', base, sessionID, 'saving relation successful !');
        resolve(true);
      })
      .catch((error) => {
        logging('error', base, sessionID, 'saving relation failed !');
        reject(error);
      });
  });
};

/*=======================================================================================*
 *
 *  Requête des relations d'un membre:
 *  - la réponse contient le statut de la relation et des données du membre ami 
 *
 *=======================================================================================*/

exports.findAndPopulate = (sessionID, param) => {
  logging('info', base, sessionID, 'Starting finding relation param...', JSON.stringify(param) );

  return new Promise((resolve, reject) => {
    Relation
    .find(param.query)
    .populate({
      path: 'receiver',
      match: { _id: { $ne: param.id} },
      select: param.accountFields,
    })
    .populate({
      path: 'requester',
      match: { _id: { $ne: param.id} },
      select: param.accountFields,
    })
    .then((relations) => {
      if (relations) {
        logging('info', base, sessionID, `Finding sent request successfull !`);
        resolve(relations);
      } else {
        logging('info', base, sessionID, 'No sent request found !');
        resolve(false);
      }
    })
    .catch((error) => {
      reject(error);
    });
  });
};

/*=======================================================================================*
 *
 *  Requête des relations d'un membre:
 *
 *=======================================================================================*/

exports.find = (sessionID, param) => {
  logging('info', base, sessionID, 'Starting finding relation param...', JSON.stringify(param) );

  return new Promise((resolve, reject) => {
    Relation
    .find(param.query)
    .then((relations) => {
      if (relations) {
        logging('info', base, sessionID, `Finding sent request successfull !`);
        resolve(relations);
      } else {
        logging('info', base, sessionID, 'No sent request found !');
        resolve(false);
      }
    })
    .catch((error) => {
      reject(error);
    });
  });
};

/*=======================================================================================*
 *
 *  Requête d'une relation
 *
 *=======================================================================================*/

exports.findOne = (sessionID, param) => {
  logging('info', base, sessionID, 'Starting finding relation...', JSON.stringify(param.query));

  return new Promise((resolve, reject) => {
    Relation.findOne(param.query, param.fields)
      .then((relation) => {
        if (relation) {
          logging('info', base, sessionID, `Finding relation request successfull !`);
          resolve(relation);
        } else {
          logging('info', base, sessionID, 'relation request not found !');
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};

/*=======================================================================================*
 *
 *  Mise à jour du statut d'une relation
 *
 *=======================================================================================*/
exports.update = (sessionID, param) => {
  logging('info', base, sessionID, 'Starting updating relation...', JSON.stringify(param));
  return new Promise((resolve, reject) => {
    Relation.findOneAndUpdate(param.query, param.fields, {new: true})
      .then((relation) => {
        logging('info', base, sessionID, 'Updating relation successful !', JSON.stringify(relation));
        resolve(relation);
      })
      .catch((error) => {
        logging('error', base, sessionID, 'Updating relation failed !');
        reject(error);
      });
  });
};

/*=======================================================================================*
 *
 *  Suppression d'une relation
 *
 *=======================================================================================*/
exports.deleteOne = (sessionID, id) => {
  logging('info', base, sessionID, 'Starting deleting relation...', JSON.stringify(id));
  return new Promise((resolve, reject) => {
    Relation.deleteOne({ _id: mongoose.mongo.ObjectId(id) })
      .then(() => {
        logging('info', base, sessionID, 'Deleting relation successfull !');
        resolve;
      })
      .catch((error) => {
        logging('error', base, sessionID, 'Deleting relation failed !');
        reject(error);
      });
  });
};
