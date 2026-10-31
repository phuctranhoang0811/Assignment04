const mongoose = require('mongoose');

const connectDB = async () => {
  // Chỉ return khi đã thực sự kết nối thành công (readyState === 1)
  if (mongoose.connection.readyState === 1) {
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is missing');
  }
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log('MongoDB connected successfully');
};

module.exports = connectDB;
