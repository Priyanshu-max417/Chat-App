const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const streamifier = require('streamifier');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const auth = require('../middleware/auth');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const saveLocally = (file) => {
  ensureUploadDir();
  const ext = path.extname(file.originalname) || '';
  const filename = `${crypto.randomUUID()}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
  return filename;
};

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `chat-app/${folder}`, resource_type: 'auto' },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const messageType = isImage ? 'image' : 'file';

    if (isConfigured()) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        isImage ? 'images' : 'files'
      );

      return res.json({
        url: result.secure_url,
        publicId: result.public_id,
        messageType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        storage: 'cloudinary',
      });
    }

    const filename = saveLocally(req.file);
    const url = `/uploads/${filename}`;

    res.json({
      url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      messageType,
      storage: 'local',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
