'use strict';

const mongoose = require('mongoose');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const memberData = require('../access-data/memberData');

/**
 * Accès au données d'un membre :
 * - pour consultation
 */

exports.getMember = (req, res) => {
  logging('info', base, req.sessionID, 'Starting getting member by Id', req.body.id);  
  // Recherche du membre par son id
  memberData
    .findOne(req.sessionID, {_id: mongoose.mongo.ObjectID(req.body.id)})
    .then((member) => {
      if (member) {
        logging('info', base, req.sessionID, `Member with id ${req.body.id} found !`);      
      } else {
        logging('info', base, req.sessionID, `Member with id ${req.body.id} not found !`);
      }
      res.status(httpStatusCodes.OK).json(member);
    })
    .catch((error) => {
      logging('error', base, req.sessionID, `Getting member with id ${req.body.id} failed ! ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};
