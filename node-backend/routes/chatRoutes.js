const express = require('express');
const { getMessages, saveMessage } = require('../controllers/chatController');
const router = express.Router();

// Get chat messages
router.get('/:chatId', getMessages);

// Save a new message
router.post('/:chatId', saveMessage);



module.exports = router;
