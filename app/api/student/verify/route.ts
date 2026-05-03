import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSession, isErrorResponse } from '@/lib/auth/session-guard'
import Groq from 'groq-sdk'

// We use dynamic import for tesseract.js to avoid SSR issues
// tesseract.js works in Node.js environment (Next.js API routes)

const GROQ_PROMPT = `You are validating whether a given image is a student ID card.

Rules:
- Just check if the uploaded image is a student ID or not. No need to strictly validate it.
- If it is an ID, there will be something like enrollment no., roll no., student name, college or school name, etc. visible.
- If something like this is available, then allow it.
- Other random photos, selfies, gym cards, etc. will be considered as invalid ID.

Respond ONLY with a valid JSON object. Do not include any explanations, markdown formatting, or other text.

Valid Output:
{"verified": true}
or
{"verified": false}`

export async function POST(request: Request) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const sessionResult = await requireSession()
  if (isErrorResponse(sessionResult)) return sessionResult
  const sessionUser = sessionResult.user

  // ── Check GROQ key ────────────────────────────────────────────────────────
  if (!process.env.GROQ_API_KEY) {
    console.error('[student/verify] GROQ_API_KEY not set')
    return NextResponse.json(
      { error: 'Server configuration error. Contact support.' },
      { status: 500 }
    )
  }

  const db = createAdminClient()
  const userId = sessionUser.id

  // ── Check if already verified ──────────────────────────────────────────────
  const { data: profile } = await db
    .from('profiles')
    .select('student_verified')
    .eq('id', userId)
    .single()

  if (profile?.student_verified) {
    return NextResponse.json(
      { error: 'Already verified', verified: true },
      { status: 200 }
    )
  }

  // ── Parse multipart form ───────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const enrollmentNumber = String(formData.get('enrollmentNumber') ?? '').trim()
  const collegeName = String(formData.get('collegeName') ?? '').trim()
  const collegeCity = String(formData.get('collegeCity') ?? '').trim()
  const idImageFile = formData.get('idImage') as File | null

  // ── Development Bypass ─────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production' && collegeName === 'DEV_BYPASS') {
    await db
      .from('student_verifications')
      .upsert(
        {
          user_id: userId,
          enrollment_number: 'DEV-12345',
          college_name: 'DEV BYPASS COLLEGE',
          college_city: 'DEV CITY',
          id_image_url: 'dev-bypass.png',
          verified_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    await db.from('profiles').update({ student_verified: true }).eq('id', userId)
    return NextResponse.json({ verified: true, message: 'Dev bypass successful!' })
  }

  if (!enrollmentNumber || !collegeName || !collegeCity || !idImageFile) {
    return NextResponse.json(
      { error: 'All fields including ID image are required' },
      { status: 400 }
    )
  }

  if (idImageFile.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'ID image must be under 5MB' },
      { status: 400 }
    )
  }

  // ── Convert file to buffer ─────────────────────────────────────────────────
  const imageBuffer = Buffer.from(await idImageFile.arrayBuffer())

  // ── Upload image to Supabase Storage (private) ────────────────────────────
  let idImageUrl: string | null = null
  try {
    const ext = idImageFile.name.split('.').pop() ?? 'jpg'
    const storagePath = `${userId}/${Date.now()}.${ext}`

    const { error: uploadErr } = await db.storage
      .from('student-ids')
      .upload(storagePath, imageBuffer, {
        contentType: idImageFile.type || 'image/jpeg',
        upsert: true,
      })

    if (!uploadErr) {
      idImageUrl = storagePath
    }
    // Non-fatal — we proceed even if storage fails
  } catch (e) {
    console.warn('[student/verify] Storage upload failed (non-fatal):', e)
  }

  // ── Prepare Image for Groq Vision ─────────────────────────────────────────
  const base64Image = imageBuffer.toString('base64')
  const mimeType = idImageFile.type || 'image/jpeg'
  const dataUri = `data:${mimeType};base64,${base64Image}`

  // ── GROQ verification ─────────────────────────────────────────────────────
  let groqVerified = false
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: GROQ_PROMPT },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 50,
      // response_format might not be supported by vision models, we parse JSON manually
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    groqVerified = parsed.verified === true
  } catch (groqErr) {
    console.error('[student/verify] GROQ failed:', groqErr)
    return NextResponse.json(
      { error: 'Verification service temporarily unavailable. Try again.' },
      { status: 503 }
    )
  }

  if (!groqVerified) {
    return NextResponse.json(
      {
        verified: false,
        error:
          'Verification failed. Please upload a valid student college ID card with your name and enrollment number clearly visible.',
      },
      { status: 200 }
    )
  }

  // ── Save to DB ────────────────────────────────────────────────────────────
  const { error: upsertErr } = await db
    .from('student_verifications')
    .upsert(
      {
        user_id: userId,
        enrollment_number: enrollmentNumber,
        college_name: collegeName,
        college_city: collegeCity,
        id_image_url: idImageUrl,
        verified_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (upsertErr) {
    console.error('[student/verify] DB upsert failed:', upsertErr)
    return NextResponse.json(
      { error: 'Failed to save verification. Please try again.' },
      { status: 500 }
    )
  }

  // ── Mark profile as verified ───────────────────────────────────────────────
  await db
    .from('profiles')
    .update({ student_verified: true })
    .eq('id', userId)

  return NextResponse.json({ verified: true, message: 'Student verification successful!' })
}
