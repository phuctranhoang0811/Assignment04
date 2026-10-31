var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.status(200).json({
    message: 'Quiz API is running',
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 16) + '...' : 'NOT_FOUND',
    dbState: mongoose.connection.readyState
  });
});

module.exports = router;
