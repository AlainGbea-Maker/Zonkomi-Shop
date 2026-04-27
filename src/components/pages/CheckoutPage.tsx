'use client'

import { useState, useEffect } from 'react'
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
  Smartphone,
  Truck,
  ShieldCheck,
  Phone,
  Tag,
  X,
} from 'lucide-react'

function parseImages(images: string | null | undefined): string[] {
  if (!images) return []
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    if (Array.isArray(parsed)) return parsed
    if (typeof parsed === 'string') return [parsed]
    return []
  } catch {
    return [images]
  }
}

function isImageUrl(str: string): boolean {
  return str.startsWith('/uploads/') || str.startsWith('http')
}

function getEmojiFallback(images: string | null | undefined, fallback = '📦'): string {
  const parsed = parseImages(images)
  for (const img of parsed) {
    if (!isImageUrl(img)) return img
  }
  return fallback
}

function ProductThumb({ images, name }: { images: string | null | undefined; name: string }) {
  const imgs = parseImages(images)
  const realImg = imgs.find(isImageUrl)
  if (realImg) {
    return (
      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img src={realImg} alt={name} className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div className="w-12 h-12 rounded bg-gradient-to-br from-[#FCD116] to-[#D4AA00] flex items-center justify-center flex-shrink-0">
      <span className="text-xl">{getEmojiFallback(images)}</span>
    </div>
  )
}

const steps = [
  { id: 1, label: 'Shipping', icon: MapPin },
  { id: 2, label: 'Payment', icon: CreditCard },
  { id: 3, label: 'Review', icon: ClipboardList },
]

const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Savannah',
  'North East',
  'Oti',
  'Western North',
]

type PaymentMethod = 'mtn_momo' | 'vodafone_cash' | 'airteltigo_money' | 'card' | 'cash_on_delivery'

interface PaymentOption {
  id: PaymentMethod
  label: string
  subtitle: string
  icon: string
  color: string
  bgColor: string
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'mtn_momo',
    label: 'MTN Mobile Money',
    subtitle: 'Pay with MTN MoMo',
    icon: '📱',
    color: 'text-yellow-600',
    bgColor: 'border-yellow-400 bg-yellow-50',
  },
  {
    id: 'vodafone_cash',
    label: 'Vodafone Cash',
    subtitle: 'Pay with VF Cash',
    icon: '📲',
    color: 'text-red-600',
    bgColor: 'border-red-400 bg-red-50',
  },
  {
    id: 'airteltigo_money',
    label: 'AirtelTigo Money',
    subtitle: 'Pay with AT Money',
    icon: '☎️',
    color: 'text-blue-600',
    bgColor: 'border-blue-400 bg-blue-50',
  },
  {
    id: 'card',
    label: 'Visa / Mastercard',
    subtitle: 'Debit or Credit Card',
    icon: '💳',
    color: 'text-purple-600',
    bgColor: 'border-purple-400 bg-purple-50',
  },
  {
    id: 'cash_on_delivery',
    label: 'Cash on Delivery',
    subtitle: 'Pay when you receive',
    icon: '💵',
    color: 'text-green-600',
    bgColor: 'border-green-400 bg-green-50',
  },
]

interface ShippingInfo {
  name: string
  address: string
  city: string
  region: string
  phone: string
  additionalInfo: string
}

