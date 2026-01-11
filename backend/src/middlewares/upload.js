import multer from 'multer';

// Store file in memory (RAM) temporarily
const storage = multer.memoryStorage();

// Accept only images, max size 5MB
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 50 },
});

export default upload;