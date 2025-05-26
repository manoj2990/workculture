import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
    console.log('📁 Upload directory:', uploadDir);
        cb(null, uploadDir);
    },
    
    filename: function (req, file, cb) {
        // Use the original filename to maintain consistency
        const originalName = file.originalname;
        console.log('📄 Saving file:', originalName);
       
        cb(null, originalName);
    }
});

// File filter to accept only specific file types

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('📁 Processing file:', file);
    // console.log('📄 File details:', {
    //     mimetype: file.mimetype,
    //     size: file.size,
    //     fieldname: file.fieldname
    // });
  
    const allowedTypes = [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
    
        // Videos
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
    
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/jpg' // some browsers/devices may send jpg instead of jpeg
    ];
    
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.error('❌ Invalid file type:', file.mimetype);
        cb(new Error(`Invalid file type. Only PDF, video, and document files are allowed. Received: ${file.mimetype}`));
    }
};

// Configure multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10 // Maximum number of files
    }
});