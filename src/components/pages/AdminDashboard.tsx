'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore, useUserStore } from '@/lib/store'
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Eye,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  pendingOrders: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  orderItems: { name: string; quantity: number; price: number }[]
}

interface OrderStatusItem {
  status: string
  count: number
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'confirmed': case 'processing': return 'bg-blue-100 text-blue-800'
    case 'shipped': return 'bg-purple-100 text-purple-800'
    case 'delivered': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function AdminDashboard() {
  const { navigate } = useAppStore()
  const { user, token, isAdmin } = useUserStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [orderStatuses, setOrderStatuses] = useState<OrderStatusItem[]>([])
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [orderFilter, setOrderFilter] = useState('all')
  const [orderLoading, setOrderLoading] = useState(false)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStats(data.stats)
      setRecentOrders(data.recentOrders)
      setOrderStatuses(data.ordersByStatus || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    setOrderLoading(true)
    try {
      const params = new URLSearchParams()
      if (orderFilter && orderFilter !== 'all') params.set('status', orderFilter)
      params.set('limit', '50')
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {
      // silently fail
    } finally {
      setOrderLoading(false)
    }
  }

  const updateOrderStatus = async (orderNumber: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchOrders()
        fetchDashboard()
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    if (!user || !isAdmin()) {
      return
    }
    fetchDashboard()
  }, [user, token])

  useEffect(() => {
    if (user && isAdmin()) {
      fetchOrders()
    }
  }, [orderFilter, user, token])

  // Not admin - show access denied
  if (!user || !isAdmin()) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-400" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
        <p className="text-gray-500 mb-6">You need admin privileges to access the dashboard.</p>
        <Button onClick={() => navigate('home')} className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full px-8">
          Go Home
        </Button>
      </div>
    )
  }

  const statCards = [
    { icon: Package, label: 'Products', value: stats?.totalProducts || 0, color: 'text-blue-600 bg-blue-50' },
    { icon: ShoppingCart, label: 'Orders', value: stats?.totalOrders || 0, color: 'text-purple-600 bg-purple-50' },
    { icon: Users, label: 'Customers', value: stats?.totalUsers || 0, color: 'text-emerald-600 bg-emerald-50' },
    { icon: DollarSign, label: 'Revenue', value: `GH₵${((stats?.totalRevenue || 0)).toFixed(2)}`, color: 'text-[#C59F00] bg-yellow-50' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('home')} className="text-gray-500 hover:text-[#C59F00] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your store</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchDashboard(); fetchOrders() }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-gray-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Tabs defaultValue="recent" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recent">Recent Orders</TabsTrigger>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="status">Order Status</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Recent Orders
                {stats && stats.pendingOrders > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    {stats.pendingOrders} pending
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No orders yet</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono font-medium">{order.orderNumber}</span>
                          <Badge className={`${getStatusColor(order.status)} text-xs`}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {order.orderItems.length} items - {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-[#C59F00]">GH₵{order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">All Orders</CardTitle>
                <Select value={orderFilter} onValueChange={setOrderFilter}>
                  <SelectTrigger className="w-[160px] h-8 text-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {orderLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono font-medium">{order.orderNumber}</span>
                          <Badge className={`${getStatusColor(order.status)} text-xs`}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {order.orderItems.map(i => i.name).join(', ')}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <p className="font-bold text-sm text-[#C59F00]">GH₵{order.total.toFixed(2)}</p>
                        <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.orderNumber, v)}>
                          <SelectTrigger className="w-[120px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                Order Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderStatuses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No order data yet</p>
                ) : (
                  orderStatuses.map((item) => {
                    const maxCount = Math.max(...orderStatuses.map(s => s.count))
                    const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                    return (
                      <div key={item.status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize font-medium">{item.status}</span>
                          <span className="text-gray-500">{item.count} orders</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              item.status === 'delivered' ? 'bg-green-500' :
                              item.status === 'cancelled' ? 'bg-red-500' :
                              item.status === 'shipped' ? 'bg-purple-500' :
                              item.status === 'processing' ? 'bg-blue-500' :
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
