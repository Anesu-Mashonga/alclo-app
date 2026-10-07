/**
 * Client-side photo handling for item uploads: validate, downscale and encode
 * as a JPEG data URL so it fits comfortably in localStorage.
 */

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
/** Value for an <input type="file" accept> attribute. */
export const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif';
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 900;
export const JPEG_QUALITY = 0.82;

const EXTENSION_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };

/** Error with a friendly message and a machine-readable code. */
export class ImageError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ImageError';
    this.code = code;
  }
}

function typeOf(file) {
  if (file?.type) return file.type.toLowerCase();
  const ext = String(file?.name ?? '').split('.').pop()?.toLowerCase();
  return EXTENSION_TYPES[ext] ?? '';
}

/**
 * Checks type and size. Returns a friendly error message, or null when the file is fine.
 * @param {File|Blob} file
 * @returns {string|null}
 */
export function validateImageFile(file) {
  if (!file) return 'Choose a photo to upload.';
  if (!ACCEPTED_IMAGE_TYPES.includes(typeOf(file))) {
    return 'That file type is not supported. Use a JPG, PNG, WebP or AVIF photo.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'That photo is larger than 8 MB. Choose a smaller one.';
  }
  return null;
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> path, which handles a few more formats in some browsers.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Validates, resizes (longest side at most 900px) and encodes a photo as a JPEG data URL.
 * Transparent areas are filled with white so product shots stay clean.
 * @param {File|Blob} file
 * @param {{ maxDimension?: number, quality?: number }} [options]
 * @returns {Promise<string>} data URL
 * @throws {ImageError}
 */
export async function readImageFile(file, options = {}) {
  const problem = validateImageFile(file);
  if (problem) throw new ImageError('invalid_file', problem);

  const maxDimension = options.maxDimension ?? MAX_IMAGE_DIMENSION;
  const quality = options.quality ?? JPEG_QUALITY;

  let source;
  try {
    source = await decode(file);
  } catch {
    throw new ImageError('decode_failed', 'We could not read that photo. Try a different file.');
  }

  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  if (!width || !height) throw new ImageError('decode_failed', 'We could not read that photo. Try a different file.');

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('canvas_unavailable', 'Your browser could not process that photo.');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  if (typeof source.close === 'function') source.close();

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Approximate size in bytes of a data URL, for storage warnings.
 * @param {string} dataUrl
 */
export function dataUrlBytes(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return 0;
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.floor((base64.length * 3) / 4);
}
