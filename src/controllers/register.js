'use strict';

const cipher = require('../utils/cipher');
const mailSender = new (require('../utils/email'))();
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const memberData = require('../access-data/memberData');
let registerStatus = {
  pseudoUnavalaible: false,
  save: false,
  email: false
}

/**
 * Enregistrement d'un nouveau membre:
 * - vérification que son pseudo n'est pas déjà utilisé
 * - chiffrement de son mot de passe
 * - enregistrement des données en base
 * - envoi d'un email de confirmation à l'adresse fournie
 * TODO que faire quand l'email est KO? il faudrait demander à l'utilisateur de vérifier et modifier son email
 */

function NewMember (initObject) {
  this.pseudo = initObject.pseudo;
  this.firstName = initObject.firstName,
  this.lastName = initObject.lastName,
  this.password = initObject.password,
  this.email = initObject.email;
  this.sex = initObject.sex;
  this.birthDate = initObject.birthDate;
  this.presentation = initObject.presentation;
  this.photo = initObject.photo;
}

exports.addMember = (req, res) => {
  
  logging('info', base, req.sessionID, 'Starting registering new member...');
  const bodyLog = new NewMember(req.body); // A factoriser
  bodyLog.password = '***';
  if (bodyLog.photo) {
    bodyLog.photo.content = '...';
  }
  logging(
    'info',
    base,
    req.sessionID,
    'Starting checking pseudo availability...',
    JSON.stringify(bodyLog)
  );

  const member = new NewMember(req.body);
  // Recherche d'un membre avec le pseudo
  memberData
    .findOne(req.sessionID, {pseudo: member.pseudo})
    .then((member) => {
      if (member) {
        logging('info', base, req.sessionID, `Pseudo ${member.pseudo} already in use !`);
        registerStatus.pseudoUnavalaible = true;
        res.status(httpStatusCodes.OK).json(registerStatus);
      } else {
        logging('info', base, req.sessionID, `Pseudo ${member.pseudo} available`);
        return;
      }
    })
    .then(() => {
      // hachage avec sel du mot de passe
      const { hash, salt } = cipher.getSaltHash(member.password);
      member.password = hash;
      member.salt = salt;
      return;
    })
    .then(() => {
      // enregistrement en base
      memberData
        .addOne(req.sessionID, member)
        .then(() => {
          logging('info', base, req.sessionID, 'Add member successful !');
          registerStatus.save = true;
          return;
        })
        .catch((error) => {
          logging('error', base, req.sessionID, `Add member failed ! ${error}`);
          throw error;
        });
    })
    .then(() => {
      // Envoi de l'email de confirmation
      // eslint-disable-next-line no-undef
      const text = `<html><body><p>Bonjour ${member.pseudo},<br>${process.env.EMAIL_TEXT}</body></html>`;
      mailSender
        // eslint-disable-next-line no-undef
        .send(req.body.email, process.env.EMAIL_SUBJECT, text)
        .then(() => {
          logging(
            'info',
            base,
            req.sessionID,
            ' Email processing successfull !'
          );
          registerStatus.email = true;
        })
        .catch((error) => {
          // une erreur sur le traitement email n'est pas propagée        
          logging('error', base, req.sessionID, `Email processing failed ! ${error}`);
        });
    })
    .then(() => {    
      logging('debug', base, req.sessionID, `Registering status ${registerStatus}`);  
      res.status(httpStatusCodes.CREATED).json(registerStatus);
    })
    .catch((error) => {
      logging('error', base, req.sessionID, `Member registering failed ! ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).send();
    })   
    
};
