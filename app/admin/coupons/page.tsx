import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'
export default async function AdminCouponsPage() {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-red-200">{auth.error}</div>
    )
  }

  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
        {error.message}
      </p>
    )
  }

  const rows = coupons ?? []

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-white">Coupons</h1>
          <p className="mt-2 text-white/60">Create discount codes, set limits, and track redemptions.</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-mugen-crimson px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-mugen-crimson/90"
        >
          New coupon
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm text-white/90">
          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Valid until</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-white/45">
                  No coupons yet. Create one to get started.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold text-white">{c.code}</td>
                  <td className="px-4 py-3 text-white/70">{c.discount_type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.is_active ? 'text-emerald-400' : 'text-white/40'
                      }
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="mx-2 text-white/30">|</span>
                    <span
                      className={
                        c.is_visible !== false ? 'text-blue-400' : 'text-white/40'
                      }
                    >
                      {c.is_visible !== false ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {c.times_used ?? 0}
                    {c.max_uses != null ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {c.valid_until
                      ? new Date(c.valid_until).toLocaleDateString('en-IN')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/coupons/${c.id}`}
                      className="font-semibold text-mugen-gold hover:underline"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-white/40">
        Amounts in checkout are validated server-side. Total discount shown uses order snapshots after payment.
      </p>
    </div>
  )
}
