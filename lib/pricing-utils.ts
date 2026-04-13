import { DELIVERY_CHARGE, GST_RATE, PRICING, MATERIAL_TYPES, PRINTER_QUALITY, POSTER_SIZES, POSTER_MATERIALS } from './constants';
import type { PriceBreakdown, ActionFigurePricingInput, PersonalizedPosterFormData } from './types';

/**
 * Convert rupees to paisa (database stores in paisa)
 */
export function rupeeToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paisa to rupees (for display)
 */
export function paisaToRupee(paisa: number): number {
  return paisa / 100;
}

/**
 * `price` and `original_price` (MRP) are stored in paise. Values edited directly in the DB
 * are often entered in rupees (e.g. 300) while `price` is correctly in paise (25000), so
 * raw MRP is below sale price and the UI hid the discount. When raw MRP is small and ×100
 * yields a sensible MRP above the sale price, treat the stored value as rupees.
 */
export function coerceMrpPaisa(
  pricePaisa: number,
  mrpRaw: number | string | null | undefined
): number | null {
  if (mrpRaw == null || mrpRaw === '') return null
  const n = typeof mrpRaw === 'string' ? parseFloat(mrpRaw) : Number(mrpRaw)
  if (!Number.isFinite(n)) return null
  const price = Math.round(Number(pricePaisa))
  let m = Math.round(n)
  if (m <= 0) return null
  if (m > price) return m
  // Likely rupees in DB; keep bound so we never scale values that are already paise (e.g. 30000).
  if (m < price && m < 100_000) {
    const scaled = m * 100
    const maxReasonable = Math.max(price * 25, price + 1)
    if (scaled > price && scaled <= maxReasonable) return scaled
  }
  return null
}

/** Read MRP from row (Postgres / API may use different keys). */
export function pickMrpRaw(row: Record<string, unknown>): unknown {
  return (
    row.original_price ??
    row.mrp ??
    row['Original_Price'] ??
    row['MRP'] ??
    row['originalPrice']
  )
}

/** Sale + MRP in paisa; `mrpRaw` from DB (number or string). */
export function resolveRetailMrp(salePaisa: unknown, mrpRaw: unknown): number | null {
  const p = Math.round(Number(salePaisa))
  if (!Number.isFinite(p) || p < 0) return null
  return coerceMrpPaisa(p, mrpRaw as number | string | null | undefined)
}

/** Single source for PDP, admin table, cards: handles string prices from JSON and alternate column names. */
export function getRetailPricing(row: Record<string, unknown>): {
  salePaisa: number
  mrpPaisa: number | null
  hasDeal: boolean
  discountPct: number
} {
  const salePaisa = Math.round(Number(row.price))
  const mrpPaisa = resolveRetailMrp(salePaisa, pickMrpRaw(row))
  const hasDeal = mrpPaisa != null && mrpPaisa > salePaisa
  const discountPct =
    hasDeal && mrpPaisa
      ? Math.round(((mrpPaisa - salePaisa) / mrpPaisa) * 100)
      : 0
  return { salePaisa, mrpPaisa, hasDeal, discountPct }
}

/** Normalize Supabase row fields: numbers may arrive as strings; some DBs use `mrp` instead of `original_price`. */
export function normalizeProductPriceFields(row: {
  price: unknown
  original_price?: unknown
  mrp?: unknown
}): { price: number; original_price: number | null } {
  const r = row as Record<string, unknown>
  const price = Math.round(Number(row.price) || 0)
  const raw = pickMrpRaw(r)
  if (raw == null || raw === '') {
    return { price, original_price: null }
  }
  const n = Number(raw)
  const original_price = Number.isFinite(n) ? Math.round(n) : null
  return { price, original_price }
}

/**
 * Format currency for display
 */
