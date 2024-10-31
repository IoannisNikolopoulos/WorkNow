const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recommendedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobListing' }],
  recommendedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }], // For recommended articles
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
