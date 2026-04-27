'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useAppStore, rehydrateStores } from '@/lib/store'
import { AnimatePresence, motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HomePage from '@/components/pages/HomePage'
import ProductListPage from '@/components/pages/ProductListPage'
import ProductDetailPage from '@/components/pages/ProductDetailPage'
import CartPage from '@/components/pages/CartPage'
import CheckoutPage from '@/components/pages/CheckoutPage'
import OrderConfirmationPage from '@/components/pages/OrderConfirmationPage'
import OrderHistoryPage from '@/components/pages/OrderHistoryPage'
import OrderDetailPage from '@/components/pages/OrderDetailPage'
import AccountPage from '@/components/pages/AccountPage'
import LoginPage from '@/components/pages/LoginPage'
import AdminDashboard from '@/components/pages/AdminDashboard'

const pageComponents: Record<string, React.ComponentType> = {
  home: HomePage,
  products: ProductListPage,
  'product-detail': ProductDetailPage,
  cart: CartPage,
  checkout: CheckoutPage,
  'order-confirmation': OrderConfirmationPage,
  orders: OrderHistoryPage,
  'order-detail': OrderDetailPage,
  login: LoginPage,
  account: AccountPage,
  admin: AdminDashboard,
}

// useSyncExternalStore ensures server returns false (spinner) and client returns true (content)
// without any hydration mismatch
const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export default function Home() {
  const { view, selectedProductId, selectedOrderNumber } = useAppStore()
  const mounted = useHydrated()
  const rehydrated = useRef(false)

  // Rehydrate persisted stores from localStorage on first client mount
  useEffect(() => {
    if (!rehydrated.current) {
      rehydrated.current = true
      rehydrateStores()
    }
  }, [])

  const PageComponent = pageComponents[view] || HomePage

  // Use composite keys to force remount on param changes
  const getAnimKey = () => {
    if (view === 'product-detail') return `${view}-${selectedProductId || ''}`
    if (view === 'order-detail') return `${view}-${selectedOrderNumber || ''}`
    return view
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        {mounted ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={getAnimKey()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <PageComponent />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#FCD116] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
