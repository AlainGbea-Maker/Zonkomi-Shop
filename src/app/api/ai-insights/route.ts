import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/middleware'
import {
  getDashboardStats,
  allProducts,
  getAllOrders,
  allCategories,
  getInventorySummary,
  getInventoryHistory,
} from '@/lib/memory-store'
import ZAI from 'z-ai-web-dev-sdk'

// ==================== IN-MEMORY CACHE ====================
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const insightCache = new Map<string, { data: string; timestamp: number }>()

// ==================== SYSTEM PROMPT ====================
const SYSTEM_PROMPT = `You are an expert e-commerce business analyst for Zonkomi Shop, Ghana's leading refurbished electronics marketplace. Provide actionable, specific insights based on the data provided. Use markdown formatting. Be concise but thorough. Focus on practical recommendations that can be implemented immediately. Consider the Ghanaian market context (Mobile Money payments, regional delivery, etc.).`

// ==================== DATA FETCHERS ====================

function getSalesData() {
  const dashboard = getDashboardStats()
  const allOrders = getAllOrders({ limit: 100 })
  const categoryMap = new Map(allCategories.map(c => [c.id, c]))

  // Build detailed order data
  const ordersDetail = allOrders.orders.map(o => ({
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    subtotal: o.subtotal,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    shippingCity: o.shippingCity,
    shippingState: o.shippingState,
    items: o.orderItems.map(oi => ({
      name: oi.name,
      quantity: oi.quantity,
      price: oi.price,
      productId: oi.productId,
    })),
    createdAt: o.createdAt,
  }))

  // Product sales breakdown
  const productSales = new Map<string, { name: string; quantity: number; revenue: number; categoryId: string; categoryName: string }>()
  for (const o of allOrders.orders) {
    if (o.status === 'cancelled') continue
    for (const oi of o.orderItems) {
      const existing = productSales.get(oi.productId) || { name: oi.name, quantity: 0, revenue: 0, categoryId: '', categoryName: '' }
      existing.quantity += oi.quantity
      existing.revenue += oi.price * oi.quantity
      // Look up category
      const product = allProducts.find(p => p.id === oi.productId)
      if (product) {
        existing.categoryId = product.categoryId
        const cat = categoryMap.get(product.categoryId)
        existing.categoryName = cat?.name || 'Unknown'
      }
      productSales.set(oi.productId, existing)
    }
  }

  return {
    stats: dashboard.stats,
    ordersByStatus: dashboard.ordersByStatus,
    revenueByMonth: dashboard.revenueByMonth,
    topSellingProducts: dashboard.topSellingProducts,
    recentOrders: ordersDetail.slice(0, 20),
    productSalesBreakdown: Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue),
    totalOrders: allOrders.pagination.total,
  }
}

function getProductData() {
  const dashboard = getDashboardStats()
  const categoryMap = new Map(allCategories.map(c => [c.id, c.name]))

  // Build product analysis data
  const productsWithInfo = allProducts.filter(p => p.active).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    stock: p.stock,
    category: categoryMap.get(p.categoryId) || 'Unknown',
    condition: p.condition,
    rating: p.rating,
    reviewCount: p.reviewCount,
    featured: p.featured,
    brand: p.brand,
    createdAt: p.createdAt,
    // Calculate discount percentage
    discountPct: p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : 0,
  }))

  // Identify low stock
  const lowStock = productsWithInfo.filter(p => p.stock > 0 && p.stock < 5).sort((a, b) => a.stock - b.stock)
  const outOfStock = productsWithInfo.filter(p => p.stock === 0)

  // Products with no discount that could benefit from one
  const noDiscount = productsWithInfo.filter(p => p.discountPct === 0 && p.stock > 10)

  return {
    totalActiveProducts: dashboard.stats.totalProducts,
    products: productsWithInfo.sort((a, b) => b.stock - a.stock),
    lowStock,
    outOfStock,
    noDiscount,
    featuredProducts: productsWithInfo.filter(p => p.featured),
    categories: Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name, count: productsWithInfo.filter(p => p.category === name).length })),
  }
}

