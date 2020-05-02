const express = require('express');
const mailSender = new (require('../utils/email'))();
const errorHandler = require('../utils/errorHandler');
const httpStatusCodes = require('../constants/httpStatusCodes');
const router = express.Router();
const member = require('../domain/member');

/* Test */
router.post('/email', function (req, res, next) {
  if (!req.body) {
    errorHandler.perform(res, err, httpStatusCodes.BAD_REQUEST);
  }

  if (req.body) {
    if (req.body.subject && req.body.recipient && req.body.text) {
      mailSender
        .send(req.body.recipient, req.body.subject, req.body.text)
        .then((i) => {
          res.status(httpStatusCodes.OK).end('email envoyé');
        })
        .catch((err) => {
          errorHandler.perform(res, err, httpStatusCodes.INTERNAL_SERVER_ERROR);
        });
    }
  }
});

router.post('/member', function (req, res, next) {
  if (!req.body) {
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }    
     member.addOne(req, res, next);

});

router.get('/members', function (req, res, next) {
  if (!req.body) {
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }

  member.findMany(req, res, next);
});

router.get('/member/:id', function (req, res, next) {
  if (!req.params.id) {
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }
  member.findOne(req, res, next);
});

router.post('/member/:id', function (req, res, next) {
  if (!req.body && !req.params) {
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }
  member.updateOne(req, res, next);
});

router.delete('/member/:id', function (req, res, next) {
  if (!req.params) {
    res.status(httpStatusCodes.BAD_REQUEST).json({
      error: error,
    });
  }

  if (req.params.id) {
    member.deleteOne(req, res, next);
  }
});

module.exports = router;
