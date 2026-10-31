
var express = require('express');
var router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyUser, verifyAdmin } = require('../middleware/authenticate');

// 1. REGISTER USER
router.post('/register', async (req, res) => {
  try {
    const { username, password, isAdmin = false } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: 'Username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      admin: Boolean(isAdmin)
    });

    res.status(201).json({
      message: 'User registered successfully',
      username: user.username,
      isAdmin: user.admin,
      hashedPassword: user.password
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.post('/register-admin', verifyUser, verifyAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: 'Username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await User.create({
      username,
      password: hashedPassword,
      admin: true
    });

    res.status(201).json({
      message: 'Admin registered successfully',
      username: adminUser.username,
      admin: adminUser.admin
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. LOGIN USER / ADMIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username })
      .select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }

    const isMatch = await bcrypt.compare(
      password || '',
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token: token,
      username: user.username,
      admin: user.admin
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. GET ALL USERS - ADMIN ONLY
router.get('/', verifyUser, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json(users);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
