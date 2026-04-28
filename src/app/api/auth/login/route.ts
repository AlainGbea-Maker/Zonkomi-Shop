import { NextResponse } from 'next/server'
import { authUser, findUserByEmail, hashPassword, signToken } from '@/lib/memory-store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Try in-memory store
    const result = authUser(email, password)
    if (result) {
      return NextResponse.json({
        user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role, phone: result.user.phone },
        token: result.token,
      })
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
