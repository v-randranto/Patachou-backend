'use strict';

const checkPassword = require('../utils/cipher').check;
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const jwt = require('jsonwebtoken');
const accountData = require('../access-data/accountData');

/**
 * Connexion d'un utilisateur :
 * - recherche en base de l'utilisateur
 * - vérification de son mot de passe
 * - génération d'un jeton d'authentification à renvoyer au client
 */

exports.checkAccount = (req, res) => {
  logging(
    'info',
    base,
    req.sessionID,
    'Starting login authentication...',
    req.body.pseudo
  );
  const loginStatus = {
    error: false,
    auth: false,
    token: null,
    id: '',
  };
  let foundAccount;
  // Recherche du membre par son pseudo
  const param = {
    query: {pseudo: req.body.pseudo},
    fields: 'password salt'
  }; 

  accountData
    .findOne(req.sessionID, param)
    .then((account) => {
      if (account) {
        foundAccount = account;
        logging(
          'info',
          base,
          req.sessionID,
          `Account ${req.body.pseudo} found, starting password checking...`
        );
        return true;
      } else {
        logging(
          'info',
          base,
          req.sessionID,
          `Account ${req.body.pseudo} not found !`
        );
        return false;
      }
    })
    .then((pseudo) => {
      // si membre trouvé, vérifier le mot de passe
      if (pseudo) {
        const passwordChecked = checkPassword(
          req.body.password,
          foundAccount.salt,
          foundAccount.password
        );
        if (passwordChecked) {
          logging(
            'info',
            base,
            req.sessionID,
            `Account ${req.body.pseudo} password checked !`
          );
          loginStatus.auth = true;
          try {
            const token = jwt.sign(
              {
                id: foundAccount._id,
                pseudo: foundAccount.pseudo,
              },
              // eslint-disable-next-line no-undef
              process.env.TOKEN_KEY,
              { expiresIn: '1h' },
              { algorithm: 'HS256' }
            );
            logging(
              'info',
              base,
              req.sessionID,
              `Account ${req.body.pseudo} token created`
            );
            loginStatus.token = token;
            loginStatus.id = foundAccount._id;
            loginStatus.expiresIn = 3600;
          } catch (error) {
            logging(
              'error',
              base,
              req.sessionID,
              `Jwt signing failed on account ${req.body.pseudo} !`
            );
            loginStatus.error = true;
          }
        } else {
          logging(
            'error',
            base,
            req.sessionID,
            `Account ${req.body.pseudo} password mismatch !`
          );
          loginStatus.auth = false;
        }
      }
    })
    .catch((error) => {
      logging(
        'error',
        base,
        req.sessionID,
        `Getting account ${req.body.pseudo} failed ! ${error}`
      );
      loginStatus.error = true;
      // res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json(loginStatus);
    })
    .finally(() => {
      if (loginStatus.error) {
        logging('debug', base, req.sessionID, 'technical error');
        res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
      } else if (loginStatus.auth) {
        logging('debug', base, req.sessionID, 'login authorized');
        res.status(httpStatusCodes.OK).json(loginStatus);
      } else {
        logging('debug', base, req.sessionID, 'login unauthorized');
        res.status(httpStatusCodes.UNAUTHORIZED).end();
      }
    });
};
