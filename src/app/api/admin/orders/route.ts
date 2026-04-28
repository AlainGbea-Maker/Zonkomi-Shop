import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { getAllOrders } from '@/lib/memory-store'

// GET /api/admin/orders - List all orders with filters
export async function GET(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const status = searchParams.get('status') || undefined
      const paymentStatus = searchParams.get('paymentStatus') || undefined
      const search = searchParams.get('search') || undefined
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

      const result = getAllOrders({ status, paymentStatus, search, page, limit })
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching admin orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
  })
}
