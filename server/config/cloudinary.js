// cloudinary v1 is CommonJS — use createRequire to import it in ESM
import { v2 as cloudinaryV2 } from 'cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Warn if env missing
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    '[Cloudinary] Missing env vars — uploads will fail. Check server/.env'
  );
}

// Multer memory storage
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'video/x-matroska'
];

const ALLOWED_CHUNK_TYPES = [
  'application/octet-stream'
];

// Image filter
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid image type: ${file.mimetype}. Allowed: JPG, PNG, WEBP`
      ),
      false
    );
  }
};

// Video filter
const videoFileFilter = (req, file, cb) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid video type: ${file.mimetype}. Allowed: MP4, MOV, WEBM`
      ),
      false
    );
  }
};

// Generic filter
const anyFileFilter = (req, file, cb) => {
  if (
    ALLOWED_IMAGE_TYPES.includes(file.mimetype) ||
    ALLOWED_VIDEO_TYPES.includes(file.mimetype) ||
    file.fieldname === 'chunk' ||
    ALLOWED_CHUNK_TYPES.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only images and videos are allowed.'),
      false
    );
  }
};

// Image upload — max 10MB
const uploadImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// Video upload — max 300MB
const uploadVideos = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 300 * 1024 * 1024
  }
});

// General upload — max 500MB
const upload = multer({
  storage,
  fileFilter: anyFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

// Convenience upload handlers
const uploadImage = uploadImages.single('image');
const uploadVideo = uploadVideos.single('video');

// Upload buffer to Cloudinary
const uploadToCloudinary = async (
  buffer,
  folder,
  resourceType = 'auto'
) => {
  const extension =
    resourceType === 'video'
      ? '.mp4'
      : '.tmp';

  const tmpFile = path.join(
    os.tmpdir(),
    `upload_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}${extension}`
  );

  try {
    // Write temp file
    fs.writeFileSync(tmpFile, buffer);

    // Explicit upload options
    const uploadOptions = {
      folder
    };

    uploadOptions.resource_type = resourceType;

    console.log('Uploading to Cloudinary:', {
      folder,
      resourceType,
      tmpFile
    });

    // Stable upload
    const result = await new Promise((resolve, reject) => {
      cloudinaryV2.uploader.upload(
        tmpFile,
        uploadOptions,
        (error, res) => {
          if (error) {
            console.error(
              '[Cloudinary] Upload failed:',
              error
            );

            return reject(error);
          }

          resolve(res);
        }
      );
    });

    return result;
  } catch (error) {
    console.error(
      '[Cloudinary] uploadToCloudinary failed:',
      error
    );

    throw error;
  } finally {
    // Cleanup temp file
    try {
      fs.unlinkSync(tmpFile);
    } catch (_) {}
  }
};

// Delete media from Cloudinary
const deleteFromCloudinary = async (
  publicId,
  resourceType = 'image'
) => {
  return await cloudinaryV2.uploader.destroy(publicId, {
    resource_type: resourceType
  });
};

// Generate upload signature
const generateSignature = (folder) => {
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinaryV2.utils.api_sign_request(
    {
      timestamp,
      folder
    },
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY
  };
};

// Human-readable multer errors
const formatMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    if (
      err.field === 'video' ||
      err.fieldname === 'video'
    ) {
      return 'Video too large. Maximum size is 300MB.';
    }

    return 'File too large. Maximum size is 10MB for images.';
  }

  return err.message || 'Upload error';
};

export {
  cloudinaryV2 as cloudinary,
  upload,
  uploadImages,
  uploadVideos,
  uploadImage,
  uploadVideo,
  uploadToCloudinary,
  deleteFromCloudinary,
  generateSignature,
  formatMulterError
};``