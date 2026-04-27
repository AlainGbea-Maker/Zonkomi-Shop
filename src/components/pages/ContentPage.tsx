'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Users,
  Leaf,
  Newspaper,
  Briefcase,
  ShoppingBag,
  Handshake,
  Megaphone,
  RotateCcw,
  CreditCard,
  Smartphone,
  Gift,
  Banknote,
  Truck,
  HeadphonesIcon,
  HelpCircle,
  Package,
  FileText,
  TrendingUp,
  Globe,
  Star,
  Award,
  Clock,
  CheckCircle2,
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  Zap,
} from 'lucide-react'

// ==================== CONTENT DATA ====================

interface ContentSection {
  title: string
  icon: React.ElementType
  content: React.ReactNode
}

const contentMap: Record<string, ContentSection> = {
  about: {
    title: 'About Zonkomi Shop',
    icon: Globe,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Zonkomi Shop is Ghana&apos;s leading online marketplace for premium certified refurbished electronics.
          We believe everyone deserves access to quality technology at affordable prices — without compromising
          on reliability or performance.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { icon: Shield, label: 'Certified Quality', desc: 'Every device goes through a rigorous 52-point inspection and testing process' },
            { icon: Award, label: '90-Day Warranty', desc: 'Full warranty coverage on all products with hassle-free returns' },
            { icon: Users, label: '50,000+ Customers', desc: 'Trusted by thousands of happy customers across Ghana' },
            { icon: Leaf, label: 'Sustainable', desc: 'Reducing e-waste by giving electronics a second life' },
          ].map((item) => (
            <div key={item.label} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-[#FCD116]/15 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-[#C59F00]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-gray-600 leading-relaxed">
          Founded in 2024, Zonkomi Shop started with a simple mission: make premium technology accessible to every
          Ghanaian. From laptops and smartphones to tablets and accessories, we source only the best refurbished
          devices from trusted global suppliers. Our team of certified technicians ensures every product meets our
          strict quality standards before it reaches your doorstep.
        </p>
      </>
    ),
  },

  careers: {
    title: 'Careers at Zonkomi Shop',
    icon: Briefcase,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Join our growing team and help us reshape the way Ghana shops for electronics. We&apos;re always looking
          for passionate, talented individuals who share our vision of affordable, sustainable tech.
        </p>
        <div className="space-y-4 mb-6">
          {[
            { role: 'Quality Control Technician', dept: 'Operations', location: 'Accra', type: 'Full-time' },
            { role: 'Customer Service Representative', dept: 'Support', location: 'Accra / Remote', type: 'Full-time' },
            { role: 'Digital Marketing Specialist', dept: 'Marketing', location: 'Accra / Remote', type: 'Full-time' },
            { role: 'Logistics Coordinator', dept: 'Operations', location: 'Accra', type: 'Full-time' },
            { role: 'Content Creator & Social Media', dept: 'Marketing', location: 'Remote', type: 'Contract' },
            { role: 'Warehouse Assistant', dept: 'Operations', location: 'Accra', type: 'Full-time' },
          ].map((job) => (
            <div key={job.role} className="p-4 border border-gray-200 rounded-xl hover:border-[#FCD116]/50 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-[#C59F00] transition-colors">{job.role}</p>
                  <p className="text-xs text-gray-500">{job.dept}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">{job.type}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {job.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Card className="bg-gradient-to-br from-[#002B1B] to-[#004D2E] border-0 text-white">
          <CardContent className="p-6 text-center">
            <Briefcase className="w-10 h-10 text-[#FCD116] mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1">Don&apos;t see your role?</h3>
            <p className="text-sm text-gray-300 mb-4">Send us your CV and we&apos;ll keep you in mind for future openings.</p>
            <Button className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full">
              <Mail className="w-4 h-4 mr-2" />
              careers@zonkomishop.com
            </Button>
          </CardContent>
        </Card>
      </>
    ),
  },

  press: {
    title: 'Press Releases',
    icon: Newspaper,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Stay up to date with the latest news from Zonkomi Shop. For media inquiries, contact us at
          <span className="font-medium text-[#C59F00]"> press@zonkomishop.com</span>
        </p>
        <div className="space-y-4">
          {[
            {
              date: 'January 2025',
              title: 'Zonkomi Shop Launches Spin & Win — Gamified Discounts for Ghanaian Shoppers',
              excerpt: 'We\'re excited to introduce our new Spin & Win feature, giving customers the chance to win exclusive discounts on refurbished electronics every day.',
            },
            {
              date: 'December 2024',
              title: 'Zonkomi Shop Partners with MTN Mobile Money for Seamless Payments',
              excerpt: 'In a move to make online shopping easier, we\'ve integrated MTN MoMo, Vodafone Cash, and AirtelTigo Money for instant checkout.',
            },
            {
              date: 'November 2024',
              title: 'Reaching 5,000 Products Milestone — Our Biggest Catalog Yet',
              excerpt: 'From the latest iPhone models to business-grade laptops, our inventory has grown to over 5,000 certified refurbished products.',
            },
            {
              date: 'October 2024',
              title: 'Zonkomi Shop Now Delivering to All 16 Regions of Ghana',
              excerpt: 'We\'ve expanded our delivery network to cover every region in Ghana, bringing affordable tech to doorstep nationwide.',
            },
            {
              date: 'August 2024',
              title: 'Grand Launch: Zonkomi Shop Goes Live in Ghana',
              excerpt: 'After months of preparation, Zonkomi Shop officially launches as Ghana\'s premier destination for certified refurbished electronics.',
            },
          ].map((item) => (
            <div key={item.title} className="p-5 border border-gray-200 rounded-xl hover:border-[#FCD116]/50 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-400">{item.date}</span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#C59F00] transition-colors mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.excerpt}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },

  sustainability: {
    title: 'Sustainability',
    icon: Leaf,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          At Zonkomi Shop, sustainability isn&apos;t just a buzzword — it&apos;s core to our business model.
          Every refurbished device we sell is one less device in a landfill, one less device manufactured, and
          one more family with access to affordable technology.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { value: '12,000+', label: 'Devices Saved from Landfill', icon: RotateCcw },
            { value: '85 tonnes', label: 'E-Waste Prevented', icon: Leaf },
            { value: '40%', label: 'Less Carbon vs New', icon: Globe },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-5 text-center">
                <stat.icon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-800">{stat.value}</p>
                <p className="text-xs text-green-600 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <h3 className="font-bold text-gray-900 mb-3">Our Sustainability Pillars</h3>
        <div className="space-y-3">
          {[
            { title: 'Reduce E-Waste', desc: 'We extend the lifecycle of electronics through professional refurbishment, keeping thousands of devices out of Ghana\'s waste streams.' },
            { title: 'Responsible Packaging', desc: 'All shipments use recyclable and biodegradable packaging materials. No single-use plastics.' },
            { title: 'Carbon-Conscious Delivery', desc: 'We consolidate shipments and partner with eco-conscious logistics providers to minimize our carbon footprint.' },
            { title: 'Community Recycling', desc: 'Our Trade-In Program encourages customers to exchange old devices responsibly, earning credit towards their next purchase.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },

  'sell-on-zonkomi': {
    title: 'Sell on Zonkomi Shop',
    icon: ShoppingBag,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Turn your used electronics into cash! Zonkomi Shop makes it easy for individuals and businesses to sell
          their pre-owned devices through our trusted marketplace.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { step: '1', title: 'Submit Your Device', desc: 'Fill out our quick online form with your device details, condition, and photos.' },
            { step: '2', title: 'Get a Free Quote', desc: 'Our team will evaluate your device and send you a competitive offer within 24 hours.' },
            { step: '3', title: 'Ship or Drop Off', desc: 'Send your device via our free courier or drop it off at our Accra collection point.' },
            { step: '4', title: 'Get Paid Fast', desc: 'Once verified, receive payment directly to your mobile money or bank account.' },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 p-4 border border-gray-200 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#FCD116] flex items-center justify-center flex-shrink-0 text-white font-bold">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Card className="bg-gradient-to-r from-[#FCD116] to-[#D4AA00] border-0">
          <CardContent className="p-6 text-center">
            <Zap className="w-8 h-8 text-white/80 mx-auto mb-2" />
            <h3 className="font-bold text-white text-lg mb-1">Start Selling Today</h3>
            <p className="text-sm text-white/80 mb-4">Join hundreds of sellers earning extra income on Zonkomi Shop.</p>
            <Button variant="outline" className="bg-white text-[#C59F00] hover:bg-gray-100 border-0 rounded-full font-semibold">
              Register as a Seller
            </Button>
          </CardContent>
        </Card>
      </>
    ),
  },

  affiliate: {
    title: 'Affiliate Program',
    icon: TrendingUp,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Earn commission by recommending Zonkomi Shop to your audience. Our affiliate program is free to join
          and pays generous commissions on every successful referral.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { value: '5-10%', label: 'Commission Rate', icon: Banknote },
            { value: '30 Days', label: 'Cookie Duration', icon: Clock },
            { value: 'No Min.', label: 'Payout Threshold', icon: CreditCard },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 bg-gray-50">
              <CardContent className="p-5 text-center">
                <stat.icon className="w-8 h-8 text-[#C59F00] mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <h3 className="font-bold text-gray-900 mb-3">How It Works</h3>
        <div className="space-y-3 mb-6">
          {[
            'Sign up for free and get your unique referral link',
            'Share your link on social media, blogs, WhatsApp, or your website',
            'When someone purchases through your link, you earn commission',
            'Get paid monthly via mobile money or bank transfer',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[#FCD116] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-white">{i + 1}</span>
              </div>
              <p className="text-sm text-gray-600">{item}</p>
            </div>
          ))}
        </div>
        <Button className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full w-full">
          <Handshake className="w-4 h-4 mr-2" />
          Join the Affiliate Program
        </Button>
      </>
    ),
  },

  advertise: {
    title: 'Advertise Products',
    icon: Megaphone,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Boost your product visibility on Zonkomi Shop. Our advertising solutions help sellers reach
          thousands of ready-to-buy customers across Ghana.
        </p>
        <div className="space-y-4 mb-6">
          {[
            {
              title: 'Featured Placement',
              desc: 'Your products appear at the top of search results and category pages for maximum visibility.',
              price: 'From GH₵ 50/week',
            },
            {
              title: 'Banner Ads',
              desc: 'Display your brand on our homepage, category pages, or newsletter with custom creative.',
              price: 'From GH₵ 200/week',
            },
            {
              title: 'Social Media Shoutout',
              desc: 'Get your products featured on our Instagram, Facebook, and Twitter with professional photography.',
              price: 'From GH₵ 100/post',
            },
            {
              title: 'Deal of the Day',
              desc: 'Your product becomes our Deal of the Day with a special badge and prime homepage placement.',
              price: 'From GH₵ 300/day',
            },
          ].map((item) => (
            <Card key={item.title} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-[#C59F00] transition-colors">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <span className="text-sm font-bold text-[#C59F00] whitespace-nowrap ml-4">{item.price}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full w-full">
          <Mail className="w-4 h-4 mr-2" />
          Contact Our Ad Team
        </Button>
      </>
    ),
  },

  'trade-in': {
    title: 'Trade-In Program',
    icon: RotateCcw,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Upgrade to better tech while doing good for the planet. Our Trade-In Program lets you exchange your
          old devices for store credit towards your next Zonkomi Shop purchase.
        </p>
        <Card className="bg-gradient-to-br from-[#002B1B] to-[#006B3F] border-0 text-white mb-6">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-2">How Trade-In Works</h3>
            <div className="space-y-3">
              {[
                'Tell us what device you have (brand, model, condition)',
                'Get an instant trade-in value estimate',
                'Ship your device to us for free (or drop off at our Accra office)',
                'Receive Zonkomi Credit added to your account',
                'Use your credit on any product in our store',
              ].map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#FCD116] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-[#003D26]">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-200">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <h3 className="font-bold text-gray-900 mb-3">What We Accept</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { emoji: '💻', label: 'Laptops' },
            { emoji: '📱', label: 'Smartphones' },
            { emoji: '📲', label: 'Tablets' },
            { emoji: '⌚', label: 'Wearables' },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-gray-50 rounded-xl text-center">
              <span className="text-3xl">{item.emoji}</span>
              <p className="text-sm font-medium text-gray-700 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },

  payments: {
    title: 'Payment Options',
    icon: CreditCard,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          We offer multiple convenient payment methods tailored for Ghanaian shoppers. Choose whatever works
          best for you — all transactions are secure and encrypted.
        </p>
        <div className="space-y-3 mb-6">
          {[
            {
              icon: '📱',
              label: 'MTN Mobile Money',
              desc: 'Pay instantly with MTN MoMo. An MoMo prompt will be sent to confirm payment.',
              color: 'bg-yellow-50 border-yellow-200',
              badge: 'Most Popular',
              badgeColor: 'bg-yellow-500 text-white',
            },
            {
              icon: '📲',
              label: 'Vodafone Cash',
              desc: 'Seamless payments with your Vodafone Cash wallet.',
              color: 'bg-red-50 border-red-200',
              badge: null,
              badgeColor: '',
            },
            {
              icon: '☎️',
              label: 'AirtelTigo Money',
              desc: 'Quick and easy with AT Money.',
              color: 'bg-blue-50 border-blue-200',
              badge: null,
              badgeColor: '',
            },
            {
              icon: '💳',
              label: 'Visa / Mastercard',
              desc: 'Use your debit or credit card for secure online payments.',
              color: 'bg-purple-50 border-purple-200',
              badge: 'International',
              badgeColor: 'bg-purple-500 text-white',
            },
            {
              icon: '💵',
              label: 'Cash on Delivery',
              desc: 'Pay with cash when your order arrives at your doorstep.',
              color: 'bg-green-50 border-green-200',
              badge: 'Available',
              badgeColor: 'bg-green-500 text-white',
            },
          ].map((item) => (
            <div key={item.label} className={`p-4 border rounded-xl ${item.color} flex items-center gap-4`}>
              <span className="text-3xl">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>{item.badge}</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            All payments are processed securely with SSL encryption. Your financial information is never stored on our servers.
          </p>
        </div>
      </>
    ),
  },

  shipping: {
    title: 'Shipping & Returns',
    icon: Truck,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          We deliver across all 16 regions of Ghana with reliable courier partners. Orders are carefully
          packaged and tracked from our warehouse to your doorstep.
        </p>

        <h3 className="font-bold text-gray-900 mb-3">Shipping Rates</h3>
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="font-semibold text-green-800 text-sm">FREE Shipping</p>
              <p className="text-xs text-green-600">Orders over GH₵ 500</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Standard Shipping</p>
              <p className="text-xs text-gray-500">GH₵ 49.99 — 3-5 business days</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Express Shipping (Accra only)</p>
              <p className="text-xs text-gray-500">GH₵ 79.99 — 1-2 business days</p>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-gray-900 mb-3">Return Policy</h3>
        <div className="space-y-3">
          {[
            { title: '30-Day Returns', desc: 'Not satisfied? Return any item within 30 days for a full refund.' },
            { title: '90-Day Warranty', desc: 'All products include a 90-day warranty against defects.' },
            { title: 'Easy Process', desc: 'Contact our support team, ship the item back for free, and get your refund.' },
            { title: 'Condition Matters', desc: 'Items must be returned in their original condition with all accessories.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <RotateCcw className="w-4 h-4 text-[#C59F00] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
  },

  'customer-service': {
    title: 'Customer Service',
    icon: HeadphonesIcon,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Our dedicated support team is here to help you with any questions, concerns, or issues. We typically
          respond within a few hours during business hours.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            { icon: MessageCircle, label: 'Live Chat', desc: 'Chat with us in real-time on WhatsApp', value: '+233 24 123 4567', action: 'WhatsApp Us' },
            { icon: Mail, label: 'Email', desc: 'Send us a detailed message', value: 'support@zonkomishop.com', action: 'Send Email' },
            { icon: Phone, label: 'Phone', desc: 'Mon-Fri, 8AM - 6PM GMT', value: '+233 24 123 4567', action: 'Call Now' },
            { icon: MapPin, label: 'Visit Us', desc: 'Come see us in person', value: 'Ring Road Central, Accra', action: 'Get Directions' },
          ].map((item) => (
            <Card key={item.label} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5">
                <item.icon className="w-7 h-7 text-[#C59F00] mb-3" />
                <p className="font-bold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mb-1">{item.desc}</p>
                <p className="text-sm font-medium text-[#C59F00]">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-gray-50 border-0">
          <CardContent className="p-5 text-center">
            <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">Business Hours</p>
            <p className="text-sm text-gray-500">Monday — Friday: 8:00 AM — 6:00 PM (GMT)</p>
            <p className="text-sm text-gray-500">Saturday: 9:00 AM — 2:00 PM (GMT)</p>
            <p className="text-sm text-gray-500">Sunday & Holidays: Closed</p>
          </CardContent>
        </Card>
      </>
    ),
  },

  help: {
    title: 'Help Center',
    icon: HelpCircle,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Find quick answers to common questions below. Can&apos;t find what you&apos;re looking for?
          Our customer service team is always ready to help.
        </p>
        <h3 className="font-bold text-gray-900 mb-3">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {[
            {
              q: 'What does "refurbished" mean?',
              a: 'Refurbished products are pre-owned devices that have been professionally inspected, tested, cleaned, and restored to full working condition. They perform like new but at a fraction of the price.',
            },
            {
              q: 'Do refurbished products come with a warranty?',
              a: 'Yes! Every product sold on Zonkomi Shop comes with a 90-day warranty covering manufacturing defects. Extended warranty options are also available.',
            },
            {
              q: 'How do I track my order?',
              a: 'Log into your account and go to "My Orders". You\'ll see real-time tracking information for all shipped orders. You\'ll also receive SMS updates.',
            },
            {
              q: 'Can I return a product?',
              a: 'Absolutely. We offer a 30-day return policy. If you\'re not satisfied, contact our support team and we\'ll arrange a hassle-free return and refund.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept MTN Mobile Money, Vodafone Cash, AirtelTigo Money, Visa/Mastercard, and Cash on Delivery. All payments are secure and encrypted.',
            },
            {
              q: 'How long does delivery take?',
              a: 'Standard delivery takes 3-5 business days. Express delivery in Accra takes 1-2 business days. Orders over GH₵ 500 qualify for free shipping.',
            },
            {
              q: 'Do you deliver outside Accra?',
              a: 'Yes! We deliver to all 16 regions of Ghana. Delivery times may vary by location, but we cover the entire country.',
            },
            {
              q: 'How do I use my Spin & Win discount?',
              a: 'When your cart total reaches GH₵ 799+, the Spin & Win wheel unlocks. Spin to win a discount code, then apply it at checkout in the coupon field.',
            },
          ].map((item) => (
            <div key={item.q} className="p-4 border border-gray-200 rounded-xl">
              <p className="font-semibold text-gray-900 text-sm mb-1">{item.q}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
        <Separator className="my-6" />
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-3">Still need help?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat on WhatsApp
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => window.location.href = 'mailto:support@zonkomishop.com'}>
              <Mail className="w-4 h-4 mr-2" />
              Email Support
            </Button>
          </div>
        </div>
      </>
    ),
  },

  giftcards: {
    title: 'Gift Cards',
    icon: Gift,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Give the gift of technology! Zonkomi Shop gift cards are the perfect way to let your loved ones
          choose their own refurbished electronics. Available in various denominations.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { value: 'GH₵ 50', gradient: 'from-green-500 to-emerald-600' },
            { value: 'GH₵ 100', gradient: 'from-[#FCD116] to-[#D4AA00]' },
            { value: 'GH₵ 200', gradient: 'from-[#CE1126] to-red-600' },
            { value: 'GH₵ 500', gradient: 'from-purple-500 to-violet-600' },
            { value: 'GH₵ 1000', gradient: 'from-[#002B1B] to-[#004D2E]' },
            { value: 'Custom', gradient: 'from-gray-600 to-gray-800' },
          ].map((card) => (
            <div key={card.value} className={`bg-gradient-to-br ${card.gradient} rounded-xl p-5 text-white text-center cursor-pointer hover:scale-105 transition-transform shadow-md`}>
              <Gift className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-lg">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[
            'Gift cards never expire',
            'Can be used on any product in our store',
            'Delivered instantly via email or SMS',
            'Perfect for birthdays, holidays, and special occasions',
          ].map((item) => (
            <div key={item} className="flex gap-2 items-center">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-gray-600">{item}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },

  financing: {
    title: 'Financing Available',
    icon: Banknote,
    content: (
      <>
        <p className="text-gray-600 leading-relaxed mb-6">
          Want it now but can&apos;t pay all at once? Zonkomi Shop offers flexible financing options so you can
          spread the cost of your purchase over time. No hidden fees, no surprises.
        </p>
        <Card className="bg-gradient-to-br from-[#002B1B] to-[#006B3F] border-0 text-white mb-6">
          <CardContent className="p-6 text-center">
            <Banknote className="w-12 h-12 text-[#FCD116] mx-auto mb-3" />
            <h3 className="font-bold text-xl mb-1">Pay in 3 Easy Installments</h3>
            <p className="text-sm text-gray-300 mb-4">Split your purchase into 3 monthly payments — 0% interest!</p>
            <div className="flex justify-center gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-[#FCD116]">0%</p>
                <p className="text-xs text-gray-400">Interest</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#FCD116]">3x</p>
                <p className="text-xs text-gray-400">Payments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#FCD116]">GH₵200+</p>
                <p className="text-xs text-gray-400">Min. Order</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <h3 className="font-bold text-gray-900 mb-3">Eligible Products</h3>
        <p className="text-sm text-gray-600 mb-4">
          Financing is available on laptops, smartphones, tablets, and desktops priced at GH₵ 200 and above.
          Simply select &quot;Installment Payment&quot; at checkout to see your payment schedule.
        </p>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800 flex items-start gap-2">
            <span className="text-base flex-shrink-0">&#128161;</span>
            <span>Financing is currently available for registered customers with verified accounts. Contact us to learn more about eligibility.</span>
          </p>
        </div>
      </>
    ),
  },
}

// ==================== COMPONENT ====================

export default function ContentPage() {
  const { selectedInfoSlug, navigate } = useAppStore()

  const slug = selectedInfoSlug || 'about'
  const content = contentMap[slug]

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Button className="bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full" onClick={() => navigate('home')}>
          Go Home
        </Button>
      </div>
    )
  }

  const Icon = content.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#002B1B] via-[#004D2E] to-[#006B3F]">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-[#FCD116]/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-[#FCD116]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{content.title}</h1>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-gray-200">
            <CardContent className="p-6 md:p-8">
              {content.content}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
