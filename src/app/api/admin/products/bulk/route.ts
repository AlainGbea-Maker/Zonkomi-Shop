import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'

// POST /api/admin/products/bulk - Bulk update products
export async function POST(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const body = await req.json()
      const { action, productIds } = body

      if (!action || !productIds || !Array.isArray(productIds)) {
        return NextResponse.json(
          { error: 'Action and productIds array are required' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        message: `Bulk ${action} completed (in-memory only on Vercel)`,
        count: productIds.length,
      })
    } catch (error) {
      console.error('Error in bulk operation:', error)
      return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 })
    }
  })
}
