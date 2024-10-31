const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');

// Send a connection request
router.post('/connectionrequests', connectionController.sendConnectionRequest);

router.get('/check-request-status', connectionController.checkConnectionRequestStatus);

// Fetch all connection requests
router.get('/connectionrequests/:userId', connectionController.getConnectionRequests);

// Accept a connection request
router.post('/connection-requests/:id/accept', connectionController.acceptConnectionRequest);

// Update connection request status
router.put('/connectionrequests/:requestId', connectionController.updateConnectionRequestStatus);

// Remove a connection
router.put('/:id/remove-connection', connectionController.removeConnection);

module.exports = router;
