import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param plaintext The plaintext to encrypt
 * @returns Object containing encryptedKey, iv, and tag (all hex encoded)
 */
export function encrypt(plaintext: string): { encryptedKey: string; iv: string; tag: string } {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is missing.');
  }

  // Ensure the key is exactly 32 bytes.
  const key = Buffer.from(secret, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_SECRET must be a 64-character hex string (32 bytes).');
  }

  const ivBuffer = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, ivBuffer);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tagBuffer = cipher.getAuthTag();

  return {
    encryptedKey: encrypted,
    iv: ivBuffer.toString('hex'),
    tag: tagBuffer.toString('hex')
  };
}

/**
 * Decrypts a hex string back to plaintext using AES-256-GCM.
 * @param encryptedKey The encrypted hex string
 * @param iv The hex-encoded Initialization Vector
 * @param tag The hex-encoded Authentication Tag
 * @returns The decrypted plaintext string
 */
export function decrypt(encryptedKey: string, iv: string, tag: string): string {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is missing.');
  }

  const key = Buffer.from(secret, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  const tagBuffer = Buffer.from(tag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
  decipher.setAuthTag(tagBuffer);

  let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
