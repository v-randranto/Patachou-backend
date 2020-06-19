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
const { logging } = require('./utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const PATH_STATIC_FILES = 'dist/frontend/';
const CONNECTION_API_PATH = '/api/connection';
const MEMBER_API_PATH = '/api/member';
const RELATION_API_PATH = '/api/relation';
const connectionRouter = require('./routes/connection');
const memberRouter = require('./routes/member');
const relationRouter = require('./routes/relation');

const app = express();
// app.use(helmet());
app.disable('x-powered-by');

app.use(bodyParser.json({limit: '1mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '1mb', extended: true}));

app.use(cors());
// TODO revoir l'utilisation d'helmet

app.use(express.static(PATH_STATIC_FILES));

const dbUrl = process.env.DB_URL;

mongoose
  .connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    logging('info', base, null, `Connected to MongoDB`);
  })
  .catch((error) => {
    logging('error', base, null, 'MongoDB connection failed !', error);
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
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
    // maxAge: process.env.COOKIE_MAXAGE
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRES)
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
  .unless({path: /\/api\/connection/i })  
  );

// routes
app.use(CONNECTION_API_PATH, connectionRouter);
app.use(MEMBER_API_PATH, memberRouter);
app.use(RELATION_API_PATH, relationRouter);

app.get('/*', function (req, res) {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile('index.html', { root: PATH_STATIC_FILES });
  }
});

app.use(function (req, res) {  
  console.log('oups')
      res.end();  
});

module.exports = app;
