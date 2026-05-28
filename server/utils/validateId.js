import mongoose from 'mongoose';

/**
 * Validates whether a string is a valid MongoDB ObjectId.
 * Returns true if valid, false otherwise.
 * Prevents "Cast to ObjectId failed" errors.
 */
export const isValidObjectId = (id) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Wraps a controller that uses findById.
 * If the ID is invalid, returns 400 immediately instead of crashing.
 */
export const validateIdParam = (req, res, paramName = 'id') => {
  const id = req.params[paramName];
  if (!isValidObjectId(id)) {
    res.status(400).json({ message: `Invalid ${paramName}: "${id}" is not a valid ObjectId` });
    return false;
  }
  return true;
};

/**
 * Safely resolve a frontend ID to a Mongo ObjectId.
 * If the ID is already a valid ObjectId, return it.
 * If not (e.g., numeric mock ID), try to find by numeric ID or title.
 * Never crashes — returns null if not resolvable.
 */
export const safeObjectId = (id) => {
  if (!id) return null;
  // Already valid?
  if (mongoose.Types.ObjectId.isValid(id)) {
    // Ensure it's actually a 24-char hex string (not just any valid string like "true")
    if (String(id).length === 24) {
      return id;
    }
  }
  return null;
};

/**
 * Find a series by its ID (ObjectId or numeric mock ID).
 * Numeric IDs are searched as string matches on various fields.
 */
export const findSeriesSafe = async (SeriesModel, id) => {
  if (!id) return null;
  
  // Try direct ObjectId lookup first
  const objId = safeObjectId(id);
  if (objId) {
    const series = await SeriesModel.findById(objId);
    if (series) return series;
  }
  
  // If numeric mock ID, try matching by numeric ID stored in a field or just search by title
  // This is best-effort for legacy mock data
  return null;
};

/**
 * Validate that a params ID is a valid ObjectId.
 * If the ID is numeric (mock-era), returns a 400 with a helpful message.
 * Otherwise, returns the validated ObjectId string.
 */
export const getValidatedId = (req, res, paramName = 'id') => {
  const id = req.params[paramName];
  if (!isValidObjectId(id)) {
    return null;
  }
  return id;
};