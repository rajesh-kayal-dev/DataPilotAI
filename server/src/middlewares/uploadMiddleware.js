import multer from 'multer';

/**
 * Secure File Upload Middleware (AWS S3 Cloud Edition)
 * - Uses memory storage for direct S3 upload
 * - Limits size to 3MB (as requested)
 * - Restricts MIME types to PDF only
 */

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF is allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB limit
  }
});

export default upload;