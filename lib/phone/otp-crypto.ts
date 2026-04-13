import crypto from 'crypto'

function secret(): string {
  const s = process.env.PHONE_OTP_SECRET
  if (!s || s.length < 16) {
    throw new Error('PHONE_OTP_SECRET must be set (min 16 chars) for phone OTP')
  }
  return s
}

export function hashOtp(phoneNormalized: string, code: string): string {
  return crypto.createHmac('sha256', secret()).update(`${phoneNormalized}:${code}`).digest('hex')
}

export function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

export function generateOtp6(): string {
  const n = crypto.randomInt(0, 1_000_000)
  return String(n).padStart(6, '0')
}
