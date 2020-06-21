'use strict';

/**************************************************************************************
 *
 * Recherche de membres pour les demandes d'ajout d'amis :
 * - le membre qui fait la recherche doit être exclu du résultat
 * - les membres qui sont en relation lui doivent être exclus
 *
 ****************************************************************************************/
const mongoose = require('mongoose');
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

  let foundAccounts = [];
  let checkedAccounts = [];
  let foundRelations = [];
  let _id;
  logging('info', base, req.sessionID, `Starting searching accounts with ${JSON.stringify(req.body)}`
  );

  const termRegex = {
    $regex: req.body.term,
    $options: 'i',
  };

  _id = mongoose.mongo.ObjectID(req.body.id);

  const accountParam = {
    query: {
      $and: [
        { _id: { $ne: _id } },
        {
          $or: [
            { pseudo: termRegex },
            { firstName: termRegex },
            { lastName: termRegex },
          ],
        },
      ],
    },
    fields: '_id pseudo firstName lastName sex email presentation photoUrl',
  };
  
  const relationParam = {
    query: {
      $or: [{ requester: _id }, { receiver: _id }],
      status: { $in: ['PENDING', 'CONFIRMED'] },
    },
      fields: '_id requester receiver status',
    };

  await accountData
    .find(req.sessionID, accountParam)
    .then((accounts) => {
      if (accounts.length) {
        logging('info', base, req.sessionID, `${accounts.lentgh} Accounts found !`); 
        foundAccounts = accounts;       
        console.log('foundAccounts all in all', foundAccounts);
        
      } else {
        logging('info', base, req.sessionID, `No account found!`);
      }
      console.log("reaching this stage !")
      // res.status(httpStatusCodes.OK).json(foundAccounts);
    })
    .catch((error) => {
      logging('error', base, req.sessionID,
        `Getting accounts with query ${accountParam} failed ! `,
        JSON.stringify(error)
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });

  await relationData
    .find(req.sessionID, relationParam)
    .then((relations) => {
      if (relations.length) {
        logging('info', base, req.sessionID, `${relations.lentgh} relations found !`);      
        foundRelations = relations;
        console.log('foundrelations', foundRelations)
      } else {
        logging('info', base, req.sessionID, `No account found!`);
      }
    })
    .catch((error) => {
      logging('error', base, req.sessionID,
        `Getting accounts with query ${accountParam} failed ! `,
        JSON.stringify(error)
      );
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
    });

  foundAccounts.forEach(account => {
    console.log(`checking ${account.pseudo} ${account._id}`)
    // le callback ne fonctionne pas !!!
    const gotcha = foundRelations.findIndex(relation => {
      (JSON.stringify(relation.requester) == JSON.stringify(account._id)) || 
      (JSON.stringify(relation.receiver) == JSON.stringify(account._id))
    });

    if (gotcha != -1 ) {
      console.log(`account ${account.pseudo} is KO`)
    } else {
      checkedAccounts.push(account);
      console.log(`account ${account.pseudo} is OK`)
    }
  });  
 
  console.log("Et voilà", checkedAccounts)
  res.status(httpStatusCodes.OK).json(checkedAccounts);
};


