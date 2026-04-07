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
