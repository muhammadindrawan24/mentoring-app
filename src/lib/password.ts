'use client';

const PASSWORD_SALT = 'sim-mentoring-islam';

function fallbackHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const s = PASSWORD_SALT + input;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + code, 0x85ebca6b) >>> 0;
  }
  const p1 = (h1 ^ (h1 >>> 16)).toString(16).padStart(8, '0');
  const p2 = (h2 ^ (h2 >>> 13)).toString(16).padStart(8, '0');
  const filler = (Math.imul(h1, 0x5bd1e995) ^ h2).toString(16).padStart(8, '0');
  return `${p1}${p2}${filler}${p1}${p2}${filler}${p1}${p2}`;
}

/**
 * Hash password dengan SHA-256 (garam statis). Fallback sinkron bila
 * crypto.subtle tidak tersedia. Simpannya sebagai hex 64 karakter.
 * Catatan: untuk produksi sebaiknya pakai bcrypt/argon2 di sisi server.
 */
export async function hashPassword(password: string): Promise<string> {
  const input = `${PASSWORD_SALT}:${password}`;
  try {
    const subtle = typeof crypto !== 'undefined' && crypto.subtle;
    if (!subtle) return fallbackHash(password);
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return fallbackHash(password);
  }
}

/** True bila nilai tersimpan cocok dengan password input (support legacy plaintext). */
export async function verifyPassword(input: string, stored: string): Promise<boolean> {
  if (!input || !stored) return false;
  if (input === stored) return true;
  return (await hashPassword(input)) === stored;
}