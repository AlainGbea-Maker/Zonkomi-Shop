// In-memory data store for Vercel deployment (no database needed)
// Data persists only during the serverless function's lifetime

import { products as seedProducts, categories as seedCategories, type SeedProduct, type SeedCategory } from './seed-data'
import { signToken } from './auth-lite'
export { signToken }

// Simple ID generator (no external dependency needed)
function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
}

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

  if (opts.categoryId) {
    filtered = filtered.filter(p => p.categoryId === opts.categoryId)
  } else if (opts.categorySlug) {
    const cat = allCategories.find(c => c.slug === opts.categorySlug)
    if (cat) filtered = filtered.filter(p => p.categoryId === cat.id)
  }

  if (opts.search) {
    const q = opts.search.toLowerCase()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    )
  }

  if (opts.featured === 'true') {
    filtered = filtered.filter(p => p.featured)
  }

  if (opts.minPrice && opts.minPrice > 0) {
    filtered = filtered.filter(p => p.price >= opts.minPrice!)
  }
  if (opts.maxPrice && opts.maxPrice > 0) {
    filtered = filtered.filter(p => p.price <= opts.maxPrice!)
  }

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

// ==================== ADMIN PRODUCT CRUD ====================
export function createProduct(data: {
  name: string
  description: string
  shortDesc?: string
  price: number
  originalPrice?: number
  condition?: string
  categoryId: string
  images?: string[]
  stock?: number
  featured?: boolean
  specs?: string
  brand?: string
  warranty?: string
}): SeedProduct {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const id = generateId('prod')
  const now = new Date().toISOString()

  const product: SeedProduct = {
    id,
    name: data.name,
    slug,
    description: data.description,
    shortDesc: data.shortDesc || null,
    price: data.price,
    originalPrice: data.originalPrice ?? null,
    condition: data.condition || 'Good',
    categoryId: data.categoryId,
    images: data.images ? JSON.stringify(data.images) : '[]',
    stock: data.stock ?? 10,
    rating: 0,
    reviewCount: 0,
    featured: data.featured ?? false,
    specs: data.specs || '{}',
    brand: data.brand || null,
    warranty: data.warranty || '90 Days Warranty',
    active: true,
  }

  allProducts.push(product)
  return product
}

export function updateProduct(id: string, data: Partial<SeedProduct>): SeedProduct | undefined {
  const idx = allProducts.findIndex(p => p.id === id)
  if (idx === -1) return undefined
  Object.assign(allProducts[idx], data)
  return allProducts[idx]
}

export function deleteProduct(id: string): boolean {
  const idx = allProducts.findIndex(p => p.id === id)
  if (idx === -1) return false
  allProducts.splice(idx, 1)
  return true
}

export function toggleProductActive(id: string): SeedProduct | undefined {
  const product = allProducts.find(p => p.id === id)
  if (!product) return undefined
  product.active = !product.active
  return product
}

