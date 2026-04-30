'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, useRecentlyViewedStore, type Product, type Category } from '@/lib/store'
import ProductCard from '@/components/ui/ProductCard'
import { ArrowRight, Shield, RotateCcw, Award, CreditCard, Package, Users, Star, TrendingUp, Gift, Zap, Clock, Trash2, Quote, MapPin, Timer, Flame } from 'lucide-react'

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

const categoryEmojis: Record<string, string> = {
  'Laptops': '💻',
  'Smartphones': '📱',
  'Tablets': '📲',
  'Desktops': '🖥️',
  'Monitors': '🖥️',
  'Headphones': '🎧',
  'Cameras': '📷',
  'Gaming': '🎮',
  'Audio': '🔊',
  'Wearables': '⌚',
  'Networking': '🌐',
  'Storage': '💾',
  'Accessories': '🔧',
  'TVs': '📺',
}

const categoryGradients: Record<string, string> = {
  'Laptops': 'from-amber-500 to-yellow-400',
  'Smartphones': 'from-emerald-600 to-emerald-400',
  'Tablets': 'from-teal-500 to-teal-300',
  'Desktops': 'from-emerald-700 to-green-500',
  'Monitors': 'from-cyan-600 to-teal-400',
  'Headphones': 'from-amber-600 to-amber-400',
  'Cameras': 'from-red-600 to-red-400',
  'Gaming': 'from-yellow-600 to-amber-400',
  'Audio': 'from-emerald-500 to-green-400',
  'Wearables': 'from-amber-500 to-yellow-300',
  'Networking': 'from-teal-600 to-emerald-400',
  'Storage': 'from-green-600 to-emerald-400',
  'Accessories': 'from-stone-500 to-stone-400',
  'TVs': 'from-yellow-700 to-amber-500',
}

function getDefaultGradient(index: number) {
  const gradients = [
    'from-amber-500 to-yellow-400',
    'from-emerald-600 to-emerald-400',
    'from-teal-500 to-teal-300',
    'from-yellow-600 to-amber-400',
    'from-green-600 to-emerald-400',
    'from-red-600 to-red-400',
    'from-cyan-600 to-teal-400',
    'from-emerald-700 to-green-500',
  ]
  return gradients[index % gradients.length]
}

function getDefaultEmoji(index: number) {
  const emojis = ['💻', '📱', '📲', '🖥️', '🎧', '📷', '🎮', '🔊']
  return emojis[index % emojis.length]
}

