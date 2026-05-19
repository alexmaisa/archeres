/**
 * crypto.ts — Archeres Zero-Knowledge E2EE Cryptography Module
 *
 * All operations use the native Web Crypto API (no external dependencies).
 * Algorithm: PBKDF2 (key derivation) + AES-256-GCM (encryption/wrapping).
 *
 * Key hierarchy:
 *   Password → PBKDF2 → Wrapping Key → AES-GCM wrap → Master Encryption Key (MEK)
 *   Recovery Key → PBKDF2 → Recovery Wrapping Key → AES-GCM wrap → MEK (same MEK)
 *
 * The server only ever stores encrypted vaults and ciphertext, never plaintext or raw keys.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 32;
const IV_BYTES = 12; // 96-bit IV for AES-GCM

// ─────────────────────────────────────────────────────────────────
// Helpers: base64 ↔ Uint8Array
// ─────────────────────────────────────────────────────────────────

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function checkSecureContext() {
  if (typeof window !== "undefined" && (!window.crypto || !window.crypto.subtle)) {
    throw new Error(
      "Web Crypto API (crypto.subtle) is unavailable.\n\n" +
      "Archeres uses Zero-Knowledge End-to-End Encryption (E2EE) to protect your research. " +
      "Modern browsers require a Secure Context (HTTPS or localhost) to enable E2EE libraries.\n\n" +
      "How to fix in Development:\n" +
      "1. Access via localhost on your PC.\n" +
      "2. On mobile/Tailscale, enable Chrome Flag 'Insecure origins treated as secure' and add your server address.\n" +
      "3. Use a TLS tunnel (e.g. Tailscale HTTPS or ngrok) for HTTPS access."
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Salt Generation
// ─────────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically random 32-byte salt, returned as base64.
 * A unique salt is generated once per user at registration time.
 */
export function generateSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
}

// ─────────────────────────────────────────────────────────────────
// Recovery Key Generation
// ─────────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically random 32-byte recovery key, returned as base64.
 * This key is sent to the user via email and used to re-derive a wrapping key
 * that can unlock the recoveryVault if the user's password is lost.
 */
export function generateRecoveryKey(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(32)));
}

// ─────────────────────────────────────────────────────────────────
// Key Derivation (PBKDF2)
// ─────────────────────────────────────────────────────────────────

/**
 * Derives an AES-256-GCM wrapping key from a secret (password or recovery key)
 * and a base64-encoded salt using PBKDF2 with 100,000 SHA-256 iterations.
 */
export async function deriveWrappingKey(
  secret: string,
  saltBase64: string
): Promise<CryptoKey> {
  checkSecureContext();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(saltBase64) as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );
}

// ─────────────────────────────────────────────────────────────────
// Master Encryption Key (MEK)
// ─────────────────────────────────────────────────────────────────

/**
 * Generates a new random AES-256-GCM Master Encryption Key.
 * This key is used to encrypt/decrypt all user research project data.
 * It is never sent to the server in plaintext — only wrapped (encrypted) form.
 */
export async function generateMasterKey(): Promise<CryptoKey> {
  checkSecureContext();
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable so it can be wrapped and stored in sessionStorage
    ["encrypt", "decrypt"]
  );
}

// ─────────────────────────────────────────────────────────────────
// Key Wrapping / Unwrapping (Vault)
// ─────────────────────────────────────────────────────────────────

/**
 * Wraps (encrypts) the MEK using a wrapping key (AES-256-GCM).
 * Returns a base64 string: IV (12 bytes) | wrapped key ciphertext.
 * This base64 string is the "vault" stored on the server.
 */
export async function wrapMasterKey(
  mek: CryptoKey,
  wrappingKey: CryptoKey
): Promise<string> {
  checkSecureContext();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const wrappedKey = await crypto.subtle.wrapKey("raw", mek, wrappingKey, {
    name: "AES-GCM",
    iv,
  });

  // Prepend IV to the wrapped key bytes
  const combined = new Uint8Array(IV_BYTES + wrappedKey.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(wrappedKey), IV_BYTES);

  return toBase64(combined);
}

/**
 * Unwraps (decrypts) a vault base64 string back into the MEK CryptoKey.
 * Expects the same format produced by wrapMasterKey: IV | ciphertext.
 * Throws if the wrapping key is incorrect (wrong password or recovery key).
 */
export async function unwrapMasterKey(
  vaultBase64: string,
  wrappingKey: CryptoKey
): Promise<CryptoKey> {
  checkSecureContext();
  const combined = fromBase64(vaultBase64);
  const iv = combined.slice(0, IV_BYTES);
  const wrappedKey = combined.slice(IV_BYTES);

  return crypto.subtle.unwrapKey(
    "raw",
    wrappedKey,
    wrappingKey,
    { name: "AES-GCM", iv },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// ─────────────────────────────────────────────────────────────────
// Data Encryption / Decryption
// ─────────────────────────────────────────────────────────────────

/**
 * Encrypts a UTF-8 plaintext string with the MEK using AES-256-GCM.
 * Returns a base64 string: IV (12 bytes) | ciphertext.
 */
export async function encryptText(
  plaintext: string,
  mek: CryptoKey
): Promise<string> {
  checkSecureContext();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    mek,
    encoded
  );

  const combined = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_BYTES);

  return toBase64(combined);
}

/**
 * Decrypts a base64 ciphertext string (produced by encryptText) back to plaintext.
 * Throws if the MEK is incorrect or the ciphertext is tampered.
 */
export async function decryptText(
  ciphertextBase64: string,
  mek: CryptoKey
): Promise<string> {
  checkSecureContext();
  const combined = fromBase64(ciphertextBase64);
  const iv = combined.slice(0, IV_BYTES);
  const ciphertext = combined.slice(IV_BYTES);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    mek,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Safely decrypts a string. Returns the original string if decryption fails or mek is null.
 * Provides excellent backward compatibility for legacy plaintext records.
 */
export async function decryptTextSafe(
  ciphertextBase64: string,
  mek: CryptoKey | null
): Promise<string> {
  if (!mek || !ciphertextBase64) return ciphertextBase64;
  try {
    const combined = fromBase64(ciphertextBase64);
    const iv = combined.slice(0, IV_BYTES);
    const ciphertext = combined.slice(IV_BYTES);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      mek,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return ciphertextBase64;
  }
}
