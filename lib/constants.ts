// E-commerce Constants

/** Primary brand logo (PNG). Folder is spelled `assests` in `public/`. */
export const BRAND_LOGO_PNG_SRC = '/assests/logo/3dkalakaar.png';

export const DELIVERY_CHARGE = 89; // ₹89 fixed delivery charge
export const GST_RATE = 0.18; // 18% GST

// Product Categories
export const PRODUCT_CATEGORIES = {
  POSTERS: 'posters',
  ACTION_FIGURES: 'action_figures',
  LIMITED_EDITION: 'limited_edition',
  CUSTOM_ACTION_FIGURE: 'custom_action_figure',
  PERSONALIZED_POSTERS: 'personalized_posters',
} as const;

export const CATEGORY_LABELS = {
  [PRODUCT_CATEGORIES.POSTERS]: 'Posters',
  [PRODUCT_CATEGORIES.ACTION_FIGURES]: 'Action Figures',
  [PRODUCT_CATEGORIES.LIMITED_EDITION]: 'Limited Edition',
  [PRODUCT_CATEGORIES.CUSTOM_ACTION_FIGURE]: 'Custom Action Figure',
  [PRODUCT_CATEGORIES.PERSONALIZED_POSTERS]: 'Personalized Posters',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING_PAYMENT]: 'Pending Payment',
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Custom Action Figure - Material Types
export const MATERIAL_TYPES = [
  { value: 'PLA', label: 'PLA', priceMultiplier: 1.0 },
  { value: 'ABS', label: 'ABS', priceMultiplier: 1.2 },
  { value: 'PETG', label: 'PETG', priceMultiplier: 1.3 },
  { value: 'ASA', label: 'ASA', priceMultiplier: 1.4 },
  { value: 'TPU', label: 'TPU Flexible', priceMultiplier: 1.8 },
  { value: 'Engineering', label: 'Engineering Grade', priceMultiplier: 2.0 },
] as const;

// Custom Action Figure - Printer Quality
export const PRINTER_QUALITY = [
  { value: '0.2mm Standard Quality', label: '0.2mm (Standard)', timeMultiplier: 1.0 },
  { value: '0.15mm Medium Quality', label: '0.15mm (Medium)', timeMultiplier: 1.3 },
  { value: '0.1mm High Quality', label: '0.1mm (High)', timeMultiplier: 1.8 },
] as const;

// Custom Action Figure - Infill Options
export const INFILL_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];

// Custom Action Figure - Colors
export const COLOR_OPTIONS = [
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 
  'Purple', 'Pink', 'Gray', 'Brown', 'Gold', 'Silver'
];

// Personalized Poster - Size Options
export const POSTER_SIZES = [
  { value: 'A4', label: 'A4 (21×30 cm)', price: 299, width: 21, height: 30 },
  { value: 'A3', label: 'A3 (30×42 cm)', price: 599, width: 30, height: 42 },
  { value: 'A2', label: 'A2 (42×59 cm)', price: 999, width: 42, height: 59 },
  { value: '18x24', label: '18×24 in (standard)', price: 999, width: 46, height: 61 },
  { value: 'Custom', label: 'Custom Size', price: 0, width: 0, height: 0 },
] as const;

// Personalized Poster - Material Types
export const POSTER_MATERIALS = [
  { value: 'Standard', label: 'Standard', priceMultiplier: 1.0 },
  { value: 'Matte', label: 'Matte Finish', priceMultiplier: 1.0 },
  { value: 'Glossy', label: 'Glossy Finish', priceMultiplier: 1.2 },
] as const;

// Pricing - Base rates (in paisa - multiply by 100 for rupees)
export const PRICING = {
  BASE_PRICE_PER_GRAM: 3, // ₹3 per gram base
  BASE_PRICE_PER_HOUR: 5000, // ₹50 per hour printing time
  CUSTOM_POSTER_BASE: 20000, // ₹200 base for custom posters
  CUSTOM_POSTER_PER_CM2: 2, // ₹0.02 per cm²
} as const;

// File Upload Limits
export const FILE_LIMITS = {
  STL_MAX_SIZE_MB: 100,
  IMAGE_MAX_SIZE_MB: 10,
  ALLOWED_STL_EXTENSIONS: ['.stl', '.obj', '.stp', '.step', '.igs', '.iges'],
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

// Coupon Codes
export const COUPON_CODES = {
  HALF50: 'HALF50',
  FREEDEL: 'FREEDEL',
} as const;
