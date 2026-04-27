'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
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
  Plus,
  Upload,
  X,
  Search,
  ImageIcon,
  Star,
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

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductItem {
  id: string
  name: string
  slug: string
  description: string
  shortDesc: string | null
  price: number
  originalPrice: number | null
  condition: string
  categoryId: string
  images: string
  stock: number
  rating: number
  reviewCount: number
  featured: boolean
  active: boolean
  specs: string
  brand: string | null
  warranty: string
  createdAt: string
  category: { id: string; name: string }
}

interface ProductFormData {
  name: string
  description: string
  shortDesc: string
  price: string
  originalPrice: string
  condition: string
  categoryId: string
  images: string[]
  stock: string
  featured: boolean
  specs: string
  brand: string
  warranty: string
}

const emptyFormData: ProductFormData = {
  name: '',
  description: '',
  shortDesc: '',
  price: '',
  originalPrice: '',
  condition: 'Refurbished',
  categoryId: '',
  images: [],
  stock: '10',
  featured: false,
  specs: '',
  brand: '',
  warranty: '90 Days Warranty',
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

function ProductImage({ src, className = '' }: { src: string; className?: string }) {
  if (!src || src === 'undefined') {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <ImageIcon className="w-6 h-6" />
      </div>
    )
  }
  if (src.startsWith('/uploads/') || src.startsWith('http')) {
    return <img src={src} alt="" className={`object-cover ${className}`} />
  }
  return (
    <div className={`flex items-center justify-center bg-gray-100 text-3xl ${className}`}>
      {src}
    </div>
  )
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

  // --- Product management state ---
  const [products, setProducts] = useState<ProductItem[]>([])
  const [productLoading, setProductLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [productStatusFilter, setProductStatusFilter] = useState('all')
  const [categories, setCategories] = useState<Category[]>([])
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData)
  const [formSaving, setFormSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Order management ---
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

  // --- Product management ---
  const fetchProducts = async () => {
    setProductLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '100')
      if (productSearch) params.set('search', productSearch)
      if (productCategoryFilter && productCategoryFilter !== 'all') params.set('category', productCategoryFilter)
      if (productStatusFilter && productStatusFilter !== 'all') params.set('status', productStatusFilter)
      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProducts(data.products || [])
    } catch {
      // silently fail
    } finally {
      setProductLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      // silently fail
    }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setFormData((prev) => ({ ...prev, images: [...prev.images, data.url] }))
    } catch {
      // silently fail
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const openCreateProduct = () => {
    setEditingProduct(null)
    setFormData(emptyFormData)
    setProductDialogOpen(true)
  }

  const openEditProduct = (product: ProductItem) => {
    setEditingProduct(product)
    let images: string[] = []
    try {
      images = JSON.parse(product.images || '[]')
    } catch {
      images = []
    }
    setFormData({
      name: product.name,
      description: product.description,
      shortDesc: product.shortDesc || '',
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      condition: product.condition || 'Refurbished',
      categoryId: product.categoryId,
      images,
      stock: String(product.stock),
      featured: product.featured,
      specs: product.specs || '',
      brand: product.brand || '',
      warranty: product.warranty || '90 Days Warranty',
    })
    setProductDialogOpen(true)
  }

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.categoryId || !formData.price) return

    setFormSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: formData.name,
        description: formData.description,
        shortDesc: formData.shortDesc || null,
        price: formData.price,
        originalPrice: formData.originalPrice || null,
        condition: formData.condition,
        categoryId: formData.categoryId,
        images: formData.images,
        stock: parseInt(formData.stock) || 0,
        featured: formData.featured,
        specs: formData.specs || '{}',
        brand: formData.brand || null,
        warranty: formData.warranty,
      }

      if (editingProduct) {
        body.id = editingProduct.id
      }

      const res = await fetch('/api/admin/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setProductDialogOpen(false)
        fetchProducts()
        fetchDashboard()
      }
    } catch {
      // silently fail
    } finally {
      setFormSaving(false)
    }
  }

  const confirmDeleteProduct = (product: ProductItem) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products?id=${productToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setDeleteDialogOpen(false)
        setProductToDelete(null)
        fetchProducts()
        fetchDashboard()
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
    }
  }

  const toggleProductActive = async (product: ProductItem) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: product.id, active: !product.active }),
      })
      if (res.ok) {
        fetchProducts()
      }
    } catch {
      // silently fail
    }
  }

  const toggleProductFeatured = async (product: ProductItem) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: product.id, featured: !product.featured }),
      })
      if (res.ok) {
        fetchProducts()
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
    fetchCategories()
  }, [user, token])

  useEffect(() => {
    if (user && isAdmin()) {
      fetchOrders()
    }
  }, [orderFilter, user, token])

  useEffect(() => {
    if (user && isAdmin()) {
      fetchProducts()
    }
  }, [productSearch, productCategoryFilter, productStatusFilter, user, token])

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
        <Button variant="outline" size="sm" onClick={() => { fetchDashboard(); fetchOrders(); fetchProducts() }}>
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
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="recent">Recent Orders</TabsTrigger>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="status">Order Status</TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Products
          </TabsTrigger>
        </TabsList>

        {/* ===== Recent Orders Tab ===== */}
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

        {/* ===== All Orders Tab ===== */}
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

        {/* ===== Order Status Tab ===== */}
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

        {/* ===== Products Tab ===== */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  Products
                  <Badge variant="secondary" className="text-xs ml-1">{products.length}</Badge>
                </CardTitle>
                <Button
                  onClick={openCreateProduct}
                  className="bg-[#002B1B] hover:bg-[#003D26] text-white rounded-lg gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={productStatusFilter} onValueChange={setProductStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Product list */}
              {productLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 mb-1">No products found</p>
                  <p className="text-sm text-gray-400">Create your first product or adjust filters</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {products.map((product) => {
                    let images: string[] = []
                    try { images = JSON.parse(product.images || '[]') } catch { images = [] }
                    const thumbnail = images[0] || ''

                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {/* Thumbnail */}
                        <ProductImage
                          src={thumbnail}
                          className="w-14 h-14 rounded-lg flex-shrink-0 bg-gray-200"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                              {product.name}
                            </p>
                            {product.featured && (
                              <Badge className="bg-[#FCD116] text-[#002B1B] text-[10px] px-1.5 py-0 gap-1">
                                <Star className="w-2.5 h-2.5" /> Featured
                              </Badge>
                            )}
                            <Badge className={`${product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-[10px] px-1.5 py-0`}>
                              {product.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {product.category?.name || 'Uncategorized'} &middot; {product.condition} &middot; Stock: {product.stock}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0 mr-2">
                          <p className="font-bold text-sm text-[#C59F00]">GH₵{product.price.toFixed(2)}</p>
                          {product.originalPrice && (
                            <p className="text-xs text-gray-400 line-through">GH₵{product.originalPrice.toFixed(2)}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-[#C59F00]"
                            onClick={() => toggleProductActive(product)}
                            title={product.active ? 'Deactivate' : 'Activate'}
                          >
                            {product.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                            onClick={() => openEditProduct(product)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                            onClick={() => confirmDeleteProduct(product)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== Product Create/Edit Dialog ===== */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingProduct ? 'Edit Product' : 'Create New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product details below.' : 'Fill in the details to add a new product.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Row: Name */}
            <div className="grid gap-2">
              <Label htmlFor="prod-name">Product Name *</Label>
              <Input
                id="prod-name"
                placeholder="e.g. iPhone 14 Pro Max"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            {/* Row: Category + Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(v) => setFormData((p) => ({ ...p, categoryId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(v) => setFormData((p) => ({ ...p, condition: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Refurbished">Refurbished</SelectItem>
                    <SelectItem value="Used">Used</SelectItem>
                    <SelectItem value="Open Box">Open Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row: Price + Original Price + Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="prod-price">Price (GH₵) *</Label>
                <Input
                  id="prod-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prod-orig-price">Original Price</Label>
                <Input
                  id="prod-orig-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData((p) => ({ ...p, originalPrice: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prod-stock">Stock</Label>
                <Input
                  id="prod-stock"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={formData.stock}
                  onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value }))}
                />
              </div>
            </div>

            {/* Row: Brand + Warranty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="prod-brand">Brand</Label>
                <Input
                  id="prod-brand"
                  placeholder="e.g. Apple"
                  value={formData.brand}
                  onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prod-warranty">Warranty</Label>
                <Input
                  id="prod-warranty"
                  placeholder="e.g. 90 Days Warranty"
                  value={formData.warranty}
                  onChange={(e) => setFormData((p) => ({ ...p, warranty: e.target.value }))}
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="grid gap-2">
              <Label htmlFor="prod-short">Short Description</Label>
              <Input
                id="prod-short"
                placeholder="Brief product summary"
                value={formData.shortDesc}
                onChange={(e) => setFormData((p) => ({ ...p, shortDesc: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="prod-desc">Full Description</Label>
              <Textarea
                id="prod-desc"
                placeholder="Detailed product description..."
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Images */}
            <div className="grid gap-2">
              <Label>Images</Label>
              <div className="flex flex-wrap gap-2 items-start">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-lg border overflow-hidden bg-gray-50">
                    <ProductImage src={img} className="w-full h-full" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#C59F00] flex flex-col items-center justify-center text-gray-400 hover:text-[#C59F00] transition-colors disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-[10px] mt-0.5">Upload</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-400">JPEG, PNG, WebP, or GIF up to 5MB</p>
            </div>

            {/* Specs (JSON) */}
            <div className="grid gap-2">
              <Label htmlFor="prod-specs">Specifications (JSON)</Label>
              <Textarea
                id="prod-specs"
                placeholder='{"color": "Black", "storage": "256GB"}'
                value={formData.specs}
                onChange={(e) => setFormData((p) => ({ ...p, specs: e.target.value }))}
                rows={3}
                className="font-mono text-xs"
              />
            </div>

            {/* Featured toggle */}
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, featured: checked }))}
              />
              <Label className="cursor-pointer" onClick={() => setFormData((p) => ({ ...p, featured: !p.featured }))}>
                Featured product
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
              disabled={formSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={formSaving || !formData.name || !formData.categoryId || !formData.price}
              className="bg-[#002B1B] hover:bg-[#003D26] text-white"
            >
              {formSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingProduct ? (
                'Update Product'
              ) : (
                'Create Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation Dialog ===== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDeleteDialogOpen(false); setProductToDelete(null) }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
