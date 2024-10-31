const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');

// Log an interaction
router.post('/', interactionController.logInteraction);

// Check if an interaction already exists for an article
router.get('/articles', interactionController.checkArticleInteraction);

// Check if an interaction already exists for a job
router.get('/jobs', interactionController.checkJobInteraction);

// Log an article interaction
router.post('/articles', interactionController.logArticleInteraction);

// Log a job interaction
router.post('/jobs', interactionController.logJobInteraction);

module.exports = router;
