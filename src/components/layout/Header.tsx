'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, useCartStore, useUserStore, useWishlistStore, type Category } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  ChevronDown,
  LogOut,
  Package,
  Heart,
  Settings,
  MapPin,
  X,
  Sparkles,
} from 'lucide-react'


export default function Header() {
  const { view, searchQuery, setSearchQuery, navigate } = useAppStore()
  const { items, getItemCount } = useCartStore()
  const wishlistItems = useWishlistStore((s) => s.items)
  const { user, logout, isAdmin } = useUserStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [catHovered, setCatHovered] = useState(false)
  // Read welcome dismissed state from sessionStorage in a hydration-safe way
  const welcomeDismissed = useSyncExternalStore(
    (onChange) => {
      window.addEventListener('zonkomi-welcome-change', onChange)
      return () => window.removeEventListener('zonkomi-welcome-change', onChange)
    },
    () => {
      try { return sessionStorage.getItem('zonkomi-welcome-dismissed') === 'true' }
      catch { return false }
    },
    () => false
  )
  const searchInputRef = useRef<HTMLInputElement>(null)
  const catTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const itemCount = getItemCount()

  // Compute welcome visibility — always false on server to avoid hydration mismatch
  const showWelcome = !!(user?.name && !welcomeDismissed)

  const dismissWelcome = () => {
    try { sessionStorage.setItem('zonkomi-welcome-dismissed', 'true') } catch {}
    window.dispatchEvent(new Event('zonkomi-welcome-change'))
  }

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data || []))
      .catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate('products')
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    navigate('products', { categoryId })
    setMobileMenuOpen(false)
    setCatHovered(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Welcome Banner - shown after sign in */}
      <AnimatePresence>
        {showWelcome && user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-gradient-to-r from-[#FCD116] via-[#FFE066] to-[#FCD116]"
          >
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B6914]" />
                <p className="text-sm font-semibold text-[#3D2E00]">
                  Welcome back, <span className="text-[#8B6914]">{user.name.split(' ')[0]}</span>! 
                  <span className="font-normal text-[#5C4400]"> Glad to have you at Zonkomi Shop</span>
                </p>
              </div>
              <button
                onClick={dismissWelcome}
                className="text-[#8B6914] hover:text-[#3D2E00] transition-colors p-1 rounded-full hover:bg-black/5"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar - dark */}
      <div className="bg-[#002B1B] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8">
          <span className="text-gray-300 hidden sm:block">
            Free shipping on orders over GH₵ 500
          </span>
          <div className="flex items-center gap-4 text-gray-300">
            <a href="#" className="hover:text-white transition-colors">Help</a>
            <a href="#" className="hover:text-white transition-colors">Track Order</a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-[#004D2E]">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 h-14">
          {/* Logo */}
          <button
            onClick={() => navigate('home')}
            className="flex-shrink-0 flex items-center gap-1 text-white hover:outline hover:outline-1 hover:outline-white/50 rounded p-1.5 transition-colors"
          >
            <img
              src="/logo.png"
              alt="Zonkomi Shop"
              className="w-9 h-9 rounded-md object-contain"
            />
            <div className="hidden sm:block">
              <div className="text-white font-bold text-lg leading-none">Zonkomi</div>
              <div className="text-gray-300 text-[10px] leading-none">.shop</div>
            </div>
          </button>

          {/* Category dropdown - desktop */}
          <div
            className="hidden lg:block relative"
            onMouseEnter={() => {
              if (catTimeoutRef.current) clearTimeout(catTimeoutRef.current)
              setCatHovered(true)
            }}
            onMouseLeave={() => {
              catTimeoutRef.current = setTimeout(() => setCatHovered(false), 200)
            }}
          >
            <button className="flex items-center gap-1 text-white text-sm hover:outline hover:outline-1 hover:outline-white/50 rounded px-2 py-1.5 transition-colors">
              <Menu className="w-4 h-4" />
              All
              <ChevronDown className="w-3 h-3" />
            </button>
            {catHovered && categories.length > 0 && (
              <div className="absolute top-full left-0 mt-0 w-64 bg-white rounded-b-lg shadow-xl border border-gray-200 py-2 z-50">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#C59F00] transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 flex max-w-2xl">
            <div className="flex-1 relative flex">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search refurbished electronics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-r-none border-0 bg-white text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="submit"
                className="h-10 px-4 bg-[#FCD116] hover:bg-[#D4AA00] text-[#1a1a1a] rounded-l-none border-0"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </form>

          {/* Right icons - desktop */}
          <div className="hidden md:flex items-center gap-1">
            {/* User */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-white text-sm hover:outline hover:outline-1 hover:outline-white/50 rounded px-2 py-1.5 transition-colors">
                  <User className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-[10px] text-gray-300 leading-none">Hello, {user?.name?.split(' ')[0] || 'Sign In'}</div>
                    <div className="text-xs font-bold leading-tight">Account</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('account')}>
                      <Settings className="mr-2 h-4 w-4" />
                      My Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('orders')}>
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    {isAdmin() && (
                      <DropdownMenuItem onClick={() => navigate('admin')} className="text-[#C59F00] font-medium">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('cart')}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      My Cart
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} variant="destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => navigate('login')}>
                      <User className="mr-2 h-4 w-4" />
                      Sign In
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('login')}>
                      Sign Up
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Orders */}
            <button
              onClick={() => user ? navigate('orders') : navigate('login')}
              className="flex items-center gap-1 text-white text-sm hover:outline hover:outline-1 hover:outline-white/50 rounded px-2 py-1.5 transition-colors"
            >
              <Package className="w-5 h-5" />
              <div className="text-left">
                <div className="text-[10px] text-gray-300 leading-none">Returns</div>
                <div className="text-xs font-bold leading-tight">& Orders</div>
              </div>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => navigate('wishlist')}
              className="relative flex items-center text-white hover:outline hover:outline-1 hover:outline-white/50 rounded px-2 py-1.5 transition-colors"
            >
              <div className="relative">
                <Heart className="w-7 h-7" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#CE1126] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                  </span>
                )}
              </div>
              <span className="font-bold text-sm ml-1 hidden xl:block">Wishlist</span>
            </button>

            {/* Cart */}
            <button
              onClick={() => navigate('cart')}
              className="relative flex items-center text-white hover:outline hover:outline-1 hover:outline-white/50 rounded px-2 py-1.5 transition-colors"
            >
              <div className="relative">
                <ShoppingCart className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 bg-[#FCD116] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              </div>
              <span className="font-bold text-sm ml-1 hidden xl:block">Cart</span>
            </button>
          </div>

          {/* Mobile menu + cart */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={() => navigate('wishlist')}
              className="relative text-white p-2"
            >
              <Heart className="w-6 h-6" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#CE1126] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => user ? navigate('cart') : navigate('login')}
              className="relative text-white p-2"
            >
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FCD116] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="text-white p-2">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="bg-[#004D2E] text-white p-4 rounded-none">
                  <SheetTitle className="text-white">
                    <div className="flex items-center gap-2">
                      <img src="/logo.png" alt="Zonkomi Shop" className="w-7 h-7 rounded-md object-contain" />
                      Zonkomi Shop
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto flex-1 py-2">
                  {user ? (
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        navigate('login')
                      }}
                      className="w-full px-4 py-3 bg-[#FCD116] hover:bg-[#D4AA00] text-sm font-medium rounded-lg mx-2 mt-2"
                    >
                      Sign In
                    </button>
                  )}
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Shop by Department
                    </div>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#C59F00] transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <div className="border-t py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      My Account
                    </div>
                    {[
                      { label: 'My Wishlist', icon: Heart, action: () => navigate('wishlist') },
                      { label: 'My Orders', icon: Package, action: () => navigate('orders') },
                      { label: 'My Cart', icon: ShoppingCart, action: () => navigate('cart') },
                      { label: 'My Account', icon: Settings, action: () => navigate('account') },
                      ...(isAdmin() ? [{ label: 'Admin Dashboard', icon: Settings, action: () => navigate('admin') }] : []),
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          setMobileMenuOpen(false)
                          item.action()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        {item.label}
                      </button>
                    ))}
                    {user && (
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false)
                          logout()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Sub-nav - categories on desktop */}
      <nav className="hidden lg:block bg-[#CE1126]">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-10 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => navigate('home')}
            className="text-white text-xs whitespace-nowrap px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
          >
            All
          </button>
          {categories.slice(0, 12).map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="text-white text-xs whitespace-nowrap px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
            >
              {cat.name}
            </button>
          ))}
          <button
            onClick={() => navigate('products')}
            className="text-white text-xs whitespace-nowrap px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
          >
            See All
          </button>
        </div>
      </nav>
    </header>
  )
}
