const express = require('express');
const router = express.Router();

const Question = require('../models/Question');

const {
    verifyUser,
    verifyAuthor,
    verifyAdmin
} = require('../middleware/authenticate');

// 1. GET ALL QUESTIONS - PUBLIC
router.get('/', verifyUser, verifyAdmin, async (req, res) => {
    try {
        const questions = await Question.find()
            .populate('author', 'username')
            .lean();

        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. GET QUESTION BY ID - PUBLIC
router.get('/:questionId', async (req, res) => {
    try {
        const question = await Question.findById(
            req.params.questionId
        ).populate('author', 'username').lean();

        if (!question) {
            return res.status(404).json({
                message: 'Question not found'
            });
        }

        res.status(200).json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. CREATE QUESTION - LOGIN REQUIRED
router.post('/', verifyUser, verifyAdmin, async (req, res) => {
    try {
        const {
            text,
            options,
            correctAnswerIndex,
            keywords
        } = req.body;

        const question = await Question.create({
            text,
            options,
            correctAnswerIndex,
            keywords,
            author: req.user._id
        });

        res.status(201).json({
            message: 'Question created successfully',
            question
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put(
    '/:questionId',
    verifyUser,
    verifyAdmin,
    async (req, res) => {
        try {
            const {
                text,
                options,
                correctAnswerIndex,
                keywords
            } = req.body;

            const question = await Question.findByIdAndUpdate(
                req.params.questionId,
                {
                    text,
                    options,
                    correctAnswerIndex,
                    keywords
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            res.status(200).json({
                message: 'Question updated successfully',
                question
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

// 5. DELETE QUESTION - AUTHOR ONLY
router.delete(
    '/:questionId',
    verifyUser,
    verifyAdmin,
    async (req, res) => {
        try {
            await Question.findByIdAndDelete(
                req.params.questionId
            );

            res.status(200).json({
                message: 'Question deleted successfully'
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

module.exports = router;
