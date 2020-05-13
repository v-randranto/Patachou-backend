'use strict';
const mongoose = require('mongoose');
const Member = require('../models/member');
const cipher = require('../utils/cipher');
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const logger = require('../utils/logger');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const getLogPrefix = (sessionId) => {
  return `[${base}] [ID=${sessionId}]`;
}

exports.addOne = (req, res) => {
  const bodyCopy = Object.assign({}, req.body);
  bodyCopy.password = '***'
  logger.info(`${getLogPrefix(req.sessionID)} addOne() - ${JSON.stringify(bodyCopy)}`);
  const { hash, salt } = cipher.getSaltHash(req.body.password);
  const member = new Member(req.body);
  member.password = hash;
  member.salt = salt;
  member
    .save()
    .then(() => {
      logger.info(`${getLogPrefix(req.sessionID)} addOne()] successful !`);
      res.status(httpStatusCodes.CREATED).json({
        message: `Member created !`,
      });
    })
    .catch((error) => {
      logger.error(`${getLogPrefix(req.sessionID)} addOne()] failed ! - ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};

exports.findOne = (req, res) => {
  logger.info(`${getLogPrefix(req.sessionID)} findOne()] - ${JSON.stringify(req.body)}`);
  Member.findOne({
    _id: mongoose.mongo.ObjectId(req.body.id),
  })
    .then((member) => {
      if (member) {
        logger.info(`${getLogPrefix(req.sessionID)} findOne()] member found`);
        res.status(httpStatusCodes.OK).json(member);
      } else {
        logger.info(`${getLogPrefix(req.sessionID)} findOne()] not found`);
        res.status(httpStatusCodes.OK).json(member);
      }
    })
    .catch((error) => {
      logger.error(`${getLogPrefix(req.sessionID)} findOne()] failed ! - ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};

exports.updateOne = (req, res) => {
  logger.info(`${getLogPrefix(req.sessionID)} updateOne()] - ${JSON.stringify(req.params)} ${JSON.stringify(req.body)}`);
  Member.updateOne({ _id: mongoose.mongo.ObjectId(req.params.id) }, req.body)
    .then(() => {
      logger.info(`${getLogPrefix(req.sessionID)} updateOne()] successful !`);
      res.status(httpStatusCodes.NO_CONTENT).end();
    })
    .catch((error) => {
      logger.error(`${getLogPrefix(req.sessionID)} updateOne()] failed ! - ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};

exports.deleteOne = (req, res) => {
  logger.info(`[${base}/deleteOne()] - ${JSON.stringify(req.params)} `);
  Member.deleteOne({ _id: mongoose.mongo.ObjectId(req.params.id) })
    .then(() => {
      logger.info(`[${base}/deleteOne()] successful !`);
      res.status(httpStatusCodes.NO_CONTENT).json();
    })
    .catch((error) => {
      logger.error(`[${base}/deleteOne()] failed ! - ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};

exports.find = (req, res) => {
  logger.info(`[${base}/find()] - ${JSON.stringify(req.body)} `);
  Member.find()
    .then((members) => {
      logger.info(`[${base}/find()] successful !`);
      res.status(httpStatusCodes.OK).json(members);
    })
    .catch((error) => {
      logger.error(`[${base}/find()] failed ! - ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};

exports.connect = (req, res) => {
  const bodyCopy = Object.assign({}, req.body);
  bodyCopy.password = '***'
  logger.info(`[${base}/deleteOne()] - ${JSON.stringify(bodyCopy)} `);
  Member.findOne({
    userName: req.body.userName,
  })
    .then((member) => {
      const result = cipher.check(
        req.body.password,
        member.salt,
        member.password
      );
      if (result) {
        logger.info(`[${base}/connect()] valid password !`);
        res.status(httpStatusCodes.OK).json(member);
      } else {
        logger.info(`[${base}/connect()] invaled password !`);
        res.end('password KO');
      }
    })
    .catch((error) => {
      logger.error(`[${base}/connect()] failed ! - ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};
