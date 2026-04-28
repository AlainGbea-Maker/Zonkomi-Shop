import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { getInventorySummary } from '@/lib/memory-store'

// GET /api/admin/inventory/summary — Get inventory summary stats
export async function GET(request: Request) {
  return withAdmin(request as any, async () => {
    try {
      const summary = getInventorySummary()
      return NextResponse.json(summary)
    } catch (error) {
      console.error('Error fetching inventory summary:', error)
      return NextResponse.json({ error: 'Failed to fetch inventory summary' }, { status: 500 })
    }
  })
}
