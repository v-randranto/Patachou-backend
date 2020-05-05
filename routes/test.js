const express = require('express');
const mailSender = new (require('../utils/email'))();
const errorHandler = require('../utils/errorHandler');
const httpStatusCodes = require('../constants/httpStatusCodes');
const router = express.Router();
const test = require('../controllers/test');
const logger = require('../utils/logger');

/* Test */
router.post('/email', function (req, res) {
  if (!req.body) {
    const error = new Error('there is no request body');
    logger.error(error);
    errorHandler.perform(res, error, httpStatusCodes.BAD_REQUEST);
  }

    if (req.body.subject && req.body.recipient && req.body.text) {
      mailSender
        .send(req.body.recipient, req.body.subject, req.body.text)
        .then(() => {
          logger.info(req.body);
          res.status(httpStatusCodes.OK).end('email envoyé');
        })
        .catch((err) => {
          logger.error(`email ko - ${req.body} - ${err}`);
          errorHandler.perform(res, err, httpStatusCodes.INTERNAL_SERVER_ERROR);
        });
   
  }
});

router.post('/cr-member', function (req, res, next) {
  if (!req.body) {
    const error = new Error('there is no request body');
    logger.error(error);
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }    
     test.addOne(req, res, next);

});

router.post('/gt-member', function (req, res, next) {
  if (!req.body) {
    const error = new Error('there is no request body');
    logger.error(error);
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }    
     test.findOne(req, res, next);

});

router.get('/members', function (req, res, next) {
  if (!req.body) {
    const error = new Error('there is no request body');
    logger.error(error);
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }

  test.find(req, res, next);
});

router.post('/connect', function (req, res, next) {
  if (!req.body) {
    logger.error(error);
    const error = new Error('there is no request params');
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }
  test.connect(req, res, next);
});

router.post('/ud-member', function (req, res, next) {
  if (!req.body ) {
    logger.error(error);
    const error = new Error('there is no request body ');
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }
  test.updateOne(req, res, next);
});

router.delete('/member/:id', function (req, res, next) {
  if (!req.params) {
    const error = new Error('there is no request params');
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }

  if (req.params.id) {
    test.deleteOne(req, res, next);
  }
});

module.exports = router;
