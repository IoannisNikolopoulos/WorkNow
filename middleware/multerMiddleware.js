const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save files to 'uploads' directory
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    // Rename file to avoid name conflicts and ensure forward slashes
    const sanitizedFilename = file.originalname.replace(/\\/g, '/');
    cb(null, `${Date.now()}-${sanitizedFilename}`);
  }
});

// Initialize upload variable to handle file uploads
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|mp3|wav/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Files of this type are not allowed!');
    }
  }
});

module.exports = upload;
