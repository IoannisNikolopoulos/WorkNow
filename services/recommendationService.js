const spawnSync = require('child_process').spawnSync;
const User = require('../models/user');
const Interaction = require('../models/interaction');
const Recommendation = require('../models/recommendation');
const Article = require('../models/article');
const JobListing = require('../models/jobListing');

const matrixFactorization = async (data) => {
  const inputData = JSON.stringify(data);
  const pythonProcess = spawnSync('python', ['-u', 'recommendation_service.py'], {
    input: inputData,
  });

  const pythonOutput = pythonProcess.stdout.toString();
  if (!pythonOutput) return "No interactions were found."
  const outputData = JSON.parse(pythonOutput);
  return outputData
}

// Function to update recommendations for all users
const updateRecommendations = async () => {
  try {
    const users = await User.find();

    // Fetch all articles and job listings
    const articles = await Article.find();
    const jobs = await JobListing.find();

    const articleIds = articles.map(article => article._id.toString());
    const jobIds = jobs.map(job => job._id.toString());

    const articleInteractionMatrix = [];
    const jobInteractionMatrix = [];

    for (let user of users) {
      const userInteractions = await Interaction.find({ userId: user._id });

      const articleRow = Array(articleIds.length).fill(0);
      const jobRow = Array(jobIds.length).fill(0);

      for (let interaction of userInteractions) {
        if (interaction.articleId) {
          const index = articleIds.indexOf(interaction.articleId.toString());
          if (index !== -1) {
            articleRow[index] = interaction.interactionScore;
          }
        } else if (interaction.jobId) {
          const index = jobIds.indexOf(interaction.jobId.toString());
          if (index !== -1) {
            jobRow[index] = interaction.interactionScore;
          }
        }
      }

      articleInteractionMatrix.push(articleRow);
      jobInteractionMatrix.push(jobRow);
    }

    const articleRecommendations = await matrixFactorization(articleInteractionMatrix);
    const jobRecommendations = await matrixFactorization(jobInteractionMatrix);

    console.log('Article Recommendations:', articleRecommendations);
    console.log('Job Recommendations:', jobRecommendations);

    // Verify if the recommendations map correctly to users
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      const userArticleRecommendations = articleRecommendations[i];
      const userJobRecommendations = jobRecommendations[i];

      if (!userArticleRecommendations || !userJobRecommendations) {
        console.error(`Missing recommendations for user: ${user._id}`);
        continue;
      }

      const recommendedArticles = userArticleRecommendations
        .map((score, index) => ({ index, score }))
        .sort((a, b) => b.score - a.score)
        .map(rec => articleIds[rec.index]);

      const recommendedJobs = userJobRecommendations
        .map((score, index) => ({ index, score }))
        .sort((a, b) => b.score - a.score)
        .map(rec => jobIds[rec.index]);

      await Recommendation.findOneAndUpdate(
        { userId: user._id },
        {
          recommendedArticles,
          recommendedJobs,
          updatedAt: new Date(),
        },
        { new: true, upsert: true }
      );
    }

    console.log('Recommendations updated for all users.');
  } catch (error) {
    console.error('Error updating recommendations:', error);
  }
};


// Export the function for manual and scheduled tasks
module.exports = { updateRecommendations };
