import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const cartItems = await db.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ cartItems })
  } catch (error) {
    console.error('Error fetching cart items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart items' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, productId, quantity = 1 } = body

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'userId and productId are required' },
        { status: 400 }
      )
    }

    const qty = Math.max(1, parseInt(String(quantity), 10) || 1)

    // Check if product exists and has stock
    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Upsert: update quantity if item already in cart
    const existingItem = await db.cartItem.findFirst({
      where: { userId, productId },
    })

    let cartItem
    if (existingItem) {
      cartItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + qty },
        include: { product: true },
      })
    } else {
      cartItem = await db.cartItem.create({
        data: { userId, productId, quantity: qty },
        include: { product: true },
      })
    }

    return NextResponse.json({ cartItem }, { status: 201 })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cartItemId = searchParams.get('id')

    if (!cartItemId) {
      // If no id provided, clear entire cart for a user
      const userId = searchParams.get('userId')
      if (!userId) {
        return NextResponse.json(
          { error: 'id or userId is required' },
          { status: 400 }
        )
      }

      await db.cartItem.deleteMany({ where: { userId } })
      return NextResponse.json({ message: 'Cart cleared' })
    }

    await db.cartItem.delete({
      where: { id: cartItemId },
    })

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}
