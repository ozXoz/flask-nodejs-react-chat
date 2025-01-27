const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/fileController');
const router = express.Router();

const upload = multer({ dest: 'uploads/' }); // Configure multer for file uploads

router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;
