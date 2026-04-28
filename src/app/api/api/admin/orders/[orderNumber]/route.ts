import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import { getOrderByNumber, updateOrderStatus, deleteOrderByNumber } from '@/lib/memory-store'

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
      const order = getOrderByNumber(orderNumber)

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

      const order = getOrderByNumber(orderNumber)
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

      const updated = updateOrderStatus(orderNumber, updates as { status?: string; paymentStatus?: string; notes?: string | null })
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
      const success = deleteOrderByNumber(orderNumber)

      if (!success) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      return NextResponse.json({ message: 'Order deleted successfully' })
    } catch (error) {
      console.error('Error deleting order:', error)
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
    }
  })
}
