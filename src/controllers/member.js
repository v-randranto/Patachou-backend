'use strict';

/**************************************************************************************
 *
 * Gestion du compte d'un membre:
 * - récupération des données du compte à partir de son id
 * - récupération de plusieurs comptes
 *
 ****************************************************************************************/
const mongoose = require('mongoose');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const accountData = require('../access-data/accountData');

exports.checkPseudo = (req, res) => {
  logging('info', base, req.sessionID, `Starting getting account with pseudo ${req.body.pseudo}`);
  // Recherche du membre par son id
  const param = {
    query: { pseudo: req.body.pseudo },
    fields: '_id pseudo'
  }
  accountData
    .findOne(req.sessionID, param)
    .then((account) => {
      let pseudoUnavailable = false;
      if (account) {        
        logging('info', base, req.sessionID, `Account found ! ${JSON.stringify(account)}`);
        pseudoUnavailable = true;
      } else {
        logging('info', base, req.sessionID, `Account with pseudo ${req.body.pseudo} not found !`);
      }
      res.status(httpStatusCodes.OK).json(pseudoUnavailable);
    })
    .catch((error) => {
      logging('error', base, req.sessionID, 
      `Getting account with pseudo ${req.body.pseudo} failed ! ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};

exports.getAccount = (req, res) => {
  logging('info', base, req.sessionID, 'Starting getting account by Id', req.body.id);
  // Recherche du membre par son id
  const param = {
    query: { _id: mongoose.mongo.ObjectID(req.body.id) },
    fields: '_id pseudo firstName lastName email sex birthDate presentation photoUrl creationDate'
  }
  accountData
    .findOne(req.sessionID, param)
    .then((account) => {
      if (account) {
        logging('info', base, req.sessionID, `Account with id ${req.body.id} found !`);
      } else {
        logging('info', base, req.sessionID, `Account with id ${req.body.id} not found !`);
      }
      res.status(httpStatusCodes.OK).json(account);
    })
    .catch((error) => {
      logging('error', base, req.sessionID, 
      `Getting account with id ${req.body.id} failed ! ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};

exports.searchAccounts = (req, res) => {
  logging('info', base, req.sessionID, `Starting getting accounts with ${JSON.stringify(req.body)}`);
  const value = {
    $regex: req.body.term,
    $options: 'i',
  };
  const _id = mongoose.mongo.ObjectID(req.body.id);

  const param = {
    query: { 
      $and: [
        { _id: { $ne: _id } }, 
        { $or: [{ pseudo: value }, { firstName: value }, { lastName: value }] }
      ],     
    },
    fields: '_id pseudo firstName lastName sex email presentation photoUrl'
  };

  accountData
    .find(req.sessionID, param)
    .then((accounts) => {
      if (accounts.lentgh) {
        logging('info', base, req.sessionID, `${accounts.lentgh} Accounts found !`);
      } else {
        logging('info', base, req.sessionID, `No account !`);
      }
      res.status(httpStatusCodes.OK).json(accounts);
    })
    .catch((error) => {
      logging('error', base, req.sessionID, `Getting accounts with query ${param} failed ! `, JSON.stringify(error));
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};
