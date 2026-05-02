import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSession, isErrorResponse } from '@/lib/auth/session-guard'

export async function GET(_request: Request) {
  const sessionResult = await requireSession()
  if (isErrorResponse(sessionResult)) return sessionResult
  const userId = sessionResult.user.id

  const db = createAdminClient()

  const { data: profile } = await db
    .from('profiles')
    .select('student_verified')
    .eq('id', userId)
    .single()

  if (!profile) {
    return NextResponse.json({
      studentVerified: false
    })
  }

  return NextResponse.json({
    studentVerified: profile.student_verified
  })
}
