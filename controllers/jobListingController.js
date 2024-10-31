const JobListing = require('../models/jobListing');
const User = require('../models/user');
const mongoose = require('mongoose');

// Fetch all job listings
exports.getJobListings = async (req, res) => {
  const userId = req.query.userId;
  try {
    const user = await User.findById(userId).populate('connectedWith');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const connectedUserIds = user.connectedWith.map((user) => user._id.toString());
    const listings = await JobListing.find().lean();

    const listingsWithConnectionStatus = listings.map((listing) => {
      const isConnected = listing.userId && connectedUserIds.includes(listing.userId.toString());
      return { ...listing, connected: isConnected };
    });

    res.json(listingsWithConnectionStatus);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch job listing by ID
exports.getJobListingById = async (req, res) => {
  try {
    const listing = await JobListing.findById(req.params.id).populate('userId');
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const userId = req.query.userId;
    const user = await User.findById(userId).populate('connectedWith', '_id');
    const isConnected = user.connectedWith.some((conn) => conn._id.equals(listing.userId._id));

    res.json({ ...listing.toObject(), isConnected });
  } catch (err) {
    console.error('Error fetching listing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Post a new job listing
exports.postJobListing = async (req, res) => {
  try {
    const { title, description, skills, poster, userId, connected } = req.body;
    const newListing = new JobListing({
      title,
      description,
      skills: skills.split(',').map((skill) => skill.trim()),
      poster,
      userId,
      connected,
    });
    await newListing.save();
    res.status(201).json(newListing);
  } catch (error) {
    console.error('Error posting listing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply for a job listing
exports.applyForJobListing = async (req, res) => {
  try {
    const { userId } = req.body;
    const listingId = req.params.id;

    const jobListing = await JobListing.findById(listingId);
    if (!jobListing) return res.status(404).json({ error: 'Job listing not found' });

    if (jobListing.applicants.includes(userId)) {
      return res.status(400).json({ error: 'User has already applied' });
    }

    jobListing.applicants.push(userId);
    await jobListing.save();
    res.status(200).json({ message: 'Application successful', jobListing });
  } catch (error) {
    console.error('Error applying to listing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a job listing
exports.deleteJobListing = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid listing ID' });
  }

  try {
    const listing = await JobListing.findById(id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (listing.userId.toString() !== userId && !user.admin) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this listing.' });
    }

    await listing.deleteOne();
    res.status(200).json({ success: true, message: 'Job listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting job listing:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Fetch job listings with applicants
exports.getJobListingsWithApplicants = async (req, res) => {
  const userId = req.query.userId;
  try {
    const jobListings = await JobListing.find({ userId }).populate('applicants', 'firstName lastName email');
    if (!jobListings || jobListings.length === 0) {
      return res.status(404).json({ error: 'No job listings found for this user.' });
    }
    res.json(jobListings);
  } catch (error) {
    console.error('Error fetching job listings with applicants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
