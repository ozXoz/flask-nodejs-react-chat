const express = require("express");
const multer = require("multer");
const { uploadFile } = require("../controllers/fileController");

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// File upload route
router.post("/upload", upload.single("file"), uploadFile);

module.exports = router;
