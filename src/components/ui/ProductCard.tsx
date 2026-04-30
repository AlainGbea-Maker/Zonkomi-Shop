'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Eye, Minus, Plus, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore, useCartStore, type Product } from '@/lib/store'
import StarRating from '@/components/ui/StarRating'

const gradients = [
  'product-gradient-1',
  'product-gradient-2',
  'product-gradient-3',
  'product-gradient-4',
  'product-gradient-5',
  'product-gradient-6',
  'product-gradient-7',
  'product-gradient-8',
]

function parseImages(images: string | null | undefined): string[] {
  if (!images) return []
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    if (Array.isArray(parsed)) return parsed
    if (typeof parsed === 'string') return [parsed]
    return []
  } catch {
    return [images]
  }
}

function isImageUrl(str: string): boolean {
  return str.startsWith('/images/') || str.startsWith('/uploads/') || str.startsWith('http://') || str.startsWith('https://')
}

function getEmojiFallback(images: string | null | undefined, fallback = '📦'): string {
  const parsed = parseImages(images)
  for (const img of parsed) {
    if (!isImageUrl(img)) return img
  }
  return fallback
}

function getGradient(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function getConditionColor(condition: string) {
  switch (condition.toLowerCase()) {
    case 'excellent':
      return 'bg-emerald-100 text-emerald-800'
    case 'good':
      return 'bg-blue-100 text-blue-800'
    case 'fair':
      return 'bg-amber-100 text-amber-800'
    case 'like new':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getDiscount(price: number, originalPrice: number | null) {
  if (!originalPrice || originalPrice <= price) return 0
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { navigate } = useAppStore()
  const { addItem } = useCartStore()
  const discount = getDiscount(product.price, product.originalPrice)

  // Quick view state
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [qvProduct, setQvProduct] = useState<Product | null>(null)
  const [qvLoading, setQvLoading] = useState(false)
  const [qvQuantity, setQvQuantity] = useState(1)

  const handleClick = () => {
    navigate('product-detail', { productId: product.id })
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
  }

  const handleQuickView = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setQuickViewOpen(true)
    setQvQuantity(1)

    // If we already have the full product data (from card), use it directly
    // Otherwise fetch it
    if (product.description && product.description.length > 50) {
      setQvProduct(product)
      return
    }

    setQvLoading(true)
    try {
      const res = await fetch(`/api/products/${product.id}`)
      if (res.ok) {
        const data = await res.json()
        setQvProduct(data?.product || data)
      } else {
        // Fallback to what we have from the card
        setQvProduct(product)
      }
    } catch {
      setQvProduct(product)
    } finally {
      setQvLoading(false)
    }
  }

  const handleQvAddToCart = () => {
    if (qvProduct) {
      addItem(qvProduct, qvQuantity)
      setQuickViewOpen(false)
    }
  }

  const handleQvViewFull = () => {
    setQuickViewOpen(false)
    navigate('product-detail', { productId: product.id })
  }

  const qvDiscount = qvProduct ? getDiscount(qvProduct.price, qvProduct.originalPrice) : 0

  return (
    <>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className="group cursor-pointer border-gray-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full"
          onClick={handleClick}
        >
          <CardContent className="p-0">
            {/* Product Image */}
            <div
              className={`relative w-full aspect-square ${getGradient(product.id)} flex items-center justify-center overflow-hidden`}
            >
              {(() => {
                const imgs = parseImages(product.images)
                const realImg = imgs.find(isImageUrl)
                if (realImg) {
                  return (
                    <img
                      src={realImg}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )
                }
                return <span className="text-5xl md:text-6xl">{getEmojiFallback(product.images)}</span>
              })()}
              {discount > 0 && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5">
                  -{discount}%
                </Badge>
              )}
              {product.stock <= 3 && product.stock > 0 && (
                <Badge className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5">
                  Only {product.stock} left
                </Badge>
              )}
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Badge className="bg-gray-800 text-white text-sm">Out of Stock</Badge>
                </div>
              )}

              {/* Quick View overlay button on hover */}
              <button
                onClick={handleQuickView}
                className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs font-medium py-2 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
              >
                <Eye className="w-3.5 h-3.5" />
                Quick View
              </button>
            </div>

            {/* Product Info */}
            <div className="p-3 md:p-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1.5 py-0 ${getConditionColor(product.condition)}`}
                >
                  {product.condition}
                </Badge>
                {product.brand && (
                  <span className="text-[10px] text-gray-500 truncate">{product.brand}</span>
                )}
              </div>

              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-[#C59F00] transition-colors">
                {product.name}
              </h3>

              <StarRating rating={product.rating} size="sm" showValue count={product.reviewCount} />

              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-bold text-[#C59F00]">
                  GH₵{product.price.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-gray-400 line-through">
                    GH₵{product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Button
                  size="sm"
                  className="flex-1 bg-[#FCD116] hover:bg-[#D4AA00] text-[#1a1a1a] border border-[#D4AA00] rounded-full text-xs font-medium h-8"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                  Add to Cart
                </Button>
                {/* Mobile quick view button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 rounded-full border-gray-200 flex-shrink-0 md:hidden"
                  onClick={handleQuickView}
                  aria-label="Quick view"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick View Dialog */}
      <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <DialogContent className="sm:max-w-2xl p-0 gap-0 max-h-[90vh] overflow-hidden">
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          <DialogDescription className="sr-only">Quick view of {product.name}</DialogDescription>

          <ScrollArea className="max-h-[90vh]">
            {qvLoading ? (
              /* Loading skeleton */
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
                  <div className="space-y-4">
                    <div className="h-5 bg-gray-100 rounded w-1/4 animate-pulse" />
                    <div className="h-6 bg-gray-100 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                    <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
                    <div className="h-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ) : qvProduct ? (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Image */}
                  <div className={`aspect-square rounded-xl ${getGradient(qvProduct.id)} flex items-center justify-center overflow-hidden`}>
                    {(() => {
                      const imgs = parseImages(qvProduct.images)
                      const realImg = imgs.find(isImageUrl)
                      if (realImg) {
                        return (
                          <img
                            src={realImg}
                            alt={qvProduct.name}
                            className="w-full h-full object-cover rounded-xl"
                            loading="lazy"
                          />
                        )
                      }
                      return <span className="text-7xl md:text-8xl">{getEmojiFallback(qvProduct.images)}</span>
                    })()}
                    {qvDiscount > 0 && (
                      <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold">
                        -{qvDiscount}%
                      </Badge>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Condition, Brand, SKU */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getConditionColor(qvProduct.condition)} text-[10px] px-1.5 py-0.5`}>
                          {qvProduct.condition}
                        </Badge>
                        {qvProduct.brand && (
                          <span className="text-xs text-gray-500">by <span className="font-medium text-gray-700">{qvProduct.brand}</span></span>
                        )}
                        {qvProduct.sku && (
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{qvProduct.sku}</span>
                        )}
                      </div>

                      {/* Name */}
                      <h2 className="text-lg font-bold text-gray-900 leading-snug">
                        {qvProduct.name}
                      </h2>

                      {/* Rating */}
                      <StarRating rating={qvProduct.rating} size="sm" showValue count={qvProduct.reviewCount} />

                      <Separator />

                      {/* Price */}
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-[#C59F00]">
                            GH₵{qvProduct.price.toFixed(2)}
                          </span>
                          {qvProduct.originalPrice && qvProduct.originalPrice > qvProduct.price && (
                            <span className="text-sm text-gray-400 line-through">
                              GH₵{qvProduct.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {qvDiscount > 0 && (
                          <Badge className="mt-1 bg-red-500 text-white text-[10px]">
                            Save {qvDiscount}%
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      {qvProduct.shortDesc && (
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                          {qvProduct.shortDesc}
                        </p>
                      )}

                      {/* Stock */}
                      <div>
                        {qvProduct.stock > 0 ? (
                          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            {qvProduct.stock <= 5
                              ? `Only ${qvProduct.stock} left in stock`
                              : 'In Stock'}
                          </p>
                        ) : (
                          <p className="text-xs text-red-600 font-medium">Out of Stock</p>
                        )}
                      </div>

                      {/* Quantity Selector */}
                      {qvProduct.stock > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">Qty:</span>
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button
                              onClick={() => setQvQuantity((q) => Math.max(1, q - 1))}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 h-8 flex items-center justify-center text-sm font-medium border-x">
                              {qvQuantity}
                            </span>
                            <button
                              onClick={() => setQvQuantity((q) => Math.min(qvProduct.stock, q + 1))}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-3">
                      <Button
                        className="w-full bg-[#FCD116] hover:bg-[#D4AA00] text-[#1a1a1a] border border-[#D4AA00] rounded-full h-11 text-sm font-semibold"
                        onClick={handleQvAddToCart}
                        disabled={qvProduct.stock === 0}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-[#002B1B] text-[#002B1B] hover:bg-[#002B1B] hover:text-white rounded-full h-10 text-sm font-medium"
                        onClick={handleQvViewFull}
                      >
                        View Full Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
