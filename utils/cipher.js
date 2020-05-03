'use strict';

const crypto = require('crypto');
const getHash = function(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 256, 'sha256').toString('hex');
};

exports.getSaltHash = function(password) {
    const salt = crypto.randomBytes(32).toString('hex'); 
    return {hash: getHash(password, salt), salt: salt};
}
exports.check = function(password, salt, expectedHash) {
    if (expectedHash === getHash(password, salt)) {
        return true;
    } 
}
