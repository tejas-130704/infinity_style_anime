import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getPublicSupabaseEnv } from './env'

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse
  supabaseUserId: string | null
}> {
  const env = getPublicSupabaseEnv()
  if (!env) {
    return {
      response: NextResponse.next({ request }),
      supabaseUserId: null,
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    response: supabaseResponse,
    supabaseUserId: user?.id ?? null,
  }
}
