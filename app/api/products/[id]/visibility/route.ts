import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminSession, isErrorResponse } from '@/lib/auth/session-guard'

/**
 * PATCH /api/products/[id]/visibility
 * Body: { is_public: boolean }
 *
 * Admin-only lightweight endpoint to toggle a product's public visibility.
 * Using a dedicated route keeps the intent explicit and avoids accidentally
 * touching other fields when the admin clicks the toggle switch.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  // Must be admin
  const auth = await requireAdminSession()
  if (isErrorResponse(auth)) return auth

  let body: { is_public?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.is_public !== 'boolean') {
    return NextResponse.json(
      { error: '`is_public` must be a boolean' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('products')
    .update({
      is_public: body.is_public,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, name, is_public, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Revalidate all affected pages so the shop updates immediately
  revalidatePath('/shop')
  revalidatePath('/admin/products')
  revalidatePath(`/product/${id}`)

  return NextResponse.json({ product: data })
}
