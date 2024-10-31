const User = require('../models/user');
const ConnectionRequest = require('../models/connectionRequest');

// Send connection request
exports.sendConnectionRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    const existingRequest = await ConnectionRequest.findOne({ senderId, receiverId });
    if (existingRequest) {
      return res.status(400).json({ message: 'Connection request already exists.' });
    }

    const newRequest = new ConnectionRequest({ senderId, receiverId });
    await newRequest.save();
    res.status(201).json({ message: 'Connection request sent.' });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Accept connection request
exports.acceptConnectionRequest = async (req, res) => {
  const { requestId } = req.params;
  const { userId } = req.body;
  try {
    const request = await ConnectionRequest.findById(requestId);
    if (request.receiverId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized action.' });
    }

    const userToConnect = await User.findById(request.senderId);
    const currentUser = await User.findById(request.receiverId);

    currentUser.connectedWith.push(userToConnect._id);
    userToConnect.connectedWith.push(currentUser._id);

    await currentUser.save();
    await userToConnect.save();
    await ConnectionRequest.findByIdAndDelete(requestId);

    res.json({ message: 'Connection accepted.' });
  } catch (error) {
    console.error('Error accepting connection request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Fetch connection requests
exports.getConnectionRequests = async (req, res) => {
  const { userId } = req.params;
  try {
    const requests = await ConnectionRequest.find({ receiverId: userId, status: 'pending' }).populate('senderId', 'firstName lastName');
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update connection request status
exports.updateConnectionRequestStatus = async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  try {
    const request = await ConnectionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Connection request not found.' });
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      const sender = await User.findById(request.senderId);
      const receiver = await User.findById(request.receiverId);

      sender.connectedWith.push(receiver._id);
      receiver.connectedWith.push(sender._id);

      await sender.save();
      await receiver.save();
    }

    res.status(200).json({ message: `Connection request ${status}.` });
  } catch (error) {
    console.error('Error updating connection request status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Remove a connection
exports.removeConnection = async (req, res) => {
  const { id } = req.params; // The ID of the current user
  const { targetUserId } = req.body; // The ID of the user to remove from connections

  try {
    const currentUser = await User.findById(id);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    currentUser.connectedWith = currentUser.connectedWith.filter(
      (connId) => connId.toString() !== targetUserId
    );
    targetUser.connectedWith = targetUser.connectedWith.filter(
      (connId) => connId.toString() !== id
    );

    await currentUser.save();
    await targetUser.save();

    res.json({ message: 'Connection removed successfully.' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.checkConnectionRequestStatus = async (req, res) => {
  const { senderId, receiverId } = req.query;
  try {
    // Check if a request exists where senderId sent to receiverId
    const sentRequest = await ConnectionRequest.findOne({
      senderId,
      receiverId,
      status: 'pending',
    });

    // Check if a request exists where receiverId sent to senderId
    const receivedRequest = await ConnectionRequest.findOne({
      senderId: receiverId,
      receiverId: senderId,
      status: 'pending',
    });

    if (sentRequest) {
      res.status(200).json({ status: 'request_sent' });
    } else if (receivedRequest) {
      res.status(200).json({ status: 'request_received' });
    } else {
      res.status(200).json({ status: 'none' });
    }
  } catch (error) {
    console.error('Error checking connection request status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};