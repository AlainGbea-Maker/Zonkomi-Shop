import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { allProducts, allCategories } from '@/lib/memory-store'
import { getProductsWithCategory } from '@/lib/seed-data'

// GET /api/admin/products - List all products (admin)
export async function GET(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const search = searchParams.get('search')
      const category = searchParams.get('category')
      const status = searchParams.get('status')
      const sort = searchParams.get('sort') || 'rating'
      const order = searchParams.get('order') || 'desc'
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

      let filtered = [...allProducts]

      if (search) {
        const q = search.toLowerCase()
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
        )
      }
      if (category) filtered = filtered.filter(p => p.categoryId === category)
      if (status === 'active') filtered = filtered.filter(p => p.active)
      if (status === 'inactive') filtered = filtered.filter(p => !p.active)

      const sortDir = order === 'asc' ? 1 : -1
      switch (sort) {
        case 'name': filtered.sort((a, b) => sortDir * a.name.localeCompare(b.name)); break
        case 'price': filtered.sort((a, b) => sortDir * (a.price - b.price)); break
        case 'stock': filtered.sort((a, b) => sortDir * (a.stock - b.stock)); break
        case 'rating': filtered.sort((a, b) => sortDir * (b.rating - a.rating)); break
        default: filtered.sort((a, b) => sortDir * (b.rating - a.rating)); break
      }

      const total = filtered.length
      const skip = (page - 1) * limit
      const paged = filtered.slice(skip, skip + limit)

      const catMap: Record<string, { id: string; name: string }> = {}
      for (const c of allCategories) catMap[c.id] = { id: c.id, name: c.name }

      const withCat = paged.map(p => ({
        ...p,
        category: catMap[p.categoryId] ? { id: catMap[p.categoryId].id, name: catMap[p.categoryId].name } : null,
      }))

      return NextResponse.json({
        products: withCat,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    } catch (error) {
      console.error('Error fetching admin products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
  })
}

// POST /api/admin/products - Create product (echo back for Vercel)
export async function POST(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const body = await req.json()
      // In-memory: just return success (data won't persist across serverless invocations)
      return NextResponse.json({ message: 'Product created (in-memory only on Vercel)', product: body }, { status: 201 })
    } catch (error) {
      console.error('Error creating product:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
  })
}

// PUT /api/admin/products - Update product
export async function PUT(request: Request) {
  return withAdmin(request as any, async () => {
    return NextResponse.json({ message: 'Product updated (in-memory only on Vercel)' })
  })
}

// DELETE /api/admin/products - Delete product
export async function DELETE(request: Request) {
  return withAdmin(request as any, async () => {
    return NextResponse.json({ message: 'Product deleted (in-memory only on Vercel)' })
  })
}
