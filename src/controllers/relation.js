'use strict';

/***************************************************************************************
 *
 * Gestion des relations d'un membre:
 * - Prise en compte d'une nouvelle relation (add)
 * - Consulation des relations (getAll)
 * - Rejet d'une demande d'ajout d'ami (update)
 * - Confirmation d'une demande d'ajout d'ami (update)
 * - Termination d'une relation confirmée (update)
 *
 ****************************************************************************************/
const mongoose = require('mongoose');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const mailSender = new (require('../utils/email'))();
const relationData = require('../access-data/relationData');
const Relation = require('../models/relationship');

const textEmail = function (requesterPseudo, receiverPseudo) {
  // eslint-disable-next-line no-undef
  return `<html><body><p>Bonjour ${requesterPseudo},<br>${process.env.EMAIL_REQUEST_TEXT} de ${receiverPseudo}</body></html>`;
};

/*=======================================================================================*
 * Traitement d'une demande d'ajout d'ami:
 * - vérification que les membres ne sont pas déjà en relation TODO
 * - enregistrement en base
 * - envoi d'un email de confirmation à l'adresse fournie
 *=======================================================================================*/

exports.add = async (req, res) => {
  logging(
    'info',
    base,
    req.sessionID,
    'Starting registering new relation...',
    JSON.stringify(req.body)
  );

  let requestStatus = {
    alreadyRelated: false,
    save: false,    
    email: false,
  };  

  // Données à mettre en base
  const relation = req.body.relation;
  relation.requester = mongoose.mongo.ObjectId(relation.requester);
  relation.receiver = mongoose.mongo.ObjectId(relation.receiver);
  // Données complémentaires pour l'envoi d'email
  const complementaryData = req.body.complementaryData;

  /*-----------------------------------------------------------------------------*
   * Vérification de la non existence d'une relation
   *----------------------------------------------------------------------------*/
  // param de la requête pour vérifier l'absence d'une relation

  const param = {
    // query: {      
    //    $and: [{ requester: requesterId }, { receiver: receiverId }] 
    // },
    query: { 
      $or: [ 
      { $and: [{ requester: relation.requester }, { receiver: relation.receiver }] }, 
      { $and: [{ requester: relation.receiver }, { receiver: relation.requester }] } 
    ]},
    fields: '_id'
  };

  await relationData
    .findOne(req.sessionID, param)
    .then((relation) => {
      if (relation) {
        logging('info', base, req.sessionID, `Already in relation ${relation._id}`);
        requestStatus.alreadyRelated = true;
        return;
      } else {
        logging('info', base, req.sessionID, `No relation found`);
      }
    })
    .catch((error) => {
      logging('error', base, req.sessionID, `Checking absence of relation has failed ! ${error}`);
      throw error;
    });

  if (requestStatus.alreadyRelated) {
    res.status(httpStatusCodes.OK).json(requestStatus);
    return;
  }
  /*-----------------------------------------------------------------------------*
   * Enregistrement en base de la demande
   *----------------------------------------------------------------------------*/
  await relationData
    .addOne(req.sessionID, relation)
    .then(() => {
      logging('info', base, req.sessionID, 'Adding relation is successful !');
      requestStatus.save = true;
      return;
    })
    .catch((error) => {
      logging('error', base, req.sessionID, `Adding relation has failed ! ${error}`);
      throw error;
    });

  /*-----------------------------------------------------------------------------*
   * Envoi de l'email de confirmation
   *----------------------------------------------------------------------------*/
  await mailSender
    // eslint-disable-next-line no-undef
    .send(
      complementaryData.receiverEmail,
      // eslint-disable-next-line no-undef
      process.env.EMAIL_REQUEST_SUBJECT,
      textEmail(
        complementaryData.receiverPseudo,
        complementaryData.requesterPseudo
      )
    )
    .then(() => {
      logging('info', base, req.sessionID, ' Email processing successfull !');
      requestStatus.email = true;
      return;
    })
    .catch((error) => {
      // une erreur sur le traitement email n'est pas propagée
      logging('error', base, req.sessionID, `Email processing has failed ! ${error}`);
    });

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/
  logging('info', base, req.sessionID, `Final status`, JSON.stringify(requestStatus));
  if (requestStatus.save) {
    res.status(httpStatusCodes.CREATED).json(requestStatus);
  } else {
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
  }
};
/*=======================================================================================*
 * Requête des relations en attente et confirmées d'un membre
 *=======================================================================================*/

exports.getAll = async (req, res) => {
  logging('info', base, req.sessionID, `Starting getting sent requests for id ${JSON.stringify(req.body)}`);

  const _id = mongoose.mongo.ObjectID(req.body.id);
  const param = { 
    query: {
      $or: [{ requester: _id }, { receiver: _id }],
      status: { $in: ['PENDING', 'CONFIRMED'] },
    },
    accountFields: '_id pseudo firstName lastName presentation photoUrl',
  };

  relationData
    .findAndPopulate(req.sessionID, param, _id)
    .then((relations) => {
      logging('info', base, req.sessionID, 'Getting sent requests is successful !');
      res.status(httpStatusCodes.OK).json(relations);
    })
    .catch((error) => {
      logging('error', base, req.sessionID,  `Getting sent requests has failed ! ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};

/*=======================================================================================*
 *
 *  Mise à jour du statut d'une relation:
 * - rejet d'une relation en attente
 * - acceptation (confirmation) d'une relation en attente
 * - termination d'une relation confirmée
 *
 *=======================================================================================*/
exports.update = async (req, res) => {
  logging('info', base, req.sessionID, `Starting updating relation with ${JSON.stringify(req.body)}`);
  let updateStatus = {
    badRequest: false,
    save: false,
  };
  const param = {
    query : { _id: req.body.id },
    fields : { 
      status: req.body.status,
      modificationDate: Date.now(),
      modificationAuthor: req.body.modificationAuthor }
  };

  let updatedRelation = new Relation();

  /*-------------------------------------------------------------------------*
   * Contrôle que le statut de la relation à modifier est compatible avec la màj
   *-------------------------------------------------------------------------*/
  await relationData
    .findOne(req.sessionID, param)
    .then((relation) => {
      if (!relation) {
        return;
      }
      switch (req.body.status) {
        case 'CONFIRMED':
        case 'REJECTED':
          if (relation.status !== 'PENDING') {
            updateStatus.badRequest = true;
            return;
          }
          break;
        case 'TERMINATED':
          if (relation.status !== 'CONFIRMED') {
            updateStatus.badRequest = true;
            return;
          }
          break;
        default:
          updateStatus.badRequest = true;
      }
      logging('info', base, req.sessionID, 'Checking status is successful !');
    })
    .catch((error) => {
      logging('error', base, req.sessionID, `Checking status has failed ! ${error}`);
      throw error;
    });
  
    if (updateStatus.badRequest) {
      res.status(httpStatusCodes.BAD_REQUEST).end();
      return;  
    }

  /*-------------------------------------------------------------------------*
   * Enregistrement de la màj
   *-------------------------------------------------------------------------*/
  await relationData
    .update(req.sessionID, param)
    .then((relation) => {      
      logging('info', base, req.sessionID, 'Updating relation is successful !', JSON.stringify(relation));
      updateStatus.save = true;
      updatedRelation = relation;
    })
    .catch((error) => {
      logging('error', base, req.sessionID, `Updating relation has failed ! ${error}`);
    });

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/
  logging('info', base, req.sessionID, `Final registering status`, JSON.stringify(updateStatus)
  );
  if (updateStatus.save) {
    res.status(httpStatusCodes.CREATED).json(updatedRelation);
  } else {
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
  }
};
