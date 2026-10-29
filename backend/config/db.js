// config/db.js
// Connects the application to MongoDB Atlas using Mongoose.

const mongoose = require('mongoose')

async function connectDB() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error(
      'ERROR: MONGODB_URI is not set. Create backend/.env (copy .env.example) ' +
        'and paste your MongoDB Atlas connection string.',
    )
    process.exit(1)
  }

  try {
    const connection = await mongoose.connect(uri)
    console.log(`MongoDB connected successfully: ${connection.connection.host}`)
  } catch (error) {
    console.error(`ERROR: MongoDB connection failed -> ${error.message}`)
    console.error(
      'Check your connection string, database user password, and that your IP is allowed in Atlas Network Access.',
    )
    process.exit(1)
  }
}

module.exports = connectDB
