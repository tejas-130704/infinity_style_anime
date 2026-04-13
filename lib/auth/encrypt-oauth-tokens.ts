import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { getNextAuthSecret } from '@/lib/auth/nextauth-secret'

const ALGO = 'aes-256-gcm'
const SALT = 'infinity-google-oauth-v1'

/** Returns null when encryption is not configured (missing or short secret). */
function getEncryptionKey(): Buffer | null {
  const explicit = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim().replace(/^["']|["']$/g, '')
  const secret = explicit || getNextAuthSecret()
  if (!secret || secret.length < 8) return null
  return scryptSync(secret, SALT, 32)
}

let warnedMissingKey = false

/** Encrypt for DB storage. Returns null for empty input or when no encryption key is set. */
export function encryptOAuthSecret(plain: string | null | undefined): string | null {
  if (plain == null || plain === '') return null
  const key = getEncryptionKey()
  if (!key) {
    if (process.env.NODE_ENV !== 'production' && !warnedMissingKey) {
      warnedMissingKey = true
      console.warn(
        '[auth] Google OAuth tokens are not stored encrypted. Set NEXTAUTH_SECRET or GOOGLE_TOKEN_ENCRYPTION_KEY (min 8 chars) in .env.local to persist tokens securely.'
      )
    }
    return null
  }
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

/** Server-only decryption (e.g. background jobs). Not exposed to clients. */
export function decryptOAuthSecret(blob: string | null | undefined): string | null {
  if (blob == null || blob === '') return null
  const key = getEncryptionKey()
  if (!key) return null
  try {
    const raw = Buffer.from(blob, 'base64')
    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const enc = raw.subarray(28)
    const decipher = createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
