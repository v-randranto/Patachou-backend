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
const cipher = require('../utils/cipher');

const { storePix } = require('../utils/photoHandler');

// eslint-disable-next-line no-undef
const default_avatar = process.env.DEFAULT_AVATAR;

/*====================================================================================*
 * requête du compte d'un membre
 *=====================================================================================*/

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

/*====================================================================================*
 * recherche de comptes (recherche de membres par un membre)
 *=====================================================================================*/

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
      if (accounts.length) {
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

/*====================================================================================*
 * Mise à jour d'un compte
 *=====================================================================================*/

exports.updateAccount = async (req, res) => {
  logging('info', base, req.sessionID, 'Starting updating account', JSON.stringify(req.body));
  const updateStatus = {
    pseudoUnavailable: false,
    save: false,
    account: null
  };

   // paramétrage de la requête mongo pour la mise àjour
   const paramUpdate = {
    query: { _id: req.body.id },
    fields: null
  }
   
  let updateAccount = {
    modificationDate: Date.now(),
    modificationAuthor: req.body.modificationAuthor 
  }

   /*-----------------------------------------------------------------------------*
   * Vérification de la disponibilité du pseudonyme
   *-----------------------------------------------------------------------------*/
  await (function () {
    let param;
    return new Promise((resolve, reject) => {
      if (!req.body.pseudo) {
        resolve(true);
        return;
      } else {
        logging('info', base, req.sessionID, 'Starting checking pseudo', req.body.pseudo);
        param = {
          query: { pseudo: req.body.pseudo },
          fields: 'pseudo'
        }
      }
      accountData
        .findOne(req.sessionID, param)
        .then((account) => {
          if (account) {
            logging('info', base, req.sessionID, `Pseudo ${updateAccount.pseudo} is already in use!` 
            );  
            updateStatus.pseudoUnavailable = true;  
            return;
          } else {
            logging('info', base, req.sessionID, `Pseudo ${updateAccount.pseudo} is available`
            );
            updateStatus.pseudoUnavailable = false;
          }
          resolve(true)
        })
        .catch((error) => {
          logging('error', base, req.sessionID, `Checking pseudo has failed ! ${error}`
          );
          reject(error)
          throw error;
        });
    });

  })();

  if (updateStatus.pseudoUnavailable) {
    res.status(httpStatusCodes.OK).json(updateStatus);
    return;
  }


  // Alimentation du compte de modification avec les champs à modifier
  await (function () {
    return new Promise((resolve, reject) => {      
      try {
        for (let [key, value] of Object.entries(req.body)) {
          console.log(`${key}: ${value}`);
          updateAccount[key] = value;
        }
        paramUpdate.fields = updateAccount;
        console.log('updateAccount', updateAccount)
        resolve(true);
      } catch (error) {
        logging('error', base, req.sessionID, `consitution of updateAccount went awry :(`);
        reject(error);
      }
    });
  })();

 
   
  /*-------------------------------------------------------------------------*
   * Chiffrage du mot de passe s'il a été saisi
   *-------------------------------------------------------------------------*/
  await (function () {
    return new Promise((resolve, reject) => {
      if (!req.body.password) {
        resolve(true);
        return;
      }
      // hachage avec sel du mot de passe
      try {
        logging('info', base, req.sessionID, `Let's do some hashin' and saltin'...`);
        const { hash, salt } = cipher.getSaltHash(req.body.password);
        updateAccount.password = hash;
        updateAccount.salt = salt;
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
        logging('info', base, req.sessionID,  `${updateAccount.pseudo} has a nice picture ${accountPhoto.name}.`
        );
        storePix(req.sessionID, accountPhoto.content)
          .then((result) => {
            updateAccount.photoUrl = result.secure_url;
            resolve(true);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        logging('info', base, req.sessionID, `${updateAccount.pseudo} has no picture.` );
        updateAccount.photoUrl = default_avatar;
        resolve(true);
      }
    });
  })();


  /*-------------------------------------------------------------------------*
   * Enregistrement en base
   *-------------------------------------------------------------------------*/
  
  await accountData
    .update(req.sessionID, paramUpdate)
    .then((account) => {
      if (account) {
        logging('info', base, req.sessionID, `Account with id ${req.body.id} updated !`);
        updateStatus.save = true;
        updateStatus.photoUrl = account.photoUrl;
      } else {
        updateStatus.save = false;
        logging('info', base, req.sessionID, `Account with id ${req.body.id} not found !`);
      }
    })
    .catch((error) => {
      logging('error', base, req.sessionID, 
      `updating account with id ${req.body.id} failed ! ${error}`);
      updateStatus.save = false;
      throw error;
    });

    /*-----------------------------------------------------------------------------*
   * Retour du résultat au client
   *----------------------------------------------------------------------------*/
  logging('info', base, req.sessionID, `Final update status`, JSON.stringify(updateStatus)
  );
  if (updateStatus.save) {
    res.status(httpStatusCodes.CREATED).json(updateStatus);
  } else {
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
  }
};
