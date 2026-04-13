/**
 * Parse Wavefront OBJ for mtllib references (first ~64KB only).
 */
export function extractMtllibNames(objUtf8: string): string[] {
  const slice = objUtf8.slice(0, 65536)
  const names: string[] = []
  for (const line of slice.split(/\r?\n/)) {
    const t = line.trim()
    if (t.toLowerCase().startsWith('mtllib ')) {
      const rest = t.slice(7).trim()
      if (rest) {
        for (const part of rest.split(/\s+/)) {
          const base = part.split(/[/\\]/).pop()
          if (base) names.push(base)
        }
      }
    }
  }
  return names
}

export function normalizeName(s: string): string {
  return s.trim().toLowerCase()
}
