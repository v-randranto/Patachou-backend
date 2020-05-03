const express = require('express');
const router = express.Router();
const httpStatusCodes = require('../constants/httpStatusCodes');

/* Test */
router.get('/', function(req, res) {
  res.status(httpStatusCodes.OK).end('home', { title: 'Patachou' });
});

module.exports = router;
