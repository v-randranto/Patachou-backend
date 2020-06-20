'use strict'

const express = require('express');
const router = express.Router();
const member = require('../controllers/member');
const MEMBER_GET_PATH = '/get';
const MEMBER_SEARCH_PATH = '/search';
const MEMBER_UPDATE_PATH = '/update';

router.post(MEMBER_GET_PATH, member.getAccount);
router.post(MEMBER_SEARCH_PATH, member.searchAccounts);
router.post(MEMBER_UPDATE_PATH, member.updateAccount);

module.exports = router;
