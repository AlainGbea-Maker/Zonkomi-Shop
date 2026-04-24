'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useCartStore, useAppStore, useUserStore } from '@/lib/store'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  ClipboardList,
  ShoppingBag,
  Loader2,
  Package,
} from 'lucide-react'

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

const steps = [
  { id: 1, label: 'Shipping', icon: MapPin },
  { id: 2, label: 'Payment', icon: CreditCard },
  { id: 3, label: 'Review', icon: ClipboardList },
]

interface ShippingInfo {
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  country: string
}

interface PaymentInfo {
  cardNumber: string
  expiry: string
  cvv: string
  cardName: string
}

export default function CheckoutPage() {
  const { items, getSubtotal, getTax, getShipping, getTotal, clearCart } = useCartStore()
  const { navigate } = useAppStore()
  const { user } = useUserStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [shipping, setShipping] = useState<ShippingInfo>({
    name: user?.name || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip: user?.zipCode || '',
    phone: user?.phone || '',
    country: 'US',
  })

  const [payment, setPayment] = useState<PaymentInfo>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: user?.name || '',
  })

  const subtotal = getSubtotal()
  const tax = getTax()
  const shippingCost = getShipping()
  const total = getTotal()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-6">Add items to your cart before checking out.</p>
        <Button
          className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full px-8"
          onClick={() => navigate('products')}
        >
          Browse Products
        </Button>
      </div>
    )
  }

  const validateShipping = () => {
    if (!shipping.name || !shipping.address || !shipping.city || !shipping.state || !shipping.zip) {
      setError('Please fill in all required shipping fields')
      return false
    }
    setError('')
    return true
  }

  const validatePayment = () => {
    if (!payment.cardNumber || !payment.expiry || !payment.cvv || !payment.cardName) {
      setError('Please fill in all payment fields')
      return false
    }
    if (payment.cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid card number')
      return false
    }
    setError('')
    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateShipping()) return
    if (currentStep === 2 && !validatePayment()) return
    setCurrentStep((s) => Math.min(3, s + 1))
  }

  const handleBack = () => {
    setError('')
    setCurrentStep((s) => Math.max(1, s - 1))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product?.price || 0,
        name: item.product?.name || '',
        image: item.product?.images || null,
      }))

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          cartItems: orderItems,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingState: shipping.state,
          shippingZip: shipping.zip,
          shippingCountry: shipping.country,
          shippingPhone: shipping.phone,
          paymentMethod: `Card ending in ${payment.cardNumber.slice(-4)}`,
        }),
      })

      if (!res.ok) throw new Error('Failed to create order')

      const data = await res.json()
      clearCart()
      navigate('order-confirmation', { orderNumber: data?.order?.orderNumber || data?.orderNumber || data?.id })
    } catch {
      setError('Failed to place order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16)
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4)
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2)
    }
    return cleaned
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
      {/* Back to cart */}
      <button
        onClick={() => navigate('cart')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#C59F00] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  currentStep >= step.id
                    ? 'bg-[#FCD116] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  currentStep >= step.id ? 'text-[#C59F00]' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 md:w-24 h-0.5 mx-2 mb-6 transition-colors ${
                  currentStep > step.id ? 'bg-[#FCD116]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#C59F00]" />
                      Shipping Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={shipping.name}
                          onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                          placeholder="John Doe"
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Street Address *</Label>
                        <Input
                          id="address"
                          value={shipping.address}
                          onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                          placeholder="123 Main St, Apt 4B"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={shipping.city}
                          onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                          placeholder="New York"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={shipping.state}
                          onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                          placeholder="NY"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip">ZIP Code *</Label>
                        <Input
                          id="zip"
                          value={shipping.zip}
                          onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                          placeholder="10001"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={shipping.phone}
                          onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#C59F00]" />
                      Payment Method
                    </h2>
                    <div className="space-y-4">
                      {/* Visual Card */}
                      <div className="w-full h-44 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
                        <div className="relative">
                          <div className="flex justify-between items-start mb-8">
                            <CreditCard className="w-8 h-8 text-gray-300" />
                            <span className="text-sm text-gray-400">CREDIT CARD</span>
                          </div>
                          <p className="text-lg tracking-widest font-mono mb-6">
                            {payment.cardNumber || '•••• •••• •••• ••••'}
                          </p>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase">Card Holder</p>
                              <p className="text-sm">{payment.cardName || 'YOUR NAME'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase">Expires</p>
                              <p className="text-sm">{payment.expiry || 'MM/YY'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="cardName">Name on Card *</Label>
                          <Input
                            id="cardName"
                            value={payment.cardName}
                            onChange={(e) => setPayment({ ...payment, cardName: e.target.value })}
                            placeholder="John Doe"
                            className="mt-1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="cardNumber">Card Number *</Label>
                          <Input
                            id="cardNumber"
                            value={payment.cardNumber}
                            onChange={(e) =>
                              setPayment({ ...payment, cardNumber: formatCardNumber(e.target.value) })
                            }
                            placeholder="4242 4242 4242 4242"
                            className="mt-1"
                            maxLength={19}
                          />
                        </div>
                        <div>
                          <Label htmlFor="expiry">Expiry Date *</Label>
                          <Input
                            id="expiry"
                            value={payment.expiry}
                            onChange={(e) =>
                              setPayment({ ...payment, expiry: formatExpiry(e.target.value) })
                            }
                            placeholder="MM/YY"
                            className="mt-1"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            value={payment.cvv}
                            onChange={(e) =>
                              setPayment({ ...payment, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })
                            }
                            placeholder="123"
                            className="mt-1"
                            maxLength={4}
                            type="password"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        This is a demo checkout. No real payment will be processed.
                      </p>
                      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-[#C59F00]" />
                      Review Your Order
                    </h2>

                    {/* Items */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Items ({items.length})</h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div
                            key={item.productId}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-12 h-12 rounded bg-gradient-to-br from-[#FCD116] to-[#D4AA00] flex items-center justify-center flex-shrink-0">
                              <span className="text-xl">{getProductEmoji(item.product?.images)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-bold text-[#C59F00]">
                              GH₵{((item.product?.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Shipping */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">Shipping Address</h3>
                        <Button variant="ghost" size="sm" className="text-xs text-[#C59F00]" onClick={() => setCurrentStep(1)}>
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-gray-700">
                        {shipping.name}<br />
                        {shipping.address}<br />
                        {shipping.city}, {shipping.state} {shipping.zip}
                      </p>
                    </div>

                    <Separator />

                    {/* Payment */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">Payment Method</h3>
                        <Button variant="ghost" size="sm" className="text-xs text-[#C59F00]" onClick={() => setCurrentStep(2)}>
                          Edit
                        </Button>
                      </div>
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Card ending in {payment.cardNumber.slice(-4) || '****'}
                      </p>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {currentStep < 3 ? (
              <Button
                className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full"
                onClick={handleNext}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full px-8"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Place Order - GH₵{total.toFixed(2)}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-40 border-gray-200">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">GH₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={shippingCost === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                    {shippingCost === 0 ? 'FREE' : `GH₵{shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">GH₵{tax.toFixed(2)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-[#C59F00]">GH₵{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
