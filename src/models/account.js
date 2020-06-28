'use strict';

const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
  pseudo: { type: String, required: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  pwdExpiringDate: { type: Date, default: '01/01/2100' },
  isAdmin: { type: Boolean, required: true, default: false },
  lastName: { type: String, required: true },
  firstName: { type: String, required: true },
  birthDate: Date,
  sex: String,
  email: { type: String, required: true },
  presentation: { type: String, required: true },
  photoUrl: { type: String, required: true },
  creationDate: { type: Date, required: true, default: Date.now },
  modificationDate: { type: Date, required: true, default: Date.now },
  isLoggedIn: { type: Boolean, required: true, default: false}
});

module.exports = mongoose.model('Account', accountSchema);