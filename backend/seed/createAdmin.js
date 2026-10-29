// seed/createAdmin.js
// Creates (or updates) an admin account. Run with:
//   npm run seed:admin -- "Admin Name" admin@example.com secret123
// Or set ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env.

require('dotenv').config()

const connectDB = require('../config/db')
const User = require('../models/User')
const { disconnectDB } = require('./dbHelpers')

async function run() {
  const [, , argName, argEmail, argPassword] = process.argv

  const name = argName || process.env.ADMIN_NAME
  const email = (argEmail || process.env.ADMIN_EMAIL || '').toLowerCase()
  const password = argPassword || process.env.ADMIN_PASSWORD

  if (!name || !email || !password) {
    console.error(
      'Missing admin details.\n' +
        'Usage: npm run seed:admin -- "Admin Name" admin@example.com secret123\n' +
        'Or set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env.',
    )
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Admin password must be at least 8 characters.')
    process.exit(1)
  }

  await connectDB()

  const existing = await User.findOne({ email })

  if (existing) {
    existing.name = name
    existing.role = 'admin'
    existing.password = password // will be re-hashed by the pre-save hook
    await existing.save()
    console.log(`Admin updated: ${email}`)
  } else {
    await User.create({ name, email, password, role: 'admin' })
    console.log(`Admin created: ${email}`)
  }

  await disconnectDB()
  process.exit(0)
}

run().catch(async (error) => {
  console.error(`Failed to create admin: ${error.message}`)
  await disconnectDB()
  process.exit(1)
})
