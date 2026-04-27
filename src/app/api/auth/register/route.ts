import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, phone, address, city, state, zipCode, country = 'US', password } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    const hashedPassword = hashPassword(password)

    const user = await db.user.create({
      data: { email, name, phone, address, city, state, zipCode, country, password: hashedPassword },
    })

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
