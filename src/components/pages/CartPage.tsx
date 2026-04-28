'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCartStore, useAppStore, type Product } from '@/lib/store'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Shield, Truck, AlertTriangle, RefreshCw, Gift } from 'lucide-react'

function parseImages(images: string | null | undefined): string[] {
  if (!images) return []
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    if (Array.isArray(parsed)) return parsed
    if (typeof parsed === 'string') return [parsed]
    return []
  } catch {
    return []
  }
}

function isImageUrl(str: string): boolean {
  return str.startsWith('/images/') || str.startsWith('/uploads/') || str.startsWith('http://') || str.startsWith('https://')
}

function getProductEmoji(images: string | null | undefined, fallback = '📦'): string {
  const parsed = parseImages(images)
  for (const img of parsed) {
    if (!isImageUrl(img)) return img
  }
  return fallback
}

function getProductImage(images: string | null | undefined): string | null {
  const parsed = parseImages(images)
  return parsed.find(isImageUrl) || null
}

function ProductThumbnail({ images, name }: { images: string | null | undefined; name: string }) {
  const imgUrl = getProductImage(images)
  const emoji = getProductEmoji(images)

  return (
    <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gradient-to-br from-[#FCD116] to-[#D4AA00] flex items-center justify-center overflow-hidden">
      {imgUrl ? (
        <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-4xl md:text-5xl">{emoji}</span>
      )}
    </div>
  )
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
  const [syncing, setSyncing] = useState(false)
  const [removedIds, setRemovedIds] = useState<string[]>([])

  // Sync cart items with latest product data from the database
  useEffect(() => {
    if (items.length === 0) return

    const syncCart = async () => {
      setSyncing(true)
      try {
        const productIds = items.map(i => i.productId).join(',')
        const res = await fetch(`/api/products?limit=50`)
        const data = await res.json()
        const freshProducts: Product[] = data?.products || data || []
        const productMap = new Map(freshProducts.map((p: Product) => [p.id, p]))

        // Update cart items with fresh product data and remove inactive/out-of-stock items
        let hasChanges = false
        const toRemove: string[] = []

        items.forEach(item => {
          const fresh = productMap.get(item.productId)
          if (!fresh || !fresh.active) {
            toRemove.push(item.productId)
            hasChanges = true
          } else if (
            item.product &&
            (item.product.price !== fresh.price ||
             item.product.name !== fresh.name ||
             item.product.images !== fresh.images ||
             item.product.stock !== fresh.stock)
          ) {
            // Update the product data in the cart item
            useCartStore.setState(state => ({
              items: state.items.map(i =>
                i.productId === item.productId
                  ? { ...i, product: fresh, quantity: Math.min(i.quantity, fresh.stock) }
                  : i
              ),
            }))
            hasChanges = true
          }
        })

        if (toRemove.length > 0) {
          toRemove.forEach(id => useCartStore.getState().removeItem(id))
          setRemovedIds(toRemove)
        }
      } catch {
        // silently fail
      } finally {
        setSyncing(false)
      }
    }

    syncCart()
  }, []) // Only run once on mount

  const subtotal = getSubtotal()
  const tax = getTax()
  const shipping = getShipping()
  const total = getTotal()
  const itemCount = getItemCount()
  const freeShippingThreshold = 500
  const spinThreshold = 799
  const amountNeededForSpin = Math.max(0, spinThreshold - subtotal)
  const spinProgress = Math.min(100, (subtotal / spinThreshold) * 100)

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
      {/* Sync notification */}
      {removedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            {removedIds.length} {removedIds.length === 1 ? 'item' : 'items'} {removedIds.length === 1 ? 'was' : 'were'} removed from your cart because {removedIds.length === 1 ? 'it is' : 'they are'} no longer available.
          </p>
          <button onClick={() => setRemovedIds([])} className="text-amber-600 hover:text-amber-800 ml-auto flex-shrink-0">
            ×
          </button>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-sm text-gray-500 mt-1">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
        </div>
        <div className="flex items-center gap-2">
          {syncing && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Syncing...
            </span>
          )}
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
      </div>

      {/* Spin & Win promotion banner */}
      {subtotal > 0 && subtotal < spinThreshold && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-[#002B1B] to-[#004D2E] rounded-2xl text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FCD116]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FCD116]/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FCD116]/20 flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-[#FCD116]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">🎁 Unlock Spin & Win!</p>
              <p className="text-xs text-gray-300 mt-0.5">
                Add <span className="text-[#FCD116] font-bold">GH₵{amountNeededForSpin.toFixed(2)}</span> more for a chance to win up to <span className="text-[#FCD116] font-bold">20% off!</span>
              </p>
              <div className="mt-2 w-full bg-white/20 rounded-full h-2 max-w-xs">
                <div
                  className="bg-gradient-to-r from-[#FCD116] to-[#D4AA00] rounded-full h-2 transition-all duration-500"
                  style={{ width: `${spinProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{spinProgress.toFixed(0)}% of GH₵{spinThreshold}</p>
            </div>
            <button
              onClick={() => navigate('products')}
              className="px-4 py-2 bg-[#FCD116] hover:bg-[#D4AA00] text-[#002B1B] rounded-full text-xs font-bold transition-colors flex-shrink-0"
            >
              Shop More
            </button>
          </div>
        </motion.div>
      )}

      {/* Qualified for spin - celebration banner */}
      {subtotal >= spinThreshold && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-[#FCD116] to-[#D4AA00] rounded-2xl text-[#002B1B] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-[#002B1B]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">🎉 You qualify for Spin & Win!</p>
              <p className="text-xs text-[#002B1B]/70 mt-0.5">Click the gift button at the bottom-right to spin for exclusive discounts!</p>
            </div>
          </div>
        </motion.div>
      )}

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
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <ProductThumbnail images={item.product.images} name={item.product.name} />
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