export function formatCurrency(paisa: number): string {
  const rupees = paisaToRupee(paisa);
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Calculate GST amount (18% of subtotal)
 */
export function calculateGST(subtotal: number): number {
  return Math.round(subtotal * GST_RATE);
}

/**
 * Checkout totals (strict order, all amounts in paisa):
 * 1) item_total → 2) + delivery → 3) subtotal_before_coupon → 4) − coupon → 5) final = max(0, …).
 * Discount never exceeds subtotal_before_coupon. Prices treated as tax-inclusive at pay step (gst 0).
 */
export function calculateCheckoutBreakdown(
  itemTotalPaisa: number,
  deliveryChargePaisa: number,
  discountPaisa: number = 0
): PriceBreakdown {
  const item = Math.max(0, Math.round(itemTotalPaisa))
  const delivery = Math.max(0, Math.round(deliveryChargePaisa))
  const subtotalBeforeCoupon = item + delivery
  const clampedDiscount = Math.min(Math.max(0, Math.round(discountPaisa)), subtotalBeforeCoupon)
  const netAfterCoupon = Math.max(0, subtotalBeforeCoupon - clampedDiscount)
  const gstAmount = 0

  return {
    item_total: item,
    delivery_charge: delivery,
    subtotal_before_coupon: subtotalBeforeCoupon,
    discount_amount: clampedDiscount,
    gst_amount: gstAmount,
    total: netAfterCoupon,
    originalPrice: item,
    subtotal: item,
  }
}

/** @deprecated Use calculateCheckoutBreakdown(item, delivery, discount) */
export function calculatePriceBreakdown(
  subtotal: number,
  discountAmount: number = 0,
  deliveryCharge: number = DELIVERY_CHARGE * 100
): PriceBreakdown {
  return calculateCheckoutBreakdown(subtotal, deliveryCharge, discountAmount)
}

/**
 * Calculate price for custom action figure
 * Based on robu.in pricing model
 */
export function calculateActionFigurePrice(input: ActionFigurePricingInput): number {
  const { material_type, printer_quality, infill_percentage, model_weight_grams, print_time_hours } = input;

  // Get material multiplier
  const materialData = MATERIAL_TYPES.find(m => m.value === material_type);
  const materialMultiplier = materialData?.priceMultiplier || 1.0;

  // Get quality multiplier
  const qualityData = PRINTER_QUALITY.find(q => q.value === printer_quality);
  const qualityMultiplier = qualityData?.timeMultiplier || 1.0;

  // Infill multiplier (higher infill = more material = higher cost)
  const infillMultiplier = 1 + (infill_percentage - 20) / 100;

  // Base calculations
  const materialCost = Math.round(
    model_weight_grams * PRICING.BASE_PRICE_PER_GRAM * materialMultiplier * infillMultiplier
  );

  const printTimeCost = Math.round(
    print_time_hours * PRICING.BASE_PRICE_PER_HOUR * qualityMultiplier
  );

  const basePriceInPaisa = materialCost + printTimeCost;

  // Add GST (prices are GST inclusive as per requirements)
  const gstAmount = calculateGST(basePriceInPaisa);
  const totalPrice = basePriceInPaisa + gstAmount;

  return totalPrice;
}

/**
 * Calculate price for personalized poster
 */
export function calculatePosterPrice(formData: PersonalizedPosterFormData): number {
  const { size_option, custom_width_cm, custom_height_cm, material_type } = formData;

  let sizePrice = 0;
  let area = 0;

  // Get size price
  if (size_option === 'Custom' && custom_width_cm && custom_height_cm) {
    area = custom_width_cm * custom_height_cm;
    sizePrice = PRICING.CUSTOM_POSTER_BASE + (area * PRICING.CUSTOM_POSTER_PER_CM2);
  } else {
    const sizeData = POSTER_SIZES.find(s => s.value === size_option);
    if (sizeData) {
      sizePrice = sizeData.price * 100; // Convert to paisa
      area = sizeData.width * sizeData.height;
    }
  }

  // Get material multiplier
  const materialData = POSTER_MATERIALS.find(m => m.value === material_type);
  const materialMultiplier = materialData?.priceMultiplier || 1.0;

  const basePriceInPaisa = Math.round(sizePrice * materialMultiplier);

  // Add GST
  const gstAmount = calculateGST(basePriceInPaisa);
  const totalPrice = basePriceInPaisa + gstAmount;

  return totalPrice;
}

/**
 * Estimate print time based on volume and quality
 * This is a simplified estimation
 */
export function estimatePrintTime(volumeCm3: number, quality: string): number {
  const qualityData = PRINTER_QUALITY.find(q => q.value === quality);
  const multiplier = qualityData?.timeMultiplier || 1.0;

  // Rough estimation: 1 cm³ ≈ 0.05 hours at standard quality
  const baseTime = volumeCm3 * 0.05;
  return baseTime * multiplier;
}

/**
 * Estimate model weight from volume (PLA density ≈ 1.25 g/cm³)
 */
export function estimateWeight(volumeCm3: number, materialType: string, infill: number): number {
  const materialDensity: Record<string, number> = {
    'PLA': 1.25,
    'ABS': 1.05,
    'PETG': 1.27,
    'ASA': 1.07,
    'TPU': 1.20,
    'Engineering': 1.30,
  };

  const density = materialDensity[materialType] || 1.25;
  const infillFactor = infill / 100;
  
  // Weight = volume × density × infill factor
  return volumeCm3 * density * infillFactor;
}
