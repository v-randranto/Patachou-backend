'use strict'

const express = require('express');
const router = express.Router();
const login = require('../controllers/login');
const register = require('../controllers/register');

const LOGIN_PATH = '/login';
const REGISTER_PATH = '/register';

router.post(REGISTER_PATH, register.addAccount);
router.post(LOGIN_PATH, login.checkAccount);

module.exports = router;
