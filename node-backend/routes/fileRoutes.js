// fileRoutes.js

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadFile } = require("../controllers/chatController");
const User = require("../models/User"); // <<<<< ADDED: import your User model

const router = express.Router();

const avatarDir = path.join(__dirname, "../uploads/avatars");
const fileDir = path.join(__dirname, "../uploads/files");

if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`),
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, fileDir),
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * Upload Avatar => POST /file/upload-avatar
 * We also update the DB doc to store the `avatarUrl`.
 */
router.post("/upload-avatar", avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded or invalid file type." });
    }

    // Build the final URL: http://127.0.0.1:4000/uploads/avatars/<filename>
    const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;
    
    // <<<<< KEY CHANGE >>>>>
    // We expect the user's email in the request (e.g. via `req.body.email`)
    // or from the front end's fetch. If you are passing the user's email
    // in some other way, adapt accordingly.
    const userEmail = req.body.email; 
    if (!userEmail) {
      // if we have no email, we can just return the URL but not store in DB
      return res.status(400).json({ error: "Missing user email to update avatar." });
    }

    // Update the user's avatarUrl in the "users" collection
    await User.updateOne(
      { email: userEmail },
      { $set: { avatarUrl } },
      { upsert: false } // don't create a new doc if none found
    );

    console.log(`[SUCCESS] Avatar updated for email=${userEmail}:`, avatarUrl);

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      url: avatarUrl,
    });
  } catch (err) {
    console.error("[ERROR] Uploading avatar:", err);
    return res.status(500).json({ error: "Unable to upload avatar." });
  }
});

/**
 * Upload General File => POST /file/upload
 * For images/PDF in chat
 */
router.post("/upload", fileUpload.single("file"), uploadFile);

// Serve uploaded files
router.use("/avatars", express.static(avatarDir));
router.use("/files", express.static(fileDir));

module.exports = router;
