const express = require('express');
const router = express.Router();
const jobListingController = require('../controllers/jobListingController');

// Fetch job listings
router.get('/', jobListingController.getJobListings);

// Create a new job listing
router.post('/', jobListingController.postJobListing); // Fixed function name

// Apply for a job listing
router.post('/:id/apply', jobListingController.applyForJobListing);

// Delete a job listing
router.delete('/:id', jobListingController.deleteJobListing);

// Fetch user's job listings with applicants
router.get('/my-job-listings-with-applicants', jobListingController.getJobListingsWithApplicants); // Fixed function name

// Fetch job listing by ID
router.get('/:id', jobListingController.getJobListingById); // Fixed function name

module.exports = router;
