'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { useAppStore, useUserStore } from '@/lib/store'
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  DollarSign as GhanaCedi,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
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
  MapPin,
  CreditCard,
  Calendar,
  ShieldCheck,
  LayoutDashboard,
  BoxesIcon,
  ClipboardList,
  PieChart,
  History,
  Warehouse,
  AlertOctagon,
  Minus,
} from 'lucide-react'

// ==================== TYPES ====================

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  pendingOrders: number
}

interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  name: string
  image: string | null
}

interface Order {
  id: string
  orderNumber: string
  userId: string
  status: string
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry: string
  shippingPhone: string | null
  paymentMethod: string
  paymentStatus: string
  notes: string | null
  createdAt: string
  updatedAt: string
  orderItems: OrderItem[]
}

interface OrderStatusItem {
  status: string
  count: number
}

interface TopSellingProduct {
  id: string
  name: string
  image: string
  totalSold: number
  revenue: number
}

interface LowStockProduct {
  id: string
  name: string
  slug: string
  stock: number
  price: number
}

interface RevenueMonth {
  month: string
  revenue: number
  orders: number
}

interface Category {
  id: string
  name: string
  slug: string
}

interface InventoryTransaction {
  id: string
  productId: string
  productName: string
  productSku: string
  type: 'adjustment' | 'restock' | 'sale' | 'correction'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  performedBy: string
  createdAt: string
}

interface InventorySummary {
  totalItems: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
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
  sku: string
  category: { id: string; name: string } | null
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

// ==================== CONSTANTS ====================

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

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_BAR_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  processing: 'bg-blue-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  pending: 'border-l-yellow-400',
  confirmed: 'border-l-blue-400',
  processing: 'border-l-blue-500',
  shipped: 'border-l-purple-400',
  delivered: 'border-l-green-400',
  cancelled: 'border-l-red-400',
}

function getStatusColor(status: string): string {
  return STATUS_COLORS[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    mobile_money: 'Mobile Money',
    credit_card: 'Credit Card',
    bank_transfer: 'Bank Transfer',
    cash_on_delivery: 'Cash on Delivery',
  }
  return map[method] || method
}

function formatPaymentStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// ==================== HELPERS ====================

function ProductImage({ src, className = '' }: { src: string; className?: string }) {
  if (!src || src === 'undefined' || src === '📦') {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <ImageIcon className="w-6 h-6" />
      </div>
    )
  }
  if (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:')) {
    return <img src={src} alt="" className={`object-cover ${className}`} />
  }
  return (
    <div className={`flex items-center justify-center bg-gray-100 text-3xl ${className}`}>
      {src}
    </div>
  )
}

function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ==================== MAIN COMPONENT ====================

