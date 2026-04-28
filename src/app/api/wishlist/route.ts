import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { allProducts, getCategoriesWithCount } from '@/lib/memory-store'

// Wishlist is managed client-side via Zustand store.
// These API endpoints exist for compatibility but delegate to client-side state.

// GET /api/wishlist - Get user's wishlist
export async function GET() {
  return withAuth({} as any, async () => {
    return NextResponse.json({ items: [], count: 0 })
  })
}

// POST /api/wishlist - Add product to wishlist
export async function POST(request: Request) {
  return withAuth(request as any, async (req) => {
    try {
      const body = await req.json()
      const { productId } = body

      if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 })
      }

      const product = allProducts.find(p => p.id === productId)
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      return NextResponse.json({ message: 'Added to wishlist' }, { status: 201 })
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
    }
  })
}

// DELETE /api/wishlist - Remove product from wishlist
export async function DELETE() {
  return NextResponse.json({ message: 'Removed from wishlist' })
}

// Check if product is in wishlist
export async function HEAD() {
  return new NextResponse(null, { status: 404 })
}
