'use strict';

/**************************************************************************************
 *
 * Enregistrement d'un nouveau membre:
 * - vérification que son pseudo n'est pas déjà utilisé
 * - chiffrement de son mot de passe
 * - enregistrement des données en base
 * - envoi d'un email de confirmation à l'adresse fournie
 *
 ****************************************************************************************/
const cipher = require('../utils/cipher');
const mailSender = new (require('../utils/email'))();
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const { storePix } = require('../utils/photoHandler');
const accountData = require('../access-data/accountData');

// eslint-disable-next-line no-undef
const default_avatar = process.env.DEFAULT_AVATAR;

const registerStatus = {
  pseudoUnavailable: false,
  save: false,
  email: false,
};

function NewAccount(initObject) {
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
  return `<html><body><p>Bonjour ${pseudo},<br>${process.env.EMAIL_REGISTER_TEXT}</body></html>`;
};

exports.addAccount = async (req, res) => {
  logging('info', base, req.sessionID, 'Starting registering new account...');
  const bodyLog = new NewAccount(req.body.member);
  bodyLog.password = '***';
  bodyLog.salt = '***';

  logging('info', base, req.sessionID, 'Starting checking pseudo availability...',
    JSON.stringify(bodyLog)
  );
  const newAccount = new NewAccount(req.body.member);
  const param = {
    query: { pseudo: newAccount.pseudo },
    fields: 'pseudo',
  };

  /*-----------------------------------------------------------------------------*
   * Vérification de la disponibilité du pseudonyme
   *-----------------------------------------------------------------------------*/
  await accountData
    .findOne(req.sessionID, param)
    .then((account) => {
      if (account) {
        logging('info', base, req.sessionID, `Pseudo ${newAccount.pseudo} is already in use !`
        );
        registerStatus.pseudoUnavailable = true;
        return;
      } else {
        logging('info', base, req.sessionID, `Pseudo ${newAccount.pseudo} is available`
        );
        registerStatus.pseudoUnavailable = false;

      }
    })
    .catch((error) => {
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
        logging('info', base, req.sessionID, `Let's do some hashin' and saltin'...`);
        const { hash, salt } = cipher.getSaltHash(newAccount.password);
        newAccount.password = hash;
        newAccount.salt = salt;
        logging('info', base, req.sessionID, `Successful hashin' and saltin'!`);
        resolve(true);
      } catch (error) {
        logging('error', base, req.sessionID, `The hashin' and saltin' didn't go down well!`);
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
        const accountPhoto = req.body.photo;
        logging('info', base, req.sessionID,  `${newAccount.pseudo} has a nice picture ${accountPhoto.name}.`
        );
        storePix(req.sessionID, accountPhoto.content)
          .then((result) => {
            newAccount.photoUrl = result.secure_url;
            resolve(true);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        logging('info', base, req.sessionID, `${newAccount.pseudo} has no picture.` );
        newAccount.photoUrl = default_avatar;
        resolve(true);
      }
    });
  })();

  /*-----------------------------------------------------------------------------*
   * Enregistrement en base du nouveau membre
   *----------------------------------------------------------------------------*/
  await accountData
    .addOne(req.sessionID, newAccount)
    .then(() => {
      logging('info', base, req.sessionID, 'Adding account is successful !');
      registerStatus.save = true;
      return;
    })
    .catch((error) => {
      logging('error', base, req.sessionID, `Adding account has failed ! ${error}`);
      registerStatus.save = false;
      throw error;
    });

  /*-----------------------------------------------------------------------------*
   * Envoi de l'email de confirmation
   *----------------------------------------------------------------------------*/
  await mailSender
    // eslint-disable-next-line no-undef
    .send(
      newAccount.email,
      // eslint-disable-next-line no-undef
      process.env.EMAIL_REGISTER_SUBJECT,
      textEmail(newAccount.pseudo)
    )
    .then(() => {
      logging('info', base, req.sessionID, ' Email processing successfull !');
      registerStatus.email = true;
      return;
    })
    .catch((error) => {
      // une erreur sur le traitement email n'est pas bloquante
      logging('error', base, req.sessionID, `Email processing has failed ! ${error}`);
      registerStatus.email = false;
    });

  /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/
  logging('info', base, req.sessionID, `Final registering status`, JSON.stringify(registerStatus)
  );
  if (registerStatus.save) {
    res.status(httpStatusCodes.CREATED).json(registerStatus);
  } else {
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
  }
};
