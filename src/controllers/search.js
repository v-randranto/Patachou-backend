'use strict';

/**************************************************************************************
 *
 * Recherche de membres pour les demandes d'ajout d'amis :
 * - critères: pseudo, prénom ou nom
 * - le membre qui fait la recherche doit être exclu du résultat
 * - les membres qui sont en relation avec lui doivent être exclus
 *
 ****************************************************************************************/
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const { logging } = require('../utils/loggingHandler');
const accountData = require('../access-data/accountData');
const relationData = require('../access-data/relationData');

/*====================================================================================*
 * recherche de comptes (recherche de membres par un membre)
 *=====================================================================================*/

exports.getAccounts = async (req, res) => {

  if (!req.body) {
    logging('error', base, req.sessionID, 'Bad request on search accounts');
    res.status(httpStatusCodes.BAD_REQUEST).end();
  }

  // résultat de la recherche de comptes par le demandeur
  let foundAccounts = []; 
  // les relations du membre demandeur
  let foundRelations = []; 
  // résultat de la recherche sans les membres en relation avec le demandeur
  let selectedAccounts = []; 
  
  let id = req.body.id;

  const searchStatus = {
    noAccount: false,
    noRelation: false
  }
  
  logging('info', base, req.sessionID, `Starting searching accounts with ${JSON.stringify(req.body)}`
  );

  // terme à rechercher
  const termRegex = {
    $regex: req.body.term,
    $options: 'i',
  };

  // paramètres de la requête de recherche de comptes
  const accountParam = {
    query: {
      $and: [
        { _id: { $ne: id } }, // exclut le demandeur 
        {
          $or: [
            { pseudo: termRegex },
            { firstName: termRegex },
            { lastName: termRegex },
          ],
        },
      ],
    },
    fields: '_id pseudo firstName lastName sex birthDate email presentation photoUrl is LoggedIn',
  };
  
  // paramètres de la requête de recherche des relations
  const relationParam = {
    query: {
      $or: [{ requester: id }, { receiver: id }],
      status: { $in: ['PENDING', 'CONFIRMED'] },
    },
      fields: '_id requester receiver status',
    };

/*===================================================================================*
 *        recherche des comptes moins le demandeur
 *===================================================================================*/

  await accountData
    .find(req.sessionID, accountParam)
    .then((accounts) => {
      if (accounts.length) {
        logging('info', base, req.sessionID, `${accounts.lentgh} Accounts found !`); 
        searchStatus.noAccount = false;
      } else {
        logging('info', base, req.sessionID, `No account found!`);
        searchStatus.noAccount = true;        
      } 
      foundAccounts = accounts;
    })
    .catch((error) => {
      logging('error', base, req.sessionID,
        `Getting accounts with query ${accountParam} failed ! `,
        JSON.stringify(error)
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });

    if (searchStatus.noAccount) {
      res.status(httpStatusCodes.OK).json(foundAccounts);
      return;
    }
    
/*===================================================================================*
 *        recherche des relations du demandeur
 *===================================================================================*/

  await relationData
    .find(req.sessionID, relationParam)
    .then(relations => {
      if (relations.length) {
        logging('info', base, req.sessionID, `${relations.lentgh} relations found !`);      
        foundRelations = relations;
        searchStatus.noRelation = false;
      } else {
        logging('info', base, req.sessionID, `No account found!`);
        searchStatus.noRelation = true;
      }
    })
    .catch((error) => {
      logging('error', base, req.sessionID,
        `Getting accounts with query ${accountParam} failed ! `,
        JSON.stringify(error)
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
      return;
    });

  if (searchStatus.noRelation) {
    res.status(httpStatusCodes.OK).json(foundAccounts);
    return;
  }
 
/*===================================================================================*
 *     Sélectionner les membres qui ne sont pas en relation avec le demandeur
 *===================================================================================*/

  await (function () {
    return new Promise((resolve, reject) => {
      
      try {
        foundAccounts.forEach(account => {
          let inRelation = false;       
          foundRelations.forEach(relation => {          
            if ((JSON.stringify(relation.requester) === JSON.stringify(account._id)) ||
            (JSON.stringify(relation.receiver) === JSON.stringify(account._id))) {
              inRelation = true;
              return;
            }        
          })
          if (!inRelation) {
            selectedAccounts.push(account);
          }        
        });
        resolve(true);
      } catch(error) {
        reject(error)
      }      
    })
  })()
  .then(() => {
    res.status(httpStatusCodes.OK).json(selectedAccounts);
  }) 
}