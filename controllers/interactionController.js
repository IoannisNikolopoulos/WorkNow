const Interaction = require('../models/interaction');
const Article = require('../models/article');
const JobListing = require('../models/jobListing');
const User = require('../models/user');

// Log an interaction
exports.logInteraction = async (req, res) => {
  const { userId, jobId, articleId, interactionType } = req.body;

  try {
    let interaction;

    if (articleId) {
      interaction = await Interaction.findOne({ userId, articleId });
    } else if (jobId) {
      interaction = await Interaction.findOne({ userId, jobId });
    }

    if (interaction) {
      // If interaction exists, add new interaction type if not already present
      if (!interaction.interactionType.includes(interactionType)) {
        interaction.interactionType.push(interactionType);
        interaction.interactionScore += 1;
        await interaction.save();
      }
    } else {
      // Create a new interaction
      interaction = new Interaction({
        userId,
        jobId,
        articleId,
        interactionType: [interactionType],
        interactionScore: 1,
      });
      await interaction.save();
    }

    res.status(201).json({ success: true, interaction });
  } catch (error) {
    console.error('Error logging interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch interactions related to an article or job
exports.getInteractions = async (req, res) => {
  const { userId, articleId, jobId, interactionType } = req.query;

  try {
    let query = { userId };
    if (articleId) query.articleId = articleId;
    if (jobId) query.jobId = jobId;
    if (interactionType) query.interactionType = { $in: [interactionType] };

    const interactions = await Interaction.find(query);
    res.status(200).json(interactions);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Log interest in an article or job
exports.noteInterest = async (req, res) => {
  const { userId } = req.body;
  const { articleId, jobId } = req.params;

  if (!articleId && !jobId) {
    return res.status(400).json({ error: 'Article ID or Job ID is required' });
  }

  try {
    let interaction;
    if (articleId) {
      interaction = await Interaction.findOne({ userId, articleId });
    } else if (jobId) {
      interaction = await Interaction.findOne({ userId, jobId });
    }

    if (!interaction) {
      // Create a new interaction if none exists
      interaction = new Interaction({
        userId,
        articleId: articleId || null,
        jobId: jobId || null,
        interactionType: ['interested'],
        interactionScore: 1,
      });
      await interaction.save();
      return res.status(200).json({ success: true, message: 'Interest noted', interaction });
    }

    // Check if the "interested" interaction already exists
    if (!interaction.interactionType.includes('interested')) {
      interaction.interactionType.push('interested');
      interaction.interactionScore += 1;
      await interaction.save();
      return res.status(200).json({ success: true, message: 'Interest noted', interaction });
    } else {
      return res.status(400).json({ error: 'Interest already noted' });
    }
  } catch (error) {
    console.error('Error noting interest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch notifications (interested and comments) for a user’s articles
exports.getArticleNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch articles where the user is the author
    const articles = await Article.find({ authorId: userId })
      .populate('interested', 'firstName lastName')
      .populate('comments.userId', 'firstName lastName')
      .lean();

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
        userName: `${comment.userId.firstName} ${comment.userId.lastName}`,
        userId: comment.userId._id,
        createdAt: comment.createdAt,
      })),
    }));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching article notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if an interaction already exists for an article
exports.checkArticleInteraction = async (req, res) => {
  const { userId, articleId, interactionType } = req.query;

  try {
    // Find the interaction where the interactionType contains the requested type
    const interaction = await Interaction.findOne({
      userId,
      articleId,
      interactionType: { $in: [interactionType] }, // Use $in to check if the type exists in the array
    });

    if (interaction) {
      return res.status(200).json(interaction);
    } else {
      return res.status(404).json({ success: false, message: 'Interaction not found' });
    }
  } catch (error) {
    console.error('Error checking article interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if an interaction already exists for a job
exports.checkJobInteraction = async (req, res) => {
  const { userId, jobId, interactionType } = req.query;

  try {
    const interaction = await Interaction.findOne({
      userId,
      jobId,
      interactionType: { $in: [interactionType] },
    });

    if (interaction) {
      return res.status(200).json(interaction);
    } else {
      return res.status(404).json({ success: false, message: 'Interaction not found' });
    }
  } catch (error) {
    console.error('Error checking job interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Log an interaction for an article
exports.logArticleInteraction = async (req, res) => {
  const { userId, articleId, interactionType } = req.body;

  if (!userId || !articleId || !interactionType) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
      let interaction = await Interaction.findOne({ userId, articleId });

      if (interaction) {
          if (!interaction.interactionType.includes(interactionType)) {
              interaction.interactionType.push(interactionType);
              interaction.interactionScore += 1;
              await interaction.save();
          } else {
              return res.status(400).json({ error: 'Interaction already logged' });
          }
      } else {
          interaction = new Interaction({
              userId,
              articleId,
              interactionType: [interactionType],
              interactionScore: 1,
          });
          await interaction.save();
      }

      res.status(201).json({ success: true, interaction });
  } catch (error) {
      console.error('Error logging interaction:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};


// Log an interaction for a job
exports.logJobInteraction = async (req, res) => {
  const { userId, jobId, interactionType } = req.body;

  if (!userId || !jobId || !interactionType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let interaction = await Interaction.findOne({ userId, jobId });

    if (interaction) {
      // If interaction exists, add new interaction type if not already present
      if (!interaction.interactionType.includes(interactionType)) {
        interaction.interactionType.push(interactionType);
        interaction.interactionScore += 1; // Increment interaction score
        await interaction.save();
      } else {
        return res.status(400).json({ error: 'Interaction already logged' });
      }
    } else {
      // Create a new interaction for the job
      interaction = new Interaction({
        userId,
        jobId,
        interactionType: [interactionType],
        interactionScore: 1, // Start with an initial score of 1
      });
      await interaction.save();
    }

    res.status(201).json({ success: true, interaction });
  } catch (error) {
    console.error('Error logging job interaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
