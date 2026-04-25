'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { CheckCircle2, Package, ShoppingBag } from 'lucide-react'

export default function OrderConfirmationPage() {
  const { selectedOrderNumber, navigate } = useAppStore()
  const orderNumber = useMemo(() => {
    if (selectedOrderNumber) return selectedOrderNumber
    return 'ZD-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  }, [selectedOrderNumber])

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center"
        >
          <CheckCircle2 className="w-14 h-14 text-green-500" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Thank You for Your Order!
        </h1>
        <p className="text-gray-500 mb-6">
          Your order has been placed successfully. We&apos;ll send you a confirmation email shortly.
        </p>

        {orderNumber && (
          <Card className="mb-8 border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-xl font-bold text-gray-900 font-mono">{orderNumber}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <Button
            className="w-full bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full h-12"
            onClick={() => navigate('products')}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Continue Shopping
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-full h-12"
            onClick={() => navigate('orders')}
          >
            <Package className="w-5 h-5 mr-2" />
            View My Orders
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
