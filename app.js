'use strict'
require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const expressSession = require("express-session");
const MongoStore = require("connect-mongo")(expressSession);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const homeRouter = require('./routes/home');

const app = express();
const dbUrl = `mongodb://localhost:27017/patachou`;

/**
 *  Middlewares 
 */

mongoose.connect(dbUrl, { useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB Atlas...');
  })
  .catch((error) => {
    console.error(error);
  });

const options = {
  store: new MongoStore({
    url: dbUrl,
    ttl: 60 * 60, // expiration après une heure
    collection: 'sessions'
  }),
  secret: "jeu multi-joueurs",
  saveUninitialized: true,
  resave: false
};

// autoriser les requêtes CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use(expressSession(options));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use('/', homeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).end();
});

module.exports = app;
