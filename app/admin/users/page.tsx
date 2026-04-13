import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { ShieldCheck, User2 } from 'lucide-react'

type SearchParams = { q?: string; page?: string }

function UserAvatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <span className="relative inline-block h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
        <Image src={avatarUrl} alt={name ?? 'User'} fill className="object-cover" />
      </span>
    )
  }
  const initials = (name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mugen-crimson/20 text-xs font-bold text-mugen-crimson ring-1 ring-mugen-crimson/30">
      {initials}
    </span>
  )
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 text-red-200">
        {auth.error}
      </div>
    )
  }

  // Service role bypasses RLS so admins see every profile, not only their own row.
  const admin = createAdminClient()

  let query = admin
    .from('profiles')
    .select('id, name, email, avatar_url, auth_provider, is_admin, created_at, last_sign_in_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  let { data, error, count } = await query

  // Fallback for older DB schemas without all columns
  if (error && /column.*does not exist/i.test(error.message)) {
    const fallback = admin
      .from('profiles')
      .select('id, name, is_admin, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
    const res = await (q ? fallback.or(`name.ilike.%${q}%`) : fallback)
    data = res.data
    error = res.error
    count = res.count
  }

  if (error) {
    return (
      <div>
        <h1 className="font-cinzel text-3xl font-bold text-white">Users</h1>
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error.message}
        </p>
      </div>
    )
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-3xl font-bold text-white">Users</h1>
          <p className="mt-2 text-white/60">
            Browse customer profiles, login history, and order spend.
          </p>
        </div>
        <p className="text-xs text-white/40">
          {total.toLocaleString()} total · page {page} / {totalPages}
        </p>
      </div>

      {/* Search */}
      <form className="mt-6 flex gap-2" action="/admin/users" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="w-full rounded-xl border border-white/10 bg-mugen-black/60 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-mugen-magenta/50 focus:ring-1 focus:ring-mugen-magenta/20"
        />
        <button
          type="submit"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
        >
          Search
        </button>
        {q && (
          <Link
            href="/admin/users"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/50 hover:bg-white/10 hover:text-white"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-mugen-dark/30">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03]">
            <tr className="text-xs font-semibold uppercase tracking-wider text-white/40">
              <th className="px-4 py-3.5">User</th>
              <th className="px-4 py-3.5">Email</th>
              <th className="px-4 py-3.5">Provider</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5">Joined</th>
              <th className="px-4 py-3.5">Last Login</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {(data ?? []).map((u: any) => (
              <tr key={u.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.name} avatarUrl={u.avatar_url ?? null} />
                    <div>
                      <p className="font-semibold text-white/85">{u.name ?? '—'}</p>
                      <p className="font-mono text-[10px] text-white/30">{u.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-white/60">{u.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    {u.auth_provider ?? 'email'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.is_admin ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-mugen-gold/30 bg-mugen-gold/10 px-3 py-1 text-xs font-semibold text-mugen-gold">
                      <ShieldCheck className="h-3 w-3" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60">
                      <User2 className="h-3 w-3" /> Customer
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-white/60">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-white/60">
                  {u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    className="rounded-lg border border-mugen-glow/30 bg-white/5 px-3 py-1.5 text-xs font-semibold text-mugen-gold hover:bg-white/10"
                    href={`/admin/users/${u.id}`}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-white/40" colSpan={7}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link
          href={`/admin/users?q=${encodeURIComponent(q)}&page=${Math.max(1, page - 1)}`}
          className={`rounded-lg border px-3 py-2 ${
            page <= 1
              ? 'pointer-events-none border-white/5 bg-white/5 text-white/20'
              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          ← Prev
        </Link>
        <span className="text-xs text-white/40">
          Page {page} of {totalPages}
        </span>
        <Link
          href={`/admin/users?q=${encodeURIComponent(q)}&page=${Math.min(totalPages, page + 1)}`}
          className={`rounded-lg border px-3 py-2 ${
            page >= totalPages
              ? 'pointer-events-none border-white/5 bg-white/5 text-white/20'
              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          Next →
        </Link>
      </div>
    </div>
  )
}
