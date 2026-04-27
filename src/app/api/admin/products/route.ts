import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { db } from '@/lib/db'

// GET /api/admin/products - List all products (admin)
export async function GET(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
      const search = searchParams.get('search')
      const category = searchParams.get('category')
      const status = searchParams.get('status')
      const sort = searchParams.get('sort') || 'createdAt'
      const order = searchParams.get('order') || 'desc'

      const skip = (page - 1) * limit
      const where: Record<string, unknown> = {}

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { slug: { contains: search } },
          { brand: { contains: search } },
        ]
      }
      if (category) where.categoryId = category
      if (status === 'active') where.active = true
      if (status === 'inactive') where.active = false

      const orderBy: Record<string, string> = {}
      orderBy[sort] = order

      const [products, total] = await Promise.all([
        db.product.findMany({
          where,
          include: { category: { select: { id: true, name: true } } },
          orderBy,
          skip,
          take: limit,
        }),
        db.product.count({ where }),
      ])

      return NextResponse.json({
        products,
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
      const {
        name, description, shortDesc, price, originalPrice,
        condition, categoryId, images, stock, featured,
        specs, brand, warranty, slug,
      } = body

      if (!name || !categoryId || price === undefined) {
        return NextResponse.json(
          { error: 'Name, categoryId, and price are required' },
          { status: 400 }
        )
      }

      // Auto-generate slug if not provided
      const productSlug = slug || name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36)

      const product = await db.product.create({
        data: {
          name,
          slug: productSlug,
          description: description || '',
          shortDesc,
          price: parseFloat(price),
          originalPrice: originalPrice ? parseFloat(originalPrice) : null,
          condition: condition || 'Refurbished',
          categoryId,
          images: typeof images === 'string' ? images : JSON.stringify(images || []),
          stock: parseInt(stock) || 0,
          featured: featured || false,
          specs: typeof specs === 'string' ? specs : JSON.stringify(specs || {}),
          brand,
          warranty: warranty || '90 Days Warranty',
        },
        include: { category: true },
      })

      return NextResponse.json({ product }, { status: 201 })
    } catch (error: any) {
      console.error('Error creating product:', error)
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Product slug already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
  })
}

// PUT /api/admin/products - Update product
export async function PUT(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const body = await req.json()
      const { id, ...data } = body

      if (!id) {
        return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
      }

      // Parse JSON fields if they're objects
      if (data.images && typeof data.images !== 'string') {
        data.images = JSON.stringify(data.images)
      }
      if (data.specs && typeof data.specs !== 'string') {
        data.specs = JSON.stringify(data.specs)
      }
      if (data.price !== undefined) data.price = parseFloat(data.price)
      if (data.originalPrice !== undefined) data.originalPrice = data.originalPrice ? parseFloat(data.originalPrice) : null
      if (data.stock !== undefined) data.stock = parseInt(data.stock)

      const product = await db.product.update({
        where: { id },
        data,
        include: { category: true },
      })

      return NextResponse.json({ product })
    } catch (error: any) {
      console.error('Error updating product:', error)
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
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

      await db.product.delete({ where: { id } })
      return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error: any) {
      console.error('Error deleting product:', error)
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
  })
}
