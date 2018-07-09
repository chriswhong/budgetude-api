const express = require('express');
// const logger = require('morgan');
require('dotenv').config();

const budget = require('./routes/budget');

const app = express();

// allows CORS
app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type');
  next();
});

// app.use(logger('dev'));

// import routes
app.use('/budget', budget);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'not found',
  });
});

module.exports = app;
