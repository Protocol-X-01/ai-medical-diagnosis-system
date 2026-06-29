import { NextRequest, NextResponse } from 'next/server'
import { putSignup, type Signup } from '@/lib/dynamodb'

export const runtime = 'nodejs'
export const maxDuration = 20

// POST /api/signup — capture a trial/access request (a lead). No password, no
// account auth: a human follows up to provision access. { email, name?, organization? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid work email is required.' }, { status: 400 })
    }
    const signup: Signup = {
      signupId: `su_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email,
      name: typeof body?.name === 'string' ? body.name.trim() || undefined : undefined,
      organization: typeof body?.organization === 'string' ? body.organization.trim() || undefined : undefined,
      createdAt: new Date().toISOString(),
    }
    await putSignup(signup)
    return NextResponse.json({ ok: true, signupId: signup.signupId }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
