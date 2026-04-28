import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import {
  allProducts,
  allCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/memory-store'

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

// POST /api/admin/products - Create product
export async function POST(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const body = await req.json()

      if (!body.name) {
        return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
      }

      const specs = typeof body.specs === 'string'
        ? body.specs
        : body.specs
          ? JSON.stringify(body.specs)
          : '{}'

      const product = createProduct({
        name: body.name,
        description: body.description || '',
        shortDesc: body.shortDesc || null,
        price: Number(body.price) || 0,
        originalPrice: body.originalPrice != null ? Number(body.originalPrice) : undefined,
        condition: body.condition || 'Good',
        categoryId: body.categoryId || '',
        images: typeof body.images === 'string' ? JSON.parse(body.images) : Array.isArray(body.images) ? body.images : [],
        stock: Number(body.stock) ?? 0,
        featured: body.featured ?? false,
        specs,
        brand: body.brand || null,
        warranty: body.warranty || '90 Days Warranty',
      })

      return NextResponse.json({ product }, { status: 201 })
    } catch (error) {
      console.error('Error creating product:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
  })
}

// PUT /api/admin/products - Update product
export async function PUT(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const body = await req.json()

      if (!body.id) {
        return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
      }

      // Prepare update payload — only include provided fields
      const updates: any = {}

      if (body.name !== undefined) {
        updates.name = body.name
        updates.slug = body.slug || body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }
      if (body.slug !== undefined) updates.slug = body.slug
      if (body.description !== undefined) updates.description = body.description
      if (body.shortDesc !== undefined) updates.shortDesc = body.shortDesc
      if (body.price !== undefined) updates.price = Number(body.price)
      if (body.originalPrice !== undefined) updates.originalPrice = body.originalPrice != null ? Number(body.originalPrice) : null
      if (body.condition !== undefined) updates.condition = body.condition
      if (body.categoryId !== undefined) updates.categoryId = body.categoryId
      if (body.images !== undefined) {
        updates.images = typeof body.images === 'string'
          ? body.images
          : Array.isArray(body.images)
            ? JSON.stringify(body.images)
            : body.images
      }
      if (body.stock !== undefined) updates.stock = Number(body.stock)
      if (body.rating !== undefined) updates.rating = body.rating
      if (body.reviewCount !== undefined) updates.reviewCount = body.reviewCount
      if (body.featured !== undefined) updates.featured = body.featured
      if (body.active !== undefined) updates.active = body.active
      if (body.specs !== undefined) {
        updates.specs = typeof body.specs === 'string'
          ? body.specs
          : JSON.stringify(body.specs)
      }
      if (body.brand !== undefined) updates.brand = body.brand
      if (body.warranty !== undefined) updates.warranty = body.warranty

      const updated = updateProduct(body.id, updates)

      if (!updated) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      return NextResponse.json({ product: updated })
    } catch (error) {
      console.error('Error updating product:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
  })
}

// DELETE /api/admin/products - Delete product
export async function DELETE(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
      }

      const success = deleteProduct(id)

      if (!success) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      return NextResponse.json({ message: 'Product deleted', success: true })
    } catch (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
  })
}
