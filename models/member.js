'use strict'

const mongoose = require('mongoose');

// const identifiersSchema = mongoose.Schema({
//     username: { type: String, required: true }, 
//     password: { type: String, required: true },
//     salt: { type: String, required: true },
//     pwdExpiringDate: String,
//     updateAuthor: String,
//     updateDate: Date
// });

// const profileSchema = mongoose.Schema({
//     lastName: String, 
//     firstName: String,
//     birthDate: Date,
//     emailAddress: String,
//     picture: String,
//     updateAuthor: String,
//     updateDate: Date
// });

// const memberSchema = mongoose.Schema({
//     identifiers: identifiersSchema,
//     profile: profileSchema,
//     friends: [], 
//     creationDate: Date,
// });

const memberSchema = mongoose.Schema({
    userName: String,
    password: String,
    email: String,
    age: Number
});

module.exports = mongoose.model('member', memberSchema);
