'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Loader2, Save, Gift, Check } from 'lucide-react'
import { shouldOptimizeImageSrc } from '@/lib/image-allowlist'

interface Product {
  id: string
  name: string
  image_url: string | null
  price: number
  original_price: number | null
}

export default function AdminSpinWheelPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Hover state for the enlarged preview
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/spin-wheel')
        if (!res.ok) throw new Error('Failed to load products')
        const data = await res.json()
        
        setProducts(data.products)
        setSelectedIds(new Set(data.configuredIds))
      } catch (error) {
        toast.error('Error loading spin wheel configuration')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size >= 6) {
          toast.warning('You can select a maximum of 6 products for the spin wheel.')
          return prev
        }
        next.add(id)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least 1 product.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/spin-wheel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(selectedIds) })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      toast.success('Spin wheel configuration saved successfully!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mugen-gold" />
      </div>
    )
  }

  return (
    <div className="relative pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-white">Spin Wheel Configuration</h1>
          <p className="mt-1 text-sm text-white/45">
            Select up to 6 products to display on the checkout spin wheel.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-mugen-gold px-6 py-2.5 font-bold text-black hover:bg-yellow-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Save Configuration
        </button>
      </div>

      <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        Selected: <span className="font-bold text-mugen-gold">{selectedIds.size} / 6</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 relative">
        {products.map(product => {
          const isSelected = selectedIds.has(product.id)
          return (
            <div
              key={product.id}
              onClick={() => toggleSelection(product.id)}
              onMouseEnter={() => setHoveredProduct(product)}
              onMouseLeave={() => setHoveredProduct(null)}
              className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3 transition-all duration-200 ${
                isSelected 
                  ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                  : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg">
                  <Check className="h-4 w-4" />
                </div>
              )}
              
              <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-black/40">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className={`object-cover transition-transform duration-300 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}
                    unoptimized={!shouldOptimizeImageSrc(product.image_url)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <Gift className="h-8 w-8" />
                  </div>
                )}
              </div>
              
              <h3 className="line-clamp-2 text-xs font-semibold text-white/90">
                {product.name}
              </h3>
              <p className="mt-1 text-xs font-bold text-mugen-gold">
                ₹{(product.price / 100).toLocaleString('en-IN')}
              </p>
            </div>
          )
        })}

        {/* Floating preview on hover */}
        {hoveredProduct && (
          <div className="fixed bottom-8 right-8 z-50 w-64 rounded-xl border border-white/20 bg-black/80 p-4 shadow-2xl backdrop-blur-xl pointer-events-none transition-all duration-200">
            <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-black">
               {hoveredProduct.image_url ? (
                  <Image
                    src={hoveredProduct.image_url}
                    alt={hoveredProduct.name}
                    fill
                    className="object-cover"
                    unoptimized={!shouldOptimizeImageSrc(hoveredProduct.image_url)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/20">
                    <Gift className="h-12 w-12" />
                  </div>
                )}
            </div>
            <h4 className="font-semibold text-white">{hoveredProduct.name}</h4>
            <p className="mt-1 text-sm font-bold text-mugen-gold">
              ₹{(hoveredProduct.price / 100).toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
