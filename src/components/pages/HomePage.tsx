'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type Product, type Category } from '@/lib/store'
import ProductCard from '@/components/ui/ProductCard'
import { ArrowRight, Shield, RotateCcw, Award, CreditCard, Package, Users, Star, TrendingUp } from 'lucide-react'

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
  'Laptops': 'from-orange-500 to-amber-400',
  'Smartphones': 'from-violet-500 to-purple-400',
  'Tablets': 'from-sky-500 to-blue-400',
  'Desktops': 'from-emerald-500 to-green-400',
  'Monitors': 'from-cyan-500 to-teal-400',
  'Headphones': 'from-pink-500 to-rose-400',
  'Cameras': 'from-red-500 to-orange-400',
  'Gaming': 'from-indigo-500 to-violet-400',
  'Audio': 'from-teal-500 to-emerald-400',
  'Wearables': 'from-amber-500 to-yellow-400',
  'Networking': 'from-blue-500 to-indigo-400',
  'Storage': 'from-green-500 to-emerald-400',
  'Accessories': 'from-gray-500 to-zinc-400',
  'TVs': 'from-purple-500 to-pink-400',
}

function getDefaultGradient(index: number) {
  const gradients = [
    'from-orange-500 to-amber-400',
    'from-violet-500 to-purple-400',
    'from-sky-500 to-blue-400',
    'from-emerald-500 to-green-400',
    'from-pink-500 to-rose-400',
    'from-red-500 to-orange-400',
    'from-teal-500 to-cyan-400',
    'from-indigo-500 to-violet-400',
  ]
  return gradients[index % gradients.length]
}

function getDefaultEmoji(index: number) {
  const emojis = ['💻', '📱', '📲', '🖥️', '🎧', '📷', '🎮', '🔊']
  return emojis[index % emojis.length]
}

export default function HomePage() {
  const { navigate } = useAppStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [dealProduct, setDealProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products?featured=true&limit=8'),
        ])
        const catData = await catRes.json()
        const prodData = await prodRes.json()
        setCategories(catData || [])
        setFeaturedProducts(prodData?.products || prodData || [])

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
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
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

      {/* Trust Badges */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { icon: Shield, label: '90-Day Warranty', desc: 'Full coverage included' },
              { icon: RotateCcw, label: 'Free Returns', desc: '30-day return policy' },
              { icon: Award, label: 'Certified Quality', desc: 'Inspected & tested' },
              { icon: CreditCard, label: 'Secure Payment', desc: 'SSL encrypted checkout' },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={fadeInUp}
                className="flex items-center gap-3 p-3 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[#C59F00]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

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
                      <div
                        className={`aspect-[4/3] bg-gradient-to-br ${categoryGradients[cat.name] || getDefaultGradient(index)} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
                      >
                        <span className="text-5xl md:text-6xl drop-shadow-md">
                          {categoryEmojis[cat.name] || getDefaultEmoji(index)}
                        </span>
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

      {/* Deal of the Day */}
      {dealProduct && !loading && (
        <section className="bg-white py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 mb-2">
                ⚡ Deal of the Day
              </Badge>
              <h2 className="text-2xl font-bold text-gray-900">Today&apos;s Best Deal</h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Card className="border-2 border-red-200 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 aspect-square md:aspect-auto bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center p-8">
                      <span className="text-8xl">{getProductEmoji(dealProduct.images)}</span>
                    </div>
                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                      <Badge variant="secondary" className="bg-red-100 text-red-700 w-fit mb-3">
                        Save {dealProduct.originalPrice ? Math.round(((dealProduct.originalPrice - dealProduct.price) / dealProduct.originalPrice) * 100) : 0}% Today
                      </Badge>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                        {dealProduct.name}
                      </h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {dealProduct.shortDesc || dealProduct.description}
                      </p>
                      <div className="flex items-baseline gap-3 mb-4">
                        <span className="text-3xl font-bold text-[#C59F00]">
                          GH₵{dealProduct.price.toFixed(2)}
                        </span>
                        {dealProduct.originalPrice && (
                          <span className="text-lg text-gray-400 line-through">
                            GH₵{dealProduct.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Button
                        className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full w-fit px-8"
                        onClick={() => navigate('product-detail', { productId: dealProduct.id })}
                      >
                        View Deal <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="bg-gray-50 py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-sm text-gray-500 mt-1">Handpicked just for you</p>
            </div>
            <Button
              variant="ghost"
              className="text-[#C59F00] hover:text-[#C59F00] hover:bg-yellow-50"
              onClick={() => navigate('products')}
            >
              See All <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
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
              { icon: Package, value: '5,000+', label: 'Products' },
              { icon: Users, value: '50,000+', label: 'Happy Customers' },
              { icon: Star, value: '4.5', label: 'Average Rating' },
              { icon: TrendingUp, value: '50,000+', label: 'Orders Shipped' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FCD116]/20 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-[#C59F00]" />
                </div>
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
