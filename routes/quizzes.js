const express = require('express');
const router = express.Router();

const Quiz = require('../models/Quiz');

const {
  verifyUser,
  verifyAdmin
} = require('../middleware/authenticate');

// 1. GET ALL QUIZZES - PUBLIC
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('questions').lean();
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. GET QUIZ BY ID - PUBLIC
router.get('/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).populate('questions').lean();

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found'
      });
    }

    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. CREATE QUIZ - ADMIN ONLY
router.post('/', verifyUser, verifyAdmin, async (req, res) => {
  try {
    const { title, description, questions = [] } = req.body;

    const quiz = await Quiz.create({
      title,
      description,
      questions
    });

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. UPDATE QUIZ - ADMIN ONLY
router.put('/:quizId', verifyUser, verifyAdmin, async (req, res) => {
  try {
    const { title, description, questions } = req.body;
    const updateData = { title, description };
    if (questions !== undefined) {
      updateData.questions = questions;
    }
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.quizId,
      updateData,
      { new: true, runValidators: true }
    ).populate('questions').lean();

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      message: 'Quiz updated successfully',
      quiz
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. DELETE QUIZ - ADMIN ONLY
router.delete('/:quizId', verifyUser, verifyAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(
      req.params.quizId
    );

    if (!quiz) {
      return res.status(404).json({
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
