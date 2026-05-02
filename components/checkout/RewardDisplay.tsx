'use client'

import { motion } from 'framer-motion'
import { Gift, ShoppingCart, Star } from 'lucide-react'
import Image from 'next/image'
import { shouldOptimizeImageSrc } from '@/lib/image-allowlist'

interface RewardProduct {
  id: string
  name: string
  image_url: string | null
  price: number
  original_price?: number | null
  slug?: string | null
}

interface RewardDisplayProps {
  product: RewardProduct
  onAddToCart: () => void
}

export function RewardDisplay({ product, onAddToCart }: RewardDisplayProps) {
  const originalPriceRupees =
    product.original_price != null
      ? product.original_price / 100
      : product.price / 100

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="mx-5 mb-5"
    >
      {/* Header */}
      <div className="rounded-t-xl border-x border-t border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent px-5 py-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">
            You Won a Free Product!
          </span>
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        </div>
        <p className="text-xs text-white/40">Added to your order at ₹0</p>
      </div>

      {/* Product card */}
      <div className="border-x border-b border-yellow-500/20 rounded-b-xl bg-white/5 backdrop-blur-sm px-5 py-4">
        <div className="flex items-center gap-4">
          {/* Image */}
          <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/10 border border-yellow-500/20">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized={!shouldOptimizeImageSrc(product.image_url)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Gift className="h-8 w-8 text-yellow-400/60" />
              </div>
            )}
            {/* FREE badge */}
            <div className="absolute top-1 left-1 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm leading-none">
              FREE
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white leading-tight line-clamp-2">
              {product.name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl font-black text-green-400">₹0</span>
              <span className="text-sm text-white/40 line-through">
                ₹{originalPriceRupees.toLocaleString('en-IN')}
              </span>
              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-semibold">
                100% OFF
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onAddToCart}
          id="add-reward-to-cart-btn"
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 px-6 py-2.5 font-bold text-black flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-yellow-900/30"
        >
          <ShoppingCart className="h-4 w-4" />
          Add Free Reward to Order
        </motion.button>
      </div>
    </motion.div>
  )
}
