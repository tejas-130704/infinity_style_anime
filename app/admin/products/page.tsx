'use client'

import { useCallback, useEffect, useState } from 'react'
import { GlowButton } from '@/components/GlowButton'
import type { ProductRow } from '@/components/shop/ProductCard'

const CATEGORIES = [
  { value: 'posters', label: 'Posters' },
  { value: '3d_models', label: '3D Models' },
  { value: 'custom_designs', label: 'Custom Designs' },
] as const

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function centsFromInput(s: string) {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n)) return NaN
  return Math.round(n * 100)
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value']>('posters')
  const [imageUrl, setImageUrl] = useState('')
  const [modelUrl, setModelUrl] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/products')
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(j.error || 'Failed to load products')
      return
    }
    setProducts(j.products ?? [])
  }, [])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  function resetForm() {
    setEditingId(null)
    setName('')
    setDescription('')
    setPriceInput('')
    setCategory('posters')
    setImageUrl('')
    setModelUrl('')
  }

  async function startEdit(p: ProductRow) {
    setEditingId(p.id)
    setName(p.name)
    setDescription(p.description ?? '')
    setPriceInput(String((p.price / 100).toFixed(2)))
    setCategory(p.category as (typeof CATEGORIES)[number]['value'])
    setImageUrl(p.image_url ?? '')
    setModelUrl('')
    const res = await fetch(`/api/products/${p.id}`)
    const j = await res.json().catch(() => ({}))
    if (res.ok && j.product?.model_url) {
      setModelUrl(String(j.product.model_url))
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const price = centsFromInput(priceInput)
    if (!name.trim() || !Number.isFinite(price) || price < 0) {
      setError('Enter a valid name and price')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description || null,
            price,
            category,
            image_url: imageUrl || null,
            model_url: modelUrl || null,
          }),
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(j.error || 'Update failed')
          return
        }
        resetForm()
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description || null,
            price,
            category,
            image_url: imageUrl || null,
            model_url: modelUrl || null,
          }),
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(j.error || 'Create failed')
          return
        }
        resetForm()
      }
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this product?')) return
    setError(null)
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(j.error || 'Delete failed')
      return
    }
    if (editingId === id) resetForm()
    await load()
  }

  return (
    <div>
      <div className="max-w-5xl">
        <h1 className="font-cinzel text-3xl font-bold text-white">Admin — Products</h1>
        <p className="mt-2 text-white/60">
          Add, edit, or remove products. Images are URLs (e.g. Supabase Storage public URL).
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-10 space-y-4 rounded-xl border border-white/10 bg-mugen-dark/40 p-6"
        >
          <h2 className="font-cinzel text-xl text-white">
            {editingId ? 'Edit product' : 'New product'}
          </h2>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-white">Name</label>
              <input
                required
                className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-white">Description</label>
              <textarea
                className="min-h-[88px] w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-white">Price (USD)</label>
              <input
                required
                placeholder="19.99"
                className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-white">Category</label>
              <select
                className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white"
                value={category}
                onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number]['value'])}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-white">Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-white">Model URL (optional)</label>
              <input
                type="url"
                placeholder="https://..."
                className="w-full rounded-lg border border-mugen-gray bg-mugen-black/50 px-4 py-2 text-white"
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <GlowButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update product' : 'Add product'}
            </GlowButton>
            {editingId && (
              <button
                type="button"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <section className="mt-12">
          <h2 className="font-cinzel text-xl text-white">Catalog</h2>
          {loading ? (
            <p className="mt-4 text-white/60">Loading…</p>
          ) : products.length === 0 ? (
            <p className="mt-4 text-white/60">No products yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-white/10 bg-mugen-dark/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-white/80">Name</th>
                    <th className="px-4 py-3 font-semibold text-white/80">Category</th>
                    <th className="px-4 py-3 font-semibold text-white/80">Price</th>
                    <th className="px-4 py-3 font-semibold text-white/80">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                      <td className="px-4 py-3 text-white/70">{p.category.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-mugen-gold">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-mugen-gold hover:text-white"
                            onClick={() => startEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => remove(p.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
