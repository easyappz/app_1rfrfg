/* Easyappz: client-side crypto utilities (PBKDF2 + AES-GCM) */

// Helper: Text encoders/decoders
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSubtle() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) return window.crypto.subtle;
  throw new Error('Web Crypto API is not available');
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBase64(str) {
  const bytes = encoder.encode(str);
  return bytesToBase64(bytes);
}

function base64ToString(b64) {
  const bytes = base64ToBytes(b64);
  return decoder.decode(bytes);
}

export async function deriveKey(passphrase, salt) {
  const subtle = getSubtle();
  const passBytes = encoder.encode(passphrase);
  const saltBytes = encoder.encode(salt);
  const baseKey = await subtle.importKey('raw', passBytes, 'PBKDF2', false, ['deriveKey']);
  const derivedKey = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 150000,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
  return derivedKey;
}

export async function encryptString(plainText, key) {
  const subtle = getSubtle();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const data = encoder.encode(plainText);
  const encrypted = await subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const ctBytes = new Uint8Array(encrypted);
  const payload = {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ctBytes),
  };
  const json = JSON.stringify(payload);
  return stringToBase64(json);
}

export async function decryptString(payloadBase64, key) {
  try {
    const subtle = getSubtle();
    const json = base64ToString(payloadBase64);
    const obj = JSON.parse(json);
    const iv = base64ToBytes(obj.iv);
    const ct = base64ToBytes(obj.ciphertext);
    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    const text = decoder.decode(new Uint8Array(decrypted));
    return text;
  } catch (e) {
    throw new Error('Decryption failed');
  }
}
