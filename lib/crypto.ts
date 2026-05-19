// AES-256-GCM encryption for API keys stored in Supabase (F-024)
// Uses Web Crypto API for Edge Runtime compatibility

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)",
    );
  }
  return key;
}

async function importKey(hexKey: string): Promise<CryptoKey> {
  const keyBuffer = new Uint8Array(
    hexKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
  return crypto.subtle.importKey("raw", keyBuffer, { name: ALGORITHM }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await importKey(getEncryptionKey());
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    encoded,
  );

  // Combine IV + ciphertext, encode as base64
  const combined = new Uint8Array(
    iv.length + new Uint8Array(ciphertext).length,
  );
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encrypted: string): Promise<string> {
  const key = await importKey(getEncryptionKey());
  const combined = new Uint8Array(
    atob(encrypted)
      .split("")
      .map((c) => c.charCodeAt(0)),
  );

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}
