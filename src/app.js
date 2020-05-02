/* eslint-disable no-undef */
'use strict';
require('dotenv').config();
// const createError = require('http-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')(expressSession);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const logger = require('./utils/logger');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

const PATH_STATIC_FILES = 'dist/frontend/';
const MEMBER_API_PATH = '/api/member';

const app = express();
const testRouter = require('./routes/test');
const memberRouter = require('./routes/member');

app.use(cors());
// TODO revoir l'utilisateion d'helmet
app.use(helmet());
app.use(express.static(PATH_STATIC_FILES));

const dbUrl = process.env.DB_URL;
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
    ttl: process.env.SESSION_TTL,
    collection: process.env.SESSION_NAME,
  }),
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: false,
  cookie: {
    httpOnly: true,
    secure: true, 
    // maxAge: process.env.COOKIE_MAXAGE // TODO à rétablir qd plus besoin de postman
  }
};

app.use(expressSession(options));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  logger.info(`[${base}] [ID=${req.sessionID}] [PATH=${req.originalUrl}]`);
  next();

})

app.use('/test', testRouter);
app.use(MEMBER_API_PATH, memberRouter);

app.get('/*', function (req, res) {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile('index.html', { root: PATH_STATIC_FILES });
  }
});

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// TODO: error handler à revoir
// app.use(function (err, req, res) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//   logger.error(
//     `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`
//   );
//   // render the error page
//   res.status(err.status || 500).end();
// });

module.exports = app;
