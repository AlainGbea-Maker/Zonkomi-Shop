'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { CheckCircle2, Package, ShoppingBag, MapPin, Phone } from 'lucide-react'

export default function OrderConfirmationPage() {
  const { selectedOrderNumber, navigate } = useAppStore()
  const reactId = useId()
  const orderNumber = selectedOrderNumber || `ZD-${reactId.slice(-8).toUpperCase()}`

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
          Order Placed Successfully! 🎉
        </h1>
        <p className="text-gray-500 mb-6">
          Thank you for shopping with Zonkomi! Your order has been confirmed and will be delivered to you soon.
        </p>

        {orderNumber && (
          <Card className="mb-6 border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-xl font-bold text-gray-900 font-mono">{orderNumber}</p>
            </CardContent>
          </Card>
        )}

        {/* Delivery info */}
        <Card className="mb-6 border-gray-200">
          <CardContent className="p-4 text-left">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C59F00]" />
              What happens next?
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FCD116] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                <p className="text-sm text-gray-700">You&apos;ll receive an SMS confirmation on your phone with your order details.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FCD116] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                <p className="text-sm text-gray-700">Our team will prepare and package your items for delivery.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FCD116] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                <p className="text-sm text-gray-700">Our delivery partner will contact you before dispatching your order.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Need help */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
          <Phone className="w-4 h-4" />
          <span>Need help? Contact us at <strong className="text-gray-700">+233 XX XXX XXXX</strong></span>
        </div>

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
