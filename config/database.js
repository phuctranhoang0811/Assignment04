const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is missing');
    }
    cachedPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      })
      .catch((err) => {
        cachedPromise = null;
        throw err;
      });
  }

  await cachedPromise;
  return mongoose.connection;
};

module.exports = connectDB;
