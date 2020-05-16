'use strict'

const express = require('express');
const router = express.Router();
const profile = require('../controllers/profile');
const PROFILE_PATH = '/get';

router.post(PROFILE_PATH, profile.getMember);

module.exports = router;
