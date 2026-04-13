import type { RazorpayOptions, RazorpaySuccessResponse } from './types'

declare global {
  interface Window {
    Razorpay: unknown
  }
}

export type RazorpayPaymentFailureReason = 'failed' | 'dismissed' | 'verify_failed' | 'sdk'

export type RazorpayPaymentResult =
  | { ok: true; response: RazorpaySuccessResponse }
  | { ok: false; reason: RazorpayPaymentFailureReason; message: string }

/**
 * Load Razorpay SDK script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Opens Razorpay checkout. Resolves with a structured result — does not reject for user-visible
 * failures (insufficient balance, closed modal, etc.) so callers can handle UI + DB without noisy errors.
 */
export async function initiateRazorpayPayment(options: RazorpayOptions): Promise<RazorpayPaymentResult> {
  const isLoaded = await loadRazorpayScript()

  if (!isLoaded) {
    return {
      ok: false,
      reason: 'sdk',
      message: 'Payment form could not be loaded. Check your connection and try again.',
    }
  }

  const { handler: userHandler, ...rest } = options

  return new Promise((resolve) => {
    const Rzp = window.Razorpay as new (opts: Record<string, unknown>) => {
      on: (ev: string, fn: (payload: unknown) => void) => void
      open: () => void
    }

    const rzp = new Rzp({
      ...rest,
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          if (userHandler) {
            await Promise.resolve(userHandler(response))
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Payment could not be verified.'
          resolve({ ok: false, reason: 'verify_failed', message: msg })
          return
        }
        resolve({ ok: true, response })
      },
      modal: {
        ondismiss: () => {
          resolve({
            ok: false,
            reason: 'dismissed',
            message: 'Payment was cancelled.',
          })
        },
      },
    })

    rzp.on('payment.failed', (payload: unknown) => {
      const p = payload as { error?: { description?: string; reason?: string } }
      const msg =
        p?.error?.description ||
        p?.error?.reason ||
        'Payment failed. Please try another method or add funds.'
      resolve({ ok: false, reason: 'failed', message: msg })
    })

    rzp.open()
  })
}

/**
 * Verify Razorpay payment signature on backend
 */
export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    })

    const data = await response.json()
    return data.verified === true
  } catch (error) {
    console.error('Payment verification error:', error)
    return false
  }
}

/**
 * Create Razorpay order on backend
 */
export async function createRazorpayOrder(amount: number, receipt: string): Promise<unknown> {
  try {
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        receipt,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create order')
    }

    return await response.json()
  } catch (error) {
    console.error('Order creation error:', error)
    throw error
  }
}
