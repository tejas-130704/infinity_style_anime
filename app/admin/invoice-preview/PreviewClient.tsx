'use client'

import { useState } from 'react'
import { Eye, ShieldAlert, Info, Copy, Check } from 'lucide-react'

type Tab = 'customer' | 'admin'

interface Props {
  customerHtml: string
  adminHtml: string
  orderId: string
  isReal: boolean
}

export function InvoicePreviewClient({ customerHtml, adminHtml, orderId, isReal }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('customer')
  const [copied, setCopied] = useState(false)

  const shortId = orderId.slice(0, 8).toUpperCase()
  const currentHtml = activeTab === 'customer' ? customerHtml : adminHtml

  function handleCopy() {
    navigator.clipboard.writeText(currentHtml).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 pb-12">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-white">
              Invoice Preview
            </h1>
            <p className="mt-1 text-sm text-white/40">
              {isReal ? (
                <>
                  Live data — order{' '}
                  <span className="font-mono text-white/60">#{shortId}</span>
                </>
              ) : (
                <span className="text-yellow-400/70">⚠ Demo data — no completed order found</span>
              )}
            </p>
          </div>

          {/* Copy HTML button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy HTML
              </>
            )}
          </button>
        </div>

        {/* ── Dev notice ──────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-950/20 px-4 py-3 text-sm text-blue-300/80">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <span>
            This page is for{' '}
            <strong className="text-blue-300">development only</strong>. It previews the exact
            HTML email rendered by{' '}
            <code className="rounded bg-blue-900/30 px-1 font-mono text-xs">
              buildOrderInvoiceHtml
            </code>{' '}
            /{' '}
            <code className="rounded bg-blue-900/30 px-1 font-mono text-xs">
              buildAdminInvoiceHtml
            </code>
            . Remove the navbar link before going to production.
          </span>
        </div>

        {/* ── Tab switcher ────────────────────────────────────────────────── */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab('customer')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'customer'
                ? 'bg-white text-black shadow-lg'
                : 'bg-white/8 text-white/60 hover:bg-white/12 hover:text-white'
            }`}
          >
            <Eye className="h-4 w-4" />
            Customer Email
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                : 'bg-white/8 text-white/60 hover:bg-white/12 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            Admin Email
          </button>
        </div>

        {/* ── Description chips ───────────────────────────────────────────── */}
        <div className="mb-5 flex flex-wrap gap-2 text-xs">
          {activeTab === 'customer' ? (
            <>
              <Chip color="green">Clean invoice</Chip>
              <Chip color="green">Order summary</Chip>
              <Chip color="green">Confirmation message</Chip>
            </>
          ) : (
            <>
              <Chip color="red">Full client details</Chip>
              <Chip color="red">Name · Email · Phone · Address</Chip>
              <Chip color="red">Payment ID + Gateway Order ID</Chip>
              <Chip color="red">Coupon applied (if any)</Chip>
              <Chip color="red">Full invoice</Chip>
            </>
          )}
        </div>

        {/* ── Recipients info ─────────────────────────────────────────────── */}
        <div className="mb-5 rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm">
          <p className="font-semibold text-white/50 mb-1">
            {activeTab === 'customer' ? 'Sent to:' : 'Sent to (admins):'}
          </p>
          {activeTab === 'customer' ? (
            <p className="font-mono text-white/70">{'<customer email from order>'}</p>
          ) : (
            <div className="flex flex-col gap-0.5 font-mono text-white/70">
              <span>jainishan2023@gmail.com</span>
              <span>tejasjadhav130704@gmail.com</span>
            </div>
          )}
        </div>

        {/* ── iframe preview ──────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
            <div className="h-3 w-3 rounded-full bg-red-500/60" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <div className="h-3 w-3 rounded-full bg-green-500/60" />
            <span className="ml-3 font-mono text-xs text-white/30">email preview</span>
          </div>
          <iframe
            key={activeTab}
            srcDoc={currentHtml}
            title={`${activeTab} invoice preview`}
            className="w-full border-0 bg-white"
            style={{ height: '820px' }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}

function Chip({
  children,
  color,
}: {
  children: React.ReactNode
  color: 'green' | 'red'
}) {
  const cls =
    color === 'green'
      ? 'bg-emerald-950/60 border-emerald-500/20 text-emerald-300/80'
      : 'bg-red-950/60 border-red-500/20 text-red-300/80'
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 font-medium ${cls}`}>
      {children}
    </span>
  )
}
