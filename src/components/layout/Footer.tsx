'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowUp } from 'lucide-react'

export default function Footer() {
  const { navigate } = useAppStore()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="mt-auto">
      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className="w-full bg-[#CE1126] hover:bg-[#A80D1E] text-white text-sm py-3.5 transition-colors"
      >
        Back to top
      </button>

      {/* Main footer */}
      <div className="bg-[#004D2E] text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Get to Know Us */}
          <div>
            <h3 className="font-bold text-sm mb-3">Get to Know Us</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  About Zonkomi Shop
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Careers
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Press Releases
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Sustainability
                </span>
              </li>
            </ul>
          </div>

          {/* Make Money */}
          <div>
            <h3 className="font-bold text-sm mb-3">Make Money with Us</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Sell on Zonkomi Shop
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Affiliate Program
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Advertise Products
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Trade-In Program
                </span>
              </li>
            </ul>
          </div>

          {/* Payment */}
          <div>
            <h3 className="font-bold text-sm mb-3">Payment Options</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Credit Card
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Debit Card
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Gift Cards
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Financing Available
                </span>
              </li>
            </ul>
          </div>

          {/* Let Us Help */}
          <div>
            <h3 className="font-bold text-sm mb-3">Let Us Help You</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('account')}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Your Account
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('orders')}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Your Orders
                </button>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Shipping & Returns
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Customer Service
                </span>
              </li>
              <li>
                <span className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">
                  Help
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#001F14] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#FCD116] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="font-bold text-lg">Zonkomi Shop</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Zonkomi Shop. All rights reserved. Premium refurbished electronics.
          </p>
        </div>
      </div>
    </footer>
  )
}
