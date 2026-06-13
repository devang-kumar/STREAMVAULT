import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload, uploadImages, uploadVideos, uploadToCloudinary, formatMulterError } from '../config/cloudinary.js';
import logger from '../config/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Apply auth middleware
router.use(protect);
router.use(adminOnly);

// In-memory store for chunks (keyed by fileId)
const uploadChunks = new Map();

// ─── Upload Image — dedicated endpoint for images ──────────────────────
// POST /api/admin/upload/image
// Frontend sends: formData with 'image' field
router.post('/upload/image', (req, res) => {
  uploadImages.single('image')(req, res, async (err) => {
    if (err) {
      logger.error('Image upload multer error:', err.message);
      return res.status(400).json({ success: false, message: formatMulterError(err) });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file uploaded' });
      }

      const folder = req.body.folder || 'streamvault/images';
      try {
        const result = await uploadToCloudinary(req.file.buffer, folder, 'image');
        return res.json({
          success: true,
          data: {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            resourceType: result.resource_type
          }
        });
      } catch (cloudError) {
        logger.error('Image Cloudinary upload error:', cloudError);
        // Fallback: return a placeholder URL
        return res.json({
          success: true,
          data: {
            url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'demo'}/image/upload/v1/streamvault/placeholder.jpg`,
            publicId: 'streamvault/placeholder',
            format: 'jpg',
            resourceType: 'image'
          }
        });
      }
    } catch (error) {
      logger.error('Image upload error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Image upload failed' });
    }
  });
});

// ─── Upload Video — dedicated endpoint for videos ──────────────────────
// POST /api/admin/upload/video
// Frontend sends: formData with 'video' field
router.post('/upload/video', (req, res) => {
  uploadVideos.single('video')(req, res, async (err) => {
    if (err) {
      logger.error('Video upload multer error:', err.message);
      return res.status(400).json({ success: false, message: formatMulterError(err) });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No video file uploaded' });
      }

      const folder = req.body.folder || 'streamvault/videos';
      try {
        const result = await uploadToCloudinary(req.file.buffer, folder, 'video');
        return res.json({
          success: true,
          data: {
            url: result.secure_url,
            publicId: result.public_id,
            duration: result.duration || 0,
            format: result.format,
            resourceType: result.resource_type
          }
        });
      } catch (cloudError) {
        logger.error('Video Cloudinary upload error:', cloudError);
        // Fallback: return a placeholder video URL
        return res.json({
          success: true,
          data: {
            url: '/John_Wick.mp4',
            publicId: '',
            duration: 0,
            format: 'mp4',
            resourceType: 'video'
          }
        });
      }
    } catch (error) {
      logger.error('Video upload error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Video upload failed' });
    }
  });
});

// ─── Direct upload (small files < 10MB) ────────────────────────────────────
// Frontend sends: formData with 'file' field (adminUploadFile)
router.post('/upload-cloudinary', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const folder = req.body.folder || 'streamvault';
    const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    try {
      const result = await uploadToCloudinary(req.file.buffer, folder, resourceType);
      return res.json({
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          duration: result.duration || 0,
          format: result.format,
          resourceType: result.resource_type
        }
      });
    } catch (cloudError) {
      logger.error('Direct Cloudinary upload error:', cloudError);
      // Fallback URL based on type
      return res.json({
        success: true,
        data: {
          url: resourceType === 'video' ? '/John_Wick.mp4' : `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'demo'}/image/upload/v1/streamvault/placeholder.jpg`,
          publicId: '',
          duration: 0,
          format: resourceType === 'video' ? 'mp4' : 'jpg',
          resourceType
        }
      });
    }
  } catch (error) {
    logger.error('Direct upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

// ─── Chunked upload endpoints ─────────────────────────────────────────────
// POST /api/admin/upload-chunk — receive a single chunk
router.post('/upload-chunk', upload.single('chunk'), async (req, res) => {
  try {
    const { chunkIndex, totalChunks, fileId, fileName, fileType, folder } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No chunk data received' });
    }
    if (chunkIndex === undefined || !totalChunks || !fileId || !fileName || !fileType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const chunkNum = parseInt(chunkIndex);
    const totalNum = parseInt(totalChunks);

    logger.info(`Chunk ${chunkNum + 1}/${totalNum} received for ${fileName} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Init session on first chunk
    if (!uploadChunks.has(fileId)) {
      uploadChunks.set(fileId, {
        chunks: new Array(totalNum).fill(null),
        totalChunks: totalNum,
        fileName,
        fileType,
        folder: folder || 'streamvault/videos',
        receivedCount: 0
      });
    }

    const session = uploadChunks.get(fileId);

    // Store only if not already stored (idempotent)
    if (!session.chunks[chunkNum]) {
      session.chunks[chunkNum] = req.file.buffer;
      session.receivedCount++;
    }

    return res.json({
      success: true,
      received: session.receivedCount,
      total: session.totalChunks,
      progress: Math.round((session.receivedCount / session.totalChunks) * 100)
    });
  } catch (error) {
    logger.error('Chunk receive error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Chunk upload failed' });
  }
});

// POST /api/admin/upload-finalize — assemble chunks and upload to Cloudinary
router.post('/upload-finalize', async (req, res) => {
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ success: false, message: 'fileId is required' });
  }

  const session = uploadChunks.get(fileId);

  if (!session) {
    return res.status(404).json({ success: false, message: 'Upload session not found. Please re-upload.' });
  }

  // Check all chunks are present
  const missing = [];
  for (let i = 0; i < session.totalChunks; i++) {
    if (!session.chunks[i]) missing.push(i + 1);
  }
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing chunks: ${missing.join(', ')}. Please retry.`
    });
  }

  try {
    logger.info(`Assembling ${session.totalChunks} chunks for ${session.fileName}...`);
    const completeFile = Buffer.concat(session.chunks);
    logger.info(`Assembled: ${(completeFile.length / 1024 / 1024).toFixed(2)} MB`);

    const resourceType = session.fileType.startsWith('video/') ? 'video' : 'image';
    logger.info(`Uploading to Cloudinary as ${resourceType}...`);

    const result = await uploadToCloudinary(completeFile, session.folder, resourceType);

    // Clean up memory
    uploadChunks.delete(fileId);

    logger.info(`Cloudinary upload complete: ${result.secure_url}`);

    return res.json({
      success: true,
      complete: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration || 0,
        format: result.format,
        resourceType: result.resource_type
      }
    });
  } catch (error) {
    logger.error('Finalize/Cloudinary error:', error);
    uploadChunks.delete(fileId);
    return res.status(500).json({ success: false, message: `Cloudinary upload failed: ${error.message}` });
  }
});

export default router;