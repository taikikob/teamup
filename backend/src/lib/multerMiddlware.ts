import multer from 'multer'
import sharp from 'sharp'

// Middleware for handling file uploads using multer
// Express cannot handle multipart/form-data directly, so we use multer
// This middleware will handle file uploads and store them in s3
// sharp is used to modify the image by resizing

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

export default upload;
