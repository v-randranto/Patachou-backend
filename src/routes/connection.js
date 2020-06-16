'use strict'

const express = require('express');
const router = express.Router();
const login = require('../controllers/login');
const register = require('../controllers/register');
const member = require('../controllers/member');

const LOGIN_PATH = '/login';
const PSEUDO_PATH = '/pseudo';
const REGISTER_PATH = '/register';

router.post(PSEUDO_PATH, member.checkPseudo);
router.post(REGISTER_PATH, register.addAccount);
router.post(LOGIN_PATH, login.checkAccount);

module.exports = router;
