import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { adjustStock, getInventoryHistory } from '@/lib/memory-store'

// GET /api/admin/inventory — Get inventory history
export async function GET(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const productId = searchParams.get('productId') || undefined
      const type = searchParams.get('type') || undefined
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
      const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

      const result = getInventoryHistory({ productId, type, limit, offset })

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching inventory history:', error)
      return NextResponse.json({ error: 'Failed to fetch inventory history' }, { status: 500 })
    }
  })
}

// POST /api/admin/inventory — Adjust stock
export async function POST(request: Request) {
  return withAdmin(request as any, async (req, payload) => {
    try {
      const body = await req.json()

      if (!body.productId) {
        return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
      }
      if (body.quantity === undefined || body.quantity === null) {
        return NextResponse.json({ error: 'Quantity is required' }, { status: 400 })
      }

      const quantity = Number(body.quantity)
      if (isNaN(quantity)) {
        return NextResponse.json({ error: 'Quantity must be a valid number' }, { status: 400 })
      }

      const performedBy = payload.email || 'admin'
      const reason = body.reason || (quantity > 0 ? 'Manual restock' : 'Manual reduction')

      const result = adjustStock(body.productId, quantity, reason, performedBy)

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to adjust stock' }, { status: 400 })
      }

      return NextResponse.json({ transaction: result.transaction })
    } catch (error) {
      console.error('Error adjusting stock:', error)
      return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 })
    }
  })
}
