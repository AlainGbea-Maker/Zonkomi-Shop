import { NextResponse } from 'next/server'
import { ensureDemoUser, signToken } from '@/lib/memory-store'

const DEMO_EMAIL = 'demo@zonkomishop.com'

export async function GET() {
  try {
    const user = ensureDemoUser()

    const token = signToken({ userId: user.id, email: user.email, role: user.role })

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
      token,
    })
  } catch (error) {
    console.error('Error during demo login:', error)
    return NextResponse.json({ error: 'Demo login failed', details: String(error) }, { status: 500 })
  }
}
