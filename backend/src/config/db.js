const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('⚠️  Running without MongoDB. Auth and generation will fail until MongoDB is available.');
    console.error('   → Install MongoDB locally: https://www.mongodb.com/try/download/community');
    console.error('   → Or use MongoDB Atlas (free): https://www.mongodb.com/atlas');
    // Do NOT exit — allow server to run for health checks
  }
};


module.exports = connectDB;
