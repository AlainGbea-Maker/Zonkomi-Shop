// In-memory data store for Vercel deployment (no database needed)
// Data persists only during the serverless function's lifetime

import { products as seedProducts, categories as seedCategories, type SeedProduct, type SeedCategory } from './seed-data'
import { hashPassword, signToken, verifyToken, comparePassword } from './auth'
import { v4 as uuidv4 } from 'uuid'

// ==================== PRODUCTS & CATEGORIES (seed-based) ====================
export const allProducts: SeedProduct[] = [...seedProducts]
export const allCategories: SeedCategory[] = [...seedCategories]

function getCategoryMap(): Record<string, SeedCategory> {
  const map: Record<string, SeedCategory> = {}
  for (const c of allCategories) map[c.id] = c
  return map
}

export function getProductsFiltered(opts: {
  categorySlug?: string | null
  categoryId?: string | null
  search?: string | null
  sort?: string | null
  featured?: string | null
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}) {
  let filtered = allProducts.filter(p => p.active)

  // Category filter
  if (opts.categoryId) {
    filtered = filtered.filter(p => p.categoryId === opts.categoryId)
  } else if (opts.categorySlug) {
    const cat = allCategories.find(c => c.slug === opts.categorySlug)
    if (cat) filtered = filtered.filter(p => p.categoryId === cat.id)
  }

  // Search filter
  if (opts.search) {
    const q = opts.search.toLowerCase()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    )
  }

  // Featured filter
  if (opts.featured === 'true') {
    filtered = filtered.filter(p => p.featured)
  }

  // Price filter
  if (opts.minPrice && opts.minPrice > 0) {
    filtered = filtered.filter(p => p.price >= opts.minPrice!)
  }
  if (opts.maxPrice && opts.maxPrice > 0) {
    filtered = filtered.filter(p => p.price <= opts.maxPrice!)
  }

  // Sort
  switch (opts.sort) {
    case 'price-asc': filtered.sort((a, b) => a.price - b.price); break
    case 'price-desc': filtered.sort((a, b) => b.price - a.price); break
    case 'rating': filtered.sort((a, b) => b.rating - a.rating); break
    case 'featured': filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break
    default: filtered.sort((a, b) => b.rating - a.rating); break
  }

  const total = filtered.length
  const page = opts.page || 1
  const limit = opts.limit || 12
  const skip = (page - 1) * limit
  const paged = filtered.slice(skip, skip + limit)

  const catMap = getCategoryMap()
  const withCategory = paged.map(p => ({ ...p, category: catMap[p.categoryId] }))

  return {
    products: withCategory,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  }
}

export function getProductDetail(slugOrId: string) {
  const catMap = getCategoryMap()
  const product = allProducts.find(p => p.slug === slugOrId || p.id === slugOrId)
  if (!product) return null
  return { ...product, category: catMap[product.categoryId], reviews: [] }
}

export function getCategoriesWithCount() {
  const counts: Record<string, number> = {}
  for (const p of allProducts) { if (p.active) counts[p.categoryId] = (counts[p.categoryId] || 0) + 1 }
  return allCategories.map(c => ({ ...c, _count: { products: counts[c.id] || 0 } }))
}

// ==================== USERS (in-memory) ====================
interface StoredUser {
  id: string
  email: string
  name: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
  role: string
  password?: string | null
  createdAt: string
}

const users = new Map<string, StoredUser>()

// Pre-create demo user
const demoPassword = hashPassword('demo123')
users.set('demo-user-001', {
  id: 'demo-user-001',
  email: 'demo@zonkomishop.com',
  name: 'Kwame Asante',
  phone: '+233241234567',
  address: '12 Ring Road Central',
  city: 'Accra',
  state: 'Greater Accra',
  zipCode: 'GA-123',
  country: 'GH',
  role: 'customer',
  password: demoPassword,
  createdAt: new Date().toISOString(),
})

export function findUserByEmail(email: string): StoredUser | undefined {
  for (const u of users.values()) {
    if (u.email.toLowerCase() === email.toLowerCase()) return u
  }
  return undefined
}

export function createUser(data: { email: string; name: string; phone?: string; address?: string; city?: string; state?: string; zipCode?: string; country?: string; password: string }): StoredUser {
  const id = `user-${uuidv4()}`
  const user: StoredUser = {
    id,
    email: data.email,
    name: data.name,
    phone: data.phone,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    country: data.country || 'US',
    role: 'customer',
    password: hashPassword(data.password),
    createdAt: new Date().toISOString(),
  }
  users.set(id, user)
  return user
}

