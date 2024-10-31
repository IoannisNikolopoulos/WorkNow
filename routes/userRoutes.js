const express = require('express');
const userController = require('../controllers/userController'); // Import userController
const router = express.Router();

// User routes
router.post('/', userController.createUser); // Register a new user
router.post('/authenticate', userController.authenticateUser); // Authenticate/login a user
router.post('/signout', userController.signOutUser); // Sign out a user
router.post('/forgot-password', userController.forgotPassword); // Forgot password (OTP)
router.post('/reset-password', userController.resetPassword); // Reset password
router.get('/current-user', userController.getCurrentUser); // Get current logged-in user
router.get('/check-admin', userController.checkAdminStatus);
router.get('/', userController.searchUsers); // Search for users
router.get('/:id', userController.getUserById); // Get user details by ID
router.put('/:id/details', userController.updateUserDetails); // Update user details (e.g., skills, education)
router.put('/:id/password', userController.updateUserPassword); // Update password
router.put('/:id/email', userController.updateUserEmail); // Update email
router.get('/:id/network', userController.getUserConnections); // Get user's connections
router.post('/:id/connect', userController.connectUser); // Connect users
router.put('/:id/remove-connection', userController.removeConnection); // Remove connection

// Admin routes
router.get('/admin/users/:id', userController.getUserDetailsForAdmin); // Get user details for admin
router.delete('/admin/users/:id', userController.deleteUser); // Delete user by admin

module.exports = router;
