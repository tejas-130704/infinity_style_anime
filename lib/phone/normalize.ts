/** Normalize Indian mobile to 10 digits, or null if invalid. */
export function normalizeIndianMobile(input: string): string | null {
  if (!input || typeof input !== 'string') return null
  let s = input.replace(/\s+/g, '').replace(/-/g, '')
  if (s.startsWith('+91')) s = s.slice(3)
  else if (s.startsWith('91') && s.length === 12) s = s.slice(2)
  if (s.startsWith('0') && s.length === 11) s = s.slice(1)
  if (!/^\d{10}$/.test(s)) return null
  if (!/^[6-9]/.test(s)) return null
  return s
}

export function formatPhoneDisplay(digits10: string): string {
  const n = normalizeIndianMobile(digits10)
  if (!n) return digits10
  return `${n.slice(0, 5)} ${n.slice(5)}`
}
