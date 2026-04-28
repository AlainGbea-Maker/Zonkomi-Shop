import { NextResponse } from 'next/server'

// Cart is managed client-side via Zustand store.
// This API provides server echo/validation for cart operations.

export async function GET() {
  // Cart is client-side only
  return NextResponse.json({ cartItems: [] })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    // Return success - cart is managed client-side
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  return NextResponse.json({ message: 'Cart cleared' })
}
