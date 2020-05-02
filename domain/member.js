'use strict'
const mongoose = require('mongoose');
const Member = require('../models/member');
const httpStatusCodes = require("../constants/httpStatusCodes");

exports.createMember = (req, res, next) => {
    // OK
  const member = new Member(req.body);
  member.save().then(
    () => {
      res.status(httpStatusCodes.CREATED).json({
        message: `Member ${req.body.userName} created !`
      });
    }
  ).catch(
    (error) => {
      res.status(httpStatusCodes.BAD_REQUEST).json({
        error: error
      });
    }
  );
};

exports.getOneMember = (req, res, next) => {
    // OK
  Member.findOne({
    _id: mongoose.mongo.ObjectId(req.params.id)
  }).then(
    (member) => {
      res.status(httpStatusCodes.OK).json(member);
    }
  ).catch(
    (error) => {
      res.status(httpStatusCodes.NOT_FOUND).json({
        error: error
      });
    }
  );
};

exports.updateOneMember = (req, res, next) => {
  // OK
  Member.update({_id: mongoose.mongo.ObjectId(req.params.id)}, req.body).then(
    () => {
      res.status(httpStatusCodes.NO_CONTENT).json({
        message: `Member updated !`
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

exports.deleteOneMember = (req, res, next) => {
  // OK
  Member.deleteOne({_id: mongoose.mongo.ObjectId(req.params.id)}).then(
    () => {
      res.status(httpStatusCodes.NO_CONTENT).json({
        message: `Member deleted !`
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

exports.getMembers = (req, res, next) => {
  // OK
  Member.find().then(
    (members) => {        
    //   res.status(httpStatusCodes.OK).json(members);
    res.status(httpStatusCodes.OK).end(JSON.stringify(members));
    }
  ).catch(
    (error) => {
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error
      });
    }
  );
};