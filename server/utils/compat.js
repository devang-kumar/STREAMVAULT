/**
 * compat.js — Centralized compatibility helpers
 * 
 * Makes backend resilient to frontend mock-era payloads.
 * Safely handles: arrays/strings, comma-separated values,
 * "45m" durations, booleans as true/"true"/"on",
 * numeric IDs, year/releaseYear mismatch, showId/seriesId mismatch.
 */

/**
 * Safely convert any value to boolean.
 * Accepts: true, false, "true", "1", "on", "yes", anything else → false
 */
export const toBool = (v) => {
  if (v === true || v === false) return v;
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    return s === 'true' || s === '1' || s === 'on' || s === 'yes';
  }
  return Boolean(v);
};

/**
 * Safely convert any value to number.
 * Accepts: numbers, numeric strings, undefined → fallback
 */
export const toNum = (v, fallback = 0) => {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

/**
 * Safely parse a value as an array.
 * Accepts: arrays, comma-separated strings, JSON arrays, single string
 */
export const safeParseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    // Try JSON parse first
    try {
      const trimmed = value.trim();
      if (trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Not JSON, continue
    }
    // Comma-separated
    if (value.includes(',')) {
      return value.split(',').map(v => v.trim()).filter(Boolean);
    }
    // Single value
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
};

/**
 * Parse duration string "45m" → 2700 seconds
 * "1h 30m" → 5400 seconds
 * "1h" → 3600 seconds
 * Numeric → as-is (assumed seconds)
 * Returns number of seconds.
 */
export const parseDuration = (val) => {
  if (!val || val === '0' || val === '') return 0;
  // Already a pure number?
  const num = Number(val);
  if (!isNaN(num) && typeof val === 'number') return num;
  if (!isNaN(num) && String(val).trim() === String(num)) return num;
  
  // Parse "45m", "1h 30m", "1h" formats
  const str = String(val).toLowerCase().trim();
  let total = 0;
  const hMatch = str.match(/(\d+)\s*h/);
  const mMatch = str.match(/(\d+)\s*m/);
  const sMatch = str.match(/(\d+)\s*s/);
  if (hMatch) total += parseInt(hMatch[1]) * 3600;
  if (mMatch) total += parseInt(mMatch[1]) * 60;
  if (sMatch) total += parseInt(sMatch[1]);
  
  // If nothing matched but it's a number string, try as minutes (frontend sends "45" meaning 45m)
  if (total === 0 && !hMatch && !mMatch && !sMatch) {
    const justNum = Number(str);
    if (!isNaN(justNum) && justNum > 0 && justNum < 1000) {
      total = justNum * 60; // assume minutes
    }
  }
  
  return total || 0;
};

/**
 * Format seconds → "52m" or "1h 23m" (for frontend display)
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '45m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m === 0) return '45m';
  return `${m}m`;
};

/**
 * Resolve series/season from frontend ID.
 * Tolerates: showId, seriesId, or undefined.
 * Returns the value to use as the series field.
 */
export const resolveSeriesId = (body) => {
  return body.seriesId || body.showId || '';
};

/**
 * Resolve year from body.
 * Accepts: releaseYear or year
 */
export const resolveYear = (body) => {
  return body.releaseYear || body.year || null;
};

/**
 * Safe string array fallback
 */
export const safeArray = (arr) => {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  return [];
};

/**
 * Safe string fallback
 */
export const safeString = (str, fallback = '') => {
  if (str === undefined || str === null) return fallback;
  return String(str);
};