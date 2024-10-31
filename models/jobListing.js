const mongoose = require('mongoose');

const jobListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  skills: { type: [String], required: true },
  poster: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  connected: { type: Boolean, default: false },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of applicants
});

module.exports = mongoose.model('JobListing', jobListingSchema);
