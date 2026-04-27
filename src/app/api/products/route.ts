import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const categorySlug = searchParams.get('category')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort')
    const featured = searchParams.get('featured')
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '0')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10) || 12))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { active: true }

    // Filter by category slug or ID
    if (categorySlug) {
      where.category = { slug: categorySlug }
    } else if (categoryId) {
      where.categoryId = categoryId
    }

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // Filter by featured
    if (featured === 'true') {
      where.featured = true
    }

    // Filter by price range
    if (!isNaN(minPrice) && minPrice > 0) {
      where.price = { ...(where.price as Record<string, unknown> || {}), gte: minPrice }
    }
    if (!isNaN(maxPrice) && maxPrice > 0) {
      where.price = { ...(where.price as Record<string, unknown> || {}), lte: maxPrice }
    }

    // Determine sort order
    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (sort === 'price-asc') {
      orderBy = { price: 'asc' }
    } else if (sort === 'price-desc') {
      orderBy = { price: 'desc' }
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' }
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' }
    } else if (sort === 'featured') {
      orderBy = { featured: 'desc' }
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
