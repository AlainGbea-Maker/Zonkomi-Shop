import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const TAX_RATE = 0.0833
const FREE_SHIPPING_THRESHOLD = 50
const SHIPPING_COST = 9.99

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const orders = await db.order.findMany({
      where: { userId },
      include: { orderItems: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      cartItems,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry = 'US',
      shippingPhone,
      paymentMethod = 'credit_card',
      notes,
    } = body

    if (!userId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'userId and cartItems are required' },
        { status: 400 }
      )
    }

    if (!shippingAddress || !shippingCity || !shippingState || !shippingZip) {
      return NextResponse.json(
        { error: 'Shipping address fields are required' },
        { status: 400 }
      )
    }

    // Validate stock for all items and build order items
    const orderItemsData: { productId: string; quantity: number; price: number; name: string; image: string | null }[] = []
    let subtotal = 0

    for (const item of cartItems) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}". Available: ${product.stock}` },
          { status: 400 }
        )
      }

      const itemTotal = product.price * item.quantity
      subtotal += itemTotal

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        name: product.name,
        image: product.images ? JSON.parse(product.images)[0] : null,
      })
    }

    // Calculate tax and shipping
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
    const total = Math.round((subtotal + tax + shipping) * 100) / 100

    // Generate unique order number
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const orderNumber = `ZDO-${timestamp}-${random}`

    // Create the order with items in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          shipping,
          tax,
          total,
          shippingAddress,
          shippingCity,
          shippingState,
          shippingZip,
          shippingCountry,
          shippingPhone,
          paymentMethod,
          paymentStatus: 'paid',
          status: 'confirmed',
          notes,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: { orderItems: true },
      })

      // Decrease stock for each product
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // Clear user's cart
      await tx.cartItem.deleteMany({ where: { userId } })

      return newOrder
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
