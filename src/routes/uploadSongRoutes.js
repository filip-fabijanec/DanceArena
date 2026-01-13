const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile } = require('../r2');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('song'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file' });
  }

  const url = await uploadFile(req.file.buffer, req.file.originalname);

  res.json({ url });
});

module.exports = router;