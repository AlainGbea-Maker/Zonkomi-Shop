import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'

const DEMO_EMAIL = 'demo@zonkomishop.com'

export async function GET() {
  try {
    let user = await db.user.findUnique({ where: { email: DEMO_EMAIL } })

    if (!user) {
      const hashedPassword = hashPassword('demo123')
      user = await db.user.create({
        data: {
          email: DEMO_EMAIL,
          name: 'Kwame Asante',
          phone: '+233241234567',
          address: '12 Ring Road Central',
          city: 'Accra',
          state: 'Greater Accra',
          zipCode: 'GA-123',
          country: 'GH',
          password: hashedPassword,
          role: 'customer',
        },
      })
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role })

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
      token,
    })
  } catch (error) {
    console.error('Error during demo login:', error)
    return NextResponse.json({ error: 'Demo login failed' }, { status: 500 })
  }
}
