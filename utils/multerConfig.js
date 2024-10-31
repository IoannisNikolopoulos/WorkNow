const multer = require('multer');
const path = require('path');

// Set storage engine for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set the upload folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append date and extension to file name
  },
});

// Initialize upload with Multer config
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB file size limit (change if needed)
  fileFilter: function (req, file, cb) {
    // Check file type
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  },
});

module.exports = upload;
