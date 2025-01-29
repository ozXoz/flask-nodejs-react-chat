exports.uploadFile = (req, res) => {
  try {
    const fileType = req.file.mimetype.startsWith("image/") ? "image" : "pdf";
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    res.status(200).json({
      message: "File uploaded successfully",
      file: {
        name: req.file.originalname,
        url: fileUrl,
        type: fileType, // Store type for correct display
      },
    });
  } catch (err) {
    res.status(500).json({ error: "File upload failed" });
  }
};
