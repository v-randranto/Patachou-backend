'use strict';
const mongoose = require('mongoose');
const Member = require('../models/member');
const { logging } = require('../utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
exports.addOne = (sessionID, member) => {
  const memberLog = Object.assign({}, member);
  memberLog.password = '***';
  if (memberLog.photo) {
    memberLog.photo.content = '...';
  }
  logging('info', base, sessionID, 'Starting saving member...', JSON.stringify(memberLog));
  return new Promise((resolve, reject) => {
    const newMember = new Member(member);
    newMember
    .save()
    .then(() => {
      logging('info', base, sessionID, 'saving member successful !');
      resolve(true) ;   
    })
    .catch((error) => {
      logging('error', base, sessionID, 'saving member failed !');
      reject(error);
    });  
  });
   
};

exports.findOne = (sessionID, param ) => {
  logging(
    'info',
    base,
    sessionID,
    'Starting finding member by pseudo...', param
  );

  return new Promise((resolve, reject ) => {
    Member.findOne(param)
      .then((member) => {
        if (member) {
          logging('info', base, sessionID, 'Finding member successfull !');
          resolve(member);
        } else {
          logging('info', base, sessionID, 'Member not found !');
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
    'Starting updating member...',
    JSON.stringify(params)
  );
  return new Promise((resolve, reject) => {
    Member.updateOne({ _id: mongoose.mongo.ObjectId(params.id) }, params.fields)
    .then(() => {
      logging('info', base, sessionID, 'Updating member successful !');
      resolve;
    })
    .catch((error) => {
      logging('error', base, sessionID, 'Updating member failed !');
      reject(error);
    });
  });  
};

exports.deleteOne = (sessionID, id) => {
  logging(
    'info',
    base,
    sessionID,
    'Starting deleting member...',
    JSON.stringify(id)
  );
    return new Promise((resolve, reject) => {
      Member.deleteOne({ _id: mongoose.mongo.ObjectId(id) })
    .then(() => {
      logging('info', base, sessionID, 'Deleting member successfull !');
      resolve;
    })
    .catch((error) => {
      logging('error', base, sessionID, 'Deleting member failed !');
      reject(error);
    });
    })
  
};

exports.find = (sessionID, params) => {
  logging(
    'info',
    base,
    sessionID,
    'Starting find members...',
    JSON.stringify(params)
  );
  return new Promise((resolve, reject) => {
    Member.find()
    .then((members) => {
      if (members.length) {
        logging('info', base, sessionID, 'Finding members successful !');
        // TODO formatter les members avant de les retourner
        resolve(members);
      } else {
        logging('info', base, sessionID, 'No member found !');
        resolve(false)
      }
    })
    .catch((error) => {
      logging('error', base, sessionID, 'Finding members failed !');
      reject(error);
    });
  });
  
};