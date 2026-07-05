const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/realtime-chat';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

module.exports = connectDB;
