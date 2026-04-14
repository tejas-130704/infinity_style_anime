'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlowButton } from '@/components/GlowButton';
import { useUserMe } from '@/hooks/useUserMe';
import { PriceBreakdown } from '@/components/checkout/PriceBreakdown';
import { CouponInput } from '@/components/checkout/CouponInput';
import { calculateCheckoutBreakdown, formatCurrency } from '@/lib/pricing-utils';
import { initiateRazorpayPayment, createRazorpayOrder } from '@/lib/razorpay-utils';
import { DELIVERY_CHARGE } from '@/lib/constants';
import type { PriceBreakdown as PriceBreakdownType, CouponValidationResponse } from '@/lib/types';
import { Loader2, ShoppingBag, MapPin, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { shouldOptimizeImageSrc } from '@/lib/image-allowlist';

type CartItem = {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    slug: string | null;
  } | null;
};

async function markOrderPaymentUnsuccessful(
  orderDbId: string,
  reason: 'gateway_failed' | 'user_dismissed' | 'sdk_error',
  message: string
) {
  try {
    await fetch('/api/razorpay/payment-failed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_db_id: orderDbId, reason, message }),
    });
  } catch {
    // ignore — order may remain pending; user can retry or support can reconcile
  }
}

export default function CheckoutPageNew() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get('buyNow') === '1';
  const { user: meUser, isLoading: meLoading } = useUserMe();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [buyNowProduct, setBuyNowProduct] = useState<{
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    slug: string | null;
  } | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    phone1: '',
    phone2: '',
    email: '',
    address: '',
    city: '',
    state: '',
  });

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);
  const [couponCode, setCouponCode] = useState('');

  const itemTotal = cartItems.reduce((acc, item) => {
    return acc + (item.products?.price || 0) * item.quantity;
  }, 0);

  const deliveryPaise = DELIVERY_CHARGE * 100;
  const priceBreakdown: PriceBreakdownType = calculateCheckoutBreakdown(
    itemTotal,
    deliveryPaise,
    appliedCoupon?.discount_amount || 0
  );

  // Load user and cart (NextAuth + Supabase — useUserMe matches /api/cart)
  useEffect(() => {
    if (meLoading) return;
    if (!meUser) {
      router.replace('/login?next=/checkout');
      return;
    }

    setForm((f) => ({
      ...f,
      email: meUser.email ?? '',
    }));

    // ── Buy Now flow: read from sessionStorage instead of DB cart ──
    if (isBuyNow) {
      try {
        const raw = sessionStorage.getItem('buyNowProduct');
        if (raw) {
          const p = JSON.parse(raw) as {
            id: string;
            name: string;
            price: number;
            image_url: string | null;
            slug: string | null;
          };
          setBuyNowProduct(p);
          setCartItems([{
            id: `buy-now-${p.id}`,
            quantity: 1,
            products: {
              id: p.id,
              name: p.name,
              price: p.price,
              image_url: p.image_url,
              slug: p.slug,
            },
          }]);
          sessionStorage.removeItem('buyNowProduct');
        }
      } catch (e) {
        console.error('[buyNow] Failed to read product from sessionStorage', e);
      }
      setLoadingCart(false);
      setReady(true);
      return;
    }

    // ── Normal flow: load cart from API ──
    (async () => {
      try {
        const res = await fetch('/api/cart');
        if (res.ok) {
          const json = await res.json();
          setCartItems(json.items ?? []);
        }
      } catch (err) {
        console.error('Failed to load cart:', err);
      } finally {
        setLoadingCart(false);
      }
      setReady(true);
    })();
  }, [meLoading, meUser, router, isBuyNow]);

  useEffect(() => {
    if (cartItems.length === 0) {
      setAppliedCoupon(null);
      setCouponCode('');
      return;
    }
    const code = appliedCoupon?.code;
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupon_code: code }),
        });
        const d = await res.json();
        if (cancelled) return;
        if (!res.ok || !d.valid) {
          setAppliedCoupon(null);
          setCouponCode('');
          return;
        }
        setAppliedCoupon(d);
        setCouponCode(d.code ?? code);
      } catch {
        if (!cancelled) {
          setAppliedCoupon(null);
          setCouponCode('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cartItems, appliedCoupon?.code]);

  // Apply coupon
  const handleApplyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      const upper = code.trim().toUpperCase();
      if (appliedCoupon?.code && appliedCoupon.code.toUpperCase() === upper) {
        return { success: true };
      }
      try {
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coupon_code: code,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.valid) {
          return { success: false, error: data.error || 'Invalid coupon' };
        }

        setAppliedCoupon(data);
        setCouponCode(data.code ?? code);
        return { success: true };
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to validate coupon',
        };
      }
    },
    [appliedCoupon?.code]
  );

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  // Submit checkout
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // ── Buy Now: silently add the product to DB cart so /api/checkout can read it ──
      if (isBuyNow && buyNowProduct) {
        const addRes = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: buyNowProduct.id, quantity: 1 }),
        });
        if (!addRes.ok) {
          const j = await addRes.json().catch(() => ({})) as { error?: string };
          setError(j.error || 'Could not process Buy Now — please try again');
          return;
        }
      }

      // Validate cart
      if (cartItems.length === 0) {
        setError('Your cart is empty');
        return;
      }

      // Create order in database
      const createOrderRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          delivery_charge: DELIVERY_CHARGE * 100,
          coupon_code: appliedCoupon?.code || '',
          payment_method: 'razorpay',
        }),
      });

      const orderData = await createOrderRes.json();

      if (!createOrderRes.ok) {
        setError(orderData.error || 'Failed to create order');
        return;
      }

      const orderDbId = orderData.order_id as string;

      const rzpOrder = (await createRazorpayOrder(priceBreakdown.total, orderDbId)) as {
        order: { id: string };
      };

      const outcome = await initiateRazorpayPayment({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: priceBreakdown.total,
        currency: 'INR',
        name: '3dkalakaar',
        description: `Order #${orderDbId.slice(0, 8)}`,
        order_id: rzpOrder.order.id,
        handler: async (response) => {
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              order_db_id: orderDbId,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok || !verifyData.verified) {
            throw new Error(
              verifyData.error ||
                'Your payment could not be confirmed. If money was debited, contact support with your order ID.'
            );
          }

          await fetch('/api/cart', { method: 'DELETE' });
          const pid = encodeURIComponent(response.razorpay_payment_id);
          router.push(`/checkout/success?order_id=${orderDbId}&payment_id=${pid}`);
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone1,
        },
        theme: {
          color: '#C0151A', // mugen-crimson
        },
      });

      if (!outcome.ok) {
        if (outcome.reason === 'failed') {
          await markOrderPaymentUnsuccessful(orderDbId, 'gateway_failed', outcome.message);
        } else if (outcome.reason === 'dismissed') {
          await markOrderPaymentUnsuccessful(orderDbId, 'user_dismissed', outcome.message);
        } else if (outcome.reason === 'sdk') {
          await markOrderPaymentUnsuccessful(orderDbId, 'sdk_error', outcome.message);
        }
        setError(outcome.message);
        return;
      }
    } catch (error: any) {
      setError(error.message || 'Payment failed');
      if (process.env.NODE_ENV === 'development') {
        console.error('Checkout error:', error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (meLoading || !ready || loadingCart) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto px-4 text-white/70 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading checkout...</span>
        </div>
      </main>
    );
  }

  // Empty cart
  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-mugen-black pt-28 pb-20">
        <div className="container mx-auto max-w-md px-4 text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-white/40" />
          <h2 className="mt-4 text-2xl font-bold text-white">Your cart is empty</h2>
          <p className="mt-2 text-white/60">Add items to your cart before checkout</p>
          <Link href="/shop">
            <GlowButton className="mt-6">Continue Shopping</GlowButton>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-6xl px-4 md:px-8">
        <h1 className="font-cinzel text-4xl font-bold text-white">Checkout</h1>
        <p className="mt-2 text-white/60">Secure payment via Razorpay</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="h-5 w-5 text-mugen-crimson" />
                <h3 className="text-xl font-bold text-white">Delivery Address</h3>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-white">Full Name *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-white/20 bg-mugen-black/50 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-mugen-crimson focus:outline-none"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-white">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-lg border border-white/20 bg-mugen-black/50 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-mugen-crimson focus:outline-none"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-white">Phone *</label>
                    <input
                      required
                      type="tel"
                      value={form.phone1}
                      onChange={(e) => setForm((f) => ({ ...f, phone1: e.target.value }))}
                      className="w-full rounded-lg border border-white/20 bg-mugen-black/50 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-mugen-crimson focus:outline-none"
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-white">Alternate Phone</label>
                    <input
                      type="tel"
                      value={form.phone2}
                      onChange={(e) => setForm((f) => ({ ...f, phone2: e.target.value }))}
                      className="w-full rounded-lg border border-white/20 bg-mugen-black/50 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-mugen-crimson focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-white">Street Address *</label>
                  <textarea
                    required
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-white/20 bg-mugen-black/50 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-mugen-crimson focus:outline-none resize-none"
                    placeholder="House no., Building name, Street, Area"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-white">City *</label>
                    <input
                      required
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full rounded-lg border border-white/20 bg-mugen-black/50 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-mugen-crimson focus:outline-none"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-white">State *</label>
                    <input
                      required
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                      className="w-full rounded-lg border border-white/20 bg-mugen-black/50 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-mugen-crimson focus:outline-none"
                      placeholder="State"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
              </form>
            </div>

            {/* Coupon Section */}
            <CouponInput
              appliedCode={appliedCoupon?.code ?? couponCode}
              onRemoveCoupon={handleRemoveCoupon}
              onApplyCoupon={handleApplyCoupon}
              disabled={submitting}
            />
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <h3 className="mb-4 text-xl font-bold text-white">Order Summary</h3>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.products?.image_url && (
                      <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-white/10">
                        <Image
                          src={item.products.image_url}
                          alt={item.products.name}
                          fill
                          className="object-cover"
                          unoptimized={!shouldOptimizeImageSrc(item.products.image_url)}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {item.products?.name}
                      </h4>
                      <p className="text-xs text-white/60 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {formatCurrency((item.products?.price || 0) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <PriceBreakdown
              breakdown={priceBreakdown}
              couponCode={couponCode}
              onRemoveCoupon={handleRemoveCoupon}
            />

            {/* Place Order Button */}
            <style>{`
              .place-order-btn {
                position: relative;
                overflow: hidden;
                background: #2a2624;
                border: 2px solid white;
                color: white;
                transition: box-shadow 0.3s ease, color 0.3s ease;
              }
              .place-order-btn::before {
                content: '';
                position: absolute;
                inset: 0;
                background: #863841;
                transform: scaleX(0);
                transform-origin: left center;
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 0;
              }
              .place-order-btn:hover:not(:disabled)::before {
                transform: scaleX(1);
              }
              .place-order-btn:hover:not(:disabled) {
                box-shadow: 0 0 24px 4px rgba(134, 56, 65, 0.55);
              }
              .place-order-btn > * {
                position: relative;
                z-index: 1;
              }
            `}</style>
            <button
              type="submit"
              onClick={onSubmit}
              disabled={submitting}
              className="place-order-btn w-full rounded-lg px-6 py-4 font-bold shadow-lg shadow-mugen-crimson/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Place Order • {formatCurrency(priceBreakdown.total)}</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-white/40">
              By placing this order, you agree to our Terms & Conditions
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
