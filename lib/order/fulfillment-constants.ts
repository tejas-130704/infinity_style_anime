export const FULFILLMENT_STATUSES = [
  'ordered',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number]

export function isFulfillmentStatus(s: string | null | undefined): s is FulfillmentStatus {
  return !!s && (FULFILLMENT_STATUSES as readonly string[]).includes(s)
}

export function fulfillmentRank(s: FulfillmentStatus): number {
  switch (s) {
    case 'ordered':
      return 0
    case 'packed':
      return 1
    case 'shipped':
      return 2
    case 'out_for_delivery':
      return 3
    case 'delivered':
      return 4
    default:
      return -1
  }
}
