'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAppStore, useWishlistStore, useCartStore, type Product } from '@/lib/store'
import ProductCard from '@/components/ui/ProductCard'
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

export default function WishlistPage() {
  const { navigate } = useAppStore()
  const { items, removeItem, clearAll } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const results = await Promise.all(
        productIds.map((id) =>
          fetch(`/api/products/${id}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => data?.product || data)
            .catch(() => null)
        )
      )
      const validProducts = results.filter((p): p is Product => p != null)
      setProducts(validProducts)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts(items)
  }, [items, fetchProducts])

  const handleMoveToCart = (product: Product) => {
    addToCart(product)
    removeItem(product.id)
  }

  const handleClearAll = () => {
    clearAll()
    setProducts([])
  }

  if (loading && items.length > 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002B1B] via-[#004D2E] to-[#002B1B] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FCD116]/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#FCD116]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">My Wishlist</h1>
                <p className="text-sm text-gray-300 mt-1">
                  {items.length === 0
                    ? 'No items saved yet'
                    : `${items.length} ${items.length === 1 ? 'item' : 'items'} saved`}
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-red-400 hover:bg-white/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear your wishlist?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all {items.length} items from your wishlist. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAll}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-6 max-w-sm">
                Start adding items you love to your wishlist. Click the heart icon on any product to save it here.
              </p>
              <Button
                size="lg"
                className="bg-[#FCD116] hover:bg-[#D4AA00] text-[#1a1a1a] rounded-full px-8 h-12 font-semibold"
                onClick={() => navigate('products')}
              >
                Start Shopping
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                variants={stagger}
                initial="initial"
                animate="animate"
              >
                {products.map((product) => (
                  <motion.div key={product.id} variants={fadeInUp}>
                    <div className="relative">
                      <ProductCard product={product} />
                      {/* Overlay action buttons */}
                      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeItem(product.id)
                          }}
                          className="w-8 h-8 rounded-full bg-white/90 hover:bg-red-50 border border-gray-200 flex items-center justify-center shadow-sm transition-colors group"
                          aria-label="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-500" />
                        </button>
                      </div>
                      {/* Move to Cart button below card */}
                      <Button
                        size="sm"
                        className="mt-2 w-full bg-[#002B1B] hover:bg-[#004D2E] text-white rounded-full text-xs font-medium h-8"
                        onClick={() => handleMoveToCart(product)}
                        disabled={product.stock === 0}
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                        Move to Cart
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
