'use strict'

const express = require('express');
const router = express.Router();
const member = require('../controllers/member');
const MEMBER_GET_PATH = '/get';
const MEMBER_SEARCH_PATH = '/search';

router.post(MEMBER_GET_PATH, member.getAccount);
router.post(MEMBER_SEARCH_PATH, member.searchAccounts);

module.exports = router;
