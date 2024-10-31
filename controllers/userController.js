const User = require('../models/user');
const bcrypt = require('bcrypt');
const { storeOtp, getOtpEntry, deleteOtp } = require('../utils/otpStore');
const transporter = require('../utils/nodemailerConfig'); // Assuming transporter is in a separate config file
const ConnectionRequest = require('../models/connectionRequest');
const Recommendation = require('../models/recommendation');
const JobListing = require('../models/jobListing');
const mongoose = require('mongoose')

// Fetch user details
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId, 'firstName lastName email number photo admin education workExperience skills connectedWith currentPosition');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clean up invalid connections
    const validConnectedWith = [];
    for (const connId of user.connectedWith) {
      const exists = await User.exists({ _id: connId });
      if (exists) {
        validConnectedWith.push(connId);
      } else {
        console.log(`User ${connId} in connectedWith does not exist. Removing reference.`);
      }
    }

    if (validConnectedWith.length !== user.connectedWith.length) {
      user.connectedWith = validConnectedWith;
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user details
exports.updateUserDetails = async (req, res) => {
  const { id } = req.params;
  const { education, workExperience, skills, currentPosition, photo, isEducationPublic, isExperiencePublic, isSkillsPublic, isCurrentPositionPublic } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (education && education.trim()) user.education = education;
    if (workExperience && workExperience.trim()) user.workExperience = workExperience;
    if (skills && Array.isArray(skills)) user.skills = skills;
    if (currentPosition && currentPosition.trim()) user.currentPosition = currentPosition;
    if (photo && photo.trim()) user.photo = photo;

    user.isEducationPublic = isEducationPublic;
    user.isExperiencePublic = isExperiencePublic;
    user.isSkillsPublic = isSkillsPublic;
    user.isCurrentPositionPublic = isCurrentPositionPublic;

    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    console.log(`Attempting to delete user with ID: ${userObjectId}`);

    // Delete the user
    const user = await User.findByIdAndDelete(userObjectId);
    if (!user) {
      console.log('User not found.');
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('User deleted:', user);

    // Delete connection requests where the user is the sender or receiver
    const connRequestsResult = await ConnectionRequest.deleteMany({
      $or: [
        { senderId: userObjectId },
        { receiverId: userObjectId },
      ],
    });
    console.log('Connection requests deleted:', connRequestsResult.deletedCount);

    // Delete recommendations where the user is involved
    const recommendationsResult = await Recommendation.deleteMany({
      $or: [
        { userId: userObjectId },
        { recommendedBy: userObjectId },
      ],
    });
    console.log('Recommendations deleted:', recommendationsResult.deletedCount);

    // Delete job listings posted by the user
    const jobListingsResult = await JobListing.deleteMany({
      userId: userObjectId,
    });
    console.log('Job listings deleted:', jobListingsResult.deletedCount);

    // Remove the user from other users' connectedWith lists
    const updateResult = await User.updateMany(
      { connectedWith: userObjectId },
      { $pull: { connectedWith: userObjectId } }
    );
    console.log('Users updated:', updateResult.modifiedCount);

    res.status(200).json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch user connections
exports.getUserConnections = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('connectedWith', 'firstName lastName photo');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.connectedWith);
  } catch (error) {
    console.error('Error fetching user connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Remove user connection
exports.removeConnection = async (req, res) => {
  const { id } = req.params;
  const { targetUserId } = req.body;
  try {
    const currentUser = await User.findById(id);
    const targetUser = await User.findById(targetUserId);
    if (!currentUser || !targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    currentUser.connectedWith = currentUser.connectedWith.filter((connId) => connId.toString() !== targetUserId);
    targetUser.connectedWith = targetUser.connectedWith.filter((connId) => connId.toString() !== id);

    await currentUser.save();
    await targetUser.save();
    res.json({ success: true, message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Authenticate a user (login)
exports.authenticateUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found'); // Debugging log
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    // console.log('Password match:', isMatch); // Debugging log
    // console.log("Plain Password:", password);
    // console.log("Hashed Password from DB:", user.password);
    // console.log("Comparison Result:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set session data
    req.session.userId = user._id;
    req.session.isAdmin = user.admin;

    res.json({
      id: user._id,
      isAdmin: user.admin,
      firstName: user.firstName,
      lastName: user.lastName,
    });

  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Sign out a user
exports.signOutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error signing out:', err);
      return res.status(500).json({ error: 'Failed to sign out' });
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.json({ message: 'Signed out successfully' });
  });
};

// Create a new user (register)
exports.createUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create the new user without manually hashing the password
    const newUser = new User({
      firstName,
      lastName,
      email,
      password, // Password will be hashed by the pre('save') middleware
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Get current logged-in user
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(
      userId,
      'firstName lastName email number photo admin education workExperience skills connectedWith currentPosition'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clean up invalid connections (optimized)
    const connectedIds = user.connectedWith.map(id => id.toString());
    const existingUsers = await User.find({ _id: { $in: connectedIds } }, '_id');
    const existingIds = existingUsers.map(u => u._id.toString());

    const validConnectedWith = user.connectedWith.filter(connId => existingIds.includes(connId.toString()));

    if (validConnectedWith.length !== user.connectedWith.length) {
      user.connectedWith = validConnectedWith;
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Update user email
exports.updateUserEmail = async (req, res) => {
  const { id } = req.params;
  const { newEmail } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the new email is already in use
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
    }

    // Update the email
    user.email = newEmail;
    await user.save();

    res.json({ success: true, message: 'Email updated successfully' });
  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update user password
exports.updateUserPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update the password without manual hashing
    user.password = newPassword; // This will be hashed by the pre('save') middleware
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// Connect users (sending a connection request)
exports.connectUser = async (req, res) => {
  const { id } = req.params; // The user initiating the connection
  const { targetUserId } = req.body; // The user to be connected with

  try {
    const user = await User.findById(id);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if they are already connected
    if (user.connectedWith.includes(targetUserId)) {
      return res.status(400).json({ success: false, message: 'Already connected' });
    }

    // Connect both users
    user.connectedWith.push(targetUserId);
    targetUser.connectedWith.push(id);

    await user.save();
    await targetUser.save();

    res.json({ success: true, message: 'Users connected successfully' });
  } catch (error) {
    console.error('Error connecting users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Search users by first name, last name, or email
exports.searchUsers = async (req, res) => {
  const { search } = req.query;

  try {
    let query = {};

    // If there's a search query, modify the query to filter users
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } }, // Case-insensitive search
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query, 'firstName lastName email photo currentPosition'); // Select the fields you want to return
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Fetch user details for admin
exports.getUserDetailsForAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'firstName lastName email number photo admin biography skills connectedWith currentPosition education workExperience')
      .populate('connectedWith', 'firstName lastName photo'); // Populate connected users
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user details for admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if the current user is an admin
exports.checkAdminStatus = async (req, res) => {
  try {
    const userId = req.session.userId; // Assuming session-based authentication
    if (!userId) {
      return res.status(401).json({ isAdmin: false, error: 'Not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ isAdmin: false, error: 'User not found' });
    }

    // Check if the user is an admin
    res.json({ isAdmin: user.admin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ isAdmin: false, error: 'Internal server error' });
  }
};

// Forgot password - handle OTP generation and sending email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${email}: ${otp}`);

    // Store the OTP
    storeOtp(email, otp);

    // Define mail options
    const mailOptions = {
      from: 'johnnicks80000@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      text: `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`Error sending email to ${email}: `, error);
        return res.status(500).json({ message: 'Error sending OTP email. Please try again.' });
      }
      console.log(`Email sent: ${info.response}`);
      return res.status(200).json({ message: 'OTP sent successfully. Please check your email.' });
    });
  } catch (error) {
    console.error("Server error in forgotPassword:", error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// Validate OTP and reset password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const otpEntry = getOtpEntry(email);
  if (!otpEntry || otpEntry.otp !== otp || Date.now() - otpEntry.timestamp > 10 * 60 * 1000) {
    return res.status(400).json({ message: 'Invalid or expired OTP.' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  user.password = newPassword;
  await user.save();

  // Delete OTP after successful password reset
  deleteOtp(email);

  res.json({ message: 'Password reset successfully.', userId: user._id });
};