export function getUserById(id: string): StoredUser | undefined {
  return users.get(id)
}

export function updateUser(id: string, data: Partial<Pick<StoredUser, 'name' | 'phone' | 'address' | 'city' | 'state' | 'zipCode' | 'country'>>): StoredUser | undefined {
  const user = users.get(id)
  if (!user) return undefined
  Object.assign(user, data)
  return user
}

export function authUser(email: string, password?: string): { user: StoredUser; token: string } | null {
  const user = findUserByEmail(email)
  if (!user) return null

  if (password && user.password) {
    if (!comparePassword(password, user.password)) return null
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role })
  return { user, token }
}

// ==================== ORDERS (in-memory) ====================
interface StoredOrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  name: string
  image: string | null
}

interface StoredOrder {
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
  orderItems: StoredOrderItem[]
}

const orders = new Map<string, StoredOrder>()

export function getOrdersByUser(userId: string): StoredOrder[] {
  const result: StoredOrder[] = []
  for (const o of orders.values()) {
    if (o.userId === userId) result.push(o)
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return result
}

export function getOrderById(id: string): StoredOrder | undefined {
  return orders.get(id)
}

export function getOrderByNumber(orderNumber: string): StoredOrder | undefined {
  for (const o of orders.values()) {
    if (o.orderNumber === orderNumber) return o
  }
  return undefined
}

export function getAllOrders(opts?: { status?: string; paymentStatus?: string; search?: string; page?: number; limit?: number; sort?: string; order?: string }) {
  let filtered = Array.from(orders.values())

  if (opts?.status) filtered = filtered.filter(o => o.status === opts.status)
  if (opts?.paymentStatus) filtered = filtered.filter(o => o.paymentStatus === opts.paymentStatus)
  if (opts?.search) {
    const q = opts.search.toLowerCase()
    filtered = filtered.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.shippingAddress.toLowerCase().includes(q) ||
      o.shippingCity.toLowerCase().includes(q)
    )
  }

  const sortDir = opts?.order === 'asc' ? 1 : -1
  filtered.sort((a, b) => sortDir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))

  const total = filtered.length
  const page = opts?.page || 1
  const limit = opts?.limit || 20
  const skip = (page - 1) * limit
  const paged = filtered.slice(skip, skip + limit)

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0)

  return {
    orders: paged,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary: { totalRevenue, totalOrders: total }
  }
}

export function createOrder(data: {
  userId: string
  cartItems: Array<{ productId: string; quantity: number; name?: string; price?: number; image?: string | null }>
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  shippingCountry?: string
  shippingPhone?: string | null
  paymentMethod?: string
  notes?: string | null
}): StoredOrder {
  const TAX_RATE = 0.0833
  const FREE_SHIPPING_THRESHOLD = 50
  const SHIPPING_COST = 9.99

  const orderItems: StoredOrderItem[] = []
  let subtotal = 0

  for (const item of data.cartItems) {
    const product = allProducts.find(p => p.id === item.productId)
    const name = item.name || product?.name || 'Unknown Product'
    const price = item.price || product?.price || 0
    const image = item.image || (product?.images ? JSON.parse(product.images)[0] : null)

    orderItems.push({
      id: `oi-${uuidv4()}`,
      orderId: '',
      productId: item.productId,
      quantity: item.quantity,
      price,
      name,
      image,
    })
    subtotal += price * item.quantity
  }

  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = Math.round((subtotal + tax + shipping) * 100) / 100

  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const orderNumber = `ZDO-${timestamp}-${random}`

  const now = new Date().toISOString()
  const id = `order-${uuidv4()}`

  const order: StoredOrder = {
    id,
    orderNumber,
    userId: data.userId,
    status: 'confirmed',
    subtotal,
    shipping,
    tax,
    total,
    shippingAddress: data.shippingAddress,
    shippingCity: data.shippingCity,
    shippingState: data.shippingState,
    shippingZip: data.shippingZip,
    shippingCountry: data.shippingCountry || 'US',
    shippingPhone: data.shippingPhone || null,
    paymentMethod: data.paymentMethod || 'credit_card',
    paymentStatus: 'paid',
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now,
    orderItems: orderItems.map(oi => ({ ...oi, orderId: id })),
  }

  orders.set(id, order)
  return order
}

