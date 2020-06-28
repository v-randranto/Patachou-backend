'use strict';

// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const { toTitleCase } = require('../utils/titleCase');
const mailSender = new (require('../utils/email'))();


/*-----------------------------------------------------------------------------*
   * Envoi de l'email de confirmation
   *----------------------------------------------------------------------------*/
exports.email = (req, res) => { 

  if (!req.body || !req.body.sender || !req.body.recipient || !req.body.subject || !req.body.message) {
      logging('error', base, req.sessionID, 'Bad request on contact email');
      res.status(httpStatusCodes.BAD_REQUEST).end();
    }  

  mailSender
    .send(
      req.body.sender,
      req.body.recipient,
      req.body.subject,
      req.body.message
    )
    .then(() => {
      logging('info', base, req.sessionID, ' Email processing successfull !');
      return;
    })
    .catch(error => {
      // une erreur sur le traitement email n'est pas bloquante
      logging('error', base, req.sessionID, `Email processing has failed ! ${error}`);
    });
}