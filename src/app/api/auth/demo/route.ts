import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEMO_EMAIL = 'demo@zonkomishop.com'

export async function GET() {
  try {
    let user = await db.user.findUnique({
      where: { email: DEMO_EMAIL },
    })

    // Auto-create demo user if not found
    if (!user) {
      user = await db.user.create({
        data: {
          email: DEMO_EMAIL,
          name: 'Demo User',
          phone: '(555) 123-4567',
          address: '123 Demo Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          country: 'US',
        },
      })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error during demo login:', error)
    return NextResponse.json(
      { error: 'Demo login failed' },
      { status: 500 }
    )
  }
}
