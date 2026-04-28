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

const statusSteps = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

function getStepStatus(currentStatus: string, stepKey: string) {
  const order = statusSteps.findIndex((s) => s.key === currentStatus?.toLowerCase())
  const step = statusSteps.findIndex((s) => s.key === stepKey)
  if (currentStatus?.toLowerCase() === 'cancelled') {
    return step === 0 ? 'completed' : 'cancelled'
  }
  if (order >= step) return 'completed'
  if (order === step - 1) return 'current'
  return 'upcoming'
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

      {/* Status Progress */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Progress</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
              <div
                className="h-full bg-[#FCD116] transition-all duration-500"
                style={{
                  width: order.status?.toLowerCase() === 'cancelled'
                    ? '0%'
                    : `${(statusSteps.findIndex((s) => s.key === order.status?.toLowerCase()) / (statusSteps.length - 1)) * 100}%`,
                }}
              />
            </div>
            {statusSteps.map((step, index) => {
              const stepStatus = getStepStatus(order.status, step.key)
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      stepStatus === 'completed'
                        ? 'bg-[#FCD116] border-[#FCD116] text-white'
                        : stepStatus === 'current'
                        ? 'bg-white border-[#FCD116] text-[#C59F00]'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {stepStatus === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : stepStatus === 'cancelled' ? (
                      <span className="text-xs font-bold text-red-500">&times;</span>
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      stepStatus === 'completed'
                        ? 'text-[#C59F00]'
                        : stepStatus === 'current'
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Ordered on {new Date(order.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </CardContent>
      </Card>

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
