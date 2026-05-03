'use client';

import { useState, useEffect } from 'react';
import { Tag, Loader2 } from 'lucide-react';

interface CouponInputProps {
  onApplyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
  /** When set, only one coupon is active; applying another code replaces it (see helper text). */
  appliedCode?: string | null;
  onRemoveCoupon?: () => void;
}

interface Coupon {
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
}

export function CouponInput({
  onApplyCoupon,
  disabled,
  appliedCode,
  onRemoveCoupon,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  useEffect(() => {
    fetch('/api/coupons')
      .then((res) => res.json())
      .then((data) => {
        if (data.coupons) {
          setAvailableCoupons(data.coupons);
        }
      })
      .catch((err) => console.error('Failed to load coupons', err))
      .finally(() => setLoadingCoupons(false));
  }, []);

  const normalizedApplied = appliedCode?.trim().toUpperCase() ?? '';

  const handleApply = async () => {
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter a coupon code' });
      return;
    }

    const next = code.trim().toUpperCase();

    if (normalizedApplied && next === normalizedApplied) {
      setMessage({ type: 'success', text: 'This coupon is already applied.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await onApplyCoupon(next);

      if (result.success) {
        setMessage({
          type: 'success',
          text: normalizedApplied
            ? `Replaced with ${next}. One coupon per order.`
            : 'Coupon applied successfully!',
        });
        setCode('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Invalid coupon code' });
      }
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to apply coupon',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6 backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="h-5 w-5 text-mugen-gold" />
        <h3 className="text-lg font-bold text-white">Apply Coupon</h3>
      </div>

      <p className="mb-3 text-xs text-white/55">
        Only <span className="font-semibold text-white/80">one coupon per order</span>. Applying a
        different code replaces the current one.
      </p>

      {normalizedApplied && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-mugen-gold/25 bg-mugen-gold/10 px-3 py-2 text-sm text-mugen-gold">
          <span>
            Active: <strong className="font-mono">{normalizedApplied}</strong>
          </span>
          {onRemoveCoupon && (
            <button
              type="button"
              onClick={() => {
                onRemoveCoupon();
                setMessage(null);
              }}
              className="text-xs font-semibold text-red-300 hover:text-red-200"
            >
              Remove
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col xs:flex-row gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder={normalizedApplied ? 'Enter a different code to replace' : 'Enter coupon code'}
          disabled={disabled || loading}
          autoComplete="off"
          className="flex-1 w-full rounded-lg border border-white/20 bg-mugen-black/50 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-mugen-crimson focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={disabled || loading || !code.trim()}
          className="w-full xs:w-auto rounded-lg bg-mugen-crimson px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-mugen-crimson/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Applying...</span>
            </>
          ) : normalizedApplied ? (
            'Replace'
          ) : (
            'Apply'
          )}
        </button>
      </div>

      {message && (
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold text-white/60 uppercase">Available Coupons:</p>
        <div className="flex flex-wrap gap-2">
          {loadingCoupons ? (
            <p className="text-xs text-white/40 animate-pulse">Loading coupons...</p>
          ) : availableCoupons.length > 0 ? (
            availableCoupons.map((coupon) => {
              const amountOff =
                coupon.discount_type === 'percentage'
                  ? `${coupon.discount_value}% off`
                  : coupon.discount_type === 'fixed'
                  ? `₹${coupon.discount_value / 100} off`
                  : 'Free delivery';

              const minText =
                coupon.min_order_amount > 0
                  ? ` on orders ₹${Math.round(coupon.min_order_amount / 100)}+`
                  : '';

              const displayLabel = coupon.description || `${coupon.code} - ${amountOff}${minText}`;

              return (
                <button
                  key={coupon.code}
                  type="button"
                  onClick={() => setCode(coupon.code)}
                  disabled={disabled}
                  className="rounded-full border border-mugen-gold/30 bg-mugen-gold/5 px-3 py-1 text-xs font-medium text-mugen-gold transition-all hover:bg-mugen-gold/10 disabled:opacity-50"
                >
                  {displayLabel}
                </button>
              );
            })
          ) : (
            <p className="text-xs text-white/40">No coupons available right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}
