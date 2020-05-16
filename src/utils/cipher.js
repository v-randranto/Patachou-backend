'use strict';

const logger = require('./logger');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

const crypto = require('crypto');
const getHash = function (data, salt) {
  logger.info(`[${base}] getting a hashing`);
  return crypto
    .pbkdf2Sync(data, salt, 100000, 256, 'sha256')
    .toString('hex');
};

exports.getSaltHash = function (data) {
  logger.info(`[${base}] getting a hash and a salt`);
  const salt = crypto.randomBytes(32).toString('hex');
  return { hash: getHash(data, salt), salt: salt };
};
exports.check = function (data, salt, expectedHash) {
  logger.info(`[${base}] checking data against a hash`);
  return expectedHash === getHash(data, salt);
};
