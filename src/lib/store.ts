import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from '@/hooks/use-toast'

// ==================== TYPES ====================
export interface Product {
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
  specs: string
  brand: string | null
  warranty: string
  active: boolean
  sku?: string
  category?: Category
  reviews?: Review[]
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  sortOrder: number
  _count?: { products: number }
}

export interface CartItem {
  id?: string
  userId?: string
  productId: string
  quantity: number
  product?: Product
}

export interface Order {
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

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  name: string
  image: string | null
}

export interface Review {
  id: string
  productId: string
  userId: string
  rating: number
  title: string | null
  comment: string | null
  createdAt: string
  user?: { name: string }
}

export type AppView =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'order-confirmation'
  | 'orders'
  | 'order-detail'
  | 'login'
  | 'account'
  | 'admin'
  | 'info'
  | 'wishlist'

// Shared persist options that skip server-side hydration
// to prevent hydration mismatches from localStorage
const persistOptions = (name: string) => ({
  name,
  storage: createJSONStorage(() => {
    // Only use localStorage on the client
    if (typeof window === 'undefined') {
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }
    }
    return localStorage
  }),
  // Skip automatic hydration - we rehydrate on mount in components
  skipHydration: true,
})

// Rehydrate all persist stores from localStorage (call once on client mount)
export function rehydrateStores() {
  if (typeof window === 'undefined') return
  useCartStore.persist.rehydrate()
  useUserStore.persist.rehydrate()
  useWishlistStore.persist.rehydrate()
  useRecentlyViewedStore.persist.rehydrate()
}

// ==================== CART STORE ====================
interface CartStore {
  items: CartItem[]
  _hydrated: boolean
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  getSubtotal: () => number
  getTax: () => number
  getTotal: () => number
  getShipping: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hydrated: false,
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { productId: product.id, quantity, product }],
          }
        })

        // Show cart notification
        const existingItem = get().items.find((i) => i.productId === product.id)
        const totalQty = existingItem
          ? Math.min((existingItem.quantity - quantity) + quantity, product.stock)
          : quantity
        const wasAlreadyInCart = existingItem !== undefined && totalQty > quantity

        toast({
          title: wasAlreadyInCart ? 'Cart updated' : 'Added to cart',
          description: wasAlreadyInCart
            ? `${product.name} — now ${totalQty} in cart`
            : `${product.name} — GH₵${product.price.toFixed(2)}`,
        })
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }))
      },
      clearCart: () => set({ items: [] }),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.quantity, 0),
      getTax: () => Math.round(get().getSubtotal() * 0.0833 * 100) / 100,
      getTotal: () => get().getSubtotal() + get().getTax() + get().getShipping(),
      getShipping: () => (get().getSubtotal() >= 500 ? 0 : 49.99),
    }),
    persistOptions('zonkomi-cart')
  )
)

// ==================== APP STORE ====================
interface AppStore {
  view: AppView
  selectedProductId: string | null
  selectedCategoryId: string | null
  selectedOrderNumber: string | null
  selectedInfoSlug: string | null
  searchQuery: string
  sortBy: string
  priceRange: [number, number]
  navigate: (view: AppView, params?: { productId?: string; categoryId?: string; orderNumber?: string; infoSlug?: string }) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: string) => void
  setPriceRange: (range: [number, number]) => void
  resetFilters: () => void
}

export const useAppStore = create<AppStore>()((set) => ({
  view: 'home',
  selectedProductId: null,
  selectedCategoryId: null,
  selectedOrderNumber: null,
  selectedInfoSlug: null,
  searchQuery: '',
  sortBy: 'newest',
  priceRange: [0, 5000],
  navigate: (view, params) =>
    set({
      view,
      selectedProductId: params?.productId ?? null,
      selectedCategoryId: params?.categoryId ?? null,
      selectedOrderNumber: params?.orderNumber ?? null,
      selectedInfoSlug: params?.infoSlug ?? null,
    }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  setPriceRange: (priceRange) => set({ priceRange }),
  resetFilters: () => set({ searchQuery: '', sortBy: 'newest', priceRange: [0, 5000] }),
}))

// ==================== USER STORE ====================
interface UserStore {
  user: { id: string; email: string; name: string; phone?: string; address?: string; city?: string; state?: string; zipCode?: string; role?: string } | null
  token: string | null
  _hydrated: boolean
  setUser: (user: any, token?: string) => void
  logout: () => void
  isAdmin: () => boolean
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      _hydrated: false,
      setUser: (user, token) => set({ user, token: token || null }),
      logout: () => set({ user: null, token: null }),
      isAdmin: () => get().user?.role === 'admin',
    }),
    persistOptions('zonkomi-user')
  )
)

// ==================== WISHLIST STORE ====================
interface WishlistStore {
  items: string[]  // product IDs
  addItem: (productId: string) => void
  removeItem: (productId: string) => void
  toggleItem: (productId: string) => void
  hasItem: (productId: string) => boolean
  clearAll: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId) => {
        if (!get().items.includes(productId)) {
          set((state) => ({ items: [...state.items, productId] }))
        }
      },
      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((id) => id !== productId) }))
      },
      toggleItem: (productId) => {
        if (get().items.includes(productId)) {
          get().removeItem(productId)
        } else {
          get().addItem(productId)
        }
      },
      hasItem: (productId) => get().items.includes(productId),
      clearAll: () => set({ items: [] }),
    }),
    persistOptions('zonkomi-wishlist')
  )
)

// ==================== RECENTLY VIEWED STORE ====================
interface RecentlyViewedStore {
  items: string[]  // product IDs, max 20
  addItem: (productId: string) => void
  clearAll: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId) => {
        set((state) => {
          const filtered = state.items.filter((id) => id !== productId)
          return { items: [productId, ...filtered].slice(0, 20) }
        })
      },
      clearAll: () => set({ items: [] }),
    }),
    persistOptions('zonkomi-recently-viewed')
  )
)
