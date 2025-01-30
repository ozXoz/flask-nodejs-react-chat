const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// ✅ Ensure Upload Directories Exist
const avatarDir = path.join(__dirname, "../uploads/avatars");
const fileDir = path.join(__dirname, "../uploads/files");

// Create directories if they do not exist
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });

/**
 * ✅ Multer Configuration for Avatars
 * - Stores in `uploads/avatars/`
 * - Accepts JPEG, PNG, GIF
 * - Max size: 5MB
 */
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`),
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * ✅ Multer Configuration for General Files (Images & PDFs)
 * - Stores in `uploads/files/`
 * - Accepts JPEG, PNG, GIF, PDF
 * - Max size: 10MB
 */
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, fileDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`),
});

const fileUpload = multer({
  storage: fileStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and PDFs are allowed."), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * ✅ Route: Upload Avatar (`/upload-avatar`)
 * - Saves file in `/uploads/avatars/`
 * - Returns file URL
 */
router.post("/upload-avatar", avatarUpload.single("avatar"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded or invalid file type." });
  }

  const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;

  res.status(200).json({
    message: "Avatar uploaded successfully",
    url: avatarUrl,
  });
});

/**
 * ✅ Route: Upload General Files (Images/PDFs) (`/upload`)
 * - Saves file in `/uploads/files/`
 * - Returns file URL
 */
router.post("/upload", fileUpload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded or invalid file type." });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/files/${req.file.filename}`;

  res.status(200).json({
    message: "File uploaded successfully",
    file: { name: req.file.originalname, url: fileUrl, type: req.file.mimetype },
  });
});

/**
 * ✅ Route: Serve Uploaded Files
 */
router.use("/avatars", express.static(avatarDir));
router.use("/files", express.static(fileDir));

/**
 * ✅ Export Router
 */
module.exports = router;
