'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUp } from 'lucide-react'
import { useT } from '@/lib/language-store'

function FooterLink({ slug, children }: { slug?: string; action?: () => void; children: React.ReactNode }) {
  const { navigate } = useAppStore()

  const handleClick = () => {
    if (slug) {
      navigate('info', { infoSlug: slug })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <li>
      <button
        onClick={handleClick}
        className="text-sm text-gray-300 hover:text-white transition-colors text-left"
      >
        {children}
      </button>
    </li>
  )
}

function FooterNavLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="text-sm text-gray-300 hover:text-white transition-colors text-left"
      >
        {children}
      </button>
    </li>
  )
}

export default function Footer() {
  const { navigate } = useAppStore()
  const [email, setEmail] = useState('')
  const t = useT()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    toast({
      title: t('footer.youreIn'),
      description: t('footer.youreInDesc'),
    })
    setEmail('')
  }

  return (
    <footer className="mt-auto">
      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className="w-full bg-[#CE1126] hover:bg-[#A80D1E] text-white text-sm py-3.5 transition-colors"
      >
        {t('footer.backToTop')}
      </button>

      {/* Main footer */}
      <div className="bg-[#004D2E] text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Get to Know Us */}
          <div>
            <h3 className="font-bold text-sm mb-3">{t('footer.getToKnowUs')}</h3>
            <ul className="space-y-2">
              <FooterLink slug="about">{t('footer.aboutUs')}</FooterLink>
              <FooterLink slug="careers">{t('footer.careers')}</FooterLink>
              <FooterLink slug="press">{t('footer.pressReleases')}</FooterLink>
              <FooterLink slug="sustainability">{t('footer.sustainability')}</FooterLink>
            </ul>
          </div>

          {/* Make Money with Us */}
          <div>
            <h3 className="font-bold text-sm mb-3">{t('footer.makeMoneyWithUs')}</h3>
            <ul className="space-y-2">
              <FooterLink slug="sell-on-zonkomi">{t('footer.sellOnZonkomi')}</FooterLink>
              <FooterLink slug="affiliate">{t('footer.affiliateProgram')}</FooterLink>
              <FooterLink slug="advertise">{t('footer.advertiseProducts')}</FooterLink>
              <FooterLink slug="trade-in">{t('footer.tradeInProgram')}</FooterLink>
            </ul>
          </div>

          {/* Payment Options */}
          <div>
            <h3 className="font-bold text-sm mb-3">{t('footer.paymentOptions')}</h3>
            <ul className="space-y-2">
              <FooterLink slug="payments">{t('footer.mobileMoney')}</FooterLink>
              <FooterLink slug="payments">{t('footer.creditDebitCard')}</FooterLink>
              <FooterLink slug="giftcards">{t('footer.giftCards')}</FooterLink>
              <FooterLink slug="financing">{t('footer.financingAvailable')}</FooterLink>
            </ul>
          </div>

          {/* Let Us Help You */}
          <div>
            <h3 className="font-bold text-sm mb-3">{t('footer.letUsHelpYou')}</h3>
            <ul className="space-y-2">
              <FooterNavLink onClick={() => navigate('account')}>{t('footer.yourAccount')}</FooterNavLink>
              <FooterNavLink onClick={() => navigate('orders')}>{t('footer.yourOrders')}</FooterNavLink>
              <FooterLink slug="shipping">{t('footer.shippingReturns')}</FooterLink>
              <FooterLink slug="customer-service">{t('footer.customerService')}</FooterLink>
              <FooterLink slug="help">{t('footer.help')}</FooterLink>
            </ul>
          </div>
        </div>
      </div>

      {/* Ghana Payment Methods Strip */}
      <div className="bg-[#003D26] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('footer.weAccept')}</span>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: 'MTN MoMo', color: 'bg-yellow-500' },
                { label: 'Vodafone Cash', color: 'bg-red-500' },
                { label: 'AT Money', color: 'bg-blue-500' },
                { label: 'Visa', color: 'bg-purple-600' },
                { label: 'Mastercard', color: 'bg-orange-600' },
                { label: 'Cash', color: 'bg-green-600' },
              ].map((pm) => (
                <span
                  key={pm.label}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 px-2.5 py-1 rounded-md border border-white/10"
                >
                  <span className={`w-2 h-2 rounded-full ${pm.color}`} />
                  {pm.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-[#002B1B] border-t border-[#004D2E]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-lg font-bold text-white mb-1">{t('footer.stayInTheLoop')}</h3>
            <p className="text-sm text-gray-400 mb-4">{t('footer.newsletterDesc')}</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-10 rounded-lg"
                required
              />
              <Button type="submit" className="bg-[#FCD116] hover:bg-[#D4AA00] text-[#1a1a1a] rounded-lg px-6 h-10 font-semibold">
                {t('footer.subscribe')}
              </Button>
            </form>
            <p className="text-[10px] text-gray-500 mt-2">{t('footer.noSpam')}</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#001F14] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Zonkomi Shop" className="w-8 h-8 rounded-md object-contain" />
            <span className="font-bold text-lg">Zonkomi Shop</span>
          </div>
          <p className="text-xs text-gray-400" suppressHydrationWarning>
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}
