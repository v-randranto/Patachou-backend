'use strict'

const express = require('express');
const router = express.Router();
const contact = require('../controllers/contact');
const CONTACT_EMAIL_PATH = '/email';

router.post(CONTACT_EMAIL_PATH, contact.email);

module.exports = router;
