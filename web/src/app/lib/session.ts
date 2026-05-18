/**
 * session.ts — Archeres MEK Session Manager
 *
 * The Master Encryption Key (MEK) is a CryptoKey object that cannot be directly
 * serialized to sessionStorage. This module handles exporting the MEK to JWK
 * (JSON Web Key) format for storage and re-importing it when needed.
 *
 * MEK is stored in sessionStorage (not localStorage) so it is automatically
 * cleared when the browser tab or session is closed.
 */

const MEK_SESSION_KEY = "archeres_mek";

/**
 * Exports a CryptoKey MEK to JWK format and stores it in sessionStorage.
 */
export async function storeMEK(mek: CryptoKey): Promise<void> {
  const jwk = await crypto.subtle.exportKey("jwk", mek);
  sessionStorage.setItem(MEK_SESSION_KEY, JSON.stringify(jwk));
}

/**
 * Retrieves the MEK from sessionStorage and re-imports it as a CryptoKey.
 * Returns null if no MEK is stored (user not logged in or session expired).
 */
export async function getMEK(): Promise<CryptoKey | null> {
  const raw = sessionStorage.getItem(MEK_SESSION_KEY);
  if (!raw) return null;

  try {
    const jwk = JSON.parse(raw) as JsonWebKey;
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  } catch {
    return null;
  }
}

/**
 * Clears the MEK from sessionStorage.
 * Call this on logout to ensure the key is removed from the browser session.
 */
export function clearMEK(): void {
  sessionStorage.removeItem(MEK_SESSION_KEY);
}
