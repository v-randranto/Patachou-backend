'use strict';
const mongoose = require('mongoose');
const Member = require('../models/member');
const cipher = require('../utils/cipher');
const httpStatusCodes = require('../constants/httpStatusCodes.json');
const logger = require('../utils/logger');

exports.addOne = (req, res) => {
  const { hash, salt } = cipher.getSaltHash(req.body.password);
  const member = new Member(req.body);
  member.password = hash;
  member.salt = salt;
  member
    .save()
    .then(() => {
      logger.info(`member created - ${member._id} - ${member.userName}`);
      res.status(httpStatusCodes.CREATED).json({
        message: `Member created !`,
      });
    })
    .catch((error) => {
      logger.error(`email ko - ${req.body} - ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};

exports.findOne = (req, res) => {
  Member.findOne({
    _id: mongoose.mongo.ObjectId(req.body.id),
  })
    .then((member) => {
      if (member) {
        logger.info(`member found - ${member._id} - ${member.userName}`);
        res.status(httpStatusCodes.OK).json(member);
      } else {
        logger.info(`member with id ${member._id} not found`);
        res.status(httpStatusCodes.OK).json(member);
      }
    })
    .catch((error) => {
      logger.error(`find ${req.body.id} - ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};

exports.updateOne = (req, res) => {
  Member.updateOne({ _id: mongoose.mongo.ObjectId(req.params.id) }, req.body)
    .then(() => {
      logger.info(`update - member id ${req.body.id} not found`);
      res.status(httpStatusCodes.NO_CONTENT).end();
    })
    .catch((error) => {
      logger.error(`update - member id ${req.body.id} - ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};

exports.deleteOne = (req, res) => {
  Member.deleteOne({ _id: mongoose.mongo.ObjectId(req.params.id) })
    .then(() => {
      logger.info(`delete - member id ${req.body.id} not found`);
      res.status(httpStatusCodes.NO_CONTENT).json();
    })
    .catch((error) => {
      logger.error(`delete - member id ${req.params.id} - ${error}`);
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};

exports.find = (req, res) => {
  Member.find()
    .then((members) => {
      logger.info(`${members.length} members found`);
      res.status(httpStatusCodes.OK).json(members);
    })
    .catch((error) => {
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};

exports.connect = (req, res) => {
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
        res.status(httpStatusCodes.OK).json(member);
      } else {
        res.end('password KO');
      }
    })
    .catch((error) => {
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error,
      });
    });
};
