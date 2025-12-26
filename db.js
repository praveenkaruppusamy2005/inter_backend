import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = "mongodb+srv://ipraveen982005_db_user:jT2Jwg9Wrzlp3uMS@user.ckoc9vn.mongodb.net/?appName=user" || 'mongodb://127.0.0.1:27017/interview-pro';
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

export default connectDB;
