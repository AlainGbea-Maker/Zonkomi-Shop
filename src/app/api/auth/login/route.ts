import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signToken, hashPassword, comparePassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If password provided, validate it
    if (password) {
      if (user.password) {
        const valid = comparePassword(password, user.password)
        if (!valid) {
          return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
        }
      } else {
        // Legacy user - auto-set password
        const hashedPassword = hashPassword(password)
        await db.user.update({ where: { id: user.id }, data: { password: hashedPassword } })
      }
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role })

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
      token,
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
