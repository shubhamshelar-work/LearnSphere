// server.js
// Loads environment variables, connects to MongoDB, then starts the server.

require('dotenv').config()

const app = require('./app')
const connectDB = require('./config/db')

const PORT = process.env.PORT || 5000

async function start() {
  await connectDB()

  const server = app.listen(PORT, () => {
    console.log(`LearnSphere API listening on http://localhost:${PORT}`)
  })

  // Catch problems that happen outside a request, such as MongoDB dropping out.
  server.on('error', (error) => {
    console.error(`Server error: ${error.message}`)
  })
}

process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled rejection: ${reason}`)
})

start()