export default function HomePage() {
  const { navigate } = useAppStore()
  const recentlyViewedStore = useRecentlyViewedStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [dealProduct, setDealProduct] = useState<Product | null>(null)
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [siteStats, setSiteStats] = useState<{ products: number; customers: number; orders: number; avgRating: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes, newArrRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products?featured=true&limit=8'),
          fetch('/api/products?limit=4&sortBy=newest'),
        ])
        const catData = await catRes.json()
        const prodData = await prodRes.json()
        const newArrData = await newArrRes.json()
        setCategories(catData || [])
        setFeaturedProducts(prodData?.products || prodData || [])
        setNewArrivals(newArrData?.products || newArrData || [])

        // Find deal of the day (highest discount)
        const allRes = await fetch('/api/products?limit=50')
        const allData = await allRes.json()
        const allProducts = allData?.products || allData || []
        let maxDiscount = 0
        let deal: Product | null = null
        for (const p of allProducts) {
          if (p.originalPrice && p.originalPrice > p.price) {
            const disc = (p.originalPrice - p.price) / p.originalPrice
            if (disc > maxDiscount) {
              maxDiscount = disc
              deal = p
            }
          }
        }
        setDealProduct(deal || allProducts[0] || null)

        // Fetch real site stats
        fetch('/api/stats')
          .then((r) => r.json())
          .then((data) => setSiteStats(data))
          .catch(() => {})
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch recently viewed products
  useEffect(() => {
    const ids = recentlyViewedStore.items.slice(0, 4)
    if (ids.length === 0) return
    Promise.all(
      ids.map((id) =>
        fetch(`/api/products/${id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data?.product || data)
          .catch(() => null)
      )
    ).then((results) => {
      const products = results.filter((p): p is Product => p != null)
      setRecentlyViewedProducts(products)
    })
  }, [recentlyViewedStore.items])

  // Deal countdown timer - counts down to midnight GMT
  useEffect(() => {
    const getEndOfDay = () => {
      const now = new Date()
      const end = new Date(now)
      end.setUTCHours(23, 59, 59, 999)
      return end.getTime() - now.getTime()
    }

    let remaining = getEndOfDay()
    const update = () => {
      remaining -= 1000
      if (remaining <= 0) remaining = getEndOfDay()
      const h = Math.floor(remaining / 3600000)
      const m = Math.floor((remaining % 3600000) / 60000)
      const s = Math.floor((remaining % 60000) / 1000)
      setTimeLeft({ hours: h, minutes: m, seconds: s })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-[#002B1B] via-[#004D2E] to-[#CE1126] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#FCD116] rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#006B3F] rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-[#FCD116]/20 text-[#C59F00] border-[#FCD116]/30 px-3 py-1 text-sm">
              🔥 Hot Deals Daily
            </Badge>
          </motion.div>
          <motion.h1
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white max-w-4xl leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Premium Refurbished Electronics at{' '}
            <span className="text-[#C59F00]">Unbeatable Prices</span>
          </motion.h1>
          <motion.p
            className="mt-4 text-gray-300 text-base md:text-lg max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Save up to 70% on certified refurbished laptops, phones, tablets, and more.
            Every device is inspected, tested, and backed by our 90-day warranty.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full px-8 h-12 text-base font-semibold"
              onClick={() => navigate('products')}
            >
              Shop Now
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 h-12 text-base"
              onClick={() => navigate('products', { categoryId: categories[0]?.id })}
            >
              Browse Categories
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges - Compact */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <motion.div
            className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[
              { icon: Shield, label: '90-Day Warranty', slug: 'shipping' },
              { icon: RotateCcw, label: 'Free Returns', slug: 'shipping' },
              { icon: Award, label: 'Certified Quality', slug: 'about' },
              { icon: CreditCard, label: 'Secure Payment', slug: 'payments' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate('info', { infoSlug: item.slug })}
                className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity cursor-pointer group/badge"
              >
                <item.icon className="w-4 h-4 text-[#C59F00] group-hover/badge:scale-110 transition-transform" />
                <span className="text-gray-600 font-medium group-hover/badge:text-[#C59F00] transition-colors">{item.label}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== DEAL OF THE DAY - Prominent Top Position ===== */}
      {loading ? (
        <section className="bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0d1b2a] py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Skeleton className="aspect-[4/3] rounded-2xl" />
              <div className="space-y-4 flex flex-col justify-center">
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-10 w-3/4 rounded" />
                <Skeleton className="h-5 w-full rounded" />
                <Skeleton className="h-5 w-2/3 rounded" />
                <Skeleton className="h-12 w-48 rounded-full mt-4" />
              </div>
            </div>
          </div>
        </section>
      ) : dealProduct && (
        <section className="bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0d1b2a] py-10 md:py-16 relative overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 -left-20 w-72 h-72 bg-red-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#FCD116]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-4 py-1.5">
                <Flame className="w-4 h-4 text-red-400" />
                <span className="text-red-300 text-sm font-bold uppercase tracking-wide">Deal of the Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5">
                  <Timer className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-300 text-xs font-bold">Ends in</span>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { value: timeLeft.hours, label: 'h' },
                    { value: timeLeft.minutes, label: 'm' },
                    { value: timeLeft.seconds, label: 's' },
                  ].map((unit) => (
                    <span key={unit.label} className="flex items-center gap-0.5">
                      <span className="bg-red-500/20 border border-red-500/30 text-red-300 font-mono font-bold text-sm px-2 py-1 rounded-md min-w-[2rem] text-center">
                        {String(unit.value).padStart(2, '0')}
                      </span>
                      <span className="text-red-400/60 text-xs font-bold mr-1">{unit.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* Product Image - Large & Prominent */}
                <div className="md:w-1/2 lg:w-[55%] aspect-square md:aspect-auto relative overflow-hidden bg-gradient-to-br from-gray-900/50 to-gray-800/50">
                  {getProductImage(dealProduct.images) ? (
                    <img
                      src={getProductImage(dealProduct.images)!}
                      alt={dealProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-9xl">{getProductEmoji(dealProduct.images)}</span>
                    </div>
                  )}
                  {/* Discount badge overlay */}
                  {dealProduct.originalPrice && dealProduct.originalPrice > dealProduct.price && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white rounded-xl px-4 py-2 shadow-lg shadow-red-500/30">
                      <span className="text-2xl font-black">
                        -{Math.round(((dealProduct.originalPrice - dealProduct.price) / dealProduct.originalPrice) * 100)}%
                      </span>
                      <p className="text-[10px] uppercase tracking-wider opacity-90">Save Today</p>
                    </div>
                  )}
                  {/* Condition badge */}
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white rounded-full px-3 py-1 text-xs font-medium">
                    {dealProduct.condition}
                  </div>
                </div>

                {/* Product Details - Large Typography */}
                <div className="flex-1 p-6 md:p-10 lg:p-12 flex flex-col justify-center">
                  <p className="text-[#C59F00] text-sm font-semibold uppercase tracking-wide mb-2">
                    Today&apos;s Best Deal
                  </p>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                    {dealProduct.name}
                  </h2>
                  <p className="text-gray-400 text-sm md:text-base mb-6 line-clamp-3 leading-relaxed">
                    {dealProduct.shortDesc || dealProduct.description}
                  </p>

                  {/* Price Block */}
                  <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/5">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl md:text-4xl font-black text-[#FCD116]">
                        GH₵{dealProduct.price.toFixed(2)}
                      </span>
                      {dealProduct.originalPrice && dealProduct.originalPrice > dealProduct.price && (
                        <span className="text-lg text-gray-500 line-through">
                          GH₵{dealProduct.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {dealProduct.originalPrice && dealProduct.originalPrice > dealProduct.price && (
                      <p className="text-emerald-400 text-sm mt-1 font-medium">
                        You save GH₵{(dealProduct.originalPrice - dealProduct.price).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Stock urgency */}
                  {dealProduct.stock <= 5 && dealProduct.stock > 0 && (
                    <div className="flex items-center gap-2 mb-5 text-red-400 text-sm">
                      <div className="h-1.5 flex-1 bg-red-500/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${(dealProduct.stock / 10) * 100}%` }}
                        />
                      </div>
                      <span className="font-medium whitespace-nowrap">Only {dealProduct.stock} left!</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      className="bg-[#FCD116] hover:bg-[#D4AA00] text-[#1a1a1a] rounded-full px-8 h-12 text-base font-bold shadow-lg shadow-yellow-500/20"
                      onClick={() => navigate('product-detail', { productId: dealProduct.id })}
                    >
                      Grab This Deal <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 rounded-full px-6 h-12 text-base"
                      onClick={() => navigate('products')}
                    >
                      See More Deals
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== FEATURED PRODUCTS - Prominent Top Position ===== */}
      <section className="bg-white py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FCD116] to-[#D4AA00] flex items-center justify-center shadow-md">
                <Flame className="w-5 h-5 text-[#1a1a1a]" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Products</h2>
                <p className="text-sm text-gray-500 mt-0.5">Handpicked just for you</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-[#C59F00]/30 text-[#C59F00] hover:bg-yellow-50 rounded-full"
              onClick={() => navigate('products')}
            >
              View All <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {featuredProducts.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ===== NEW ARRIVALS ===== */}
      {newArrivals.length > 0 && (
        <section className="bg-gradient-to-br from-[#002B1B] via-[#003D26] to-[#002B1B] py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CE1126] to-[#a80d1e] flex items-center justify-center shadow-md">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">New Arrivals</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Fresh stock, just landed</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 rounded-full"
                onClick={() => { useAppStore.getState().setSortBy('newest'); navigate('products') }}
              >
                View All <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {newArrivals.slice(0, 4).map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="bg-gray-50 py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
              <p className="text-sm text-gray-500 mt-1">Find exactly what you need</p>
            </div>
            <Button
              variant="ghost"
              className="text-[#C59F00] hover:text-[#C59F00] hover:bg-yellow-50"
              onClick={() => navigate('products')}
            >
              View All <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {categories.slice(0, 8).map((cat, index) => (
                <motion.div key={cat.id} variants={fadeInUp}>
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-gray-200 group"
                    onClick={() => navigate('products', { categoryId: cat.id })}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] overflow-hidden relative">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${categoryGradients[cat.name] || getDefaultGradient(index)} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                            <span className="text-5xl md:text-6xl drop-shadow-md">
                              {categoryEmojis[cat.name] || getDefaultEmoji(index)}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-3 md:p-4 text-center">
                        <h3 className="font-semibold text-sm text-gray-900 group-hover:text-[#C59F00] transition-colors">
                          {cat.name}
                        </h3>
                        {cat._count?.products && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {cat._count.products} products
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Recently Viewed Products */}
      {recentlyViewedProducts.length > 0 && (
        <section className="bg-white py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#C59F00]" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Recently Viewed</h2>
                  <p className="text-sm text-gray-500 mt-1">Products you've been checking out</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                onClick={() => {
                  recentlyViewedStore.clearAll()
                  setRecentlyViewedProducts([])
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear History
              </Button>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {recentlyViewedProducts.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Spin & Win Promo */}
      <section className="bg-gradient-to-br from-[#002B1B] via-[#003D26] to-[#002B1B] py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FCD116] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#CE1126] rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
          >
            {/* Left - Copy */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', damping: 15 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FCD116]/15 border border-[#FCD116]/30 rounded-full mb-4"
              >
                <Gift className="w-4 h-4 text-[#FCD116]" />
                <span className="text-sm font-medium text-[#FCD116]">Exclusive Rewards</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
                Spin & Win <span className="text-[#FCD116]">Exclusive Discounts</span>
              </h2>
              <p className="text-gray-300 mb-6 max-w-md mx-auto lg:mx-0">
                Fill your cart with GH₵799+ worth of premium refurbished tech and unlock our
                daily Spin & Win wheel. Win up to <span className="text-[#FCD116] font-semibold">20% off</span>,
                free shipping, or fixed-amount discounts on your order!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full px-8 h-12 text-base font-bold shadow-lg shadow-yellow-500/20"
                  onClick={() => navigate('products')}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Building Your Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[#FCD116]/40 text-[#FCD116] hover:bg-[#FCD116]/10 rounded-full px-8 h-12 text-base"
                  onClick={() => navigate('products')}
                >
                  Browse Deals
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Right - Prize Cards */}
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto lg:mx-0 lg:ml-auto">
              {[
                { prize: '20% Off', color: 'from-red-600 to-red-400', emoji: '🔥', desc: 'Maximum savings' },
                { prize: 'Free Shipping', color: 'from-emerald-600 to-teal-400', emoji: '🚚', desc: 'Delivered free' },
                { prize: '15% Off', color: 'from-amber-600 to-yellow-400', emoji: '💎', desc: 'Premium discount' },
                { prize: 'GH₵25 Off', color: 'from-yellow-500 to-amber-400', emoji: '💰', desc: 'Cash savings' },
              ].map((item, i) => (
                <motion.div
                  key={item.prize}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-gradient-to-br ${item.color} rounded-xl p-4 text-white shadow-lg`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="font-bold text-base mt-1">{item.prize}</p>
                  <p className="text-white/80 text-xs">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">What Our Customers Say</h2>
            <p className="text-sm text-gray-500 mt-2">Trusted by thousands of shoppers across Ghana</p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { name: "Ama Mensah", location: "Accra", text: "Bought a refurbished MacBook and it works like brand new! Saved over GH₵700. The 90-day warranty gave me confidence.", rating: 5, avatar: "AM" },
              { name: "Kofi Asante", location: "Kumasi", text: "The iPhone 13 Pro I got is in excellent condition. Delivery was fast to Kumasi and the MoMo payment was seamless.", rating: 5, avatar: "KA" },
              { name: "Efua Darko", location: "Takoradi", text: "Zonkomi Shop is now my go-to for electronics. The customer service is amazing and returns are hassle-free.", rating: 5, avatar: "ED" },
              { name: "Yaw Osei", location: "Cape Coast", text: "Got my son a gaming console for his birthday. Great quality at a fraction of the cost. He loves it!", rating: 4, avatar: "YO" },
              { name: "Nana Akua", location: "Tamale", text: "The delivery to Tamale was quick and well-packaged. My Dell laptop is perfect for my small business.", rating: 5, avatar: "NA" },
              { name: "Kwabena Boateng", location: "Tema", text: "I've ordered 3 times now and every product has exceeded expectations. Zonkomi is the real deal!", rating: 5, avatar: "KB" },
            ].map((t) => (
              <motion.div key={t.avatar} variants={fadeInUp}>
                <Card className="h-full border-gray-200 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <Quote className="w-8 h-8 text-[#C59F00]/30 mb-3" />
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">{t.text}</p>
                    <div className="flex items-center gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < t.rating ? 'text-[#FCD116]' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#002B1B] to-[#006B3F] flex items-center justify-center text-white text-xs font-bold">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {t.location}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#002B1B] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { icon: Package, value: siteStats ? siteStats.products.toLocaleString() : '...', label: 'Products', action: () => navigate('products') },
              { icon: Users, value: siteStats ? `${siteStats.customers.toLocaleString()}+` : '...', label: 'Happy Customers', action: () => navigate('info', { infoSlug: 'about' }) },
              { icon: Star, value: siteStats ? siteStats.avgRating : '...', label: 'Average Rating', action: () => navigate('products') },
              { icon: TrendingUp, value: siteStats ? `${siteStats.orders.toLocaleString()}+` : '...', label: 'Orders Shipped', action: () => navigate('info', { infoSlug: 'about' }) },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="text-center"
              >
                <button
                  onClick={stat.action}
                  className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FCD116]/20 flex items-center justify-center hover:bg-[#FCD116]/30 transition-colors cursor-pointer group/stat"
                >
                  <stat.icon className="w-6 h-6 text-[#C59F00] group-hover/stat:scale-110 transition-transform" />
                </button>
                <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-[#FCD116] to-[#006B3F] py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to Save Big?
            </h2>
            <p className="text-white/90 mb-6 max-w-lg mx-auto">
              Join thousands of smart shoppers who choose refurbished. Quality guaranteed,
              wallet approved.
            </p>
            <Button
              size="lg"
              className="bg-white text-[#C59F00] hover:bg-gray-100 rounded-full px-8 h-12 text-base font-semibold"
              onClick={() => navigate('products')}
            >
              Start Shopping <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
