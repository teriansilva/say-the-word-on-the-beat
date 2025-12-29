/**
 * Security utilities for file upload validation and input sanitization
 */

// Maximum file sizes
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
];

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a'
];

// Magic bytes for file type verification
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header - validated separately for WEBP signature
  'image/bmp': [[0x42, 0x4D]],
  'audio/mpeg': [[0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2], [0x49, 0x44, 0x33]], // MP3 frame sync or ID3 tag
  'audio/mp3': [[0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2], [0x49, 0x44, 0x33]], // MP3 frame sync or ID3 tag
  'audio/wav': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'audio/ogg': [[0x4F, 0x67, 0x67, 0x53]], // OggS
  'audio/webm': [[0x1A, 0x45, 0xDF, 0xA3]], // EBML header
  'audio/aac': [[0xFF, 0xF1], [0xFF, 0xF9]], // ADTS AAC
  'audio/mp4': [[0x66, 0x74, 0x79, 0x70]], // ftyp box (at offset 4)
  'audio/x-m4a': [[0x66, 0x74, 0x79, 0x70]], // ftyp box (at offset 4)
};

// HTML entities for text sanitization (defined once for performance)
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

// Data URL validation pattern
const DATA_URL_PATTERN = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+)(;charset=[a-zA-Z0-9-]+)?(;base64)?,/;

// GUID validation pattern
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verify file type using magic bytes
 */
async function verifyFileSignature(file: File, expectedType: string): Promise<boolean> {
  const signatures = FILE_SIGNATURES[expectedType];
  if (!signatures) {
    // Only allow types with explicitly defined signatures
    console.warn(`No signature verification available for type: ${expectedType}`);
    return false;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      
      // Special handling for WebP to distinguish from other RIFF formats
      if (expectedType === 'image/webp') {
        // Check RIFF header first
        if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46) {
          // Check for WEBP signature at bytes 8-11
          const isWebP = arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50;
          resolve(isWebP);
          return;
        }
        resolve(false);
        return;
      }
      
      // Special handling for MP4/M4A which have ftyp at offset 4
      if (expectedType === 'audio/mp4' || expectedType === 'audio/x-m4a') {
        const matches = signatures.some(signature => {
          return signature.every((byte, index) => arr[index + 4] === byte);
        });
        resolve(matches);
        return;
      }
      
      // Check if file starts with any of the valid signatures
      const matches = signatures.some(signature => {
        return signature.every((byte, index) => arr[index] === byte);
      });
      
      resolve(matches);
    };
    reader.onerror = (error) => {
      console.error('File signature verification failed:', error);
      resolve(false);
    };
    
    // Read first 12 bytes for signature verification (enough for WEBP and MP4 check)
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

/**
 * Validate image file for security concerns
 */
export async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image must be smaller than ${MAX_IMAGE_SIZE / 1024 / 1024}MB` };
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid image format. Allowed: JPEG, PNG, GIF, WebP, BMP' };
  }

  // Verify file signature matches MIME type
  const signatureValid = await verifyFileSignature(file, file.type);
  if (!signatureValid) {
    return { valid: false, error: 'File type does not match its content' };
  }

  // Check for SVG files (which can contain scripts)
  if (file.name.toLowerCase().endsWith('.svg')) {
    return { valid: false, error: 'SVG files are not allowed for security reasons' };
  }

  return { valid: true };
}

/**
 * Validate audio file for security concerns
 */
export async function validateAudioFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > MAX_AUDIO_SIZE) {
    return { valid: false, error: `Audio file must be smaller than ${MAX_AUDIO_SIZE / 1024 / 1024}MB` };
  }

  // Check MIME type
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid audio format. Allowed: MP3, WAV, OGG, WebM, AAC, M4A' };
  }

  // Verify file signature for types we have signatures for
  if (FILE_SIGNATURES[file.type]) {
    const signatureValid = await verifyFileSignature(file, file.type);
    if (!signatureValid) {
      return { valid: false, error: 'File type does not match its content' };
    }
  } else {
    // Reject audio types without defined signatures for security
    return { valid: false, error: 'Unsupported audio format for security validation' };
  }

  return { valid: true };
}

/**
 * Sanitize text input to prevent XSS
 */
export function sanitizeText(input: string): string {
  // Replace all special characters with their HTML entity equivalents
  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Validate data URL format
 */
export function isValidDataUrl(url: string): boolean {
  if (!url.startsWith('data:')) {
    return false;
  }

  try {
    // Check if it's a valid data URL format
    if (!DATA_URL_PATTERN.test(url)) {
      return false;
    }

    // Extract MIME type
    const mimeMatch = url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+)/);
    if (!mimeMatch) {
      return false;
    }

    const mimeType = mimeMatch[1];

    // Ensure MIME type is from our allowed lists
    const isAllowedImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isAllowedAudio = ALLOWED_AUDIO_TYPES.includes(mimeType);

    if (!isAllowedImage && !isAllowedAudio) {
      return false;
    }

    // Don't allow SVG in data URLs
    if (mimeType === 'image/svg+xml') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate numeric input within bounds
 */
export function validateNumber(
  value: number,
  min: number,
  max: number,
  name: string = 'Value'
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${name} must be a valid number` };
  }

  if (value < min || value > max) {
    return { valid: false, error: `${name} must be between ${min} and ${max}` };
  }

  return { valid: true };
}

/**
 * Validate difficulty setting
 */
export function validateDifficulty(difficulty: string): difficulty is 'easy' | 'medium' | 'hard' {
  return ['easy', 'medium', 'hard'].includes(difficulty);
}

/**
 * Validate and sanitize URL parameters
 */
export function sanitizeUrlParam(param: string | null): string | null {
  if (!param) {
    return null;
  }

  // Remove any control characters and limit length
  const sanitized = param
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, 1000); // Limit length to prevent DoS

  return sanitized || null;
}

/**
 * Validate GUID format
 */
export function isValidGuid(guid: string): boolean {
  return GUID_PATTERN.test(guid);
}
