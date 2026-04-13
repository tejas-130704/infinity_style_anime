'use client';

import { formatCurrency } from '@/lib/pricing-utils';
import type { PriceBreakdown as PriceBreakdownType } from '@/lib/types';

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
  couponCode?: string;
  onRemoveCoupon?: () => void;
}

export function PriceBreakdown({ breakdown, couponCode, onRemoveCoupon }: PriceBreakdownProps) {
  const itemTotal = breakdown.item_total ?? breakdown.originalPrice ?? breakdown.subtotal;
  const subtotalBefore =
    breakdown.subtotal_before_coupon ?? itemTotal + breakdown.delivery_charge;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <h3 className="mb-4 text-xl font-bold text-white">Bill Details</h3>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between text-white/80">
          <span>Item Total</span>
          <span>{formatCurrency(itemTotal)}</span>
        </div>

        <div className="flex items-center justify-between text-white/80">
          <span className="flex items-center gap-2">
            Delivery Charge
            <span className="text-xs text-white/40">(fixed)</span>
          </span>
          <span>{formatCurrency(breakdown.delivery_charge)}</span>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs text-white/50">
          <span>Subtotal (items + delivery)</span>
          <span>{formatCurrency(subtotalBefore)}</span>
        </div>

        {breakdown.discount_amount > 0 && (
          <div className="flex items-center justify-between text-green-400">
            <span className="flex items-center gap-2">
              Coupon Discount{' '}
              {couponCode && (
                <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs font-medium">
                  {couponCode}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span>−{formatCurrency(breakdown.discount_amount)}</span>
              {onRemoveCoupon && (
                <button
                  type="button"
                  onClick={onRemoveCoupon}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}

        {breakdown.gst_amount > 0 && (
          <div className="flex items-center justify-between text-white/70">
            <span>GST (18%)</span>
            <span>{formatCurrency(breakdown.gst_amount)}</span>
          </div>
        )}

        <div className="!my-4 h-px bg-white/20" />

        <div className="flex items-center justify-between text-lg font-bold text-white">
          <span>Amount payable</span>
          <span className="text-mugen-crimson">{formatCurrency(breakdown.total)}</span>
        </div>

        <div className="text-center text-xs text-white/50 italic">
          {breakdown.gst_amount > 0 ? 'GST shown separately' : 'Listed prices are inclusive of applicable taxes'}
        </div>
      </div>

      {breakdown.discount_amount > 0 && (
        <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-center">
          <p className="text-sm font-medium text-green-400">
            You saved {formatCurrency(breakdown.discount_amount)} on this order
          </p>
        </div>
      )}
    </div>
  );
}
