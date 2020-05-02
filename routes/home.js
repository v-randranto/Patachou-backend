const express = require('express');
const router = express.Router();

/* Test */
router.get('/', function(req, res, next) {
  res.status(httpStatusCodes.OK).end('home', { title: 'Patachou' });
});

module.exports = router;
