'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ReactMarkdown from 'react-markdown'
import {
  BarChart3,
  Target,
  UserCheck,
  Megaphone,
  PackageSearch,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface AiInsightsPanelProps {
  aiInsights: Record<string, { content: string; cached: boolean; generatedAt: string }>
  aiLoading: Record<string, boolean>
  aiError: Record<string, string>
  onGenerate: (type: string) => void
}

const insightCards = [
  { key: 'sales_analysis', title: 'Sales Analysis', description: 'Analyze top products, trends, revenue and get growth recommendations', Icon: BarChart3, color: 'text-[#FCD116]', bg: 'bg-[#FCD116]/10', border: 'border-[#FCD116]/20' },
  { key: 'product_recommendations', title: 'Product Recommendations', description: 'Find products to feature, discount, or restock based on data', Icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { key: 'customer_insights', title: 'Customer Insights', description: 'Understand customer behavior, repeat patterns and preferences', Icon: UserCheck, color: 'text-[#C59F00]', bg: 'bg-[#C59F00]/10', border: 'border-[#C59F00]/20' },
  { key: 'marketing_suggestions', title: 'Marketing Suggestions', description: 'Campaign ideas, promotion timing and social media strategies', Icon: Megaphone, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { key: 'inventory_health', title: 'Inventory Health', description: 'Optimize stock levels, identify dead stock and prevent overstock', Icon: PackageSearch, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
] as const

export default function AiInsightsPanel({ aiInsights, aiLoading, aiError, onGenerate }: AiInsightsPanelProps) {
  return (
    <>
      {/* AI Insights Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002B1B] via-[#004D2E] to-[#003D26] p-6 md:p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FCD116]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FCD116]/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FCD116]/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#FCD116]" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">AI-Powered Insights</h2>
                <p className="text-sm text-white/70">Powered by intelligent analysis of your store data</p>
              </div>
            </div>
            <p className="text-sm text-white/60 max-w-2xl">
              Get personalized recommendations for sales optimization, inventory management, marketing strategies, and customer engagement. Each insight is generated from your actual store data.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {insightCards.map((card, index) => {
          const IconComponent = card.Icon
          const isLoading = aiLoading[card.key]
          const insight = aiInsights[card.key]
          const error = aiError[card.key]

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className={`border ${card.border} shadow-sm hover:shadow-md transition-all`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-gray-900">{card.title}</CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">{card.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGenerate(card.key)}
                      disabled={isLoading}
                      className="border-gray-200 hover:bg-[#002B1B] hover:text-white hover:border-[#002B1B] transition-all rounded-lg text-xs h-8 px-3"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Generating...
                        </>
                      ) : insight ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Refresh
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  {isLoading && (
                    <div className="space-y-3 py-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing your store data...</span>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-5/6 rounded" />
                        <Skeleton className="h-4 w-4/6 rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-3/4 rounded" />
                      </div>
                    </div>
                  )}

                  {!isLoading && !error && !insight && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center mb-3`}>
                        <IconComponent className={`w-7 h-7 ${card.color} opacity-40`} />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Click Generate to get AI-powered insights</p>
                      <p className="text-xs text-gray-400 mt-1">Insights are cached for 5 minutes</p>
                    </div>
                  )}

                  {!isLoading && insight && (
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        {insight.cached && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500">
                            Cached
                          </Badge>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {new Date(insight.generatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-em:text-gray-600 prose-code:text-[#002B1B] prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-hr:border-gray-200 max-h-[400px] overflow-y-auto pr-2">
                        <ReactMarkdown>{insight.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </>
  )
}
