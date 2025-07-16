import aesjs from 'aes-js';

const SHARED_SECRET = import.meta.env.VITE_CHAT_AES_SECRET;

function getAesKey() {
  if (!SHARED_SECRET) {
    throw new Error('VITE_CHAT_AES_SECRET is not set in your .env file');
  }
  if (SHARED_SECRET.length < 8) {
    console.warn('VITE_CHAT_AES_SECRET is very short. Use at least 8+ characters for better security.');
  }
  // Ensure 32 bytes (256 bits) for AES-256
  return aesjs.utils.utf8.toBytes(SHARED_SECRET.padEnd(32, '0').slice(0, 32));
}

export function encryptMessage(plainText) {
  const key = getAesKey();
  const textBytes = new TextEncoder().encode(plainText);
  const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
  const encryptedBytes = aesCtr.encrypt(textBytes);
  return btoa(String.fromCharCode(...encryptedBytes));
}

export function decryptMessage(encryptedBase64) {
  try {
    const key = getAesKey();
    const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
    const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    return new TextDecoder().decode(decryptedBytes);
  } catch (err) {
    console.warn('Decryption failed:', err);
    return '[Unable to decrypt message]';
  }
}

export function isBase64(str) {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
} 