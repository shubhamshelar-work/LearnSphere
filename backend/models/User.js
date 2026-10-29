// models/User.js
// Collection: users
// Stores student and admin accounts. Passwords are always hashed.

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
  },
  { timestamps: true },
)

// Hash the password before saving, but only if it was changed.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Compare a plain password with the stored hash.
userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password)
}

// Make sure a password hash can never leak in an API response.
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password
    delete ret.__v
    return ret
  },
})

module.exports = mongoose.model('User', userSchema)
