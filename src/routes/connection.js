'use strict'

const express = require('express');
const router = express.Router();
const login = require('../controllers/login');
const register = require('../controllers/register');
const lostPassword = require('../controllers/lost-password');

const LOGIN_PATH = '/login';
const REGISTER_PATH = '/register';
const LOST_PASSWORD_PATH = '/password';

router.post(REGISTER_PATH, register.addAccount);
router.post(LOGIN_PATH, login.checkAccount);
router.post(LOST_PASSWORD_PATH, lostPassword.renewPassword);

module.exports = router;
