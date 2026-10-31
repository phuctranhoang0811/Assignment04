
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const Question = require('../models/Question');


exports.verifyUser = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const token = header.substring(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid user'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};


exports.verifyAdmin = (req, res, next) => {
  if (req.user && req.user.admin === true) {
    return next();
  }

  return res.status(403).json({
    message: 'You are not authorized to perform this operation!'
  });
};


exports.verifyAuthor = async (req, res, next) => {
  try {


    if (!mongoose.isValidObjectId(req.params.questionId)) {
      return res.status(400).json({
        message: 'Invalid question ID'
      });
    }

 
    const question = await Question.findById(
      req.params.questionId
    );

    if (!question) {
      return res.status(404).json({
        message: 'Question not found'
      });
    }


    if (
      !question.author ||
      !question.author.equals(req.user._id)) {
      return res.status(403).json({
        message: 'You are not the author of this question'
      });
    }


    req.question = question;

    next();

  } catch (error) {
    next(error);
  }
};
