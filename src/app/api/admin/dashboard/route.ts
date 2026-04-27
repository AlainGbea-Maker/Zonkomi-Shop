import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { db } from '@/lib/db'

// GET /api/admin/dashboard - Dashboard stats
export async function GET(request: Request) {
  return withAdmin(request as any, async () => {
    try {
      const [
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        pendingOrders,
        recentOrders,
        topProducts,
        ordersByStatus,
        revenueByMonth,
      ] = await Promise.all([
        // Total active products
        db.product.count({ where: { active: true } }),
        // Total orders
        db.order.count(),
        // Total users
        db.user.count(),
        // Total revenue
        db.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid' } }),
        // Pending orders
        db.order.count({ where: { status: 'pending' } }),
        // Recent 10 orders
        db.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { orderItems: true },
        }),
        // Top 5 selling products
        db.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
        // Orders grouped by status
        db.order.groupBy({
          by: ['status'],
          _count: true,
        }),
        // Revenue last 6 months
        db.$queryRaw`
          SELECT 
            strftime('%Y-%m', createdAt) as month,
            SUM(total) as revenue,
            COUNT(*) as orders
          FROM "Order"
          WHERE createdAt >= datetime('now', '-6 months')
          GROUP BY strftime('%Y-%m', createdAt)
          ORDER BY month DESC
        `,
      ])

      // Enrich top products with names
      const topProductIds = topProducts.map(p => p.productId)
      const productDetails = topProductIds.length > 0
        ? await db.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, name: true, images: true },
          })
        : []

      const topProductsWithDetails = topProducts.map(tp => {
        const detail = productDetails.find(p => p.id === tp.productId)
        return {
          productId: tp.productId,
          name: detail?.name || 'Unknown',
          image: detail?.images || '[]',
          totalSold: tp._sum.quantity || 0,
        }
      })

      return NextResponse.json({
        stats: {
          totalProducts,
          totalOrders,
          totalUsers,
          totalRevenue: totalRevenue._sum.total || 0,
          pendingOrders,
          lowStockProducts: 0, // Will be calculated below
        },
        lowStockProducts: 0, // placeholder
        recentOrders,
        topProducts: topProductsWithDetails,
        ordersByStatus: ordersByStatus.map(s => ({ status: s.status, count: s._count })),
        revenueByMonth,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
  })
}
