const SAFE_NAME_RE = /^[a-zA-Z0-9._-]+$/

export function getExtension(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? ''
  const i = base.lastIndexOf('.')
  if (i <= 0 || i === base.length - 1) return ''
  return base.slice(i + 1).toLowerCase()
}

export function sanitizeBasename(name: string, maxLen = 180): string {
  const base = name.split(/[/\\]/).pop() ?? 'file'
  let s = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+/, '')
  if (!s) s = 'file'
  if (s.length > maxLen) {
    const ext = getExtension(s)
    const stem = ext ? s.slice(0, -(ext.length + 1)) : s
    const keep = ext ? maxLen - ext.length - 1 : maxLen
    s = (stem.slice(0, Math.max(1, keep)) + (ext ? `.${ext}` : '')).slice(0, maxLen)
  }
  if (!SAFE_NAME_RE.test(s)) {
    return `file_${Date.now()}`
  }
  return s
}

export function assertNoPathTraversal(name: string): void {
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    throw new Error('Invalid path')
  }
}
