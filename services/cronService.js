const cron = require('node-cron');
const recommendationService = require('./recommendationService');

// Function to schedule tasks
const scheduleTasks = () => {
  // Schedule the recommendation update task to run every minute
  cron.schedule('* * * * *', async () => {
    console.log('Running scheduled task: Updating recommendations');
    try {
      await recommendationService.updateRecommendations();
      console.log('Recommendations updated successfully.');
    } catch (error) {
      console.error('Error updating recommendations:', error);
    }
  });

  console.log('Scheduled tasks initialized.');
};

module.exports = { scheduleTasks };
