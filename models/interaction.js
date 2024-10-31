const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobListing', required: false },
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: false },
  interactionType: { type: [String], required: true }, // Array of strings for interaction types
  interactionScore: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

// Ensure that either jobId or articleId is present, but not both
interactionSchema.pre('validate', function (next) {
  if (!this.jobId && !this.articleId) {
    next(new Error('Either jobId or articleId must be provided.'));
  } else if (this.jobId && this.articleId) {
    next(new Error('Both jobId and articleId cannot be provided together.'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Interaction', interactionSchema);
