import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { db } from '@/lib/db'

// GET /api/admin/orders - List all orders with filters
export async function GET(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
      const status = searchParams.get('status')
      const paymentStatus = searchParams.get('paymentStatus')
      const search = searchParams.get('search')
      const dateFrom = searchParams.get('dateFrom')
      const dateTo = searchParams.get('dateTo')
      const sort = searchParams.get('sort') || 'createdAt'
      const order = searchParams.get('order') || 'desc'

      const skip = (page - 1) * limit
      const where: Record<string, unknown> = {}

      if (status) where.status = status
      if (paymentStatus) where.paymentStatus = paymentStatus
      if (search) {
        where.OR = [
          { orderNumber: { contains: search } },
          { shippingAddress: { contains: search } },
          { shippingCity: { contains: search } },
        ]
      }
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
        if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo)
      }

      const orderBy: Record<string, string> = {}
      orderBy[sort] = order

      const [orders, total] = await Promise.all([
        db.order.findMany({
          where,
          include: {
            orderItems: true,
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy,
          skip,
          take: limit,
        }),
        db.order.count({ where }),
      ])

      // Aggregate stats
      const [revenueSum, orderCount] = await Promise.all([
        db.order.aggregate({ _sum: { total: true }, where }),
        db.order.count({ where }),
      ])

      return NextResponse.json({
        orders,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: {
          totalRevenue: revenueSum._sum.total || 0,
          totalOrders: orderCount,
        },
      })
    } catch (error) {
      console.error('Error fetching admin orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
  })
}
