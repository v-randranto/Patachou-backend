'use strict';

/***************************************************************************************
 *
 * Gestion des relations d'un membre:
 * - Prise en compte d'une demande d'ajout d'ami
 * - Rejet d'une demande d'ajout d'ami
 * - Confirmation d'une demande d'ajout d'ami
 * - Termination d'une relation confirmée
 *
 ****************************************************************************************/
const mongoose = require('mongoose');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const mailSender = new (require('../utils/email'))();
const relationData = require('../access-data/relationData');

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
  // Données complémentaires pour l'envoi d'email
  const complementaryData = req.body.complementaryData;

  /*-----------------------------------------------------------------------------*
   * Vérification de la non existence d'une relation
   *----------------------------------------------------------------------------*/
  // TODO
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
      logging(
        'error',
        base,
        req.sessionID,
        `Adding relation has failed ! ${error}`
      );
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
      logging(
        'error',
        base,
        req.sessionID,
        `Email processing has failed ! ${error}`
      );
    });

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/
  logging(
    'info',
    base,
    req.sessionID,
    `Final registering status`,
    JSON.stringify(requestStatus)
  );
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
  logging(
    'info',
    base,
    req.sessionID,
    `Starting getting sent requests for id ${JSON.stringify(req.body)}`
  );

  const _id = mongoose.mongo.ObjectID(req.body.id);
  const param = { 
    query: {
      $or: [{ requester: _id }, { receiver: _id }],
      status: { $in: ['PENDING', 'CONFIRMED'] },
    },
    relationFields: '_id requester receiver status creationDate',
    accountFields: '_id pseudo firstName lastName presentation photoUrl',
  };

  relationData
    .findAndPopulate(req.sessionID, param, _id)
    .then((relations) => {
      logging(
        'info',
        base,
        req.sessionID,
        'Getting sent requests is successful !'
      );
      res.status(httpStatusCodes.OK).json(relations);
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `Getting sent requests has failed ! ${error}`
      );
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
  let updateStatus = {
    save: false,
  };
  const param = [
    { _id: mongoose.mongo.ObjectID(req.body.id) },
    { status: req.body.status },
    { modificationDate: Date.now },
    { modificationAuthor: mongoose.mongo.ObjectID(req.body.modifier) },
  ];

  await relationData
    .findOne(req.sessionID, param)
    .then((relation) => {
      logging(
        'info',
        base,
        req.sessionID,
        'Getting sent requests is successful !'
      );
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `Getting sent requests has failed ! ${error}`
      );
    });

  await relationData
    .update(req.sessionID, param)
    .then((status) => {
      logging(
        'info',
        base,
        req.sessionID,
        'Getting sent requests is successful !'
      );
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `Getting sent requests has failed ! ${error}`
      );
    });

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/
  logging(
    'info',
    base,
    req.sessionID,
    `Final registering status`,
    JSON.stringify(updateStatus)
  );
  if (updateStatus.save) {
    res.status(httpStatusCodes.CREATED).json(updateStatus);
  } else {
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
  }
};
