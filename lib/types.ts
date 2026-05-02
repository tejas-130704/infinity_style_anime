// Database Types for E-commerce System

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number; // in paisa (₹1 = 100 paisa)
  category: 'posters' | 'action_figures' | 'limited_edition' | 'custom_action_figure' | 'personalized_posters';
  image_url: string | null;
  model_url: string | null;
  slug: string | null;
  stock_quantity: number;
  is_featured: boolean;
  /** Controls public visibility. false = hidden from shop/public pages. */
  is_public: boolean;
  weight_grams: number;
  dimensions_cm: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed' | 'free_delivery';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  first_order_only: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string | null;
  used_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  address_id: string | null;
  total_price: number;
  subtotal: number;
  delivery_charge: number;
  discount_amount: number;
  gst_amount: number;
  coupon_id: string | null;
  status: string;
  payment_status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  order_notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
}

export interface CustomActionFigure {
  id: string;
  user_id: string;
  order_id: string | null;
  stl_file_url: string;
  stl_file_name: string;
  stl_file_size_mb: number;
  material_volume_cm3: number | null;
  model_weight_grams: number | null;
  model_dimensions_cm: string | null;
  surface_area_cm2: number | null;
  print_time_hours: number | null;
  material_type: string;
  printer_quality: string;
  infill_percentage: number;
  color: string;
  base_price: number;
  material_cost: number;
  print_time_cost: number;
  total_price: number;
  is_standard_config: boolean;
  status: 'pending' | 'processing' | 'printing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface PersonalizedPoster {
  id: string;
  user_id: string;
  order_id: string | null;
  image_file_url: string;
  image_file_name: string;
  image_file_size_mb: number;
  size_option: 'A4' | 'A3' | 'A2' | '18x24' | 'Custom';
  custom_width_cm: number | null;
  custom_height_cm: number | null;
  material_type: 'Matte' | 'Glossy' | 'Standard';
  base_price: number;
  size_price: number;
  material_price: number;
  total_price: number;
  status: 'pending' | 'processing' | 'printing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone1: string;
  phone2: string | null;
  email: string;
  address: string;
  city: string;
  state: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Profile {
  id: string;
  name: string | null;
  is_admin: boolean;
  email?: string | null;
  auth_provider?: string | null;
  provider_user_id?: string | null;
  email_verified?: boolean | null;
  last_sign_in_at?: string | null;
  created_at: string;
}

// Buy Now / Direct Purchase
/**
 * Passed from the client when the checkout is initiated via "Buy Now"
 * (i.e. NOT from the cart). Both the checkout and coupon-validate APIs
 * accept this to bypass cart DB queries entirely.
 */
export interface DirectPurchaseItem {
  /** Supabase product UUID */
  product_id: string;
  /** Price in paisa (as stored in the products table) */
  price: number;
  quantity: number;
}

// API Response Types
export interface CouponValidationResponse {
  valid: boolean;
  coupon_id?: string;
  discount_amount?: number;
  discount_type?: string;
  description?: string;
  code?: string;
  error?: string;
}

export interface PriceBreakdown {
  /** Sum of cart line items (paise) */
  item_total: number
  delivery_charge: number
  /** item_total + delivery_charge (coupon applies to this amount) */
  subtotal_before_coupon: number
  discount_amount: number
  gst_amount: number
  /** max(0, subtotal_before_coupon - discount_amount); tax-inclusive pricing → gst often 0 */
  total: number
  /** @deprecated use item_total */
  originalPrice: number
  /** @deprecated use subtotal_before_coupon for pre-discount; was ambiguous */
  subtotal: number
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

// Razorpay Types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  /** Runs before the payment promise resolves; use for verify + redirect. */
  handler?: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Custom Action Figure Pricing Input
export interface ActionFigurePricingInput {
  material_type: string;
  printer_quality: string;
  infill_percentage: number;
  model_weight_grams: number;
  print_time_hours: number;
}

// Form Types
export interface CheckoutFormData {
  name: string;
  phone1: string;
  phone2?: string;
  email: string;
  address: string;
  city: string;
  state: string;
}

export interface CustomActionFigureFormData {
  material_type: string;
  printer_quality: string;
  infill_percentage: number;
  color: string;
  is_standard_config: boolean;
}

export interface PersonalizedPosterFormData {
  size_option: 'A4' | 'A3' | 'A2' | '18x24' | 'Custom';
  custom_width_cm?: number;
  custom_height_cm?: number;
  material_type: 'Matte' | 'Glossy' | 'Standard';
}
