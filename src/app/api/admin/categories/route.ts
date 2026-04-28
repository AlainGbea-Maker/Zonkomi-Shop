import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { getCategoriesWithCount, allCategories } from '@/lib/memory-store'

// GET /api/admin/categories - List all categories
export async function GET(request: Request) {
  return withAdmin(request as any, async () => {
    try {
      const categories = getCategoriesWithCount()
      return NextResponse.json({ categories })
    } catch (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
  })
}

// POST /api/admin/categories - Create category (in-memory)
export async function POST(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const body = await req.json()
      const { name } = body

      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return NextResponse.json({ category: { id: `cat-${slug}`, name, slug, ...body }, message: 'Category created (in-memory on Vercel)' }, { status: 201 })
    } catch (error) {
      console.error('Error creating category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
  })
}

// PUT /api/admin/categories - Update category
export async function PUT(request: Request) {
  return withAdmin(request as any, async () => {
    return NextResponse.json({ message: 'Category updated (in-memory on Vercel)' })
  })
}

// DELETE /api/admin/categories - Delete category
export async function DELETE() {
  return NextResponse.json({ message: 'Category deleted (in-memory on Vercel)' })
}
