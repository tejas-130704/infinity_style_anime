import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-lg px-4 text-center">
        <h1 className="font-cinzel text-3xl font-bold text-white">Checkout cancelled</h1>
        <p className="mt-4 text-white/70">No charge was made. Your cart was cleared when checkout started — add items again anytime.</p>
        <Link href="/shop" className="mt-8 inline-block font-semibold text-mugen-gold hover:text-white">
          Continue shopping
        </Link>
      </div>
    </main>
  )
}
