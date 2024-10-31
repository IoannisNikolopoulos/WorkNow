const Article = require('../models/article');
const User = require('../models/user');
const Interaction = require('../models/interaction');
const mongoose = require('mongoose');
const Recommendation = require('../models/recommendation'); // Assuming you have a Recommendation model


// Fetch articles
exports.getArticles = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }  
  try {
    const user = await User.findById(userId).populate('connectedWith', '_id');
    if (!user) return res.status(404).json({ error: 'User not found' });

    let articles = [];

    if (user.admin) {
      articles = await Article.find().sort({ createdAt: -1 }) || [];
    } else {
      const connectedUserIds = [user._id, ...user.connectedWith.map((conn) => conn._id)];
      const articlesFromConnections = await Article.find({ authorId: { $in: connectedUserIds } }).sort({ createdAt: -1 }) || [];
      const articlesOfInterest = await Article.find({
        interested: { $in: connectedUserIds },
        authorId: { $nin: connectedUserIds },
      }).sort({ createdAt: -1 }) || [];

      // Fetch recommended articles for the user
      const recommendation = await Recommendation.findOne({ userId });
      let recommendedArticles = [];
      if (recommendation && recommendation.recommendedArticles.length > 0) {
        recommendedArticles = await Article.find({ _id: { $in: recommendation.recommendedArticles } }).sort({ createdAt: -1 });
      }

      // Combine all the fetched articles (connections, interests, recommendations)
      articles = [...recommendedArticles];
    }    

    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch specific article
exports.getArticleById = async (req, res) => {
  const { articleId } = req.params;
  const userId = req.query.userId;
  try {
    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    const user = await User.findById(userId).populate('connectedWith', '_id');
    const isConnected = user.connectedWith.some(conn => conn._id.toString() === article.authorId.toString());

    res.json({ ...article.toObject(), isConnected });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete article
exports.deleteArticle = async (req, res) => {
  const { articleId } = req.params;
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.admin) return res.status(403).json({ error: 'Unauthorized: Only admins can delete articles' });

    const article = await Article.findByIdAndDelete(articleId);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Post a new article
exports.postArticle = async (req, res) => {
  try {
    const { title, content, authorId, authorName } = req.body;
    const files = req.files ? req.files.map((file) => file.filename) : []; // Get uploaded file names

    const newArticle = new Article({
      title,
      content,
      authorId,
      authorName,
      media: files,  // Save file names in the media field
    });

    await newArticle.save();
    res.status(201).json(newArticle);
  } catch (error) {
    console.error('Error posting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// Post a comment
exports.postComment = async (req, res) => {
  const { articleId } = req.params;
  const { userId, userName, content } = req.body;
  try {
    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    const newComment = { userId, userName, content };
    article.comments.push(newComment);
    await article.save();

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  const { articleId, commentId } = req.params;
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.admin) return res.status(403).json({ error: 'Unauthorized: Only admins can delete comments' });

    const article = await Article.findById(articleId);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    article.comments = article.comments.filter((comment) => comment._id.toString() !== commentId);
    await article.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Note interest in an article
exports.noteInterest = async (req, res) => {
  const { articleId } = req.params;
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(articleId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid article ID or user ID' });
  }

  try {
    const article = await Article.findById(articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Add the user to the interested array if not already present
    if (!article.interested.includes(userId)) {
      article.interested.push(userId);
      await article.save();
      res.status(200).json({ success: true, message: 'Interest noted' });
    } else {
      res.status(400).json({ success: false, message: 'Interest already noted' });
    }
  } catch (error) {
    console.error('Error noting interest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch notifications for user's articles
exports.getArticleNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch articles where the user is the author
    const articles = await Article.find({ authorId: userId })
     .populate('interested', 'firstName lastName')
     .populate('comments.userId', 'firstName lastName')
     .lean() || [];  

    // Transform the data to the desired format
    const notifications = articles.map((article) => ({
      articleId: article._id,
      title: article.title,
      interestedUsers: article.interested.map((user) => ({
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`,
      })),
      comments: article.comments.map((comment) => ({
        _id: comment._id,
        content: comment.content,
        userName: comment.userId
          ? `${comment.userId.firstName} ${comment.userId.lastName}`
          : 'Unknown User',
        userId: comment.userId ? comment.userId._id : null,
        createdAt: comment.createdAt,
      })),
    }));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching article notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};