function getCustomerData() {
  const allOrders = getAllOrders({ limit: 200 })

  // Payment method distribution
  const paymentMethods = new Map<string, { count: number; totalAmount: number }>()
  // Geographic distribution
  const regions = new Map<string, { count: number; totalAmount: number }>()
  // Order value stats
  const orderValues: number[] = []

  // Repeat purchase patterns
  const customerOrders = new Map<string, { count: number; totalSpent: number; cities: Set<string> }>()

  for (const order of allOrders.orders) {
    const amount = order.total

    // Payment method
    const pm = paymentMethods.get(order.paymentMethod) || { count: 0, totalAmount: 0 }
    pm.count++
    pm.totalAmount += amount
    paymentMethods.set(order.paymentMethod, pm)

    // Region
    const state = order.shippingState || 'Unknown'
    const region = regions.get(state) || { count: 0, totalAmount: 0 }
    region.count++
    region.totalAmount += amount
    regions.set(state, region)

    // Order values
    if (order.paymentStatus === 'paid' && order.status !== 'cancelled') {
      orderValues.push(amount)
    }

    // Customer repeat tracking
    const cust = customerOrders.get(order.userId) || { count: 0, totalSpent: 0, cities: new Set<string>() }
    cust.count++
    if (order.paymentStatus === 'paid' && order.status !== 'cancelled') {
      cust.totalSpent += amount
    }
    cust.cities.add(order.shippingCity)
    customerOrders.set(order.userId, cust)
  }

  const totalPaid = orderValues.length
  const avgOrderValue = totalPaid > 0 ? orderValues.reduce((a, b) => a + b, 0) / totalPaid : 0
  const maxOrderValue = totalPaid > 0 ? Math.max(...orderValues) : 0
  const minOrderValue = totalPaid > 0 ? Math.min(...orderValues) : 0

  // Repeat customers
  const repeatCustomers = Array.from(customerOrders.values()).filter(c => c.count > 1)
  const newCustomers = Array.from(customerOrders.values()).filter(c => c.count === 1)

  return {
    totalCustomers: customerOrders.size,
    repeatCustomerCount: repeatCustomers.length,
    newCustomerCount: newCustomers.length,
    repeatRate: customerOrders.size > 0 ? (repeatCustomers.length / customerOrders.size) * 100 : 0,
    paymentMethodBreakdown: Array.from(paymentMethods.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      totalAmount: Math.round(data.totalAmount * 100) / 100,
      percentage: allOrders.pagination.total > 0 ? Math.round((data.count / allOrders.pagination.total) * 100) : 0,
    })),
    geographicDistribution: Array.from(regions.entries()).map(([region, data]) => ({
      region,
      orderCount: data.count,
      totalAmount: Math.round(data.totalAmount * 100) / 100,
    })).sort((a, b) => b.orderCount - a.orderCount),
    orderValueStats: {
      average: Math.round(avgOrderValue * 100) / 100,
      max: Math.round(maxOrderValue * 100) / 100,
      min: Math.round(minOrderValue * 100) / 100,
      totalPaidOrders: totalPaid,
    },
    repeatCustomerDetails: repeatCustomers.map(c => ({
      orderCount: c.count,
      totalSpent: Math.round(c.totalSpent * 100) / 100,
      citiesDelivered: Array.from(c.cities),
    })),
  }
}

function getMarketingData() {
  const allOrders = getAllOrders({ limit: 200 })
  const dashboard = getDashboardStats()

  // Order timing analysis
  const dayOfWeekOrders = new Map<string, number>()
  const hourOrders = new Map<number, number>()
  const monthlyOrders = new Map<string, number>()

  for (const order of allOrders.orders) {
    const date = new Date(order.createdAt)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    dayOfWeekOrders.set(dayName, (dayOfWeekOrders.get(dayName) || 0) + 1)

    const hour = date.getHours()
    hourOrders.set(hour, (hourOrders.get(hour) || 0) + 1)

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyOrders.set(monthKey, (monthlyOrders.get(monthKey) || 0) + 1)
  }

  // Top selling products for promo ideas
  const topProducts = dashboard.topSellingProducts.slice(0, 5)

  // Low stock products that could use clearance
  const lowStockForClearance = allProducts.filter(p => p.active && p.stock > 0 && p.stock < 5).slice(0, 5)

  // Current date for Ghana holiday context
  const now = new Date()
  const currentMonth = now.toLocaleDateString('en-US', { month: 'long' })

  return {
    orderTiming: {
      byDayOfWeek: Array.from(dayOfWeekOrders.entries()),
      byHour: Array.from(hourOrders.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
      byMonth: Array.from(monthlyOrders.entries()),
    },
    topProductsForPromotion: topProducts.map(p => ({ name: p.name, totalSold: p.totalSold, revenue: p.revenue })),
    clearanceCandidates: lowStockForClearance.map(p => ({ name: p.name, stock: p.stock, price: p.price })),
    totalCustomers: dashboard.stats.totalUsers,
    totalRevenue: dashboard.stats.totalRevenue,
    totalOrders: dashboard.stats.totalOrders,
    currentMonth,
    storeUrl: 'zonkomishop.com',
  }
}

function getInventoryData() {
  const summary = getInventorySummary()
  const history = getInventoryHistory({ limit: 50 })
  const categoryMap = new Map(allCategories.map(c => [c.id, c.name]))

  // All active products with their data
  const products = allProducts.filter(p => p.active).map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    price: p.price,
    originalPrice: p.originalPrice,
    category: categoryMap.get(p.categoryId) || 'Unknown',
    condition: p.condition,
    value: Math.round(p.price * p.stock * 100) / 100,
    daysSinceCreation: Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
  }))

  // Overstock items (high stock relative to others)
  const avgStock = products.reduce((s, p) => s + p.stock, 0) / products.length
  const overstock = products.filter(p => p.stock > avgStock * 2).sort((a, b) => b.stock - a.stock)

  // Understock (stock < 5)
  const understock = products.filter(p => p.stock > 0 && p.stock < 5).sort((a, b) => a.stock - b.stock)

  // Dead stock analysis (out of stock or very low)
  const deadStock = products.filter(p => p.stock === 0)
  const slowMoving = products.filter(p => p.stock > 0 && p.stock < 3).sort((a, b) => a.stock - b.stock)

  // Category-level inventory
  const categoryInventory = new Map<string, { totalStock: number; totalValue: number; productCount: number; avgPrice: number }>()
  for (const p of products) {
    const cat = categoryInventory.get(p.category) || { totalStock: 0, totalValue: 0, productCount: 0, avgPrice: 0 }
    cat.totalStock += p.stock
    cat.totalValue += p.value
    cat.productCount++
    categoryInventory.set(p.category, cat)
  }
  for (const [, cat] of categoryInventory) {
    cat.avgPrice = cat.productCount > 0 ? Math.round((cat.totalValue / cat.totalStock) * 100) / 100 : 0
  }

  // High-value inventory (stock * price > threshold)
  const highValueItems = products.filter(p => p.value > 5000).sort((a, b) => b.value - a.value).slice(0, 10)

  return {
    summary,
    overstock,
    understock,
    deadStock,
    slowMoving,
    categoryBreakdown: Array.from(categoryInventory.entries()).map(([category, data]) => ({
      category,
      ...data,
      totalValue: Math.round(data.totalValue * 100) / 100,
    })),
    highValueItems,
    recentTransactions: history.transactions.slice(0, 10),
    averageStock: Math.round(avgStock),
  }
}

