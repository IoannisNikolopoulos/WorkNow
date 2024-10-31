const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// Fetch recommendations for a user
router.get('/:userId', recommendationController.getRecommendations);

// Trigger manual recommendation update
//router.post('/update', recommendationController.updateRecommendations);

module.exports = router;
