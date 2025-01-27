exports.uploadFile = (req, res) => {
    try {
      res.status(200).json({ message: 'File uploaded successfully', file: req.file });
    } catch (err) {
      res.status(500).json({ error: 'File upload failed' });
    }
  };
  