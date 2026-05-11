const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    cached.promise = mongoose.connect(mongoUri, {
      connectTimeoutMS: 30000,  // Increased for serverless
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,           // Reduce for serverless
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
    }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;