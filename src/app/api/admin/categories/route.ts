import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { db } from '@/lib/db'

// GET /api/admin/categories - List all categories
export async function GET(request: Request) {
  return withAdmin(request as any, async () => {
    try {
      const categories = await db.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      })
      return NextResponse.json({ categories })
    } catch (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
  })
}

// POST /api/admin/categories - Create category
export async function POST(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const body = await req.json()
      const { name, description, image, sortOrder, active } = body

      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const category = await db.category.create({
        data: {
          name,
          slug,
          description,
          image,
          sortOrder: sortOrder || 0,
          active: active !== false,
        },
      })

      return NextResponse.json({ category }, { status: 201 })
    } catch (error: any) {
      console.error('Error creating category:', error)
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
  })
}

// PUT /api/admin/categories - Update category
export async function PUT(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const body = await req.json()
      const { id, ...data } = body

      if (!id) {
        return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
      }

      // Auto-update slug if name changed
      if (data.name) {
        data.slug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      }

      const category = await db.category.update({
        where: { id },
        data,
        include: { _count: { select: { products: true } } },
      })

      return NextResponse.json({ category })
    } catch (error: any) {
      console.error('Error updating category:', error)
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }
  })
}

// DELETE /api/admin/categories - Delete category
export async function DELETE(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
      }

      // Check if category has products
      const productCount = await db.product.count({ where: { categoryId: id } })
      if (productCount > 0) {
        return NextResponse.json(
          { error: `Cannot delete category with ${productCount} products. Move or delete products first.` },
          { status: 400 }
        )
      }

      await db.category.delete({ where: { id } })
      return NextResponse.json({ message: 'Category deleted successfully' })
    } catch (error: any) {
      console.error('Error deleting category:', error)
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }
  })
}
