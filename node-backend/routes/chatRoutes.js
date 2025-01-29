const express = require('express');
const { getMessages, saveMessage,getConversations } = require('../controllers/chatController');
const router = express.Router();


// Get conversations
router.get('/conversations', getConversations);

// Get chat messages
router.get('/:chatId', getMessages);

// Save a new message
router.post('/:chatId', saveMessage);





module.exports = router;
