'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { useAppStore, useCartStore, type Product } from '@/lib/store'
import StarRating from '@/components/ui/StarRating'
import ProductCard from '@/components/ui/ProductCard'
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Shield,
  Truck,
  RotateCcw,
  Package,
  Gift,
} from 'lucide-react'

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
  return str.startsWith('/uploads/') || str.startsWith('http://') || str.startsWith('https://')
}

function getEmojiFallback(images: string | null | undefined, fallback = '📦'): string {
  const parsed = parseImages(images)
  for (const img of parsed) {
    if (!isImageUrl(img)) return img
  }
  return fallback
}

export default function ProductDetailPage() {
  const { selectedProductId, navigate } = useAppStore()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (!selectedProductId) {
      navigate('products')
      return
    }
    let cancelled = false
    fetch(`/api/products/${selectedProductId}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setProduct(data?.product || data)
        setQuantity(1)
        setRelatedProducts([])
        if (data?.product?.categoryId) {
          fetch(`/api/products?categoryId=${data.product.categoryId}&limit=4`)
            .then((r) => r.json())
            .then((rd) => {
              if (cancelled) return
              const prods = rd?.products || rd || []
              setRelatedProducts(prods.filter((p: Product) => p.id !== (data?.product?.id || data?.id)).slice(0, 4))
            })
            .catch(() => {})
        }
      })
      .catch(() => {
        if (!cancelled) navigate('products')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedProductId, navigate])

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity)
    }
  }

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity)
      navigate('checkout')
    }
  }

  const getDiscount = () => {
    if (!product?.originalPrice || product.originalPrice <= product.price) return 0
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  }

  const getSavings = () => {
    if (!product?.originalPrice || product.originalPrice <= product.price) return 0
    return (product.originalPrice - product.price).toFixed(2)
  }

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'bg-emerald-100 text-emerald-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'fair': return 'bg-amber-100 text-amber-800'
      case 'like new': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <Skeleton className="h-4 w-20 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  const specs = (() => {
    try {
      return typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs || {}
    } catch {
      return {}
    }
  })()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('products')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#C59F00] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden border-gray-200">
            <CardContent className="p-0">
              <div className="aspect-square bg-gradient-to-br from-[#FCD116] to-[#D4AA00] flex items-center justify-center p-12 overflow-hidden">
                {(() => {
                  const imgs = parseImages(product.images)
                  const realImg = imgs.find(isImageUrl)
                  if (realImg) {
                    return (
                      <img
                        src={realImg}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    )
                  }
                  return <span className="text-[120px] md:text-[160px] drop-shadow-lg">{getEmojiFallback(product.images)}</span>
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="space-y-4">
            {/* Condition & Brand */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${getConditionColor(product.condition)} text-xs px-2 py-1`}>
                {product.condition}
              </Badge>
              {product.brand && (
                <span className="text-sm text-gray-500">by <span className="font-medium text-gray-700">{product.brand}</span></span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <StarRating rating={product.rating} size="md" showValue />
              <span className="text-sm text-gray-500">
                ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            <Separator />

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-bold text-[#C59F00]">
                  GH₵{product.price.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xl text-gray-400 line-through">
                    GH₵{product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {getDiscount() > 0 && (
                <div className="mt-1 flex items-center gap-2">
                  <Badge className="bg-red-500 text-white text-xs">
                    Save {getDiscount()}%
                  </Badge>
                  <span className="text-sm text-green-600 font-medium">
                    You save GH₵${getSavings()}
                  </span>
                </div>
              )}
            </div>

            {/* Short description */}
            {product.shortDesc && (
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.shortDesc}
              </p>
            )}

            <Separator />

            {/* Warranty Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs font-semibold text-green-800">Warranty</p>
                  <p className="text-xs text-green-600">{product.warranty || '90-Day Warranty'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-blue-800">Returns</p>
                  <p className="text-xs text-blue-600">30-Day Free Returns</p>
                </div>
              </div>
            </div>

            {/* Stock */}
            <div>
              {product.stock > 0 ? (
                <p className="text-sm text-green-600 font-medium">
                  {product.stock <= 5 ? `Only ${product.stock} left in stock - order soon!` : 'In Stock'}
                </p>
              ) : (
                <p className="text-sm text-red-600 font-medium">Out of Stock</p>
              )}
            </div>

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center text-sm font-medium border-x">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                size="lg"
                className="flex-1 bg-[#FCD116] hover:bg-[#D4AA00] text-[#1a1a1a] border border-[#D4AA00] rounded-full h-12 text-sm font-semibold"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full h-12 text-sm font-semibold"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                <Zap className="w-5 h-5 mr-2" />
                Buy Now
              </Button>
            </div>

            {/* Spin & Win CTA */}
            <div className="p-3 bg-gradient-to-r from-[#002B1B] to-[#004D2E] rounded-xl border border-[#FCD116]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FCD116]/20 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-[#FCD116]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Spin & Win up to 20% Off!</p>
                  <p className="text-xs text-gray-400">Add GH₵799+ to your cart to unlock</p>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Truck className="w-4 h-4" />
              Free shipping on orders over GH₵ 500
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs: Description, Specs, Reviews */}
      <div className="mt-10">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FCD116] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-[#C59F00] pb-3 px-4"
            >
              Description
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FCD116] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-[#C59F00] pb-3 px-4"
            >
              Specifications
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FCD116] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-500 data-[state=active]:text-[#C59F00] pb-3 px-4"
            >
              Reviews ({product.reviewCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {Object.keys(specs).length > 0 ? (
                  <Table>
                    <TableBody>
                      {Object.entries(specs).map(([key, value], index) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium text-gray-900 bg-gray-50 w-1/3 py-3 px-4">
                            {key}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-gray-700">
                            {String(value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No specifications available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {/* Review summary */}
                    <div className="flex items-center gap-4 pb-4 border-b">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-gray-900">{product.rating.toFixed(1)}</p>
                        <StarRating rating={product.rating} size="md" className="mt-1" />
                        <p className="text-xs text-gray-500 mt-1">{product.reviewCount} reviews</p>
                      </div>
                    </div>

                    {/* Review list */}
                    <div className="space-y-4">
                      {product.reviews.map((review) => (
                        <div key={review.id} className="pb-4 border-b last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                                {review.user?.name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {review.user?.name || 'Anonymous'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <StarRating rating={review.rating} size="sm" className="mb-1" />
                          {review.title && (
                            <p className="text-sm font-semibold text-gray-900">{review.title}</p>
                          )}
                          {review.comment && (
                            <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
