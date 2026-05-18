"use client";

// Client-side Zero-Knowledge E2EE Cryptographic Module (Web Crypto API)

/**
 * Derives a secure AES-256 GCM cryptographic key from a user's password and email.
 */
export async function deriveKey(password: string, email: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = encoder.encode(email.toLowerCase().trim());

  // 1. Import raw password bytes as a base key
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // 2. Derive AES-GCM 256-bit key using PBKDF2
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true, // Key is exportable to store raw bytes in RAM session
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a CryptoKey to a Base64 string for session storage.
 */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const rawKey = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(rawKey)));
}

/**
 * Imports a CryptoKey from a Base64 string.
 */
export async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  const rawKeyBytes = new Uint8Array(
    atob(base64Key)
      .split("")
      .map((c) => c.charCodeAt(0))
  );

  return await window.crypto.subtle.importKey(
    "raw",
    rawKeyBytes,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string using AES-GCM-256 and returns a serialized Base64 "iv:ciphertext" string.
 */
export async function encryptData(plaintext: string, key: CryptoKey): Promise<string> {
  if (!plaintext) return "";
  
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Generate a random 12-byte IV (standard for AES-GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the encoded data
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintextBytes
  );

  // Convert IV and Ciphertext to Base64 strings
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const ciphertextBase64 = btoa(
    String.fromCharCode(...new Uint8Array(ciphertextBuffer))
  );

  // Return combined string
  return `${ivBase64}:${ciphertextBase64}`;
}

/**
 * Decrypts a serialized Base64 "iv:ciphertext" string. Returns the original string on failure.
 */
export async function decryptData(encryptedString: string, key: CryptoKey): Promise<string> {
  if (!encryptedString || !encryptedString.includes(":")) {
    return encryptedString; // Return as-is (backward compatible with plaintext)
  }

  try {
    const parts = encryptedString.split(":");
    if (parts.length !== 2) return encryptedString;

    const [ivBase64, ciphertextBase64] = parts;

    // Decode Base64 components to bytes
    const iv = new Uint8Array(
      atob(ivBase64)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    const ciphertext = new Uint8Array(
      atob(ciphertextBase64)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Decrypt using Web Crypto Subtle API
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    // If decryption fails (e.g. not actual ciphertext or corrupt), fall back gracefully
    return encryptedString;
  }
}

/**
 * Helper to fetch the derived key from sessionStorage in RAM.
 */
export async function getActiveSessionKey(): Promise<CryptoKey | null> {
  if (typeof window === "undefined") return null;
  const base64Key = sessionStorage.getItem("user_vault_key");
  if (!base64Key) return null;
  try {
    return await importKeyFromBase64(base64Key);
  } catch (e) {
    return null;
  }
}
