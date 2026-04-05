import Link from 'next/link'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  return (
    <main className="min-h-screen bg-mugen-black pt-28 pb-20">
      <div className="container mx-auto max-w-lg px-4 text-center">
        <h1 className="font-cinzel text-3xl font-bold text-white">Payment successful</h1>
        <p className="mt-4 text-white/70">
          Thank you! Your order is confirmed. You can track it from your account.
        </p>
        {session_id && (
          <p className="mt-2 font-mono text-xs text-white/40">Session: {session_id.slice(0, 24)}…</p>
        )}
        <Link
          href="/account/orders"
          className="mt-8 inline-block font-semibold text-mugen-gold hover:text-white"
        >
          View orders
        </Link>
      </div>
    </main>
  )
}
