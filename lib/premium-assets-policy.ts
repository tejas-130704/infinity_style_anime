/**
 * Catalog premium-asset policy. User-generated flows (custom figures, personalized posters)
 * must never use these guards — see isUserGeneratedCatalogCategory().
 */

/** Categories that receive protected proxies / blob loading on the PDP. */
export const CATALOG_PREMIUM_CATEGORIES = new Set([
  'action_figures',
  'posters',
  'limited_edition',
])

export function isCatalogPremiumCategory(category: string | null | undefined): boolean {
  if (!category) return false
  return CATALOG_PREMIUM_CATEGORIES.has(category)
}

/** Must never be routed through /api/premium/* proxies. */
export function isUserGeneratedCatalogCategory(category: string | null | undefined): boolean {
  if (!category) return false
  return category === 'custom_action_figure' || category === 'personalized_posters'
}

/** Whitelist: showcase GLB character id → filename on disk (no path segments). */
export const GLB_CHARACTER_FILES: Record<string, string> = {
  'beast-titan': 'beast_titan_hip_hop_dancing.glb',
  gojo: 'gojo.glb',
  luffy: 'monkey_d._luffy.glb',
  naruto: 'naruto_sage.glb',
  sasuke: 'saske_sharingan.glb',
  sukuna: 'sukuna.glb',
  yuji: 'yuji_itadori__season_3_design.glb',
  zoro: 'zoro.glb',
}

export function resolveCatalogGlbFilename(characterId: string): string | null {
  return GLB_CHARACTER_FILES[characterId] ?? null
}
