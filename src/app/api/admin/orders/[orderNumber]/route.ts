import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { db } from '@/lib/db'

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed']

// GET /api/admin/orders/[orderNumber] - Get order detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  return withAdmin(request as any, async () => {
    try {
      const { orderNumber } = await params
      const order = await db.order.findUnique({
        where: { orderNumber },
        include: {
          orderItems: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      })

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      return NextResponse.json({ order })
    } catch (error) {
      console.error('Error fetching order:', error)
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }
  })
}

// PATCH /api/admin/orders/[orderNumber] - Update order status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  return withAdmin(request as any, async (req) => {
    try {
      const { orderNumber } = await params
      const body = await req.json()
      const { status, paymentStatus, notes } = body

      const order = await db.order.findUnique({ where: { orderNumber } })
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      const updates: Record<string, unknown> = {}

      if (status) {
        if (!VALID_STATUSES.includes(status)) {
          return NextResponse.json(
            { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
            { status: 400 }
          )
        }
        updates.status = status

        // If cancelling, restore stock
        if (status === 'cancelled' && order.status !== 'cancelled') {
          const orderItems = await db.orderItem.findMany({ where: { orderId: order.id } })
          for (const item of orderItems) {
            await db.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            })
          }
          updates.paymentStatus = 'refunded'
        }
      }

      if (paymentStatus) {
        if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
          return NextResponse.json(
            { error: `Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}` },
            { status: 400 }
          )
        }
        updates.paymentStatus = paymentStatus
      }

      if (notes !== undefined) updates.notes = notes

      const updated = await db.order.update({
        where: { orderNumber },
        data: updates,
        include: { orderItems: true },
      })

      return NextResponse.json({ order: updated })
    } catch (error) {
      console.error('Error updating order:', error)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }
  })
}

// DELETE /api/admin/orders/[orderNumber] - Delete order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  return withAdmin(request as any, async () => {
    try {
      const { orderNumber } = await params

      const order = await db.order.findUnique({ where: { orderNumber } })
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // Restore stock and delete
      await db.$transaction(async (tx) => {
        if (order.status !== 'cancelled') {
          const orderItems = await tx.orderItem.findMany({ where: { orderId: order.id } })
          for (const item of orderItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            })
          }
        }
        await tx.order.delete({ where: { orderNumber } })
      })

      return NextResponse.json({ message: 'Order deleted successfully' })
    } catch (error) {
      console.error('Error deleting order:', error)
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
    }
  })
}
