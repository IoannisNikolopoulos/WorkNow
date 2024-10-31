const { spawnSync } = require('child_process');
const Interaction = require('../models/interaction');
const Article = require('../models/article');
const JobListing = require('../models/jobListing');
const Recommendation = require('../models/recommendation');

// Function to generate recommendations based on interactions
const generateRecommendations = async (userId) => {
  try {
    const interactions = await Interaction.find({ userId });
    
    const articles = await Article.find();
    const jobs = await JobListing.find();
    
    const itemIds = [...articles.map(article => article._id.toString()), ...jobs.map(job => job._id.toString())];

    const interactionMatrix = interactions.map(interaction => {
      const row = Array(itemIds.length).fill(0);
      const interactionIndex = itemIds.indexOf(interaction.articleId || interaction.jobId);
      
      if (interactionIndex > -1) {
        row[interactionIndex] += interaction.interactionScore;
      }
      return row;
    });

    if (!interactionMatrix.length) {
      return []; // Return an empty array if no interactions
    }

    const inputData = JSON.stringify(interactionMatrix);
    const pythonProcess = spawnSync('python', ['-u', 'recommendation_service.py'], { input: inputData });

    const pythonOutput = pythonProcess.stdout.toString();
    const outputData = JSON.parse(pythonOutput);

    const recommendedItemIds = outputData.map(row => itemIds[row.index]);
    const recommendedArticles = await Article.find({ _id: { $in: recommendedItemIds } });
    const recommendedJobs = await JobListing.find({ _id: { $in: recommendedItemIds } });

    return { recommendedArticles, recommendedJobs };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
};

module.exports = { generateRecommendations };
