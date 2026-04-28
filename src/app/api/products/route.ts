import { NextResponse } from 'next/server'
import { getProductsFiltered } from '@/lib/memory-store'

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

    const result = getProductsFiltered({
      categorySlug,
      categoryId,
      search,
      sort,
      featured,
      minPrice: isNaN(minPrice) ? 0 : minPrice,
      maxPrice: isNaN(maxPrice) ? 0 : maxPrice,
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
