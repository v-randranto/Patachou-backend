'use strict';

/**************************************************************************************
 *
 * Enregistrement d'un nouveau membre:
 * - vérification que son pseudo n'est pas déjà utilisé
 * - chiffrement de son mot de passe
 * - enregistrement des données en base
 * - envoi d'un email de confirmation à l'adresse fournie
 * TODO que faire quand l'email est KO? il faudrait demander à l'utilisateur de vérifier et modifier son email
 *
 ****************************************************************************************/
const cipher = require('../utils/cipher');
const mailSender = new (require('../utils/email'))();
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const { storePix } = require('../utils/photoHandler');
const memberData = require('../access-data/memberData');
let registerStatus = {
  pseudoUnavailable: false,
  save: false,
  email: false,
};

function NewMember(initObject) {
  this.pseudo = initObject.pseudo;
  this.firstName = initObject.firstName;
  this.lastName = initObject.lastName;
  this.password = initObject.password;
  this.email = initObject.email;
  this.sex = initObject.sex;
  this.birthDate = initObject.birthDate;
  this.presentation = initObject.presentation;
  this.photo = {};
}

const textEmail = function (pseudo) {
  // eslint-disable-next-line no-undef
  return `<html><body><p>Bonjour ${pseudo},<br>${process.env.EMAIL_TEXT}</body></html>`;
};

exports.addMember = async (req, res) => {
  logging('info', base, req.sessionID, 'Starting registering new member...');
  const bodyLog = new NewMember(req.body.member);
  bodyLog.password = '***';
  bodyLog.salt = '***';

  logging('info', base, req.sessionID, 'Starting checking pseudo availability...',
    JSON.stringify(bodyLog)
  );
  const newMember = new NewMember(req.body.member);

  /*-----------------------------------------------------------------------------*
   * Vérification de la disponibilité du pseudonyme
   *-----------------------------------------------------------------------------*/
  await memberData
    .findOne(req.sessionID, { pseudo: newMember.pseudo })
    .then((member) => {
      if (member) {
        logging('info', base, req.sessionID, `Pseudo ${newMember.pseudo} is already in use !`
        );
        registerStatus.pseudoUnavailable = true;
        // res.status(httpStatusCodes.OK).json(registerStatus);
        return;
      } else {
        logging('info', base, req.sessionID, `Pseudo ${newMember.pseudo} is available`
        );
      
      }
    }).catch((error) => {
      logging('error', base, req.sessionID, `Checking pseudo has failed ! ${error}`
      );
      throw error;
    });

    if (registerStatus.pseudoUnavailable) {
      res.status(httpStatusCodes.OK).json(registerStatus);
      return;
    }
  /*-------------------------------------------------------------------------*
   * Chiffrage du mot de passe
   *-------------------------------------------------------------------------*/
  await (function () {
    return new Promise((resolve, reject) => {
      // hachage avec sel du mot de passe
      try {
        logging('info', base, req.sessionID, `Let's do some hashin' and saltin'...`
        );
        const { hash, salt } = cipher.getSaltHash(newMember.password);
        newMember.password = hash;
        newMember.salt = salt;
        logging('info', base, req.sessionID, `Successful hashin' and saltin'!`);
        resolve(true);
      } catch (error) {
        logging(
          'error',
          base,
          req.sessionID,
          `The hashin' and saltin' didn't go down well!`
        );
        reject(error);
      }
    });
  })();

  /*-----------------------------------------------------------------------------*
   * stockage de la photo 
   *----------------------------------------------------------------------------*/  
  await (function () {
    return new Promise((resolve, reject) => {
      if (req.body.photo) {
        const memberPhoto = req.body.photo;
        logging('info', base, req.sessionID, `${newMember.pseudo} has a nice picture ${memberPhoto.name}.` );        
        storePix(req.sessionID, memberPhoto.content)
        .then((result) => {
          newMember.photoUrl = result.secure_url;
          resolve(true);
        })
        .catch((error) => {
          reject(error);
        });          
      } else {
        logging( 'info', base, req.sessionID, `${newMember.pseudo} has no picture.`); 
        resolve(true);       
      }        
    });
  })();

  /*-----------------------------------------------------------------------------*
   * Enregistrement en base du nouveau membre
   *----------------------------------------------------------------------------*/
  await memberData
    .addOne(req.sessionID, newMember)
    .then(() => {
      logging('info', base, req.sessionID, 'Adding member is successful !');
      registerStatus.save = true;
      return;
    })
    .catch((error) => {
      logging('error', base, req.sessionID, `Adding member has failed ! ${error}`
      );
      throw error;
    });

  /*-----------------------------------------------------------------------------*
   * Envoi de l'email de confirmation
   *----------------------------------------------------------------------------*/
  await mailSender
    // eslint-disable-next-line no-undef
    .send(
      newMember.email,
      // eslint-disable-next-line no-undef
      process.env.EMAIL_SUBJECT,
      textEmail(newMember.pseudo)
    )
    .then(() => {
      logging('info', base, req.sessionID, ' Email processing successfull !');
      registerStatus.email = true;
      return;
    })
    .catch((error) => {
      // une erreur sur le traitement email n'est pas propagée
      logging('error', base, req.sessionID, `Email processing has failed ! ${error}`
      );
    });

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/
  logging('info', base, req.sessionID, `Final registering status`, JSON.stringify(registerStatus));
  if (registerStatus.save) {
    res.status(httpStatusCodes.CREATED).json(registerStatus);
  } else {
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).send();
  }
};
