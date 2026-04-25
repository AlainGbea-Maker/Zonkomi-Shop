'use client'

import { useSyncExternalStore } from 'react'
import { useAppStore } from '@/lib/store'
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
}

export default function Home() {
  const { view, selectedProductId, selectedOrderNumber } = useAppStore()
  const emptySubscribe = () => () => {}
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false)

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
        {hydrated ? (
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
