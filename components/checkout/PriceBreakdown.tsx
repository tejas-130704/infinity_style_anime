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
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6 backdrop-blur-md">
      <h3 className="mb-3 text-base sm:text-xl font-bold text-white">Bill Details</h3>

      <div className="space-y-2.5 text-sm">
        {/* Item Total */}
        <div className="flex items-center justify-between gap-3 text-white/80">
          <span className="shrink-0">Item Total</span>
          <span className="font-medium tabular-nums text-right min-w-0 truncate">{formatCurrency(itemTotal)}</span>
        </div>

        {/* Delivery */}
        <div className="flex items-center justify-between gap-3 text-white/80">
          <span className="flex items-center gap-1 flex-wrap shrink-0">
            Delivery Charge
            <span className="text-xs text-white/40">(fixed)</span>
          </span>
          <span className="font-medium tabular-nums text-right min-w-0 truncate">{formatCurrency(breakdown.delivery_charge)}</span>
        </div>

        {/* Subtotal */}
        <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-2 text-xs text-white/50">
          <span className="shrink-0">Subtotal (items + delivery)</span>
          <span className="tabular-nums text-right min-w-0 truncate">{formatCurrency(subtotalBefore)}</span>
        </div>

        {/* Coupon discount */}
        {breakdown.discount_amount > 0 && (
          <div className="flex items-start justify-between gap-3 text-green-400">
            <span className="flex flex-col gap-0.5 min-w-0 shrink-0">
              <span>Coupon Discount</span>
              {couponCode && (
                <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs font-medium w-fit truncate max-w-[120px]">
                  {couponCode}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              <span className="tabular-nums text-right min-w-0 truncate">−{formatCurrency(breakdown.discount_amount)}</span>
              {onRemoveCoupon && (
                <button
                  type="button"
                  onClick={onRemoveCoupon}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}

        {/* GST */}
        {breakdown.gst_amount > 0 && (
          <div className="flex items-center justify-between gap-3 text-white/70">
            <span className="shrink-0">GST (18%)</span>
            <span className="tabular-nums text-right min-w-0 truncate">{formatCurrency(breakdown.gst_amount)}</span>
          </div>
        )}

        {/* Divider */}
        <div className="!my-3 h-px bg-white/20" />

        {/* Amount Payable — key row that was being clipped */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm sm:text-base font-bold text-white shrink-0">Amount payable</span>
          <span className="text-sm sm:text-lg font-bold text-mugen-crimson tabular-nums text-right min-w-0 break-words">
            {formatCurrency(breakdown.total)}
          </span>
        </div>

        {/* Tax note */}
        <div className="text-center text-xs text-white/50 italic">
          {breakdown.gst_amount > 0
            ? 'GST shown separately'
            : 'Listed prices are inclusive of applicable taxes'}
        </div>
      </div>

      {/* Savings badge */}
      {breakdown.discount_amount > 0 && (
        <div className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-center">
          <p className="text-xs sm:text-sm font-medium text-green-400">
            You saved {formatCurrency(breakdown.discount_amount)} on this order 🎉
          </p>
        </div>
      )}
    </div>
  );
}
