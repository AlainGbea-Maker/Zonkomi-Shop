import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  return withAuth(request as any, async (_, payload) => {
    try {
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true, email: true, name: true, phone: true,
          address: true, city: true, state: true, zipCode: true,
          country: true, role: true, createdAt: true,
        },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({ user })
    } catch (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
  })
}

export async function PUT(request: Request) {
  return withAuth(request as any, async (req, payload) => {
    try {
      const body = await req.json()
      const { name, phone, address, city, state, zipCode, country } = body

      const updated = await db.user.update({
        where: { id: payload.userId },
        data: {
          ...(name && { name }),
          ...(phone !== undefined && { phone }),
          ...(address !== undefined && { address }),
          ...(city !== undefined && { city }),
          ...(state !== undefined && { state }),
          ...(zipCode !== undefined && { zipCode }),
          ...(country !== undefined && { country }),
        },
        select: {
          id: true, email: true, name: true, phone: true,
          address: true, city: true, state: true, zipCode: true,
          country: true, role: true,
        },
      })

      return NextResponse.json({ user: updated })
    } catch (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
  })
}
