'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const relationshipSchema = mongoose.Schema({
  category: { type: String, required: true },
  requester: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  recommander: { type: Schema.Types.ObjectId, ref: 'Account' },
  status: { type: String, required: true, default: 'PENDING' },
  creationDate: { type: Date, required: true, default: Date.now },
  modificationDate: { type: Date, required: true, default: Date.now },
  modificationAuthor: { type: Schema.Types.ObjectId, ref: 'Account' }
});

module.exports = mongoose.model('Relation', relationshipSchema);