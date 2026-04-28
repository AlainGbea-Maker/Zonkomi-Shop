import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { getDashboardStats, allProducts, getAllOrders } from '@/lib/memory-store'

// GET /api/admin/dashboard - Dashboard stats
export async function GET(request: Request) {
  return withAdmin(request as any, async () => {
    try {
      const dashboard = getDashboardStats()
      return NextResponse.json(dashboard)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
  })
}
