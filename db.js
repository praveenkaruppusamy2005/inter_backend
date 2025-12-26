import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://ipraveen982005_db_user:jT2Jwg9Wrzlp3uMS@user.ckoc9vn.mongodb.net/?appName=user';
    console.log('Connecting to MongoDB with URI:', uri.replace(/:([^:@]+)@/, ':****@')); // Hide password in logs
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err; // Re-throw to prevent server from starting with failed DB connection
  }
};

export default connectDB;
