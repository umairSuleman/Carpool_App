import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

class FileUploadService {
  constructor() {
    // Create uploads directory if it doesn't exist
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    // Configure multer for local storage
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(this.uploadDir, this.getUploadFolder(file));
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    // File filter
    this.fileFilter = (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed'));
      }
    };

    // Multer upload configuration
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      },
      fileFilter: this.fileFilter
    });
  }

  // Get upload folder based on file fieldname
  getUploadFolder(file) {
    const folderMap = {
      profilePhoto: 'profiles',
      driverLicense: 'documents/licenses',
      vehicleRegistration: 'documents/registrations',
      insurance: 'documents/insurance',
      governmentId: 'documents/ids'
    };
    return folderMap[file.fieldname] || 'misc';
  }

  // Get file URL (local or S3)
  getFileUrl(filePath) {
    if (process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET) {
      return filePath; // S3 URL
    } else {
      return `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${filePath}`;
    }
  }

  // Middleware for single file upload
  uploadSingle(fieldName) {
    return this.upload.single(fieldName);
  }

  // Middleware for multiple files upload
  uploadMultiple(fieldName, maxCount = 5) {
    return this.upload.array(fieldName, maxCount);
  }

  // Middleware for multiple fields
  uploadFields(fields) {
    return this.upload.fields(fields);
  }
}

export default new FileUploadService();