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
const passwordHandler = require('../utils/passwordHandler');

const { storePix } = require('../utils/photoHandler');


/*====================================================================================*
 * requête d'un compte
 *=====================================================================================*/

exports.getAccount = (req, res) => {  

  if (!req.body || !req.body.id) {
    logging('error', base, req.sessionID, 'Bad request on get account');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }

  logging('info', base, req.sessionID, 'Starting getting account by Id', JSON.stringify(req.body));
  // Recherche du membre par son id
  const param = {
    query: { _id: mongoose.mongo.ObjectID(req.body.id) },
    fields: '_id pseudo firstName lastName email sex birthDate presentation photoUrl creationDate'
  }
  accountData
    .findOne(req.sessionID, param)
    .then(account => {
      if (account) {
        logging('info', base, req.sessionID, `Account with id ${req.body.id} found !`);
      } else {
        logging('info', base, req.sessionID, `Account with id ${req.body.id} not found !`);
      }
      res.status(httpStatusCodes.OK).json(account);
    })
    .catch(error => {
      logging('error', base, req.sessionID, 
      `Getting account with id ${req.body.id} failed ! ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};

/*====================================================================================*
 * recherche de comptes (recherche de membres par un membre)
 *=====================================================================================*/

exports.searchAccounts = (req, res) => {
  
  if (!req.body) {
    logging('error', base, req.sessionID, 'Bad request on search accounts');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }

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
    .then(accounts => {
      if (accounts.length) {
        logging('info', base, req.sessionID, `${accounts.lentgh} Accounts found !`);
      } else {
        logging('info', base, req.sessionID, `No account !`);
      }
      res.status(httpStatusCodes.OK).json(accounts);
    })
    .catch(error => {
      logging('error', base, req.sessionID, `Getting accounts with query ${param} failed ! `, JSON.stringify(error));
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });
};

/*====================================================================================*
 * Mise à jour d'un compte
 *=====================================================================================*/

exports.updateAccount = async (req, res) => {
  if (!req.body || !req.body.id) {
    logging('error', base, req.sessionID, 'Bad request on update account');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }
  
  logging('info', base, req.sessionID, 'Starting updating account', JSON.stringify(req.body));

  // statut de la mise à jour
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
   
  // objet contant les champs à modifier
  let updateAccount = {
    modificationDate: new Date(),
    modificationAuthor: req.body.modificationAuthor 
  }

   /*-----------------------------------------------------------------------------*
   * Vérification de la disponibilité du pseudonyme si à modifier
   *-----------------------------------------------------------------------------*/
  await ( () => {
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
        .then(account => {
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
        .catch(error => {
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
  await ( () => {
    return new Promise((resolve, reject) => {      
      try {
        for (let [key, value] of Object.entries(req.body)) {
          updateAccount[key] = value;
        }
        resolve(true);
      } catch(error) {
        reject(error);
      }
    });
  })()
  .then(() => {
    paramUpdate.fields = updateAccount;
    console.log('param update')
  })
  .catch(error => {
    logging('error', base, req.sessionID, `consitution of updateAccount went awry :(`, JSON.stringify(error));
  });
 
   
  /*-------------------------------------------------------------------------*
   * Chiffrage du mot de passe si à modifier
   *-------------------------------------------------------------------------*/
  await ( () => {
    console.log('test password')
    return new Promise((resolve, reject) => {
      if (!req.body.password) {
        resolve(false);
      }
      // hachage avec sel du mot de passe
      try {
        logging('info', base, req.sessionID, `Let's do some hashin' and saltin'...`);
        const { hash, salt } = passwordHandler.getSaltHash(req.body.password);        
        logging('info', base, req.sessionID, `Successful hashin' and saltin'!`);
        resolve({ hash, salt });
      } catch(error) {   
        reject(error);
      }
    });
  })()
  .then(res => {
    if (res) {
      updateAccount.password = res.hash;
      updateAccount.salt = res.salt;
      updateAccount.pwdExpiringDate = new Date('01/01/2100');
    }
  })
  .catch(error => {
    logging('error', base, req.sessionID, `The hashin' and saltin' didn't go down well!`, JSON.stringify(error))
  });

  
  /*-----------------------------------------------------------------------------*
   * stockage de la photo si chargée
   *----------------------------------------------------------------------------*/

  await ( () => {
    return new Promise((resolve, reject) => {
      if (!req.body.photo) {
        resolve(false);
      }
      const accountPhoto = req.body.photo;
      logging('info', base, req.sessionID, `${updateAccount.pseudo} has a nice picture ${accountPhoto.name}.`
      );
      storePix(req.sessionID, accountPhoto.content)
        .then(result => {
          resolve(result.secure_url);
        })
        .catch(error => {
          reject(error);
        });       
    });
  })()
  .then(res => {
    if (res) {
      updateAccount.photoUrl = res;
    }
  })
  .catch(error => {
    logging('error', base, req.sessionID, `The hashin' and saltin' didn't go down well!`, JSON.stringify(error))
  });


  /*-------------------------------------------------------------------------*
   * Enregistrement en base
   *-------------------------------------------------------------------------*/
  
  await accountData
    .update(req.sessionID, paramUpdate)
    .then(account => {
      if (account) {
        logging('info', base, req.sessionID, `Account with id ${req.body.id} updated !`);
        updateStatus.save = true;
        updateStatus.photoUrl = account.photoUrl; // retourner l'url de la photo
      } else {
        updateStatus.save = false;
        logging('info', base, req.sessionID, `Account with id ${req.body.id} not found !`);
      }
    })
    .catch(error => {
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
