const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  number: String,
  photo: String, // Store the photo as a URL or file path
  admin: { type: Boolean, default: false },
  education: String,
  workExperience: String,
  skills: { type: [String], default: [] },
  connectedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  currentPosition: String,
  isEducationPublic: { type: Boolean, default: true },
  isExperiencePublic: { type: Boolean, default: true },
  isSkillsPublic: { type: Boolean, default: true },
  isCurrentPositionPublic: { type: Boolean, default: true },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
