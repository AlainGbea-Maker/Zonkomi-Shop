'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type Order } from '@/lib/store'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Truck,
  Package,
  CreditCard,
  MapPin,
  Copy,
  Check,
  Clock,
  XCircle,
  ClipboardCheck,
  Loader2,
} from 'lucide-react'

// Reusable receipt number badge with copy functionality
function ReceiptBadge({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false)
  const parts = orderNumber.split('-')

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="font-mono text-base font-bold tracking-wide text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
        {parts[0]}<span className="text-gray-300">-</span><span className="text-[#C59F00]">{parts[1]}</span><span className="text-gray-300">-</span>{parts[2]}
      </span>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
        title="Copy receipt number"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

function getProductEmoji(images: string | null | undefined, fallback = '📦'): string {
  if (!images) return fallback
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
    if (typeof parsed === 'string') return parsed
    return fallback
  } catch {
    return images || fallback
  }
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'processing': return 'bg-blue-100 text-blue-800'
    case 'shipped': return 'bg-purple-100 text-purple-800'
    case 'delivered': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const timelineSteps = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: ClipboardCheck },
  { key: 'processing', label: 'Processing', icon: Loader2 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
]

function getStepStatus(currentStatus: string, stepKey: string): 'completed' | 'current' | 'upcoming' | 'cancelled' {
  const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
  const orderIdx = statusOrder.indexOf(currentStatus?.toLowerCase())
  const stepIdx = statusOrder.indexOf(stepKey)

  if (currentStatus?.toLowerCase() === 'cancelled') {
    return stepIdx === 0 ? 'completed' : 'cancelled'
  }
  if (orderIdx >= stepIdx) return 'completed'
  if (orderIdx === stepIdx - 1) return 'current'
  return 'upcoming'
}

function estimateStepDate(createdAt: string, stepIndex: number): string {
  const created = new Date(createdAt)
  const offsets = [0, 0.5, 1, 2, 4] // hours offset from creation
  const date = new Date(created.getTime() + offsets[stepIndex] * 60 * 60 * 1000)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function OrderDetailPage() {
  const { selectedOrderNumber, navigate } = useAppStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedOrderNumber) {
      navigate('orders')
      return
    }
    let cancelled = false
    fetch(`/api/orders/${selectedOrderNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setOrder(data)
      })
      .catch(() => {
        if (!cancelled) navigate('orders')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedOrderNumber, navigate])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Back */}
      <button
        onClick={() => navigate('orders')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#C59F00] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <ReceiptBadge orderNumber={order.orderNumber} />
        </div>
        <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
        </Badge>
      </div>

      {/* Order Status Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-6">Order Progress</h2>

            {/* Cancelled notice */}
            {order.status?.toLowerCase() === 'cancelled' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6"
              >
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Order Cancelled</p>
                  <p className="text-xs text-red-600">This order has been cancelled. Contact customer service for assistance.</p>
                </div>
              </motion.div>
            )}

            {/* Timeline */}
            <div className="relative">
              {/* Connecting line background */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 hidden sm:block" />
              {/* Connecting line progress */}
              <div
                className="absolute top-5 left-5 h-0.5 hidden sm:block transition-all duration-700"
                style={{
                  backgroundColor: order.status?.toLowerCase() === 'cancelled' ? '#CE1126' : '#002B1B',
                  width: order.status?.toLowerCase() === 'cancelled'
                    ? '0%'
                    : `${(timelineSteps.findIndex((s) => s.key === order.status?.toLowerCase()) / (timelineSteps.length - 1)) * 100}%`,
                }}
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4 sm:gap-0">
                {timelineSteps.map((step, index) => {
                  const stepStatus = getStepStatus(order.status, step.key)
                  const StepIcon = step.icon
                  return (
                    <motion.div
                      key={step.key}
                      className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0 relative z-10 flex-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0">
                        {/* Circle */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all duration-300 ${
                            stepStatus === 'completed'
                              ? 'bg-[#002B1B] border-[#002B1B] text-white'
                              : stepStatus === 'current'
                              ? 'bg-white border-[#002B1B] text-[#002B1B] ring-2 ring-[#002B1B]/20'
                              : stepStatus === 'cancelled'
                              ? 'bg-white border-red-300 text-red-500'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}
                        >
                          {stepStatus === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : stepStatus === 'cancelled' ? (
                            <XCircle className="w-5 h-5" />
                          ) : stepStatus === 'current' ? (
                            <StepIcon className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </div>
                        {/* Label + date */}
                        <div className="sm:mt-2 sm:text-center">
                          <span
                            className={`text-xs font-medium block ${
                              stepStatus === 'completed'
                                ? 'text-[#002B1B]'
                                : stepStatus === 'current'
                                ? 'text-gray-900 font-semibold'
                                : stepStatus === 'cancelled'
                                ? 'text-red-500'
                                : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                          {(stepStatus === 'completed' || (stepStatus === 'current' && index === 0)) && (
                            <span className="text-[10px] text-gray-500 mt-0.5 block">
                              {estimateStepDate(order.createdAt, index)}
                            </span>
                          )}
                          {stepStatus === 'current' && index > 0 && (
                            <span className="text-[10px] text-[#C59F00] mt-0.5 block font-medium">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-6 text-center">
              Ordered on {new Date(order.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">
                Items ({order.orderItems?.length || 0})
              </h2>
              <div className="space-y-3">
                {order.orderItems?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#FCD116] to-[#D4AA00] flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{getProductEmoji(item.image)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      GH₵{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Shipping Address */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C59F00]" />
                Shipping Address
              </h3>
              <p className="text-sm text-gray-700">
                {order.shippingAddress}<br />
                {order.shippingCity}, {order.shippingState} {order.shippingZip}<br />
                {order.shippingCountry}
              </p>
              {order.shippingPhone && (
                <p className="text-sm text-gray-500 mt-1">{order.shippingPhone}</p>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C59F00]" />
                Payment
              </h3>
              <p className="text-sm text-gray-700">{order.paymentMethod || 'N/A'}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {order.paymentStatus || 'Paid'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Order Totals</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>GH₵{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className={order.shipping === 0 ? 'text-green-600' : ''}>
                  {order.shipping === 0 ? 'FREE' : `GH₵{order.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>GH₵{order.tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#C59F00]">GH₵{order.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
