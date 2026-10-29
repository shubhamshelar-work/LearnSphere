// seed/dbHelpers.js
// Tiny helper shared by the seed scripts to close the connection cleanly.

const mongoose = require('mongoose')

async function disconnectDB() {
  await mongoose.connection.close()
}

module.exports = { disconnectDB }
