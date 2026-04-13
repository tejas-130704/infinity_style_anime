import Link from 'next/link'
import { CouponForm } from '@/components/admin/CouponForm'

export default function AdminNewCouponPage() {
  return (
    <div>
      <Link href="/admin/coupons" className="text-sm text-mugen-gold hover:underline">
        ← All coupons
      </Link>
      <h1 className="font-cinzel mt-4 text-3xl font-bold text-white">New coupon</h1>
      <p className="mt-2 max-w-2xl text-white/60">
        Codes are stored uppercase. Discount amounts use the same rules as checkout (paise internally).
      </p>

      <div className="mt-10 max-w-3xl">
        <CouponForm mode="create" />
      </div>
    </div>
  )
}
