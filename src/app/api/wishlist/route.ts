import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { db } from '@/lib/db'

// GET /api/wishlist - Get user's wishlist
export async function GET(request: Request) {
  return withAuth(request as any, async (_, payload) => {
    try {
      const wishlist = await db.wishlist.findMany({
        where: { userId: payload.userId },
        include: {
          product: {
            include: { category: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        items: wishlist.map(w => w.product),
        count: wishlist.length,
      })
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
    }
  })
}

// POST /api/wishlist - Add product to wishlist
export async function POST(request: Request) {
  return withAuth(request as any, async (req, payload) => {
    try {
      const body = await req.json()
      const { productId } = body

      if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 })
      }

      // Check product exists
      const product = await db.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      // Check if already in wishlist
      const existing = await db.wishlist.findUnique({
        where: { userId_productId: { userId: payload.userId, productId } },
      })
      if (existing) {
        return NextResponse.json({ message: 'Already in wishlist', alreadyAdded: true })
      }

      const wishlist = await db.wishlist.create({
        data: { userId: payload.userId, productId },
        include: { product: true },
      })

      return NextResponse.json({ wishlist, message: 'Added to wishlist' }, { status: 201 })
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
    }
  })
}

// DELETE /api/wishlist - Remove product from wishlist
export async function DELETE(request: Request) {
  return withAuth(request as any, async (req, payload) => {
    try {
      const { searchParams } = new URL(req.url)
      const productId = searchParams.get('productId')

      if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 })
      }

      await db.wishlist.deleteMany({
        where: { userId: payload.userId, productId },
      })

      return NextResponse.json({ message: 'Removed from wishlist' })
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
    }
  })
}

// Check if product is in wishlist
export async function HEAD(request: Request) {
  return withAuth(request as any, async (req, payload) => {
    try {
      const { searchParams } = new URL(req.url)
      const productId = searchParams.get('productId')

      if (!productId) {
        return new NextResponse(null, { status: 400 })
      }

      const item = await db.wishlist.findUnique({
        where: { userId_productId: { userId: payload.userId, productId } },
      })

      if (item) {
        return new NextResponse(null, { status: 200 })
      }
      return new NextResponse(null, { status: 404 })
    } catch {
      return new NextResponse(null, { status: 500 })
    }
  })
}