export default function CheckoutPage() {
  const { items, getSubtotal, getTax, getShipping, getTotal, clearCart } = useCartStore()
  const { navigate } = useAppStore()
  const { user } = useUserStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string; type: string; value: number; name: string; minOrder?: number
  } | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')

  // Load coupon from localStorage (from wheel spin)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zonkomi-coupon')
      if (saved) {
        const coupon = JSON.parse(saved)
        setCouponInput(coupon.code)
      }
    } catch {
      // ignore
    }
  }, [])

  const [shipping, setShipping] = useState<ShippingInfo>({
    name: user?.name || '',
    address: user?.address || '',
    city: user?.city || '',
    region: user?.state || '',
    phone: user?.phone || '',
    additionalInfo: '',
  })

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('mtn_momo')
  const [momoPhone, setMomoPhone] = useState(user?.phone || '')
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: user?.name || '',
  })

  const subtotal = getSubtotal()
  const tax = getTax()
  const shippingCost = getShipping()

  // Calculate discount from coupon
  const getDiscount = () => {
    if (!appliedCoupon) return 0
    if (appliedCoupon.type === 'percent') return Math.round(subtotal * appliedCoupon.value / 100 * 100) / 100
    if (appliedCoupon.type === 'fixed') {
      if (appliedCoupon.minOrder && subtotal < appliedCoupon.minOrder) return 0
      return Math.min(appliedCoupon.value, subtotal)
    }
    if (appliedCoupon.type === 'shipping') return shippingCost
    return 0
  }

  const discount = getDiscount()
  const discountedSubtotal = subtotal - discount
  const finalShipping = appliedCoupon?.type === 'shipping' ? 0 : shippingCost
  const adjustedSubtotal = discountedSubtotal
  const finalTax = Math.round(adjustedSubtotal * 0.0833 * 100) / 100
  const total = adjustedSubtotal + finalTax + finalShipping

  const applyCoupon = () => {
    setCouponError('')
    const code = couponInput.trim().toUpperCase()
    if (!code) return

    // Validate against saved coupons
    try {
      const saved = localStorage.getItem('zonkomi-coupon')
      if (saved) {
        const coupon = JSON.parse(saved)
        if (coupon.code.toUpperCase() === code) {
          if (coupon.minOrder && subtotal < coupon.minOrder) {
            setCouponError(`Minimum order of GH₵${coupon.minOrder} required`)
            return
          }
          setAppliedCoupon(coupon)
          setCouponCode(coupon.code)
          return
        }
      }
    } catch {
      // ignore
    }
    setCouponError('Invalid coupon code. Try spinning the wheel!')
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

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
    if (!shipping.name.trim()) {
      setError('Please enter your full name')
      return false
    }
    if (!shipping.address.trim()) {
      setError('Please enter your delivery address')
      return false
    }
    if (!shipping.city.trim()) {
      setError('Please enter your city')
      return false
    }
    if (!shipping.region.trim()) {
      setError('Please select your region')
      return false
    }
    if (!shipping.phone.trim() || shipping.phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid Ghana phone number (e.g. 024 XXX XXXX)')
      return false
    }
    setError('')
    return true
  }

  const validatePayment = () => {
    if (selectedPayment === 'mtn_momo' || selectedPayment === 'vodafone_cash' || selectedPayment === 'airteltigo_money') {
      if (!momoPhone.trim() || momoPhone.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid mobile money number')
        return false
      }
    }
    if (selectedPayment === 'card') {
      if (!cardInfo.cardNumber || !cardInfo.expiry || !cardInfo.cvv || !cardInfo.cardName) {
        setError('Please fill in all card details')
        return false
      }
      if (cardInfo.cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid card number')
        return false
      }
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

  const getPaymentLabel = () => {
    const opt = paymentOptions.find((p) => p.id === selectedPayment)
    if (!opt) return 'Card'
    if (selectedPayment === 'mtn_momo' || selectedPayment === 'vodafone_cash' || selectedPayment === 'airteltigo_money') {
      return `${opt.label} (${momoPhone.replace(/\D/g, '').slice(-9)})`
    }
    if (selectedPayment === 'card') {
      return `Card ending in ${cardInfo.cardNumber.replace(/\s/g, '').slice(-4) || '****'}`
    }
    return opt.label
  }

  const getPaymentMethodForOrder = () => {
    const opt = paymentOptions.find((p) => p.id === selectedPayment)
    if (selectedPayment === 'mtn_momo' || selectedPayment === 'vodafone_cash' || selectedPayment === 'airteltigo_money') {
      return `${opt?.label} - ${momoPhone.replace(/\D/g, '').slice(-9)}`
    }
    if (selectedPayment === 'card') {
      return `Card - ${cardInfo.cardNumber.replace(/\s/g, '').slice(-4)}`
    }
    return opt?.label || 'Cash on Delivery'
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
          shippingState: shipping.region,
          shippingZip: shipping.region,
          shippingCountry: 'GH',
          shippingPhone: shipping.phone,
          paymentMethod: getPaymentMethodForOrder(),
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

  const formatGhanaPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10)
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
              {/* ====== STEP 1: SHIPPING ====== */}
              {currentStep === 1 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#C59F00]" />
                      Delivery Information
                    </h2>

                    {/* Ghana flag badge */}
                    <div className="flex items-center gap-2 mb-5 p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-2xl">🇬🇭</span>
                      <div>
                        <p className="text-sm font-semibold text-green-800">Delivering within Ghana</p>
                        <p className="text-xs text-green-600">Free delivery on orders over GH₵ 500</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={shipping.name}
                          onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                          placeholder="e.g. Kwame Asante"
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="phone">Phone Number * <span className="text-xs text-gray-400 font-normal">(required for delivery & mobile money)</span></Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+233</span>
                          <Input
                            id="phone"
                            value={shipping.phone}
                            onChange={(e) => setShipping({ ...shipping, phone: formatGhanaPhone(e.target.value) })}
                            placeholder="24 XXX XXXX"
                            className="pl-14"
                            maxLength={10}
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Delivery Address *</Label>
                        <Input
                          id="address"
                          value={shipping.address}
                          onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                          placeholder="e.g. House 12, Ring Road Central, East Legon"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City / Town *</Label>
                        <Input
                          id="city"
                          value={shipping.city}
                          onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                          placeholder="e.g. Accra, Kumasi"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="region">Region *</Label>
                        <select
                          id="region"
                          value={shipping.region}
                          onChange={(e) => setShipping({ ...shipping, region: e.target.value })}
                          className="mt-1 w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#FCD116] focus:border-transparent"
                        >
                          <option value="">Select Region</option>
                          {GHANA_REGIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="additionalInfo">Additional Delivery Notes</Label>
                        <Input
                          id="additionalInfo"
                          value={shipping.additionalInfo}
                          onChange={(e) => setShipping({ ...shipping, additionalInfo: e.target.value })}
                          placeholder="e.g. Near the filling station, 2nd gate on the left"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
                  </CardContent>
                </Card>
              )}

              {/* ====== STEP 2: PAYMENT ====== */}
              {currentStep === 2 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#C59F00]" />
                      Payment Method
                    </h2>

                    {/* Payment Options Grid */}
                    <div className="space-y-3 mb-6">
                      {paymentOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedPayment(option.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            selectedPayment === option.id
                              ? `${option.bgColor} border-current shadow-sm`
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm flex-shrink-0 border border-gray-100">
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{option.label}</p>
                            <p className="text-xs text-gray-500">{option.subtitle}</p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              selectedPayment === option.id
                                ? 'border-[#FCD116] bg-[#FCD116]'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedPayment === option.id && (
                              <Check className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Mobile Money Form */}
                    {(selectedPayment === 'mtn_momo' || selectedPayment === 'vodafone_cash' || selectedPayment === 'airteltigo_money') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-gray-50 rounded-xl border space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Smartphone className="w-5 h-5 text-[#C59F00]" />
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {paymentOptions.find((p) => p.id === selectedPayment)?.label} Details
                            </h3>
                          </div>

                          <div>
                            <Label htmlFor="momoPhone">Mobile Money Number *</Label>
                            <div className="relative mt-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+233</span>
                              <Input
                                id="momoPhone"
                                value={momoPhone}
                                onChange={(e) => setMomoPhone(formatGhanaPhone(e.target.value))}
                                placeholder="24 XXX XXXX"
                                className="pl-14"
                                maxLength={10}
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-xs text-amber-800 flex items-start gap-2">
                              <span className="text-base flex-shrink-0">💡</span>
                              <span>
                                An MoMo prompt will be sent to your phone to confirm payment.
                                Please ensure you have sufficient balance and your MoMo is active.
                              </span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Card Form */}
                    {selectedPayment === 'card' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-gray-50 rounded-xl border space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="w-5 h-5 text-[#C59F00]" />
                            <h3 className="font-semibold text-gray-900 text-sm">Card Details</h3>
                            <div className="flex gap-2 ml-auto">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">VISA</Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">MASTERCARD</Badge>
                            </div>
                          </div>

                          {/* Visual Card */}
                          <div className="w-full h-40 bg-gradient-to-br from-[#002B1B] via-[#004D2E] to-[#006B3F] rounded-xl p-5 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FCD116]/10 rounded-full -translate-y-10 translate-x-10" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FCD116]/10 rounded-full translate-y-10 -translate-x-10" />
                            <div className="relative">
                              <div className="flex justify-between items-start mb-6">
                                <CreditCard className="w-7 h-7 text-[#FCD116]/60" />
                                <span className="text-xs text-white/60 font-medium">DEBIT / CREDIT</span>
                              </div>
                              <p className="text-base tracking-widest font-mono mb-4">
                                {cardInfo.cardNumber || '•••• •••• •••• ••••'}
                              </p>
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-[9px] text-white/50 uppercase">Card Holder</p>
                                  <p className="text-xs">{cardInfo.cardName || 'YOUR NAME'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-white/50 uppercase">Expires</p>
                                  <p className="text-xs">{cardInfo.expiry || 'MM/YY'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                              <Label htmlFor="cardName">Name on Card *</Label>
                              <Input
                                id="cardName"
                                value={cardInfo.cardName}
                                onChange={(e) => setCardInfo({ ...cardInfo, cardName: e.target.value })}
                                placeholder="Name on card"
                                className="mt-1"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor="cardNumber">Card Number *</Label>
                              <Input
                                id="cardNumber"
                                value={cardInfo.cardNumber}
                                onChange={(e) => setCardInfo({ ...cardInfo, cardNumber: formatCardNumber(e.target.value) })}
                                placeholder="0000 0000 0000 0000"
                                className="mt-1"
                                maxLength={19}
                              />
                            </div>
                            <div>
                              <Label htmlFor="expiry">Expiry Date *</Label>
                              <Input
                                id="expiry"
                                value={cardInfo.expiry}
                                onChange={(e) => setCardInfo({ ...cardInfo, expiry: formatExpiry(e.target.value) })}
                                placeholder="MM/YY"
                                className="mt-1"
                                maxLength={5}
                              />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV *</Label>
                              <Input
                                id="cvv"
                                value={cardInfo.cvv}
                                onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                placeholder="123"
                                className="mt-1"
                                maxLength={4}
                                type="password"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Cash on Delivery Info */}
                    {selectedPayment === 'cash_on_delivery' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                          <div className="flex items-start gap-3">
                            <Truck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h3 className="font-semibold text-green-800 text-sm">Cash on Delivery</h3>
                              <p className="text-xs text-green-700 mt-1">
                                Pay with cash when your order is delivered to your doorstep. Please have the exact amount ready.
                                Our delivery partner will contact you before arrival.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Security badge */}
                    <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      <span>Your payment information is secure and encrypted</span>
                    </div>

                    {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
                  </CardContent>
                </Card>
              )}

              {/* ====== STEP 3: REVIEW ====== */}
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
                            <ProductThumb images={item.product?.images} name={item.product?.name || ''} />
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
                        <h3 className="text-sm font-semibold text-gray-900">Delivery Address</h3>
                        <Button variant="ghost" size="sm" className="text-xs text-[#C59F00]" onClick={() => setCurrentStep(1)}>
                          Edit
                        </Button>
                      </div>
                      <div className="text-sm text-gray-700 space-y-0.5">
                        <p className="font-medium">{shipping.name}</p>
                        <p>{shipping.address}</p>
                        <p>{shipping.city}, {shipping.region}</p>
                        <p className="flex items-center gap-1.5 text-gray-500">
                          <Phone className="w-3.5 h-3.5" />
                          🇬🇭 +233 {shipping.phone.replace(/^0/, '')}
                        </p>
                      </div>
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
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-2xl">
                          {paymentOptions.find((p) => p.id === selectedPayment)?.icon}
                        </span>
                        <p className="text-sm font-medium text-gray-900">{getPaymentLabel()}</p>
                      </div>
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
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Place Order - GH₵{total.toFixed(2)}
                    {appliedCoupon && discount > 0 && (
                      <span className="ml-1 text-xs line-through text-gray-400">
                        GH₵{(total + discount).toFixed(2)}
                      </span>
                    )}
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

              {/* Mini cart items */}
              <div className="space-y-2 pb-3 border-b">
                {items.slice(0, 4).map((item) => (
                  <div key={item.productId} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {(() => {
                        const imgs = parseImages(item.product?.images)
                        const realImg = imgs.find(isImageUrl)
                        if (realImg) {
                          return <img src={realImg} alt="" className="w-full h-full object-cover" />
                        }
                        return <span className="text-sm">{getEmojiFallback(item.product?.images)}</span>
                      })()}
                    </div>
                    <p className="text-xs text-gray-600 truncate flex-1">{item.product?.name}</p>
                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                  </div>
                ))}
                {items.length > 4 && (
                  <p className="text-xs text-gray-400">+{items.length - 4} more items</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">GH₵{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Discount ({appliedCoupon?.name})
                    </span>
                    <span className="font-medium">-GH₵{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={finalShipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                    {finalShipping === 0 ? 'FREE' : `GH₵${finalShipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (VAT)</span>
                  <span className="font-medium">GH₵{finalTax.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon code input */}
              {!appliedCoupon && (
                <div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Discount code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="h-9 text-sm uppercase"
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs text-[#C59F00] border-[#FCD116]/30 hover:bg-yellow-50 shrink-0"
                      onClick={applyCoupon}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                </div>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-medium text-green-800">{appliedCoupon.code}</span>
                    <span className="text-[10px] text-green-600">({appliedCoupon.name})</span>
                  </div>
                  <button onClick={removeCoupon} className="text-green-600 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-[#C59F00]">GH₵{total.toFixed(2)}</span>
              </div>

              {/* Trust badges */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Truck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Delivery across Ghana</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
