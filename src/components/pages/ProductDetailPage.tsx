'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { useAppStore, useCartStore, useUserStore, type Product, type Review } from '@/lib/store'
import StarRating from '@/components/ui/StarRating'
import ProductCard from '@/components/ui/ProductCard'
import { toast } from '@/hooks/use-toast'
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
  Star,
  MessageSquare,
  LogIn,
  CheckCircle2,
  Send,
  Loader2,
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
  return str.startsWith('/images/') || str.startsWith('/uploads/') || str.startsWith('http://') || str.startsWith('https://')
}

function getEmojiFallback(images: string | null | undefined, fallback = '📦'): string {
  const parsed = parseImages(images)
  for (const img of parsed) {
    if (!isImageUrl(img)) return img
  }
  return fallback
}

// Format relative date nicely
function formatReviewDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`

  // For older reviews, show formatted date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Interactive star rating for the form
function InteractiveStarRating({
  value,
  onChange,
  size = 'lg',
}: {
  value: number
  onChange: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hovered, setHovered] = useState(0)

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const current = hovered || value

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="transition-transform hover:scale-110 focus:outline-none"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`${sizeClasses[size]} transition-colors ${
              star <= current
                ? 'fill-[#C59F00] text-[#C59F00]'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-gray-600 font-medium">
          {value === 1 ? 'Poor' : value === 2 ? 'Fair' : value === 3 ? 'Good' : value === 4 ? 'Very Good' : 'Excellent'}
        </span>
      )}
    </div>
  )
}

export default function ProductDetailPage() {
  const { selectedProductId, navigate } = useAppStore()
  const { addItem } = useCartStore()
  const { user, token } = useUserStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  // Review form state
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const fetchProduct = useCallback((productId: string) => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/products/${productId}`)
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
  }, [navigate])

  useEffect(() => {
    if (!selectedProductId) {
      navigate('products')
      return
    }
    const cleanup = fetchProduct(selectedProductId)
    return cleanup
  }, [selectedProductId, navigate, fetchProduct])

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

  const handleSubmitReview = async () => {
    if (!product || !user || !token) return
    if (reviewRating === 0) {
      toast({ title: 'Please select a rating', description: 'Click on the stars to rate this product.', variant: 'destructive' })
      return
    }
    if (!reviewComment.trim()) {
      toast({ title: 'Please write a comment', description: 'Your review comment is required.', variant: 'destructive' })
      return
    }

    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          comment: reviewComment.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      // Reset form
      setReviewRating(0)
      setReviewTitle('')
      setReviewComment('')

      toast({
        title: 'Review submitted!',
        description: 'Thank you for your feedback.',
      })

      // Refresh product data to show the new review
      fetchProduct(product.id)
    } catch (err) {
      toast({
        title: 'Failed to submit review',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      })
    } finally {
      setSubmittingReview(false)
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
              {product.sku && (
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{product.sku}</span>
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
                    You save GH₵{getSavings()}
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
                      {Object.entries(specs).map(([key, value]) => (
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
            <div className="space-y-6">
              {/* Write a Review Card */}
              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-[#C59F00]/20 bg-gradient-to-br from-[#FCD116]/5 to-transparent">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-5 h-5 text-[#C59F00]" />
                        <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
                      </div>

                      {/* Star Rating Selector */}
                      <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Your Rating <span className="text-red-500">*</span>
                        </Label>
                        <InteractiveStarRating value={reviewRating} onChange={setReviewRating} />
                      </div>

                      {/* Title Input */}
                      <div className="mb-4">
                        <Label htmlFor="review-title" className="text-sm font-medium text-gray-700 mb-2 block">
                          Title <span className="text-gray-400">(optional)</span>
                        </Label>
                        <Input
                          id="review-title"
                          placeholder="Summarize your experience..."
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          maxLength={100}
                          className="border-gray-200 focus:border-[#C59F00] focus:ring-[#C59F00]/20"
                        />
                      </div>

                      {/* Comment Textarea */}
                      <div className="mb-4">
                        <Label htmlFor="review-comment" className="text-sm font-medium text-gray-700 mb-2 block">
                          Your Review <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="review-comment"
                          placeholder="What did you like or dislike about this product? How do you use it?"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={4}
                          maxLength={1000}
                          className="border-gray-200 focus:border-[#C59F00] focus:ring-[#C59F00]/20 resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {reviewComment.length}/1000
                        </p>
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={handleSubmitReview}
                        disabled={submittingReview || reviewRating === 0 || !reviewComment.trim()}
                        className="bg-[#002B1B] hover:bg-[#004D2E] text-white rounded-full px-6"
                      >
                        {submittingReview ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Review
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-gray-50">
                    <CardContent className="p-6">
                      <div className="text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-[#002B1B]/10 flex items-center justify-center mx-auto mb-3">
                          <LogIn className="w-6 h-6 text-[#002B1B]" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          Sign in to write a review
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Share your experience with other shoppers
                        </p>
                        <Button
                          variant="outline"
                          className="border-[#002B1B] text-[#002B1B] hover:bg-[#002B1B] hover:text-white rounded-full"
                          onClick={() => navigate('login')}
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Reviews List Card */}
              <Card>
                <CardContent className="p-6">
                  {product.reviews && product.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {/* Review summary */}
                      <div className="flex items-center gap-4 pb-4 border-b">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-gray-900">{product.rating.toFixed(1)}</p>
                          <StarRating rating={product.rating} size="md" className="mt-1" />
                          <p className="text-xs text-gray-500 mt-1">{product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* Review list */}
                      <div className="space-y-6">
                        {product.reviews.map((review: Review) => (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pb-6 border-b last:border-0 last:pb-0"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#002B1B] to-[#004D2E] flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                                  {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      {review.user?.name || 'Anonymous'}
                                    </span>
                                    {/* Verified Purchase badge */}
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 text-[10px] px-1.5 py-0 h-4 flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      Verified Purchase
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {formatReviewDate(review.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <StarRating rating={review.rating} size="sm" />
                            </div>
                            {review.title && (
                              <p className="text-sm font-semibold text-gray-900 mb-1">{review.title}</p>
                            )}
                            {review.comment && (
                              <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Empty state */
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-10 h-10 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No reviews yet
                      </h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        Be the first to share your experience with this product. Your feedback helps other shoppers make informed decisions.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
