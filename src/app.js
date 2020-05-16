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
const jwt = require('express-jwt');
const httpStatusCodes = require('./constants/httpStatusCodes.json');
const { logging } = require('./utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const PATH_STATIC_FILES = 'dist/frontend/';
const CONNECTION_API_PATH = '/api/connection';
const PROFILE_API_PATH = '/api/profile';

const app = express();
const connectionRouter = require('./routes/connection');
const profileRouter = require('./routes/profile');

app.use(cors());
// TODO revoir l'utilisation d'helmet
app.use(helmet());
app.use(express.static(PATH_STATIC_FILES));

const dbUrl = require('config').get('db_url');

mongoose
  .connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    logging('info', base, null, `Connected to MongoDB`);
  })
  .catch((error) => {
    logging('error', base, null, 'MongoDB connection failed !', error);
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
  },
};

app.use(expressSession(options));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  logging('info', base, req.sessionID, `PATH=${req.originalUrl}`);
  next();
});

// middleware vérifiant la validité du token transmis par le client
app.use(
  jwt({ secret: process.env.TOKEN_KEY})
  .unless({path: ['/api/connection/login', '/api/connection/register']})
  );

// routes
app.use(CONNECTION_API_PATH, connectionRouter);
app.use(PROFILE_API_PATH, profileRouter);

app.get('/*', function (req, res) {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile('index.html', { root: PATH_STATIC_FILES });
  }
});

// Catch unauthorised errors
app.use(function (err, req, res) {
  if (err.name === 'UnauthorizedError') {
    logging('error', base, req.sessionID, `jwt check : unauthorized.`);
    res.status(httpStatusCodes.UNAUTHORIZED).json({"message" : err.name + ": " + err.message});
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
