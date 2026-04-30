import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [productCount, userCount, orderCount, avgRating] = await Promise.all([
      db.product.count({ where: { active: true } }),
      db.user.count(),
      db.order.count(),
      db.product.aggregate({ _avg: { rating: true } }),
    ])

    return NextResponse.json({
      products: productCount,
      customers: userCount,
      orders: orderCount,
      avgRating: (avgRating._avg.rating || 4.0).toFixed(1),
    })
  } catch (error) {
    return NextResponse.json(
      { products: 0, customers: 0, orders: 0, avgRating: '4.0' },
      { status: 500 }
    )
  }
}
