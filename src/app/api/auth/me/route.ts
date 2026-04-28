import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { getUserById, updateUser } from '@/lib/memory-store'

export async function GET(request: Request) {
  return withAuth(request as any, async (_, payload) => {
    try {
      const user = getUserById(payload.userId)

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({
        user: {
          id: user.id, email: user.email, name: user.name, phone: user.phone,
          address: user.address, city: user.city, state: user.state, zipCode: user.zipCode,
          country: user.country, role: user.role, createdAt: user.createdAt,
        }
      })
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

      const updated = updateUser(payload.userId, {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zipCode !== undefined && { zipCode }),
        ...(country !== undefined && { country }),
      })

      if (!updated) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({
        user: {
          id: updated.id, email: updated.email, name: updated.name, phone: updated.phone,
          address: updated.address, city: updated.city, state: updated.state, zipCode: updated.zipCode,
          country: updated.country, role: updated.role,
        }
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
  })
}
