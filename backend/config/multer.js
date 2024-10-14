import multer from 'multer';

// Multer configuration for memory storage
const storage = multer.memoryStorage(); // Store files in memory as Buffer for direct Cloudinary upload

// Restrict to video file types (optional but recommended for your use case)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Not a video file! Only video files are allowed.'), false);
  }
};

// Set file size limit (optional, but good practice for handling large videos)
const limits = {
  fileSize: 100 * 1024 * 1024, // 50 MB max file size
};

// Create the Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits,
});

// Exporting upload for use in other routes
export { upload };
