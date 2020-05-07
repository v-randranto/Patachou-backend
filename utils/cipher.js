'use strict';

const logger = require('../utils/logger');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

const crypto = require('crypto');
const getHash = function(password, salt) {
    logger.debug(`[${base}/getHash()]`);
    return crypto.pbkdf2Sync(password, salt, 100000, 256, 'sha256').toString('hex');
};

exports.getSaltHash = function(password) {
    logger.debug(`[${base}/getSaltHash()]`);
    const salt = crypto.randomBytes(32).toString('hex'); 
    return {hash: getHash(password, salt), salt: salt};
}
exports.check = function(password, salt, expectedHash) {
    logger.debug(`[${base}/check()]`);
    if (expectedHash === getHash(password, salt)) {
        return true;
    } 
}
