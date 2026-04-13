/**
 * Canonical URL path for a product detail page.
 * Prefer slug (e.g. /product/monkey-d-luffy-mnv98ol5) over UUID when available.
 */
export function productDetailPath(product: { id: string; slug?: string | null }): string {
  const s = typeof product.slug === 'string' ? product.slug.trim() : ''
  if (s) return `/product/${encodeURIComponent(s)}`
  return `/product/${product.id}`
}
