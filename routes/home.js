const express = require('express');
const router = express.Router();

/* Test */
router.get('/', function(req, res, next) {
  res.send('home', { title: 'Patachou' });
});

module.exports = router;
