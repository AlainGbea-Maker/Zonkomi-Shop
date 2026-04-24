'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCartStore, useAppStore } from '@/lib/store'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Shield, Truck } from 'lucide-react'

function getProductEmoji(images: string | null | undefined, fallback = '📦'): string {
  if (!images) return fallback
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
    if (typeof parsed === 'string') return parsed
    return fallback
  } catch {
    return images || fallback
  }
}

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
    getTax,
    getShipping,
    getTotal,
    clearCart,
    getItemCount,
  } = useCartStore()
  const { navigate } = useAppStore()

  const subtotal = getSubtotal()
  const tax = getTax()
  const shipping = getShipping()
  const total = getTotal()
  const itemCount = getItemCount()
  const freeShippingThreshold = 500

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h1>
          <p className="text-gray-500 mb-8">
            Looks like you haven&apos;t added any items to your cart yet.
            Start shopping to find great deals!
          </p>
          <Button
            className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full px-8"
            onClick={() => navigate('products')}
          >
            Continue Shopping
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-sm text-gray-500 mt-1">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={clearCart}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {items.map((item, index) => {
              if (!item.product) return null
              const lineTotal = item.product.price * item.quantity
              const discount = item.product.originalPrice
                ? Math.round(((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100)
                : 0

              return (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-gray-200 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex gap-4 p-4">
                        {/* Product Image */}
                        <button
                          onClick={() => navigate('product-detail', { productId: item.product!.id })}
                          className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gradient-to-br from-[#FCD116] to-[#D4AA00] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <span className="text-4xl md:text-5xl">{getProductEmoji(item.product.images)}</span>
                        </button>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <button
                                onClick={() => navigate('product-detail', { productId: item.product!.id })}
                                className="text-sm md:text-base font-medium text-gray-900 hover:text-[#C59F00] transition-colors line-clamp-2 text-left"
                              >
                                {item.product.name}
                              </button>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{item.product.condition}</span>
                                {item.product.brand && (
                                  <>
                                    <span className="text-xs text-gray-300">•</span>
                                    <span className="text-xs text-gray-500">{item.product.brand}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 h-8 w-8"
                              onClick={() => removeItem(item.productId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex items-end justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border rounded-lg overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-10 h-8 flex items-center justify-center text-sm font-medium border-x bg-gray-50">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.productId,
                                      Math.min(item.quantity + 1, item.product!.stock)
                                    )
                                  }
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-xs text-gray-500 hidden sm:block">
                                Max: {item.product.stock}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-[#C59F00]">
                                GH₵{lineTotal.toFixed(2)}
                              </p>
                              {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                <p className="text-xs text-gray-400">
                                  GH₵{(item.product.originalPrice * item.quantity).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          <Button
            variant="outline"
            className="text-[#C59F00] border-[#FCD116]/30 hover:bg-yellow-50 mt-4"
            onClick={() => navigate('products')}
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Continue Shopping
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-40 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                  <span className="font-medium">GH₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                    {shipping === 0 ? 'FREE' : `GH₵{shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Tax</span>
                  <span className="font-medium">GH₵{tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Free shipping progress */}
              {subtotal < freeShippingThreshold && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-700 mb-2">
                    Add <span className="font-bold">GH₵{(freeShippingThreshold - subtotal).toFixed(2)}</span> more for free shipping!
                  </p>
                  <div className="w-full bg-yellow-200 rounded-full h-1.5">
                    <div
                      className="bg-[#FCD116] rounded-full h-1.5 transition-all duration-300"
                      style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-[#C59F00]">GH₵{total.toFixed(2)}</span>
              </div>

              <Button
                className="w-full bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full h-12 font-semibold text-sm"
                onClick={() => navigate('checkout')}
              >
                Proceed to Checkout
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Secure
                </div>
                <div className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  Free Shipping GH₵ 500+
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
