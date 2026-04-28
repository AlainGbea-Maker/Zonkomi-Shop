'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { CheckCircle2, Package, ShoppingBag, MapPin, Phone, Copy, Check } from 'lucide-react'

export default function OrderConfirmationPage() {
  const { selectedOrderNumber, navigate } = useAppStore()
  const today = new Date()
  const fallbackNumber = `ZKS-${[today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`
  const orderNumber = selectedOrderNumber || fallbackNumber
  const [copied, setCopied] = useState(false)

  // Split the order number for nice display: ZKS-YYYYMMDD-NNNN
  const parts = orderNumber.split('-')

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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

        {/* Receipt / Order Number Card */}
        {orderNumber && (
          <Card className="mb-6 border-2 border-dashed border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#FCD116] flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-green-800 uppercase tracking-wider">Receipt Number</span>
              </div>

              {/* Large, scannable order number with visual separation */}
              <div className="bg-white rounded-xl border border-green-200 p-4 mb-3 shadow-sm">
                <p className="font-mono text-2xl md:text-3xl font-bold tracking-wider text-gray-900 select-all">
                  {parts[0]}<span className="text-gray-300">-</span><span className="text-[#C59F00]">{parts[1]}</span><span className="text-gray-300">-</span>{parts[2]}
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={copyOrderNumber}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-green-200 bg-white hover:bg-green-50 transition-colors text-green-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Receipt Number
                  </>
                )}
              </button>
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
