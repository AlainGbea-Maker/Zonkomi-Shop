'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, useUserStore, type Order } from '@/lib/store'
import {
  Package,
  ChevronRight,
  Eye,
  Calendar,
  ShoppingBag,
} from 'lucide-react'

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

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'processing': return 'bg-blue-100 text-blue-800'
    case 'shipped': return 'bg-purple-100 text-purple-800'
    case 'delivered': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function OrderHistoryPage() {
  const { navigate } = useAppStore()
  const { user } = useUserStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      return
    }
    fetch(`/api/orders?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = (data || []).sort(
          (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setOrders(sorted)
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In to View Orders</h1>
        <p className="text-gray-500 mb-6">You need to be logged in to view your order history.</p>
        <Button
          className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full px-8"
          onClick={() => navigate('login')}
        >
          Sign In
        </Button>
      </div>
    )
  }

  // Show loading only when user is logged in
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
          <p className="text-gray-500 mb-6">When you place your first order, it will appear here.</p>
          <Button
            className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full px-8"
            onClick={() => navigate('products')}
          >
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-gray-200 overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between p-4 md:p-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-bold text-gray-900 font-mono">
                            {order.orderNumber}
                          </span>
                          <Badge className={`${getStatusColor(order.status)} text-xs`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span>{order.orderItems?.length || 0} items</span>
                          <span className="font-medium text-[#C59F00]">
                            GH₵{order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-4 ${
                          expandedOrder === order.id ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t p-4 md:p-5 space-y-3">
                          {/* Items preview */}
                          <div className="space-y-2">
                            {order.orderItems?.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="w-10 h-10 rounded bg-gradient-to-br from-[#FCD116] to-[#D4AA00] flex items-center justify-center flex-shrink-0">
                                  <span className="text-lg">{getProductEmoji(item.image)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-medium">GH₵{item.price.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-full mt-2"
                            onClick={() => navigate('order-detail', { orderNumber: order.orderNumber })}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Order Details
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