export default function AdminDashboard() {
  const { navigate } = useAppStore()
  const { user, token, isAdmin } = useUserStore()

  // --- Dashboard state ---
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [orderStatuses, setOrderStatuses] = useState<OrderStatusItem[]>([])
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueMonth[]>([])
  const [loading, setLoading] = useState(true)

  // --- Orders state ---
  const [orders, setOrders] = useState<Order[]>([])
  const [orderFilter, setOrderFilter] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

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
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [editingStockValue, setEditingStockValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Inventory state ---
  const [inventoryHistory, setInventoryHistory] = useState<InventoryTransaction[]>([])
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [stockAdjustDialogOpen, setStockAdjustDialogOpen] = useState(false)
  const [stockAdjustProduct, setStockAdjustProduct] = useState<ProductItem | null>(null)
  const [stockAdjustQty, setStockAdjustQty] = useState(0)
  const [stockAdjustReason, setStockAdjustReason] = useState('')
  const [stockAdjustCustomReason, setStockAdjustCustomReason] = useState('')
  const [stockAdjustSaving, setStockAdjustSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // ==================== DATA FETCHING ====================

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStats(data.stats)
      setRecentOrders((data.recentOrders || []).slice(0, 5))
      setOrderStatuses(data.ordersByStatus || [])
      setTopSellingProducts(data.topSellingProducts || [])
      setLowStockProducts(data.lowStockProducts || [])
      setRevenueByMonth(data.revenueByMonth || [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchOrders = useCallback(async () => {
    setOrderLoading(true)
    try {
      const params = new URLSearchParams()
      if (orderFilter && orderFilter !== 'all') params.set('status', orderFilter)
      if (orderSearch) params.set('search', orderSearch)
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
  }, [token, orderFilter, orderSearch])

  const fetchProducts = useCallback(async () => {
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
  }, [token, productSearch, productCategoryFilter, productStatusFilter])

  const fetchInventoryHistory = useCallback(async () => {
    setInventoryLoading(true)
    try {
      const res = await fetch('/api/admin/inventory?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setInventoryHistory(data.transactions || [])
    } catch {
      // silently fail
    } finally {
      setInventoryLoading(false)
    }
  }, [token])

  const fetchInventorySummary = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inventory/summary', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setInventorySummary(data)
    } catch {
      // silently fail
    }
  }, [token])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      // silently fail
    }
  }, [])

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (!user || !isAdmin()) return
    fetchDashboard()
    fetchCategories()
  }, [user, token, isAdmin, fetchDashboard, fetchCategories])

  useEffect(() => {
    if (!user || !isAdmin()) return
    fetchOrders()
  }, [user, token, isAdmin, fetchOrders])

  useEffect(() => {
    if (!user || !isAdmin()) return
    fetchProducts()
  }, [user, token, isAdmin, fetchProducts])

  useEffect(() => {
    if (!user || !isAdmin()) return
    fetchInventoryHistory()
    fetchInventorySummary()
  }, [user, token, isAdmin, fetchInventoryHistory, fetchInventorySummary])

  // ==================== ORDER HANDLERS ====================

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

  const toggleExpandedOrder = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId))
  }

  // ==================== PRODUCT HANDLERS ====================

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
    setFormData({
      name: product.name,
      description: product.description,
      shortDesc: product.shortDesc || '',
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      condition: product.condition || 'Refurbished',
      categoryId: product.categoryId,
      images: parseImages(product.images),
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
      if (editingProduct) body.id = editingProduct.id
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
      if (res.ok) fetchProducts()
    } catch {
      // silently fail
    }
  }

  // --- Inline stock quick-edit ---
  const startEditStock = (product: ProductItem) => {
    setEditingStockId(product.id)
    setEditingStockValue(String(product.stock))
  }

  const saveStock = async (productId: string) => {
    const newStock = parseInt(editingStockValue)
    if (isNaN(newStock) || newStock < 0) {
      setEditingStockId(null)
      return
    }
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: productId, stock: newStock }),
      })
      if (res.ok) {
        fetchProducts()
        fetchDashboard()
      }
    } catch {
      // silently fail
    } finally {
      setEditingStockId(null)
    }
  }

  const handleStockKeyDown = (e: React.KeyboardEvent, productId: string) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    } else if (e.key === 'Escape') {
      setEditingStockId(null)
    }
  }

  // --- Stock Adjustment Dialog ---
  const openStockAdjustDialog = (product: ProductItem, qty: number) => {
    setStockAdjustProduct(product)
    setStockAdjustQty(qty)
    setStockAdjustReason('')
    setStockAdjustCustomReason('')
    setStockAdjustDialogOpen(true)
  }

  const handleStockAdjustConfirm = async () => {
    if (!stockAdjustProduct || stockAdjustQty === 0) return
    setStockAdjustSaving(true)
    try {
      const finalReason = stockAdjustReason === 'Other' && stockAdjustCustomReason.trim()
        ? stockAdjustCustomReason.trim()
        : stockAdjustReason || (stockAdjustQty > 0 ? 'Manual restock' : 'Manual reduction')

      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: stockAdjustProduct.id,
          quantity: stockAdjustQty,
          reason: finalReason,
        }),
      })
      if (res.ok) {
        setStockAdjustDialogOpen(false)
        fetchProducts()
        fetchInventoryHistory()
        fetchInventorySummary()
        fetchDashboard()
      }
    } catch {
      // silently fail
    } finally {
      setStockAdjustSaving(false)
    }
  }

  const refreshAll = () => {
    fetchDashboard()
    fetchOrders()
    fetchProducts()
    fetchInventoryHistory()
    fetchInventorySummary()
  }

  // ==================== AUTH GUARD ====================

  if (!user || !isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto px-4 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#CE1126]/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-[#CE1126]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-gray-500 mb-8">You need admin privileges to access the dashboard.</p>
          <Button
            onClick={() => navigate('home')}
            className="bg-[#002B1B] hover:bg-[#003D26] text-white rounded-full px-8 h-11"
          >
            Go Home
          </Button>
        </motion.div>
      </div>
    )
  }

  // ==================== STAT CARDS ====================

  const statCards = [
    { icon: Package, label: 'Products', value: stats?.totalProducts || 0, color: 'text-blue-600', bg: 'bg-blue-50', accent: 'border-blue-200' },
    { icon: ShoppingCart, label: 'Orders', value: stats?.totalOrders || 0, color: 'text-purple-600', bg: 'bg-purple-50', accent: 'border-purple-200' },
    { icon: Users, label: 'Customers', value: stats?.totalUsers || 0, color: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'border-emerald-200' },
    { icon: GhanaCedi, label: 'Revenue', value: `GH₵${((stats?.totalRevenue || 0)).toFixed(2)}`, color: 'text-[#C59F00]', bg: 'bg-[#FCD116]/20', accent: 'border-[#C59F00]' },
  ]

  // ==================== ANALYTICS ====================

  const totalStatusOrders = orderStatuses.reduce((s, o) => s + o.count, 0)
  const maxStatusCount = Math.max(...orderStatuses.map(s => s.count), 1)

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-8">
        {/* ===== HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('home')}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#002B1B] hover:border-[#002B1B] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#002B1B]">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage your store</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            className="border-gray-200 hover:bg-[#002B1B] hover:text-white hover:border-[#002B1B] transition-all rounded-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </motion.div>

        {/* ===== STAT CARDS ===== */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 md:h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`border ${stat.accent} bg-white shadow-sm hover:shadow-md transition-shadow`}>
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                        <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                        <p className="text-base md:text-lg font-bold text-gray-900 truncate">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* ===== TABS ===== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 h-auto flex-wrap gap-1 rounded-xl">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-[#002B1B] data-[state=active]:text-white gap-1.5 text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="rounded-lg data-[state=active]:bg-[#002B1B] data-[state=active]:text-white gap-1.5 text-sm"
            >
              <ClipboardList className="w-4 h-4" />
              All Orders
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="rounded-lg data-[state=active]:bg-[#002B1B] data-[state=active]:text-white gap-1.5 text-sm"
            >
              <BoxesIcon className="w-4 h-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-lg data-[state=active]:bg-[#002B1B] data-[state=active]:text-white gap-1.5 text-sm"
            >
              <PieChart className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* TAB 1: OVERVIEW                                              */}
          {/* ============================================================ */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Recent Orders */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#C59F00]" />
                      Recent Orders
                      {stats && stats.pendingOrders > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-1">
                          {stats.pendingOrders} pending
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {loading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 rounded-lg" />
                        ))}
                      </div>
                    ) : recentOrders.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">No orders yet</p>
                    ) : (
                      <div className="space-y-2">
                        {recentOrders.map((order) => (
                          <div
                            key={order.id}
                            className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-3 ${STATUS_BORDER_COLORS[order.status] || 'border-l-gray-300'} hover:bg-gray-100 transition-colors cursor-pointer`}
                            onClick={() => {
                              setOrderFilter('all')
                              setOrderSearch('')
                              setExpandedOrderId(order.id)
                              setActiveTab('orders')
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-semibold text-gray-700">{order.orderNumber}</span>
                                <Badge className={`${getStatusColor(order.status)} text-[10px] px-1.5 py-0`}>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''} &middot; {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right ml-3">
                              <p className="font-bold text-sm text-[#C59F00]">GH₵{order.total.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Low Stock Alert */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-[#CE1126]/20 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2 text-[#CE1126]">
                      <AlertTriangle className="w-5 h-5" />
                      Low Stock Alert
                      {lowStockProducts.length > 0 && (
                        <Badge className="bg-[#CE1126] text-white text-xs">{lowStockProducts.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {loading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 rounded-lg" />
                        ))}
                      </div>
                    ) : lowStockProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-green-400" />
                        <p className="text-sm text-gray-500">All products are well stocked</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto">
                        {lowStockProducts.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center gap-3 p-2.5 bg-red-50/50 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-gray-200 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">GH₵{product.price.toFixed(2)}</p>
                              </div>
                              <Badge className={`${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'} text-xs font-bold`}>
                                {product.stock === 0 ? 'Out' : product.stock} in stock
                              </Badge>
                            </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top Selling Products */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#002B1B]" />
                      Top Selling Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {loading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 rounded-lg" />
                        ))}
                      </div>
                    ) : topSellingProducts.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">No sales data yet</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {topSellingProducts.map((product, i) => {
                          const images = parseImages(product.image)
                          return (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex flex-col items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                              <div className="relative">
                                <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#FCD116] text-[#002B1B] text-xs font-bold flex items-center justify-center z-10">
                                  {i + 1}
                                </span>
                                <ProductImage
                                  src={images[0] || ''}
                                  className="w-14 h-14 rounded-xl bg-gray-100"
                                />
                              </div>
                              <p className="text-xs font-semibold text-gray-800 text-center mt-2 line-clamp-2 leading-tight">
                                {product.name}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-0.5">{product.totalSold} sold</p>
                              <p className="text-xs font-bold text-[#C59F00] mt-1">GH₵{product.revenue.toFixed(0)}</p>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 2: ALL ORDERS                                            */}
          {/* ============================================================ */}
          <TabsContent value="orders">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-[#002B1B]" />
                    All Orders
                    {!orderLoading && (
                      <Badge variant="secondary" className="text-xs">{orders.length}</Badge>
                    )}
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input
                        placeholder="Search orders..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="pl-8 h-8 text-sm w-full sm:w-[180px]"
                      />
                    </div>
                    <Select value={orderFilter} onValueChange={setOrderFilter}>
                      <SelectTrigger className="w-full sm:w-[160px] h-8 text-sm">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {orderLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 mb-1">No orders found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filter</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {orders.map((order) => {
                      const isExpanded = expandedOrderId === order.id
                      return (
                        <motion.div
                          key={order.id}
                          layout
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isExpanded
                              ? 'border-[#002B1B]/20 bg-white shadow-md'
                              : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:shadow-sm'
                          }`}
                        >
                          {/* Order Header Row */}
                          <div
                            className="flex items-center justify-between p-3 md:p-4 cursor-pointer"
                            onClick={() => toggleExpandedOrder(order.id)}
                          >
                            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                              <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                                order.status === 'delivered' ? 'bg-green-500' :
                                order.status === 'cancelled' ? 'bg-red-500' :
                                order.status === 'shipped' ? 'bg-purple-500' :
                                order.status === 'processing' ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-mono font-semibold text-gray-800">{order.orderNumber}</span>
                                  <Badge className={`${getStatusColor(order.status)} text-[10px] px-1.5 py-0`}>
                                    {order.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {order.orderItems.map(i => i.name).join(', ')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-2">
                              <div className="hidden sm:block text-right">
                                <p className="font-bold text-sm text-[#C59F00]">GH₵{order.total.toFixed(2)}</p>
                                <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div
                                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center"
                                onClick={(e) => { e.stopPropagation(); toggleExpandedOrder(order.id) }}
                              >
                                {isExpanded
                                  ? <ChevronUp className="w-4 h-4 text-gray-500" />
                                  : <ChevronDown className="w-4 h-4 text-gray-500" />
                                }
                              </div>
                            </div>
                          </div>

                          {/* Mobile total + date row */}
                          <div className="sm:hidden px-3 pb-1 flex items-center justify-between text-xs text-gray-500">
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="font-bold text-[#C59F00]">GH₵{order.total.toFixed(2)}</span>
                          </div>

                          {/* Expanded Detail */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-gray-100 bg-white">
                                  <div className="p-4 space-y-4">
                                    {/* Shipping Address */}
                                    <div className="flex items-start gap-3">
                                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-semibold text-gray-700 mb-0.5">Shipping Address</p>
                                        <p className="text-xs text-gray-600">
                                          {order.shippingAddress}, {order.shippingCity}, {order.shippingState} {order.shippingZip}
                                        </p>
                                        {order.shippingPhone && (
                                          <p className="text-xs text-gray-500">{order.shippingPhone}</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Payment Info */}
                                    <div className="flex items-start gap-3">
                                      <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-semibold text-gray-700 mb-0.5">Payment</p>
                                        <p className="text-xs text-gray-600">
                                          {formatPaymentMethod(order.paymentMethod)} &middot;{' '}
                                          <span className={order.paymentStatus === 'paid' ? 'text-green-600 font-semibold' : order.paymentStatus === 'pending' ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'}>
                                            {formatPaymentStatus(order.paymentStatus)}
                                          </span>
                                        </p>
                                      </div>
                                    </div>

                                    {/* Order Timeline */}
                                    <div className="flex items-start gap-3">
                                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-semibold text-gray-700 mb-0.5">Timeline</p>
                                        <p className="text-xs text-gray-600">
                                          Created: {new Date(order.createdAt).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Updated: {new Date(order.updatedAt).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>

                                    <Separator />

                                    {/* Order Items Table */}
                                    <div>
                                      <p className="text-xs font-semibold text-gray-700 mb-2">Order Items</p>
                                      <div className="rounded-lg border border-gray-100 overflow-hidden">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="bg-gray-50">
                                              <th className="text-left py-2 px-3 font-medium text-gray-500">Product</th>
                                              <th className="text-center py-2 px-3 font-medium text-gray-500">Qty</th>
                                              <th className="text-right py-2 px-3 font-medium text-gray-500">Price</th>
                                              <th className="text-right py-2 px-3 font-medium text-gray-500">Total</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {order.orderItems.map((item) => (
                                              <tr key={item.id} className="border-t border-gray-50">
                                                <td className="py-2 px-3 text-gray-800 font-medium truncate max-w-[200px]">{item.name}</td>
                                                <td className="py-2 px-3 text-center text-gray-600">{item.quantity}</td>
                                                <td className="py-2 px-3 text-right text-gray-600">GH₵{item.price.toFixed(2)}</td>
                                                <td className="py-2 px-3 text-right font-semibold text-gray-800">GH₵{(item.price * item.quantity).toFixed(2)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      {/* Totals */}
                                      <div className="flex justify-end mt-2">
                                        <div className="text-xs space-y-0.5 text-right">
                                          <div className="flex gap-6 text-gray-500">
                                            <span>Subtotal:</span>
                                            <span>GH₵{order.subtotal.toFixed(2)}</span>
                                          </div>
                                          <div className="flex gap-6 text-gray-500">
                                            <span>Shipping:</span>
                                            <span>{order.shipping === 0 ? 'Free' : `GH₵${order.shipping.toFixed(2)}`}</span>
                                          </div>
                                          <div className="flex gap-6 text-gray-500">
                                            <span>Tax:</span>
                                            <span>GH₵{order.tax.toFixed(2)}</span>
                                          </div>
                                          <Separator className="my-1" />
                                          <div className="flex gap-6 font-bold text-gray-900 text-sm">
                                            <span>Total:</span>
                                            <span className="text-[#C59F00]">GH₵{order.total.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Status Change */}
                                    <div className="flex items-center justify-between pt-2">
                                      <span className="text-xs font-semibold text-gray-700">Update Status</span>
                                      <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.orderNumber, v)}>
                                        <SelectTrigger className="w-[150px] h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {ORDER_STATUSES.map((s) => (
                                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 3: INVENTORY                                            */}
          {/* ============================================================ */}
          <TabsContent value="inventory" className="space-y-6">
            {/* Inventory Summary Bar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#002B1B]/10 flex items-center justify-center">
                        <Warehouse className="w-4.5 h-4.5 text-[#002B1B]" />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-gray-500">Total Items</p>
                        <p className="text-sm md:text-lg font-bold text-gray-900">{inventorySummary?.totalItems ?? '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#C59F00]/10 flex items-center justify-center">
                        <GhanaCedi className="w-4.5 h-4.5 text-[#C59F00]" />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-gray-500">Inventory Value</p>
                        <p className="text-sm md:text-lg font-bold text-gray-900">{inventorySummary ? `GH₵${inventorySummary.totalValue.toFixed(0)}` : '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <AlertTriangle className="w-4.5 h-4.5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-gray-500">Low Stock</p>
                        <p className="text-sm md:text-lg font-bold text-gray-900">{inventorySummary?.lowStockCount ?? '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#CE1126]/10 flex items-center justify-center">
                        <AlertOctagon className="w-4.5 h-4.5 text-[#CE1126]" />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-gray-500">Out of Stock</p>
                        <p className="text-sm md:text-lg font-bold text-gray-900">{inventorySummary?.outOfStockCount ?? '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Products List Card */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <BoxesIcon className="w-5 h-5 text-[#002B1B]" />
                    Products
                    {!productLoading && (
                      <Badge variant="secondary" className="text-xs">{products.length}</Badge>
                    )}
                  </CardTitle>
                  <Button
                    onClick={openCreateProduct}
                    className="bg-[#002B1B] hover:bg-[#003D26] text-white rounded-lg gap-2 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                  <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
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
                    <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
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
                      <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 mb-1">No products found</p>
                    <p className="text-sm text-gray-400">Create your first product or adjust filters</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {products.map((product) => {
                      const images = parseImages(product.images)
                      const thumbnail = images[0] || ''
                      const isEditingStock = editingStockId === product.id

                      return (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                            product.active
                              ? 'bg-gray-50 hover:bg-gray-100'
                              : 'bg-gray-50/50 hover:bg-gray-100/70 opacity-70'
                          }`}
                        >
                          {/* Thumbnail */}
                          <ProductImage
                            src={thumbnail}
                            className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex-shrink-0 bg-gray-200"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px] md:max-w-[220px]">
                                {product.name}
                              </p>
                              {product.featured && (
                                <Badge className="bg-[#FCD116] text-[#002B1B] text-[9px] px-1.5 py-0 gap-0.5">
                                  <Star className="w-2.5 h-2.5" /> Featured
                                </Badge>
                              )}
                              <Badge className={`${product.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-[9px] px-1.5 py-0`}>
                                {product.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              <span className="font-mono text-gray-400">{product.sku || product.id}</span> &middot; {product.category?.name || 'Uncategorized'} &middot; {product.condition}
                            </p>
                          </div>

                          {/* Stock (inline quick-edit + quick adjustment buttons on md+) */}
                          <div
                            className="flex-shrink-0 hidden md:flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isEditingStock ? (
                              <Input
                                type="number"
                                min="0"
                                value={editingStockValue}
                                onChange={(e) => setEditingStockValue(e.target.value)}
                                onBlur={() => saveStock(product.id)}
                                onKeyDown={(e) => handleStockKeyDown(e, product.id)}
                                className="w-16 h-7 text-xs text-center"
                                autoFocus
                              />
                            ) : (
                              <>
                                <button
                                  onClick={() => openStockAdjustDialog(product, -10)}
                                  className="text-[10px] font-medium px-1.5 py-1 rounded border border-gray-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                                  title="Remove 10 units"
                                >
                                  -10
                                </button>
                                <button
                                  onClick={() => openStockAdjustDialog(product, -5)}
                                  className="text-[10px] font-medium px-1.5 py-1 rounded border border-gray-200 bg-white text-red-400 hover:bg-red-50 hover:border-red-200 transition-colors"
                                  title="Remove 5 units"
                                >
                                  -5
                                </button>
                                <button
                                  onClick={() => startEditStock(product)}
                                  className={`text-xs font-medium px-2 py-1 rounded-md border transition-colors ${
                                    product.stock < 5
                                      ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                      : 'border-gray-200 bg-white text-gray-600 hover:border-[#C59F00] hover:text-[#C59F00]'
                                  }`}
                                  title="Click to edit stock"
                                >
                                  {product.stock}
                                </button>
                                <button
                                  onClick={() => openStockAdjustDialog(product, 5)}
                                  className="text-[10px] font-medium px-1.5 py-1 rounded border border-gray-200 bg-white text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors"
                                  title="Add 5 units"
                                >
                                  +5
                                </button>
                                <button
                                  onClick={() => openStockAdjustDialog(product, 10)}
                                  className="text-[10px] font-medium px-1.5 py-1 rounded border border-gray-200 bg-white text-green-700 hover:bg-green-50 hover:border-green-200 transition-colors"
                                  title="Add 10 units"
                                >
                                  +10
                                </button>
                              </>
                            )}
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-sm text-[#C59F00]">GH₵{product.price.toFixed(2)}</p>
                            {product.originalPrice && (
                              <p className="text-[10px] text-gray-400 line-through">GH₵{product.originalPrice.toFixed(2)}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-0.5 flex-shrink-0">
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

            {/* Inventory History */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-[#002B1B]" />
                    Inventory History
                    {!inventoryLoading && inventoryHistory.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{inventoryHistory.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {inventoryLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 rounded-lg" />
                      ))}
                    </div>
                  ) : inventoryHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-500 text-sm">No inventory changes recorded yet</p>
                      <p className="text-xs text-gray-400 mt-1">Use the +/- buttons on products to log stock adjustments</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {/* Desktop table */}
                      <div className="hidden md:block rounded-lg border border-gray-100 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500">
                              <th className="text-left py-2.5 px-3 font-medium">Date</th>
                              <th className="text-left py-2.5 px-3 font-medium">Product</th>
                              <th className="text-left py-2.5 px-3 font-medium">SKU</th>
                              <th className="text-center py-2.5 px-3 font-medium">Type</th>
                              <th className="text-center py-2.5 px-3 font-medium">Qty Change</th>
                              <th className="text-center py-2.5 px-3 font-medium">Stock</th>
                              <th className="text-left py-2.5 px-3 font-medium">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inventoryHistory.map((tx) => (
                              <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                                  {new Date(tx.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-2.5 px-3 text-gray-800 font-medium truncate max-w-[180px]">{tx.productName}</td>
                                <td className="py-2.5 px-3 text-gray-400 font-mono">{tx.productSku}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge className={`text-[10px] px-1.5 py-0 ${
                                    tx.type === 'restock' ? 'bg-green-100 text-green-700' :
                                    tx.type === 'correction' ? 'bg-orange-100 text-orange-700' :
                                    tx.type === 'sale' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {tx.type}
                                  </Badge>
                                </td>
                                <td className={`py-2.5 px-3 text-center font-bold ${tx.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                                </td>
                                <td className="py-2.5 px-3 text-center text-gray-600">
                                  <span className="line-through text-gray-400">{tx.previousStock}</span>
                                  <span className="mx-1">&rarr;</span>
                                  <span className="font-semibold text-gray-800">{tx.newStock}</span>
                                </td>
                                <td className="py-2.5 px-3 text-gray-500 truncate max-w-[140px]">{tx.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile card list */}
                      <div className="md:hidden space-y-2">
                        {inventoryHistory.map((tx) => (
                          <div key={tx.id} className="p-3 bg-gray-50 rounded-lg space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-800 truncate max-w-[200px]">{tx.productName}</span>
                              <Badge className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
                                tx.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <span className="font-mono text-gray-400">{tx.productSku}</span>
                              <span>&middot;</span>
                              <span>{tx.previousStock} &rarr; {tx.newStock}</span>
                              <span>&middot;</span>
                              <span className="capitalize">{tx.type}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] text-gray-500 truncate max-w-[200px]">{tx.reason}</p>
                              <span className="text-[10px] text-gray-400 flex-shrink-0">
                                {new Date(tx.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 4: ANALYTICS                                             */}
          {/* ============================================================ */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Orders by Status Bar Chart */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#002B1B]" />
                      Orders by Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-10 rounded-lg" />
                        ))}
                      </div>
                    ) : orderStatuses.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">No order data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {orderStatuses
                          .sort((a, b) => b.count - a.count)
                          .map((item) => {
                            const widthPercent = maxStatusCount > 0 ? (item.count / maxStatusCount) * 100 : 0
                            const percentage = totalStatusOrders > 0 ? ((item.count / totalStatusOrders) * 100).toFixed(1) : '0'
                            return (
                              <motion.div
                                key={item.status}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-1"
                              >
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="capitalize font-medium text-gray-700">{item.status}</span>
                                    <Badge className={`${getStatusColor(item.status)} text-[10px] px-1.5 py-0`}>
                                      {percentage}%
                                    </Badge>
                                  </div>
                                  <span className="font-semibold text-gray-900">{item.count}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${widthPercent}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className={`h-4 rounded-full ${STATUS_BAR_COLORS[item.status] || 'bg-gray-400'}`}
                                  />
                                </div>
                              </motion.div>
                            )
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Revenue Summary */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <GhanaCedi className="w-5 h-5 text-[#C59F00]" />
                      Revenue Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 rounded-lg" />
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Total Revenue Card */}
                        <div className="bg-gradient-to-r from-[#002B1B] to-[#004D2B] rounded-xl p-4 text-white">
                          <p className="text-xs text-white/70">Total Revenue</p>
                          <p className="text-2xl md:text-3xl font-bold mt-1">
                            GH₵{((stats?.totalRevenue || 0)).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs text-white/80">
                              <ShoppingCart className="w-3 h-3" />
                              <span>{stats?.totalOrders || 0} orders</span>
                            </div>
                          </div>
                        </div>

                        {/* Revenue by Month */}
                        {revenueByMonth.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">Monthly Revenue</p>
                            <div className="space-y-2">
                              {revenueByMonth.map((m) => {
                                const maxRev = Math.max(...revenueByMonth.map(r => r.revenue), 1)
                                const widthPercent = (m.revenue / maxRev) * 100
                                return (
                                  <div key={m.month} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600 font-medium">{m.month}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">{m.orders} orders</span>
                                        <span className="font-semibold text-[#C59F00]">GH₵{m.revenue.toFixed(0)}</span>
                                      </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${widthPercent}%` }}
                                        transition={{ duration: 0.5 }}
                                        className="h-2.5 rounded-full bg-gradient-to-r from-[#FCD116] to-[#C59F00]"
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-blue-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-4 h-4 text-blue-500" />
                              <span className="text-xs text-gray-600">Avg Order</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              GH₵{stats && stats.totalOrders > 0
                                ? (stats.totalRevenue / stats.totalOrders).toFixed(2)
                                : '0.00'}
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingDown className="w-4 h-4 text-purple-500" />
                              <span className="text-xs text-gray-600">Pending</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{stats?.pendingOrders || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Orders Count Summary */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-[#002B1B]" />
                      Orders Count by Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-24 rounded-lg" />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {ORDER_STATUSES.map((status) => {
                          const item = orderStatuses.find(s => s.status === status)
                          const count = item?.count || 0
                          return (
                            <motion.div
                              key={status}
                              whileHover={{ scale: 1.03 }}
                              className="rounded-xl border border-gray-100 p-3 text-center hover:shadow-sm transition-shadow"
                            >
                              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                                status === 'delivered' ? 'bg-green-100' :
                                status === 'cancelled' ? 'bg-red-100' :
                                status === 'shipped' ? 'bg-purple-100' :
                                status === 'processing' ? 'bg-blue-100' :
                                status === 'confirmed' ? 'bg-blue-50' :
                                'bg-yellow-100'
                              }`}>
                                {status === 'delivered' && <ShieldCheck className="w-5 h-5 text-green-600" />}
                                {status === 'cancelled' && <X className="w-5 h-5 text-red-600" />}
                                {status === 'shipped' && <Package className="w-5 h-5 text-purple-600" />}
                                {status === 'processing' && <RefreshCw className="w-5 h-5 text-blue-600" />}
                                {status === 'confirmed' && <CreditCard className="w-5 h-5 text-blue-500" />}
                                {status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                              </div>
                              <p className="text-2xl font-bold text-gray-900">{count}</p>
                              <p className="text-xs text-gray-500 capitalize mt-0.5">{status}</p>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ===== PRODUCT CREATE/EDIT DIALOG ===== */}
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
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="prod-name">Product Name *</Label>
                <Input
                  id="prod-name"
                  placeholder="e.g. iPhone 14 Pro Max"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              {/* Category + Condition */}
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

              {/* Price + Original Price + Stock */}
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

              {/* Brand + Warranty */}
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

              {/* Full Description */}
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

              {/* Specs */}
              <div className="grid gap-2">
                <Label htmlFor="prod-specs">Specifications (JSON)</Label>
                <Textarea
                  id="prod-specs"
                  placeholder='{"color": "Black", "storage": "256GB"}'
                  value={formData.specs}
                  onChange={(e) => setFormData((p) => ({ ...p, specs: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Featured Product</Label>
                  <p className="text-xs text-gray-500">Display this product in the featured section</p>
                </div>
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, featured: checked }))}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setProductDialogOpen(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProduct}
                disabled={formSaving || !formData.name || !formData.categoryId || !formData.price}
                className="bg-[#002B1B] hover:bg-[#003D26] text-white rounded-lg"
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

        {/* ===== STOCK ADJUSTMENT DIALOG ===== */}
        <Dialog open={stockAdjustDialogOpen} onOpenChange={setStockAdjustDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                {stockAdjustQty > 0 ? (
                  <>
                    <Plus className="w-5 h-5 text-green-600" />
                    Add Stock
                  </>
                ) : (
                  <>
                    <Minus className="w-5 h-5 text-red-600" />
                    Reduce Stock
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Adjust stock for <span className="font-semibold text-gray-900">{stockAdjustProduct?.name}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Current stock info */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Current Stock</span>
                <span className={`text-sm font-bold ${
                  (stockAdjustProduct?.stock ?? 0) < 5 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {stockAdjustProduct?.stock ?? 0} units
                </span>
              </div>

              {/* Quantity to adjust */}
              <div className="grid gap-2">
                <Label htmlFor="stock-qty">Quantity to {stockAdjustQty > 0 ? 'Add' : 'Remove'}</Label>
                <Input
                  id="stock-qty"
                  type="number"
                  value={stockAdjustQty}
                  onChange={(e) => setStockAdjustQty(parseInt(e.target.value) || 0)}
                  className={`text-center font-bold text-lg h-12 ${
                    stockAdjustQty > 0
                      ? 'text-green-700 border-green-200 focus:border-green-400'
                      : 'text-red-700 border-red-200 focus:border-red-400'
                  }`}
                />
                {stockAdjustProduct && (
                  <p className="text-xs text-gray-500 text-center">
                    New stock will be: <span className="font-semibold text-gray-700">{stockAdjustProduct.stock + stockAdjustQty}</span> units
                  </p>
                )}
              </div>

              {/* Reason dropdown */}
              <div className="grid gap-2">
                <Label>Reason</Label>
                <Select value={stockAdjustReason} onValueChange={setStockAdjustReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Restock">Restock</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                    <SelectItem value="Sold (manual)">Sold (manual)</SelectItem>
                    <SelectItem value="Inventory Count">Inventory Count</SelectItem>
                    <SelectItem value="Return">Return</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom reason text (shown when "Other" is selected) */}
              {stockAdjustReason === 'Other' && (
                <div className="grid gap-2">
                  <Label htmlFor="custom-reason">Custom Reason</Label>
                  <Input
                    id="custom-reason"
                    placeholder="Enter reason..."
                    value={stockAdjustCustomReason}
                    onChange={(e) => setStockAdjustCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStockAdjustDialogOpen(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStockAdjustConfirm}
                disabled={
                  stockAdjustSaving ||
                  stockAdjustQty === 0 ||
                  !stockAdjustReason ||
                  (stockAdjustReason === 'Other' && !stockAdjustCustomReason.trim())
                }
                className={`rounded-lg ${
                  stockAdjustQty > 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-[#CE1126] hover:bg-[#B00E1F] text-white'
                }`}
              >
                {stockAdjustSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm {stockAdjustQty > 0 ? `+${stockAdjustQty}` : stockAdjustQty}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== DELETE CONFIRMATION DIALOG ===== */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2 text-[#CE1126]">
                <AlertTriangle className="w-5 h-5" />
                Delete Product
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <span className="font-semibold text-gray-900">{productToDelete?.name}</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="bg-[#CE1126] hover:bg-[#B00E1F] text-white rounded-lg"
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
    </div>
  )
}
