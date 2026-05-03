'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { GlowButton } from '@/components/GlowButton'

type ProductRow = { id: string; name: string; price: number }

function isoToDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultDatetimeLocal(daysAhead = 365) {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + daysAhead)
  return { from: isoToDatetimeLocal(start.toISOString()), till: isoToDatetimeLocal(end.toISOString()) }
}

export type CouponFormInitial = {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed' | 'free_delivery'
  discount_value: number
  min_order_amount: number
  max_discount_amount: number | null
  valid_from: string
  valid_until: string | null
  max_uses: number | null
  max_uses_per_user: number
  is_active: boolean
  is_visible: boolean
  first_order_only: boolean
  apply_to_all: boolean
  product_ids: string[]
}

type Props = {
  mode: 'create' | 'edit'
  initial?: CouponFormInitial
}

export function CouponForm({ mode, initial }: Props) {
  const router = useRouter()
  const defaults = defaultDatetimeLocal()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])

  const [code, setCode] = useState(initial?.code ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_delivery'>(
    initial?.discount_type ?? 'percentage'
  )
  const [discountValue, setDiscountValue] = useState(() => {
    if (!initial) return 10
    if (initial.discount_type === 'percentage') return initial.discount_value
    return Math.round(initial.discount_value / 100)
  })
  const [minCartRupee, setMinCartRupee] = useState(() =>
    initial ? Math.round(initial.min_order_amount / 100) : 0
  )
  const [maxDiscountRupee, setMaxDiscountRupee] = useState<string>(() =>
    initial?.max_discount_amount != null ? String(Math.round(initial.max_discount_amount / 100)) : ''
  )
  const [validFrom, setValidFrom] = useState(
    initial?.valid_from ? isoToDatetimeLocal(initial.valid_from) : defaults.from
  )
  const [validTill, setValidTill] = useState(
    initial?.valid_until ? isoToDatetimeLocal(initial.valid_until) : defaults.till
  )
  const [usageLimit, setUsageLimit] = useState(
    initial?.max_uses != null ? String(initial.max_uses) : ''
  )
  const [perUserLimit, setPerUserLimit] = useState(String(initial?.max_uses_per_user ?? 1))
  const [applyAll, setApplyAll] = useState(initial?.apply_to_all !== false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    () => new Set(initial?.product_ids ?? [])
  )
  const [isActive, setIsActive] = useState(initial?.is_active !== false)
  const [isVisible, setIsVisible] = useState(initial?.is_visible !== false)
  const [firstOrderOnly, setFirstOrderOnly] = useState(Boolean(initial?.first_order_only))

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/products')
        const json = await res.json()
        const list = (json.products ?? []) as ProductRow[]
        setProducts(list)
      } catch {
        setProducts([])
      }
    })()
  }, [])

  function toggleProduct(id: string) {
    setSelectedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function applyToAllProducts() {
    setApplyAll(true)
    setSelectedProducts(new Set())
  }

  function buildPayload() {
    const min_order_amount = Math.max(0, Math.round(minCartRupee * 100))
    let dv = Math.max(0, Math.round(Number(discountValue) || 0))
    if (discountType === 'fixed') {
      dv = Math.round(dv * 100)
    }
    if (discountType === 'free_delivery') {
      dv = 0
    }
    const capRaw = maxDiscountRupee.trim()
    const max_discount_amount =
      discountType === 'percentage' && capRaw !== '' && !Number.isNaN(Number(capRaw))
        ? Math.max(0, Math.round(Number(capRaw) * 100))
        : null

    const max_uses =
      usageLimit.trim() === '' ? null : Math.max(1, parseInt(usageLimit, 10) || 1)
    const max_uses_per_user = Math.max(1, parseInt(perUserLimit, 10) || 1)

    return {
      code,
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: dv,
      min_order_amount,
      max_discount_amount,
      valid_from: new Date(validFrom).toISOString(),
      valid_until: validTill.trim() === '' ? null : new Date(validTill).toISOString(),
      max_uses,
      max_uses_per_user,
      apply_to_all: applyAll,
      product_ids: applyAll ? [] : Array.from(selectedProducts),
      is_active: isActive,
      is_visible: isVisible,
      first_order_only: firstOrderOnly,
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!code.trim()) {
      setError('Coupon code is required')
      return
    }
    if (!applyAll && selectedProducts.size === 0) {
      setError('Select products or use “Apply to all products”')
      return
    }

    setLoading(true)
    try {
      const payload = buildPayload()
      const url = mode === 'create' ? '/api/admin/coupons' : `/api/admin/coupons/${initial!.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Save failed')
        return
      }
      if (mode === 'create' && data.id) {
        router.push(`/admin/coupons/${data.id}`)
        router.refresh()
      } else {
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white/80">Coupon code *</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-white/15 bg-mugen-black/60 px-3 py-2.5 text-white"
            placeholder="SAVE10"
            required
          />
        </label>

        <label className="block space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-white/80">Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-mugen-black/60 px-3 py-2.5 text-white"
            placeholder="Shown to customers when valid"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white/80">Start</span>
          <input
            type="datetime-local"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-mugen-black/60 px-3 py-2.5 text-white"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white/80">Expiry</span>
          <input
            type="datetime-local"
            value={validTill}
            onChange={(e) => setValidTill(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-mugen-black/60 px-3 py-2.5 text-white"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white/80">Global usage limit</span>
          <input
            type="number"
            min={1}
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-mugen-black/60 px-3 py-2.5 text-white"
            placeholder="Unlimited if empty"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white/80">Per-user limit</span>
          <input
            type="number"
            min={1}
            value={perUserLimit}
            onChange={(e) => setPerUserLimit(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-mugen-black/60 px-3 py-2.5 text-white"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white/80">Minimum cart (₹)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={minCartRupee}
            onChange={(e) => setMinCartRupee(Number(e.target.value))}
            className="w-full rounded-lg border border-white/15 bg-mugen-black/60 px-3 py-2.5 text-white"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white/80">Discount type</span>
          <select
            value={discountType}
            onChange={(e) =>
              setDiscountType(e.target.value as 'percentage' | 'fixed' | 'free_delivery')
            }
            className="w-full rounded-lg border border-white/15 bg-mugen-black/60 px-3 py-2.5 text-white"
          >
            <option value="percentage">Percentage (% off)</option>
            <option value="fixed">Fixed amount (₹ off)</option>
            <option value="free_delivery">Free delivery</option>
          </select>
        </label>

        {discountType !== 'free_delivery' && (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-white/80">
              {discountType === 'percentage' ? 'Percent off' : 'Amount off (₹)'}
            </span>
            <input
              type="number"
              min={0}
              max={discountType === 'percentage' ? 100 : undefined}
              step={discountType === 'percentage' ? 1 : 1}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="w-full rounded-lg border border-white/15 bg-mugen-black/60 px-3 py-2.5 text-white"
              required
            />
          </label>
        )}

        {discountType === 'percentage' && (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-white/80">Max discount cap (₹)</span>
            <input
              type="number"
              min={0}
              value={maxDiscountRupee}
              onChange={(e) => setMaxDiscountRupee(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-mugen-black/60 px-3 py-2.5 text-white"
              placeholder="Optional"
            />
          </label>
        )}

        <div className="flex flex-wrap items-center gap-6 md:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-white/30"
            />
            Active
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="rounded border-white/30"
            />
            Visible on frontend
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
            <input
              type="checkbox"
              checked={firstOrderOnly}
              onChange={(e) => setFirstOrderOnly(e.target.checked)}
              className="rounded border-white/30"
            />
            First order only
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-cinzel text-lg font-semibold text-white">Applicable products</h3>
          <button
            type="button"
            onClick={applyToAllProducts}
            className="rounded-lg border border-mugen-gold/40 bg-mugen-gold/10 px-4 py-2 text-sm font-semibold text-mugen-gold hover:bg-mugen-gold/20"
          >
            Apply to all products
          </button>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-white/85">
          <input
            type="checkbox"
            checked={applyAll}
            onChange={(e) => {
              setApplyAll(e.target.checked)
              if (e.target.checked) setSelectedProducts(new Set())
            }}
            className="rounded border-white/30"
          />
          Coupon applies to entire cart (any product)
        </label>

        {!applyAll && (
          <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-mugen-black/40 p-3">
            {products.length === 0 ? (
              <p className="text-sm text-white/50">Loading products…</p>
            ) : (
              <ul className="space-y-2">
                {products.map((p) => (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-white/90">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="rounded border-white/30"
                      />
                      <span className="flex-1">{p.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <GlowButton type="submit" disabled={loading} className="min-w-[160px]">
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </span>
        ) : mode === 'create' ? (
          'Create coupon'
        ) : (
          'Save changes'
        )}
      </GlowButton>
    </form>
  )
}
