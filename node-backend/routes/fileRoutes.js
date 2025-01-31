// routes/fileRoutes.js
// <<<<< ENTIRE FILE. The important part is using fileUpload & calling uploadFile from chatController >>>>>

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadFile } = require("../controllers/chatController"); // <<<<< import from chatController

const router = express.Router();

const avatarDir = path.join(__dirname, "../uploads/avatars");
const fileDir = path.join(__dirname, "../uploads/files");

// Ensure the directories exist
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });

// <<<<< AVATAR STORAGE / UPLOAD >>>>>
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`),
});
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// <<<<< FILE STORAGE / UPLOAD for images & PDFs >>>>>
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, fileDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`),
});
const fileUpload = multer({
  storage: fileStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only JPEG, PNG, GIF, and PDFs are allowed."),
        false
      );
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * Upload Avatar => /file/upload-avatar
 */
router.post("/upload-avatar", avatarUpload.single("avatar"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ error: "No file uploaded or invalid file type." });
  }
  // Build the URL with /uploads/avatars subfolder
  const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;

  return res.status(200).json({
    message: "Avatar uploaded successfully",
    url: avatarUrl,
  });
});

/**
 * Upload General Files => /file/upload
 */
router.post("/upload", fileUpload.single("file"), uploadFile);

// Serve the uploaded files
router.use("/avatars", express.static(avatarDir)); // => /file/avatars/<filename>
router.use("/files", express.static(fileDir));     // => /file/files/<filename>

module.exports = router;
