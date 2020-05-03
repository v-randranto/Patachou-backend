'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberSchema = mongoose.Schema({
  userName: { type: String, required: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  pwdExpiringDate: { type: Date, default: '01/01/2100' },
  isAdmin: { type: Boolean, required: true, default: false },
  lastName: String,
  firstName: String,
  birthDate: Date,
  email: { type: String, required: true },
  picture: String,
  friends: [Schema.ObjectId],
  creationDate: { type: Date, required: true, default: Date.now },
  updateUserName: String,
  updateDate: { type: Date },
});

module.exports = mongoose.model('member', memberSchema);
