'use strict'
const mongoose = require('mongoose');
const Member = require('../models/member');
const cipher = require('../utils/cipher');
const httpStatusCodes = require("../constants/httpStatusCodes");

exports.addOne = (req, res) => {
  const { hash, salt } = cipher.getSaltHash(req.body.password);
  const member = new Member(req.body);   
  member.password = hash;
  member.salt = salt;
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

exports.findOne = (req, res) => {
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

exports.updateOne = (req, res) => {
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

exports.deleteOne = (req, res) => {
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

exports.find = (req, res) => {
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

exports.connect = (req, res) => {
  Member.findOne({
    userName: req.body.userName
  }).then(
    (member) => {
      const result = cipher.check(req.body.password, member.salt, member.password);
      if (result) {res.status(httpStatusCodes.OK).json(member);}
      else {res.end('password KO');}
    }
  ).catch(
    (error) => {
      res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        error: error
      });
    }
  );
};