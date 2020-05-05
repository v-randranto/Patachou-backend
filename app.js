'use strict';
require('dotenv').config();
// const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const config = require('config');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')(expressSession);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const logger = require('./utils/logger');

const PATH_STATIC_FILES = 'dist/frontend/';

const app = express();
const testRouter = require('./routes/test');

app.use(cors());

app.use(express.static(PATH_STATIC_FILES));

const dbUrl = config.db.url;

/**
 *  Middlewares
 */

mongoose
  .connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    console.log('Connected to MongoDB ');
  })
  .catch((error) => {
    logger.error(error);
    console.error(error);
  });

const options = {
  store: new MongoStore({
    url: dbUrl,
    ttl: config.session.ttl,
    collection: config.session.name,
  }),
  secret: config.session.secret,
  saveUninitialized: true,
  resave: false,
};

app.use(expressSession(options));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/test', testRouter);

app.get('/*', function (req, res) {
  // eslint-disable-next-line no-undef
  if (process.env.NODE_ENV === 'production') {
    res.sendFile('index.html', { root: PATH_STATIC_FILES });
  }
});

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// TODO: error handler à revoir
app.use(function (err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`
  );
  // render the error page
  res.status(err.status || 500).end();
});

module.exports = app;
