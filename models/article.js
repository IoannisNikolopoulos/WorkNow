const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  media: { type: [String] }, // Array of file paths
  interested: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of users interested
  comments: [commentSchema], // Use the commentSchema here
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Article', articleSchema);
