'use strict';

const checkPassword = require('../utils/passwordHandler').check;
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const jwt = require('jsonwebtoken');
const accountData = require('../access-data/accountData');

/****************************************************************************************
 *
 * Connexion d'un utilisateur :
 * - recherche en base de l'utilisateur
 * - vérification de son mot de passe
 * - génération d'un jeton d'authentification à renvoyer au client
 *
 ****************************************************************************************/

exports.checkAccount = (req, res) => {
  logging('info', base, req.sessionID, 'Starting login authentication...');

  const loginStatus = {
    error: false,
    notFound: false,
    pwdExpired: false,
    authKO: false,
    jwtKO: false,
  };

  const returnData = {
    status: loginStatus,
    member: null,
    token: null,
    expiresIn: 24 * 3600 * 1000  // jeton valide pendant 1j
  };  

  let foundAccount;
  // Recherche du membre par son pseudo
  const param = {
    query: { pseudo: req.body.pseudo },
    // fields: 'password salt'
  };

  accountData
    .findOne(req.sessionID, param)
    .then((account) => {
      if (account) {
        logging('info', base, req.sessionID, `Account ${req.body.pseudo} found`);
        foundAccount = account;
        if (foundAccount.pwdExpiringDate < new Date()) {
          logging('info', base, req.sessionID, `Account ${req.body.pseudo} paswword has expired`);
          loginStatus.pwdExpired = true;
          return false;
        } else {
          return true;
        }
      } else {
        logging('info', base, req.sessionID, `Account ${req.body.pseudo} not found !`);
        loginStatus.notFound = true;
        return false;
      }
    })
    .then((accountFound) => {
      // si membre trouvé, vérifier le mot de passe
      if (accountFound) {
        const passwordChecked = checkPassword(
          req.body.password,
          foundAccount.salt,
          foundAccount.password
        );
        if (passwordChecked) {
          logging('info', base, req.sessionID, `Account ${req.body.pseudo} password checked !`
          );
          try {
            const token = jwt.sign(
              {
                id: foundAccount._id,
                pseudo: foundAccount.pseudo,
              },
              // eslint-disable-next-line no-undef
              process.env.TOKEN_KEY,
              { expiresIn: '1d' },
              { algorithm: 'HS256' }
            );
            logging('info', base, req.sessionID, `Account ${req.body.pseudo} token created`);
            returnData.token = token;
            foundAccount.password = '*';
            foundAccount.salt = '*';
            returnData.member = foundAccount;
          } catch (error) {
            logging('error', base, req.sessionID, `Jwt signing failed on account ${req.body.pseudo} !`);
            loginStatus.jwtKO = true;
          }
        } else {
          loginStatus.authKO = true;
          logging('error', base, req.sessionID, `Account ${req.body.pseudo} password mismatch !`);
        }
      }
    })
    .catch((error) => {
      logging('error', base, req.sessionID, `Getting account ${req.body.pseudo} failed ! ${error}`);
      loginStatus.error = true;
    })
    .finally(() => {
      if (loginStatus.error) {
        logging('debug', base, req.sessionID, 'technical error');
        res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
      } else if (loginStatus.notFound) {
        logging('debug', base, req.sessionID, 'not found');
        res.status(httpStatusCodes.NOT_FOUND).json({ loginStatus });
      } else if (
        loginStatus.pwdExpired ||
        loginStatus.authKO ||
        loginStatus.jwtKO
      ) {
        logging('debug', base, req.sessionID, 'login unauthorized');
        res.status(httpStatusCodes.UNAUTHORIZED).json({ loginStatus });
      } else {
        logging('debug', base, req.sessionID, 'login authorized');
        res.status(httpStatusCodes.OK).json(returnData);
      }
    });
};
