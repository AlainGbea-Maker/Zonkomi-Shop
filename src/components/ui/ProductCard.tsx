'use client'

import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  return str.startsWith('/uploads/') || str.startsWith('http://') || str.startsWith('https://')
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

  const handleClick = () => {
    navigate('product-detail', { productId: product.id })
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
  }

  return (
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

            <Button
              size="sm"
              className="mt-1 w-full bg-[#FCD116] hover:bg-[#D4AA00] text-[#1a1a1a] border border-[#D4AA00] rounded-full text-xs font-medium h-8"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
