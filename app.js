'use strict'
require('dotenv').config();
const createError = require('http-errors');
const app = require('express')();
const cors = require('cors');
const config = require('config');

// const path = require('path');
const expressSession = require("express-session");
const MongoStore = require("connect-mongo")(expressSession);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const homeRouter = require('./routes/home');
const testRouter = require('./routes/test');

app.use(cors())

const dbUrl = config.db.url;

/**
 *  Middlewares 
 */

mongoose.connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    console.log('Connected to MongoDB ');
  })
  .catch((error) => {
    console.error(error);
  });

const options = {
  store: new MongoStore({
    url: dbUrl,
    ttl: config.session.ttl,
    collection: config.session.name
  }),
  secret: config.session.secret,
  saveUninitialized: true,
  resave: false
};

app.use(expressSession(options));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// TODO provisoire à supprimer
app.use(function(req, res, next) {
  console.log('config', config);
  next();
});

app.use('/', homeRouter);
app.use('/test', testRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// TODO: error handler à revoir
app.use(function(err, req, res) {
  // set locals, only providing error in development  
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).end();
});

module.exports = app;
