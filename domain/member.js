'use strict'
const mongoose = require('mongoose');
const Member = require('../models/member');
const httpStatusCodes = require("../constants/httpStatusCodes");

exports.addOne = (req, res, next) => {
  const member = new Member(req.body);
  member.save().then(
    () => {
      res.status(httpStatusCodes.CREATED).json({
        message: `Member created !`
      });
    }
  ).catch(
    (error) => {
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error
      });
    }
  );
};

exports.findOne = (req, res, next) => {
  Member.findOne({
    _id: mongoose.mongo.ObjectId(req.params.id)
  }).then(
    (member) => {
      res.status(httpStatusCodes.OK).json(member);
    }
  ).catch(
    (error) => {
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error
      });
    }
  );
};

exports.updateOne = (req, res, next) => {
  Member.updateOne({_id: mongoose.mongo.ObjectId(req.params.id)}, req.body).then(
    () => {
      res.status(httpStatusCodes.NO_CONTENT).end();
    }
  ).catch(
    (error) => {
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error
      });
    }
  );
};

exports.deleteOne = (req, res, next) => {
  Member.deleteOne({_id: mongoose.mongo.ObjectId(req.params.id)}).then(
    () => {
      res.status(httpStatusCodes.NO_CONTENT).json();
    }
  ).catch(
    (error) => {
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error
      });
    }
  );
};

exports.findMany = (req, res, next) => {
  Member.find().then(
    (members) => {        
      res.status(httpStatusCodes.OK).json(members);
    }
  ).catch(
    (error) => {
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error
      });
    }
  );
};