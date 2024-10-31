const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const upload = require('../middleware/multerMiddleware'); // Import multer middleware

// Fetch all articles for the user
router.get('/articles/:userId', articleController.getArticles);

// Fetch a single article
router.get('/home/:articleId', articleController.getArticleById);  // Fixed

// Create a new article
router.post('/', upload.array('media', 5), articleController.postArticle);  // Allow up to 10 files

// Add a comment to an article
router.post('/:articleId/comments', articleController.postComment);  // Fixed

// Delete an article
router.delete('/:articleId', articleController.deleteArticle);

// Delete a comment from an article
router.delete('/:articleId/comments/:commentId', articleController.deleteComment);

// Note interest in an article
router.post('/:articleId/note-interest', articleController.noteInterest);

// Fetch notifications for user's articles
router.get('/notifications/:userId', articleController.getArticleNotifications);

module.exports = router;
