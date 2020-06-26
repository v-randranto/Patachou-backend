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

// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const { toTitleCase } = require('../utils/titleCase');
const mailSender = new (require('../utils/email'))();
const emailContent = require('../constants/email.json');
const relationData = require('../access-data/relationData');
const Relation = require('../models/relationship');

const textEmail = function (requesterPseudo, receiverPseudo) {
  // eslint-disable-next-line no-undef
  return `<html><body><p>Bonjour ${toTitleCase(requesterPseudo)},<br>${emailContent.REQUEST.text} de ${toTitleCase(receiverPseudo)}</body></html>`;
};

/*=======================================================================================*
 * Traitement d'une demande d'ajout d'ami:
 * - vérification que les membres ne sont pas déjà en relation TODO
 * - enregistrement en base
 * - envoi d'un email de confirmation à l'adresse fournie
 *=======================================================================================*/

exports.add = async (req, res) => {

  if (!req.body) {
    logging('error', base, req.sessionID, 'Bad request on add relation');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }
  
  logging('info', base, req.sessionID, 'Starting registering new relation...', JSON.stringify(req.body)
  );

  // statuts de la demande d'ajout
  let requestStatus = {
    alreadyRelated: false,
    save: false,    
    email: false,
  };  

  // Données à mettre en base
  const relation = req.body.relation;  
  // Données complémentaires pour l'envoi d'email
  const complementaryData = req.body.complementaryData;

  /*-----------------------------------------------------------------------------*
   * Vérification de la non existence d'une relation
   *----------------------------------------------------------------------------*/

  // param de la requête pour vérifier l'absence d'une relation
  const param = {
    query: { 
      $or: [ 
      { $and: [{ requester: relation.requester }, { receiver: relation.receiver }] }, 
      { $and: [{ requester: relation.receiver }, { receiver: relation.requester }] } 
    ]},
    fields: '_id'
  };

  await relationData
    .findOne(req.sessionID, param)
    .then(relation => {
      if (relation) {
        logging('info', base, req.sessionID, `Already in relation ${relation._id}`);
        requestStatus.alreadyRelated = true;
        return;
      } else {
        logging('info', base, req.sessionID, `No relation found`);
      }
    })
    .catch(error => {
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
    .catch(error => {
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
      emailContent.REQUEST.subject,
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
    .catch(error => {
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

  if (!req.body || !req.body.id) {
    logging('error', base, req.sessionID, 'Bad request on get all relations');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }

  logging('info', base, req.sessionID, `Starting getting sent requests for id ${JSON.stringify(req.body)}`);

  const id = req.body.id;
  const param = { 
    query: {
      $or: [{ requester: id }, { receiver: id }],
      status: { $in: ['PENDING', 'CONFIRMED'] },
    },
    accountFields: '_id pseudo firstName lastName presentation photoUrl',
  };

  relationData
    .findAndPopulate(req.sessionID, param, id)
    .then(relations => {
      logging('info', base, req.sessionID, 'Getting sent requests is successful !');
      res.status(httpStatusCodes.OK).json(relations);
    })
    .catch(error => {
      logging('error', base, req.sessionID,  `Getting sent requests has failed ! ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};

/*=======================================================================================*
 * Requête des relations en attente et confirmées d'un membre
 *=======================================================================================*/

exports.wsGetAll = async (socketId, memberId) => {

  let relations = [];

  logging('info', base, socketId, `Starting getting sent requests for id ${memberId}`);

  // const _id = mongoose.mongo.ObjectID(memberId);
  const param = { 
    query: {
      $or: [{ requester: memberId }, { receiver: memberId }],
      status: { $in: ['PENDING', 'CONFIRMED'] },
    },
    accountFields: '_id pseudo firstName lastName presentation photoUrl',
  };

  await relationData
    .findAndPopulate(socketId, param, memberId)
    .then(res => {
      relations = res;
      logging('info', base, socketId, 'Getting sent requests is successful !');      
    })
    .catch(error => {
      logging('error', base, socketId,  `Getting sent requests has failed ! ${error}`);
      throw error;
    });
  
  return relations;
};


/*=======================================================================================*
 *
 *  Mise à jour du statut d'une relation:
 * - rejet d'une relation en attente
 * - acceptation (confirmation) d'une relation en attente
 * - termination d'une relation confirmée
 *
 *=======================================================================================*/
exports.wsUpdate = async (socketId, data) => {

  logging('info', base, socketId, `Starting updating relation  ${data}`);

  // statuts de la mise à jour de la relation
  const updateStatus = {
    badRequest: false,
    save: false
  };

  const param = {
    query : { _id: data.id },
    fields : { 
      status: data.status,
      modificationDate: Date.now(),
      modificationAuthor: data.modificationAuthor }
  };

  let updatedRelation = new Relation();

  /*-----------------------------------------------------------------------------------*
   *   Contrôle que le statut de la relation à modifier est compatible 
   *-----------------------------------------------------------------------------------*/
  await relationData
    .findOne(socketId, param)
    .then(relation => {
      if (!relation) {
        throw new Error('bad request');
      }
      switch (data.status) {
        case 'CONFIRMED':
        case 'REJECTED':
          if (relation.status !== 'PENDING') {
            throw new Error('bad request');
          }
          break;
        case 'TERMINATED':
          if (relation.status !== 'CONFIRMED') {
            updateStatus.badRequest = true;
            throw new Error('bad request');
          }
          break;
        default:
          throw new Error('bad request');
          
      }
      logging('info', base, socketId, 'Checking status is successful !');
    })
    .catch(error => {
      logging('error', base, socketId, `Checking status has failed ! ${error}`);
      throw error;
    });
  

  /*-------------------------------------------------------------------------*
   * Enregistrement de la màj
   *-------------------------------------------------------------------------*/

  await relationData
    .update(socketId, param)
    .then(relation => {      
      logging('info', base, socketId, 'Updating relation is successful !', JSON.stringify(relation));
      updateStatus.save = true;
      updatedRelation = relation;
    })
    .catch(error => {
      logging('error', base, socketId, `Updating relation has failed ! ${error}`);
      
    });

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/

logging('info', base, socketId, `Final registering status`, JSON.stringify(updateStatus)
);

if (updateStatus.save) {
  return updatedRelation;
} else {
  throw new Error('Internal server error')
}
};
