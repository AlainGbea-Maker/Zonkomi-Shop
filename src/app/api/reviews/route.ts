import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { db } from '@/lib/db'

// GET /api/reviews - List reviews for a product or user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const userId = searchParams.get('userId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const skip = (page - 1) * limit

    if (!productId && !userId) {
      return NextResponse.json({ error: 'productId or userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { active: true }
    if (productId) where.productId = productId
    if (userId) where.userId = userId

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.review.count({ where }),
    ])

    // Calculate average rating
    const avgResult = await db.review.aggregate({
      where: productId ? { productId } : userId ? { userId } : {},
      _avg: { rating: true },
      _count: true,
    })

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      average: avgResult._avg?.rating || 0,
      totalReviews: avgResult._count,
    })
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

      // Check product exists
      const product = await db.product.findUnique({ where: { id: productId } })
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      // Check if user already reviewed
      const existing = await db.review.findUnique({
        where: { userId_productId: { userId: payload.userId, productId } },
      })
      if (existing) {
        return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 })
      }

      const review = await db.review.create({
        data: {
          productId,
          userId: payload.userId,
          rating,
          title,
          comment,
        },
        include: { user: { select: { id: true, name: true } } },
      })

      // Update product rating average
      const allReviews = await db.review.findMany({ where: { productId } })
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      await db.product.update({
        where: { id: productId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: allReviews.length,
        },
      })

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

      const review = await db.review.findUnique({ where: { id: reviewId } })
      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }

      if (review.userId !== payload.userId) {
        return NextResponse.json({ error: 'You can only delete your own reviews' }, { status: 403 })
      }

      const productId = review.productId
      await db.review.delete({ where: { id: reviewId } })

      // Recalculate product rating
      const remainingReviews = await db.review.findMany({ where: { productId } })
      const avgRating = remainingReviews.length > 0
        ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / remainingReviews.length
        : 0
      await db.product.update({
        where: { id: productId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: remainingReviews.length,
        },
      })

      return NextResponse.json({ message: 'Review deleted successfully' })
    } catch (error) {
      console.error('Error deleting review:', error)
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
    }
  })
}
