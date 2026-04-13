export function formatMoneyINRFromPaise(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    (paise ?? 0) / 100
  )
}

export function formatOrderDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

