const Conversation = require('../models/conversation');

// Fetch all conversations for a user
exports.getConversationsByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'firstName lastName photo')
      .populate({
        path: 'messages',
        populate: { path: 'senderId receiverId', select: 'firstName lastName _id' },
      });
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new conversation
exports.createConversation = async (req, res) => {
  const { participants } = req.body;
  if (!participants || participants.length !== 2) {
    return res.status(400).json({ error: 'Two participants are required to start a conversation.' });
  }
  try {
    let conversation = await Conversation.findOne({ participants: { $all: participants } });
    if (!conversation) {
      conversation = new Conversation({ participants, messages: [] });
      await conversation.save();
      participants.forEach((participantId) => {
        global.io.to(participantId.toString()).emit('newConversation', conversation);
      });
    }
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send a message in a conversation
exports.sendMessage = async (req, res) => {
  const { conversationId, senderId, receiverId, text } = req.body;
  try {
    let conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      conversation = new Conversation({ participants: [senderId, receiverId], messages: [] });
    }

    const newMessage = { senderId, receiverId, text, conversationId: conversation._id };
    conversation.messages.push(newMessage);
    await conversation.save();

    global.io.to(conversationId).emit('receiveMessage', newMessage);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
