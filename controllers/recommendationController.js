const Recommendation = require('../models/recommendation');
const recommendationService = require('../services/recommendationService');

// Fetch recommended articles and jobs for a user
exports.getRecommendations = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch recommendations for the user
    const recommendation = await Recommendation.findOne({ userId })
      .populate('recommendedArticles')
      .populate('recommendedJobs');

    if (!recommendation) {
      return res.status(404).json({ error: 'No recommendations found' });
    }

    // Return separate lists of recommended articles and jobs
    res.json({
      recommendedArticles: recommendation.recommendedArticles,
      recommendedJobs: recommendation.recommendedJobs,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Manually trigger recommendation updates
exports.updateRecommendations = async (req, res) => {
  try {
    await recommendationService.updateRecommendations();
    res.json({ success: true, message: 'Recommendations updated for all users.' });
  } catch (error) {
    console.error('Error updating recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
