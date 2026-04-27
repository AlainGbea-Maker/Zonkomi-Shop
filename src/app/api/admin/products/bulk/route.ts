import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { db } from '@/lib/db'

// POST /api/admin/products/bulk - Bulk update products (toggle active, update stock, delete)
export async function POST(request: Request) {
  return withAdmin(request as any, async (req) => {
    try {
      const body = await req.json()
      const { action, productIds, data } = body

      if (!action || !productIds || !Array.isArray(productIds)) {
        return NextResponse.json(
          { error: 'Action and productIds array are required' },
          { status: 400 }
        )
      }

      let result

      switch (action) {
        case 'activate':
          result = await db.product.updateMany({
            where: { id: { in: productIds } },
            data: { active: true },
          })
          break

        case 'deactivate':
          result = await db.product.updateMany({
            where: { id: { in: productIds } },
            data: { active: false },
          })
          break

        case 'feature':
          result = await db.product.updateMany({
            where: { id: { in: productIds } },
            data: { featured: true },
          })
          break

        case 'unfeature':
          result = await db.product.updateMany({
            where: { id: { in: productIds } },
            data: { featured: false },
          })
          break

        case 'delete':
          // Delete in transaction to handle foreign keys
          await db.$transaction(async (tx) => {
            await tx.orderItem.deleteMany({ where: { productId: { in: productIds } } })
            await tx.cartItem.deleteMany({ where: { productId: { in: productIds } } })
            await tx.review.deleteMany({ where: { productId: { in: productIds } } })
            await tx.wishlist.deleteMany({ where: { productId: { in: productIds } } })
            result = await tx.product.deleteMany({ where: { id: { in: productIds } } })
          })
          break

        case 'updateStock':
          if (!data || data.stock === undefined) {
            return NextResponse.json({ error: 'Stock value required for update' }, { status: 400 })
          }
          result = await db.product.updateMany({
            where: { id: { in: productIds } },
            data: { stock: parseInt(data.stock) },
          })
          break

        default:
          return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
      }

      return NextResponse.json({
        message: `Bulk ${action} completed`,
        count: result?.count || productIds.length,
      })
    } catch (error) {
      console.error('Error in bulk operation:', error)
      return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 })
    }
  })
}
