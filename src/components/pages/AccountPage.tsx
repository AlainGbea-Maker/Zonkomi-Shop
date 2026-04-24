'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppStore, useUserStore } from '@/lib/store'
import {
  User,
  Package,
  ShoppingCart,
  LogOut,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from 'lucide-react'

export default function AccountPage() {
  const { navigate } = useAppStore()
  const { user, logout } = useUserStore()

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Zonkomi Shop</h1>
        <p className="text-gray-500 mb-6">Sign in to access your account, orders, and more.</p>
        <Button
          className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full px-8"
          onClick={() => navigate('login')}
        >
          Sign In
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="md:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#FCD116] to-[#D4AA00] flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                <Separator className="my-4" />
                <div className="space-y-3 text-left">
                  {user.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {user.phone}
                    </div>
                  )}
                  {(user.address || user.city) && (
                    <div className="flex items-start gap-3 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span>
                        {[user.address, user.city, user.state, user.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {user.email}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 group"
              onClick={() => navigate('orders')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                    <Package className="w-6 h-6 text-[#C59F00]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">My Orders</p>
                    <p className="text-sm text-gray-500">View order history and track shipments</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#C59F00] transition-colors" />
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 group"
              onClick={() => navigate('cart')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">My Cart</p>
                    <p className="text-sm text-gray-500">View and manage your shopping cart</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 group"
              onClick={() => navigate('products')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Continue Shopping</p>
                    <p className="text-sm text-gray-500">Browse our latest deals and products</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </CardContent>
            </Card>

            <Separator className="my-2" />

            <Button
              variant="outline"
              className="w-full rounded-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              onClick={() => {
                logout()
                navigate('home')
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