export function updateOrderStatus(orderNumber: string, updates: Partial<Pick<StoredOrder, 'status' | 'paymentStatus' | 'notes'>>): StoredOrder | undefined {
  const order = getOrderByNumber(orderNumber)
  if (!order) return undefined
  Object.assign(order, updates, { updatedAt: new Date().toISOString() })
  return order
}

export function deleteOrderByNumber(orderNumber: string): boolean {
  const order = getOrderByNumber(orderNumber)
  if (!order) return false
  return orders.delete(order.id)
}

// ==================== SPINS (in-memory) ====================
interface SpinRecord {
  id: string
  sessionId: string
  userId: string | null
  prize: string
  prizeType: string
  prizeValue: number
  code: string | null
  used: boolean
  createdAt: string
}

const spins: SpinRecord[] = []

export function getSpinsForSession(sessionId: string, withinHours = 24): SpinRecord[] {
  const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000)
  return spins.filter(s => s.sessionId === sessionId && new Date(s.createdAt) >= cutoff)
}

export function addSpin(data: { sessionId: string; userId?: string; prize: string; prizeType: string; prizeValue: number; code: string | null }): SpinRecord {
  const record: SpinRecord = {
    id: `spin-${uuidv4()}`,
    sessionId: data.sessionId,
    userId: data.userId || null,
    prize: data.prize,
    prizeType: data.prizeType,
    prizeValue: data.prizeValue,
    code: data.code,
    used: false,
    createdAt: new Date().toISOString(),
  }
  spins.push(record)
  return record
}

// ==================== REVIEWS (in-memory) ====================
interface StoredReview {
  id: string
  productId: string
  userId: string
  rating: number
  title: string | null
  comment: string | null
  active: boolean
  createdAt: string
  user?: { id: string; name: string }
}

const reviews: StoredReview[] = []

export function getReviewsByProduct(productId: string, opts?: { page?: number; limit?: number }) {
  const filtered = reviews.filter(r => r.productId === productId && r.active)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = filtered.length
  const page = opts?.page || 1
  const limit = opts?.limit || 10
  const skip = (page - 1) * limit
  const paged = filtered.slice(skip, skip + limit)

  const avgRating = filtered.length > 0 ? filtered.reduce((s, r) => s + r.rating, 0) / filtered.length : 0

  return {
    reviews: paged,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    average: Math.round(avgRating * 10) / 10,
    totalReviews: filtered.length,
  }
}

export function createReview(data: { productId: string; userId: string; rating: number; title?: string; comment?: string }): StoredReview | null {
  const existing = reviews.find(r => r.userId === data.userId && r.productId === data.productId)
  if (existing) return null

  const user = getUserById(data.userId)
  const review: StoredReview = {
    id: `review-${uuidv4()}`,
    productId: data.productId,
    userId: data.userId,
    rating: data.rating,
    title: data.title || null,
    comment: data.comment || null,
    active: true,
    createdAt: new Date().toISOString(),
    user: user ? { id: user.id, name: user.name } : undefined,
  }
  reviews.push(review)
  return review
}

export function deleteReview(reviewId: string, userId: string): boolean {
  const idx = reviews.findIndex(r => r.id === reviewId && r.userId === userId)
  if (idx === -1) return false
  reviews.splice(idx, 1)
  return true
}

// ==================== DASHBOARD STATS ====================
export function getDashboardStats() {
  const allOrders = Array.from(orders.values())
  const paidOrders = allOrders.filter(o => o.paymentStatus === 'paid')
  const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0)
  const pendingOrders = allOrders.filter(o => o.status === 'pending').length
  const recentOrders = allOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  const ordersByStatus: Record<string, number> = {}
  for (const o of allOrders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1
  }

  // Count product sales from order items
  const productSales: Record<string, number> = {}
  for (const o of allOrders) {
    for (const oi of o.orderItems) {
      productSales[oi.productId] = (productSales[oi.productId] || 0) + oi.quantity
    }
  }
  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([productId, totalSold]) => {
      const product = allProducts.find(p => p.id === productId)
      return {
        productId,
        name: product?.name || 'Unknown',
        image: product?.images || '[]',
        totalSold,
      }
    })

  return {
    stats: {
      totalProducts: allProducts.filter(p => p.active).length,
      totalOrders: allOrders.length,
      totalUsers: users.size,
      totalRevenue,
      pendingOrders,
    },
    recentOrders,
    topProducts,
    ordersByStatus: Object.entries(ordersByStatus).map(([status, count]) => ({ status, count })),
    revenueByMonth: [],
  }
}
