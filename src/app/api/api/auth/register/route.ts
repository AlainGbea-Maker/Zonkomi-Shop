import { NextResponse } from 'next/server'
import { createUser, findUserByEmail, signToken } from '@/lib/memory-store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, phone, address, city, state, zipCode, country = 'GH', password } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    // Auto-generate password if not provided (registration form doesn't require it)
    const finalPassword = password || `auto-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    const existingUser = findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    const user = createUser({ email, name, phone, address, city, state, zipCode, country, password: finalPassword })

    const token = signToken({ userId: user.id, email: user.email, role: user.role })

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
      token,
    }, { status: 201 })
  } catch (error) {
    console.error('Error during registration:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
