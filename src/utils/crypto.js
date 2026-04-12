// PBKDF2 passphrase hashing via Web Crypto API
// Zero dependencies, native browser support

const ITERATIONS = 100_000;
const KEY_LENGTH = 256; // bits
const SALT_LENGTH = 16; // bytes

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function deriveKey(passphrase, saltBytes) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial, KEY_LENGTH
  );
  return toHex(bits);
}

/**
 * Hash a passphrase with a fresh random salt.
 * @returns {{ salt: string, hash: string }} hex-encoded
 */
export async function hashPassphrase(passphrase) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const salt = toHex(saltBytes);
  const hash = await deriveKey(passphrase, saltBytes);
  return { salt, hash };
}

/**
 * Verify a passphrase against a stored salt + hash.
 * @returns {boolean}
 */
export async function verifyPassphrase(passphrase, salt, storedHash) {
  const saltBytes = fromHex(salt);
  const derived = await deriveKey(passphrase, saltBytes);
  return derived === storedHash;
}

// ============================================================
// AES-256-GCM Encryption (for response encryption)
// ============================================================

const IV_LENGTH = 12; // bytes, recommended for GCM

/**
 * Generate a random AES-256 key and return it as a hex string.
 */
export function generateFormKey() {
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(keyBytes);
}

/**
 * Import a hex-encoded key into a CryptoKey for AES-GCM.
 */
async function importAesKey(hexKey) {
  const keyBytes = fromHex(hexKey);
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/**
 * Encrypt plaintext with AES-256-GCM.
 * @param {string} plaintext - The data to encrypt
 * @param {string} hexKey - 64-char hex AES key
 * @returns {string} "iv:ciphertext" both hex-encoded
 */
export async function encryptData(plaintext, hexKey) {
  const key = await importAesKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return toHex(iv) + ':' + toHex(cipherBuffer);
}

/**
 * Decrypt an "iv:ciphertext" string with AES-256-GCM.
 * @param {string} payload - "iv:ciphertext" hex-encoded
 * @param {string} hexKey - 64-char hex AES key
 * @returns {string} decrypted plaintext
 */
export async function decryptData(payload, hexKey) {
  const [ivHex, cipherHex] = payload.split(':');
  const key = await importAesKey(hexKey);
  const iv = fromHex(ivHex);
  const cipherBytes = fromHex(cipherHex);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
  return new TextDecoder().decode(plainBuffer);
}

/**
 * Wrap (encrypt) the form key with a passphrase-derived key.
 * @param {string} formKeyHex - The AES form key to wrap
 * @param {string} passphrase - The creator's passphrase
 * @returns {{ wrappedKey: string, keySalt: string }} hex-encoded
 */
export async function wrapFormKey(formKeyHex, passphrase) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const formKeyBytes = fromHex(formKeyHex);
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, formKeyBytes);
  return {
    wrappedKey: toHex(iv) + ':' + toHex(cipherBuffer),
    keySalt: toHex(saltBytes),
  };
}

/**
 * Unwrap (decrypt) the form key with a passphrase-derived key.
 * @param {string} wrappedKey - "iv:ciphertext" hex-encoded
 * @param {string} keySalt - hex-encoded salt used during wrapping
 * @param {string} passphrase - The creator's passphrase
 * @returns {string} The decrypted form key as hex
 */
export async function unwrapFormKey(wrappedKey, keySalt, passphrase) {
  const saltBytes = fromHex(keySalt);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const [ivHex, cipherHex] = wrappedKey.split(':');
  const iv = fromHex(ivHex);
  const cipherBytes = fromHex(cipherHex);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, wrappingKey, cipherBytes);
  return toHex(plainBuffer);
}
