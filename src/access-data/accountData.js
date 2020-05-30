'use strict';
const mongoose = require('mongoose');
const Account = require('../models/account');
const { logging } = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

exports.addOne = (sessionID, account) => {
  const accountLog = Object.assign({}, account);
  accountLog.password = '***';
  if (accountLog.photo) {
    accountLog.photo.content = '...';
  }
  logging('info', base, sessionID, 'Starting saving account...', JSON.stringify(accountLog));
  return new Promise((resolve, reject) => {
    const newAccount = new Account(account);
    newAccount
    .save()
    .then(() => {
      logging('info', base, sessionID, 'saving account successful !');
      resolve(true) ;   
    })
    .catch((error) => {
      logging('error', base, sessionID, 'saving account failed !');
      reject(error);
    });  
  });
   
};

exports.findOne = (sessionID, param ) => {
  logging(
    'info',
    base,
    sessionID,
    'Starting finding account param...', JSON.stringify(param.query)
  );

  return new Promise((resolve, reject ) => {
    Account.findOne(param.query, param.fields)
      .then((account) => {
        if (account) {
          logging('info', base, sessionID, `Finding account successfull !`);
          resolve(account);
        } else {
          logging('info', base, sessionID, 'Account not found !');
          resolve(false);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });  
};

exports.updateOne = (sessionID, params) => {
  logging(
    'info',
    base,
    sessionID,
    'Starting updating account...',
    JSON.stringify(params)
  );
  return new Promise((resolve, reject) => {
    Account.updateOne({ _id: mongoose.mongo.ObjectId(params.id) }, params.fields)
    .then(() => {
      logging('info', base, sessionID, 'Updating account successful !');
      resolve;
    })
    .catch((error) => {
      logging('error', base, sessionID, 'Updating account failed !');
      reject(error);
    });
  });  
};

exports.deleteOne = (sessionID, id) => {
  logging(
    'info',
    base,
    sessionID,
    'Starting deleting account...',
    JSON.stringify(id)
  );
    return new Promise((resolve, reject) => {
      Account.deleteOne({ _id: mongoose.mongo.ObjectId(id) })
    .then(() => {
      logging('info', base, sessionID, 'Deleting account successfull !');
      resolve;
    })
    .catch((error) => {
      logging('error', base, sessionID, 'Deleting account failed !');
      reject(error);
    });
    })
  
};

exports.find = (sessionID, param) => {
  logging(
    'info',
    base,
    sessionID,
    'Starting finding accounts...',
    JSON.stringify(param.query)
  );
  return new Promise((resolve, reject) => {
    Account.find(param.query, param.fields)
    .then((accounts) => {
      if (accounts.length) {
        logging('info', base, sessionID, `Finding accounts successful !`);
        // TODO formatter les accounts avant de les retourner
        resolve(accounts);
      } else {
        logging('info', base, sessionID, 'No account found !');
        resolve(false)
      }
    })
    .catch((error) => {
      logging('error', base, sessionID, 'Finding accounts failed !');
      reject(error);
    });
  });
  
};