// ==================== LLM CALL ====================

async function generateInsight(type: string): Promise<string> {
  let data: unknown
  let userPrompt = ''

  switch (type) {
    case 'sales_analysis': {
      data = getSalesData()
      userPrompt = `Analyze the following sales data for Zonkomi Shop and provide:
1. **Key Performance Metrics** - Overall sales health
2. **Top Selling Products** - Best performers and why
3. **Sales Trends** - Patterns in orders and revenue
4. **Revenue Analysis** - Revenue streams and growth areas
5. **Actionable Recommendations** - 3-5 specific things to do to boost sales

Data:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``
      break
    }
    case 'product_recommendations': {
      data = getProductData()
      userPrompt = `Based on the following product data, provide:
1. **Products to Feature** - Which products should be promoted and why
2. **Products to Discount** - Items that need price adjustments
3. **Restock Priority** - Which items need immediate restocking
4. **Category Gaps** - Missing product types or underrepresented categories
5. **Pricing Suggestions** - Specific price recommendations with reasoning

Data:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``
      break
    }
    case 'customer_insights': {
      data = getCustomerData()
      userPrompt = `Analyze the following customer data for Zonkomi Shop and provide:
1. **Repeat Purchase Patterns** - Customer loyalty and retention insights
2. **Payment Preferences** - Popular payment methods and opportunities
3. **Geographic Distribution** - Regional sales patterns and expansion opportunities
4. **Average Order Value Trends** - AOV analysis and upselling opportunities
5. **Customer Engagement Ideas** - How to increase repeat purchases

Data:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``
      break
    }
    case 'marketing_suggestions': {
      data = getMarketingData()
      userPrompt = `Based on the following data, provide marketing recommendations for Zonkomi Shop:
1. **Best Times for Promotions** - Optimal days and times based on order patterns
2. **Email/SMS Campaign Ideas** - Specific campaign concepts with messaging
3. **Social Media Content** - Post ideas for Instagram, Twitter, Facebook Ghana
4. **Seasonal Promotion Planning** - Ghana-specific holidays and events to leverage
5. **Flash Sale Strategy** - Products and timing for flash sales

Data:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``
      break
    }
    case 'inventory_health': {
      data = getInventoryData()
      userPrompt = `Analyze the following inventory data and provide optimization insights:
1. **Overstock Items** - Products with excess stock that need discounting
2. **Understock Items** - Products that need urgent restocking
3. **Dead Stock Analysis** - Items with zero or very low stock to reconsider
4. **Optimal Stock Levels** - Recommended stock levels by category
5. **Inventory Value Optimization** - How to maximize inventory ROI

Data:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``
      break
    }
    default:
      throw new Error(`Unknown insight type: ${type}`)
  }

  const zai = await ZAI.create()

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    thinking: { type: 'disabled' },
  })

  return completion.choices[0]?.message?.content || 'No insights generated. Please try again.'
}

// ==================== API ROUTE ====================

export async function POST(request: Request) {
  return withAdmin(request as any, async () => {
    try {
      const body = await request.json()
      const { type } = body

      const validTypes = ['sales_analysis', 'product_recommendations', 'customer_insights', 'marketing_suggestions', 'inventory_health']

      if (!type || !validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid insight type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }

      // Check cache
      const cached = insightCache.get(type)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({
          type,
          content: cached.data,
          cached: true,
          generatedAt: new Date(cached.timestamp).toISOString(),
        })
      }

      // Generate insight
      const content = await generateInsight(type)

      // Cache the result
      insightCache.set(type, { data: content, timestamp: Date.now() })

      return NextResponse.json({
        type,
        content,
        cached: false,
        generatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('AI Insights error:', error)
      return NextResponse.json(
        { error: 'Failed to generate AI insights. Please try again.' },
        { status: 500 }
      )
    }
  })
}
