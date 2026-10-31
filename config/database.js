const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is missing in Vercel settings');
  }
  await mongoose.connect(uri);
  console.log('MongoDB connected successfully');
};

module.exports = connectDB;