export function toggleProductFeatured(id: string): SeedProduct | undefined {
  const product = allProducts.find(p => p.id === id)
  if (!product) return undefined
  product.featured = !product.featured
  return product
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

// Lazily ensure demo user exists (avoid calling hashPassword at module init)
export function ensureDemoUser(): StoredUser {
  let user = users.get('demo-user-001')
  if (!user) {
    user = {
      id: 'demo-user-001',
      email: 'demo@zonkomishop.com',
      name: 'Kwame Asante',
      phone: '+233241234567',
      address: '12 Ring Road Central, Osu',
      city: 'Accra',
      state: 'Greater Accra',
      zipCode: 'GA-123',
      country: 'GH',
      role: 'admin',
      password: 'demo123', // plain text ok for in-memory demo
      createdAt: new Date().toISOString(),
    }
    users.set(user.id, user)
  }
  return user
}

// Lazily ensure admin user exists for email/password login
export function ensureAdminUser(): StoredUser {
  let user = users.get('admin-user-001')
  if (!user) {
    user = {
      id: 'admin-user-001',
      email: 'admin@zonkomishop.com',
      name: 'Admin User',
      phone: '+233201234567',
      address: 'Admin HQ, Osu',
      city: 'Accra',
      state: 'Greater Accra',
      zipCode: 'GA-001',
      country: 'GH',
      role: 'admin',
      password: 'admin123', // plain text ok for in-memory demo
      createdAt: new Date().toISOString(),
    }
    users.set(user.id, user)
  }
  return user
}

export function findUserByEmail(email: string): StoredUser | undefined {
  for (const u of users.values()) {
    if (u.email.toLowerCase() === email.toLowerCase()) return u
  }
  return undefined
}

export function createUser(data: { email: string; name: string; phone?: string; address?: string; city?: string; state?: string; zipCode?: string; country?: string; password: string }): StoredUser {
  const id = generateId('user')
  const user: StoredUser = {
    id,
    email: data.email,
    name: data.name,
    phone: data.phone,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    country: data.country || 'GH',
    role: 'customer',
    password: data.password, // plain text ok for in-memory demo
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
  // Ensure admin user exists so it can be logged into
  ensureAdminUser()

  const user = findUserByEmail(email)
  if (!user) return null

  // Simple password check for in-memory demo
  if (password && user.password && user.password !== password) return null

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

export interface StoredOrder {
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

// ==================== SAMPLE DATA (lazy initialization) ====================
let sampleDataInitialized = false

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0)
  return d
}

function ensureSampleUsers(): void {
  const sampleUsers: StoredUser[] = [
    { id: 'user-sample-001', email: 'kojo.mensah@gmail.com', name: 'Kojo Mensah', phone: '+233243456789', address: '24 Oxford Street, Osu', city: 'Accra', state: 'Greater Accra', zipCode: 'GA-234', country: 'GH', role: 'customer', password: 'password123', createdAt: daysAgo(60).toISOString() },
    { id: 'user-sample-002', email: 'ama.boateng@yahoo.com', name: 'Ama Boateng', phone: '+233205678901', address: '15 Kejetia Market Road', city: 'Kumasi', state: 'Ashanti', zipCode: 'AK-112', country: 'GH', role: 'customer', password: 'password123', createdAt: daysAgo(55).toISOString() },
    { id: 'user-sample-003', email: 'kwesi.appiah@hotmail.com', name: 'Kwesi Appiah', phone: '+233267890123', address: '8 Harbour Road, Takoradi', city: 'Takoradi', state: 'Western', zipCode: 'WR-345', country: 'GH', role: 'customer', password: 'password123', createdAt: daysAgo(45).toISOString() },
    { id: 'user-sample-004', email: 'efua.duodu@gmail.com', name: 'Efua Duodu', phone: '+233278901234', address: '42 Tamale Main Street', city: 'Tamale', state: 'Northern', zipCode: 'NR-567', country: 'GH', role: 'customer', password: 'password123', createdAt: daysAgo(35).toISOString() },
    { id: 'user-sample-005', email: 'yaw.osei@outlook.com', name: 'Yaw Osei', phone: '+233209012345', address: '7 Liberation Road', city: 'Accra', state: 'Greater Accra', zipCode: 'GA-678', country: 'GH', role: 'customer', password: 'password123', createdAt: daysAgo(30).toISOString() },
    { id: 'user-sample-006', email: 'abi.baah@gmail.com', name: 'Abigail Baah', phone: '+233240123456', address: '3 High Street, Cape Coast', city: 'Cape Coast', state: 'Central', zipCode: 'CC-901', country: 'GH', role: 'customer', password: 'password123', createdAt: daysAgo(25).toISOString() },
  ]

  for (const u of sampleUsers) {
    if (!users.has(u.id)) {
      users.set(u.id, u)
    }
  }
}

function ensureSampleOrders(): void {
  // Build product lookup for realistic order items
  function lookupProduct(id: string) {
    return allProducts.find(p => p.id === id)
  }

  function parseFirstImage(images: string): string {
    try {
      const arr = JSON.parse(images)
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : '📦'
    } catch {
      return '📦'
    }
  }

  interface SampleOrderDef {
    userId: string
    items: Array<{ productId: string; quantity: number }>
    status: string
    paymentStatus: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
    daysOld: number
    paymentMethod: string
    notes: string | null
  }

  const sampleOrderDefs: SampleOrderDef[] = [
    {
      userId: 'user-sample-001',
      items: [{ productId: 'prod-dell-5520', quantity: 1 }, { productId: 'prod-sony-xm5', quantity: 1 }],
      status: 'delivered',
      paymentStatus: 'paid',
      address: '24 Oxford Street, Osu',
      city: 'Accra',
      state: 'Greater Accra',
      zip: 'GA-234',
      phone: '+233243456789',
      daysOld: 28,
      paymentMethod: 'mobile_money',
      notes: null,
    },
    {
      userId: 'user-sample-002',
      items: [{ productId: 'prod-iphone-13', quantity: 2 }, { productId: 'prod-airpods-pro', quantity: 2 }],
      status: 'delivered',
      paymentStatus: 'paid',
      address: '15 Kejetia Market Road',
      city: 'Kumasi',
      state: 'Ashanti',
      zip: 'AK-112',
      phone: '+233205678901',
      daysOld: 25,
      paymentMethod: 'mobile_money',
      notes: 'Please deliver before 5pm',
    },
    {
      userId: 'user-sample-003',
      items: [{ productId: 'prod-macbook-m1', quantity: 1 }],
      status: 'shipped',
      paymentStatus: 'paid',
      address: '8 Harbour Road, Takoradi',
      city: 'Takoradi',
      state: 'Western',
      zip: 'WR-345',
      phone: '+233267890123',
      daysOld: 5,
      paymentMethod: 'credit_card',
      notes: null,
    },
    {
      userId: 'user-sample-004',
      items: [{ productId: 'prod-ps5', quantity: 1 }, { productId: 'prod-xbox', quantity: 1 }],
      status: 'processing',
      paymentStatus: 'paid',
      address: '42 Tamale Main Street',
      city: 'Tamale',
      state: 'Northern',
      zip: 'NR-567',
      phone: '+233278901234',
      daysOld: 3,
      paymentMethod: 'mobile_money',
      notes: 'Call before delivery',
    },
    {
      userId: 'user-sample-005',
      items: [{ productId: 'prod-samsung-s22', quantity: 1 }, { productId: 'prod-bose-qc45', quantity: 1 }, { productId: 'prod-galaxy-tab', quantity: 1 }],
      status: 'confirmed',
      paymentStatus: 'paid',
      address: '7 Liberation Road',
      city: 'Accra',
      state: 'Greater Accra',
      zip: 'GA-678',
      phone: '+233209012345',
      daysOld: 2,
      paymentMethod: 'credit_card',
      notes: null,
    },
    {
      userId: 'user-sample-006',
      items: [{ productId: 'prod-ipad-air', quantity: 1 }],
      status: 'pending',
      paymentStatus: 'pending',
      address: '3 High Street, Cape Coast',
      city: 'Cape Coast',
      state: 'Central',
      zip: 'CC-901',
      phone: '+233240123456',
      daysOld: 1,
      paymentMethod: 'bank_transfer',
      notes: null,
    },
    {
      userId: 'user-sample-001',
      items: [{ productId: 'prod-thinkpad-x1', quantity: 1 }],
      status: 'delivered',
      paymentStatus: 'paid',
      address: '24 Oxford Street, Osu',
      city: 'Accra',
      state: 'Greater Accra',
      zip: 'GA-234',
      phone: '+233243456789',
      daysOld: 20,
      paymentMethod: 'mobile_money',
      notes: null,
    },
    {
      userId: 'user-sample-003',
      items: [{ productId: 'prod-lg-27-4k', quantity: 2 }],
      status: 'cancelled',
      paymentStatus: 'refunded',
      address: '8 Harbour Road, Takoradi',
      city: 'Takoradi',
      state: 'Western',
      zip: 'WR-345',
      phone: '+233267890123',
      daysOld: 18,
      paymentMethod: 'credit_card',
      notes: 'Customer changed mind',
    },
    {
      userId: 'user-sample-005',
      items: [{ productId: 'prod-hp-840', quantity: 1 }, { productId: 'prod-dell-u2722', quantity: 1 }],
      status: 'delivered',
      paymentStatus: 'paid',
      address: '7 Liberation Road',
      city: 'Accra',
      state: 'Greater Accra',
      zip: 'GA-678',
      phone: '+233209012345',
      daysOld: 15,
      paymentMethod: 'mobile_money',
      notes: null,
    },
    {
      userId: 'user-sample-002',
      items: [{ productId: 'prod-mac-mini', quantity: 1 }, { productId: 'prod-switch', quantity: 1 }],
      status: 'shipped',
      paymentStatus: 'paid',
      address: '15 Kejetia Market Road',
      city: 'Kumasi',
      state: 'Ashanti',
      zip: 'AK-112',
      phone: '+233205678901',
      daysOld: 4,
      paymentMethod: 'mobile_money',
      notes: null,
    },
    {
      userId: 'user-sample-004',
      items: [{ productId: 'prod-canon-r6', quantity: 1 }],
      status: 'pending',
      paymentStatus: 'pending',
      address: '42 Tamale Main Street',
      city: 'Tamale',
      state: 'Northern',
      zip: 'NR-567',
      phone: '+233278901234',
      daysOld: 0,
      paymentMethod: 'bank_transfer',
      notes: 'Awaiting payment confirmation',
    },
    {
      userId: 'user-sample-006',
      items: [{ productId: 'prod-pixel-7', quantity: 1 }, { productId: 'prod-airpods-pro', quantity: 1 }],
      status: 'confirmed',
      paymentStatus: 'paid',
      address: '3 High Street, Cape Coast',
      city: 'Cape Coast',
      state: 'Central',
      zip: 'CC-901',
      phone: '+233240123456',
      daysOld: 1,
      paymentMethod: 'mobile_money',
      notes: null,
    },
  ]

  const TAX_RATE = 0.0833
  const FREE_SHIPPING_THRESHOLD = 50
  const SHIPPING_COST = 9.99

  for (const def of sampleOrderDefs) {
    const createdAt = daysAgo(def.daysOld).toISOString()
    const timestamp = new Date(createdAt).getTime().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const orderNumber = `ZDO-${timestamp}-${random}`
    const id = generateId('order')

    const orderItems: StoredOrderItem[] = []
    let subtotal = 0

    for (const item of def.items) {
      const product = lookupProduct(item.productId)
      const name = product?.name || 'Unknown Product'
      const price = product?.price || 0
      const image = product ? parseFirstImage(product.images) : '📦'

      orderItems.push({
        id: generateId('oi'),
        orderId: id,
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

    const order: StoredOrder = {
      id,
      orderNumber,
      userId: def.userId,
      status: def.status,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress: def.address,
      shippingCity: def.city,
      shippingState: def.state,
      shippingZip: def.zip,
      shippingCountry: 'GH',
      shippingPhone: def.phone,
      paymentMethod: def.paymentMethod,
      paymentStatus: def.paymentStatus,
      notes: def.notes,
      createdAt,
      updatedAt: createdAt,
      orderItems,
    }

    orders.set(id, order)
  }
}

function ensureSampleData(): void {
  if (sampleDataInitialized) return
  sampleDataInitialized = true
  ensureSampleUsers()
  ensureSampleOrders()
}

// ==================== ORDER FUNCTIONS ====================

export function getOrdersByUser(userId: string): StoredOrder[] {
  ensureSampleData()
  const result: StoredOrder[] = []
  for (const o of orders.values()) {
    if (o.userId === userId) result.push(o)
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return result
}

export function getOrderByNumber(orderNumber: string): StoredOrder | undefined {
  ensureSampleData()
  for (const o of orders.values()) {
    if (o.orderNumber === orderNumber) return o
  }
  return undefined
}

export function getAllOrders(opts?: { status?: string; paymentStatus?: string; search?: string; page?: number; limit?: number; sort?: string; order?: string }) {
  ensureSampleData()
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
  ensureSampleData()
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
      id: generateId('oi'),
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
  const id = generateId('order')

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
    shippingCountry: data.shippingCountry || 'GH',
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
    id: generateId('spin'),
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
    id: generateId('review'),
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
  ensureSampleData()

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

  // Top selling products by quantity sold
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

  // Low stock products (stock < 5)
  const lowStockProducts = allProducts
    .filter(p => p.active && p.stock < 5)
    .sort((a, b) => a.stock - b.stock)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stock: p.stock,
      price: p.price,
    }))

  // Top selling products (full version for dashboard)
  const topSellingProducts = topProducts.map(tp => {
    const product = allProducts.find(p => p.id === tp.productId)
    return {
      id: tp.productId,
      name: tp.name,
      image: tp.image,
      totalSold: tp.totalSold,
      revenue: product ? Math.round(tp.totalSold * product.price * 100) / 100 : 0,
    }
  })

  // Revenue by month (last 3 months)
  const now = new Date()
  const revenueByMonth: Array<{ month: string; revenue: number; orders: number }> = []
  for (let i = 2; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const monthStr = monthDate.toLocaleString('en-US', { month: 'short', year: 'numeric' })

    const monthOrders = paidOrders.filter(o => {
      const d = new Date(o.createdAt)
      return d.getFullYear() === year && d.getMonth() === month
    })
    const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0)

    revenueByMonth.push({
      month: monthStr,
      revenue: Math.round(monthRevenue * 100) / 100,
      orders: monthOrders.length,
    })
  }

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
    revenueByMonth,
    lowStockProducts,
    topSellingProducts,
  }
}
