import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { getReviewsByProduct, createReview, deleteReview } from '@/lib/memory-store'
import { allProducts } from '@/lib/memory-store'

// GET /api/reviews - List reviews for a product or user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const result = getReviewsByProduct(productId, { page, limit })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST /api/reviews - Create a review
export async function POST(request: Request) {
  return withAuth(request as any, async (req, payload) => {
    try {
      const body = await req.json()
      const { productId, rating, title, comment } = body

      if (!productId || !rating) {
        return NextResponse.json({ error: 'productId and rating are required' }, { status: 400 })
      }

      if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
      }

      const product = allProducts.find(p => p.id === productId)
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      const review = createReview({ productId, userId: payload.userId, rating, title, comment })
      if (!review) {
        return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 })
      }

      return NextResponse.json({ review }, { status: 201 })
    } catch (error) {
      console.error('Error creating review:', error)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }
  })
}

// DELETE /api/reviews - Delete a review (own review only)
export async function DELETE(request: Request) {
  return withAuth(request as any, async (req, payload) => {
    try {
      const { searchParams } = new URL(req.url)
      const reviewId = searchParams.get('id')

      if (!reviewId) {
        return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
      }

      const success = deleteReview(reviewId, payload.userId)
      if (!success) {
        return NextResponse.json({ error: 'Review not found or not yours' }, { status: 404 })
      }

      return NextResponse.json({ message: 'Review deleted successfully' })
    } catch (error) {
      console.error('Error deleting review:', error)
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
    }
  })
}
