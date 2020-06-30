'use strict';

// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const mailSender = new (require('../utils/email'))();


/*-----------------------------------------------------------------------------*
   * Envoi de l'email de confirmation
   *----------------------------------------------------------------------------*/
exports.email = (req, res) => { 

  let emailStatus = false;

  if (!req.body || !req.body.email || !req.body.subject || !req.body.text) {
      logging('error', base, req.sessionID, `Bad request on contact email ${JSON.stringify(req.body)}`);
      res.status(httpStatusCodes.BAD_REQUEST).end();
      return;
    }  
//dans nodemailer, l'alimentation de l'option 'from' n'est pas prise en compte (ballot ça), cette donnée est systématiquement alimenté avec l'adresse du compte gmail, d'où le contournement ci-dessous
  const text = `Email utilisateur: ${req.body.email}<br><br>${req.body.text}` 

  mailSender
    .send(
      req.body.email,
      // eslint-disable-next-line no-undef
      process.env.EMAIL_USER,
      req.body.subject,
      text
    )
    .then(() => {
      emailStatus = true;
      logging('info', base, req.sessionID, ' Email processing successfull !');
      res.status(httpStatusCodes.OK).json(emailStatus);
    })
    .catch(error => {
      // une erreur sur le traitement email n'est pas bloquante
      logging('error', base, req.sessionID, `Email processing has failed ! ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
}