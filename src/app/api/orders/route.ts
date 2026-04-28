import { NextResponse } from 'next/server'
import { getOrdersByUser, createOrder } from '@/lib/memory-store'

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

    const orders = getOrdersByUser(userId)
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
      shippingCountry = 'GH',
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

    const order = createOrder({
      userId,
      cartItems,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      shippingPhone,
      paymentMethod,
      notes,
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
