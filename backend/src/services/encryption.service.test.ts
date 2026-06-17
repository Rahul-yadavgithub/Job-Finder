import assert from 'assert';
import crypto from 'crypto';
import { encrypt, decrypt } from './encryption.service';

// Mock the environment variable for testing
process.env.ENCRYPTION_SECRET = crypto.randomBytes(32).toString('hex');

console.log('Running Encryption Service Tests...');

async function runTests() {
  const plaintext = 'my-super-secret-api-key-xyz-123';

  console.log('1. encrypt then decrypt returns original string');
  const { encryptedKey, iv, tag } = encrypt(plaintext);
  
  // Ensure it was actually encrypted
  assert.notStrictEqual(encryptedKey, plaintext);
  assert.strictEqual(typeof encryptedKey, 'string');
  assert.strictEqual(typeof iv, 'string');
  assert.strictEqual(typeof tag, 'string');

  // Decrypt should perfectly match
  const decryptedText = decrypt(encryptedKey, iv, tag);
  assert.strictEqual(decryptedText, plaintext);

  console.log('2. decrypting with wrong IV throws error');
  const badIv = crypto.randomBytes(16).toString('hex');
  assert.throws(() => {
    decrypt(encryptedKey, badIv, tag);
  }, /Unsupported state or unable to authenticate data/);

  console.log('3. decrypting with wrong tag throws error');
  const badTag = crypto.randomBytes(16).toString('hex');
  assert.throws(() => {
    decrypt(encryptedKey, iv, badTag);
  }, /Unsupported state or unable to authenticate data/);
  
  console.log('4. decrypting with wrong encryptedKey throws error');
  const badKey = encryptedKey.substring(0, encryptedKey.length - 2) + '00';
  assert.throws(() => {
    decrypt(badKey, iv, tag);
  }, /Unsupported state or unable to authenticate data/);

  console.log('✅ ALL TESTS PASSED');
}

runTests().catch(err => {
  console.error('❌ TEST FAILED', err);
  process.exit(1);
});
