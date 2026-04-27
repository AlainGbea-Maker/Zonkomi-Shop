'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAppStore, type Product, type Category } from '@/lib/store'
import ProductCard from '@/components/ui/ProductCard'
import {
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
} from 'lucide-react'

const ITEMS_PER_PAGE = 24

const conditions = ['Excellent', 'Good', 'Fair', 'Like New']

export default function ProductListPage() {
  const {
    selectedCategoryId,
    searchQuery,
    sortBy,
    priceRange,
    setSortBy,
    setPriceRange,
    navigate,
    resetFilters,
  } = useAppStore()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(selectedCategoryId || 'all')
  const [filterOpen, setFilterOpen] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(ITEMS_PER_PAGE))
      params.set('sort', sortBy)
      if (searchQuery) params.set('search', searchQuery)
      if (selectedCategory && selectedCategory !== 'all') params.set('categoryId', selectedCategory)
      if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]))
      if (priceRange[1] < 5000) params.set('maxPrice', String(priceRange[1]))
      if (selectedConditions.length > 0) params.set('condition', selectedConditions.join(','))

      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      setProducts(data?.products || data || [])
      setTotalProducts(data?.pagination?.total || data?.total || (Array.isArray(data) ? data.length : 0))
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, searchQuery, selectedCategory, priceRange, selectedConditions])

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedCategoryId) {
      setSelectedCategory(selectedCategoryId)
    }
  }, [selectedCategoryId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    setPage(1)
  }, [selectedCategory, sortBy, searchQuery, priceRange, selectedConditions])

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE)

  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    )
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedConditions([])
    setPriceRange([0, 5000])
    resetFilters()
  }

  const hasActiveFilters = selectedCategory !== 'all' || selectedConditions.length > 0 || priceRange[0] > 0 || priceRange[1] < 5000

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Category</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-100 transition-colors ${selectedCategory === 'all' ? 'text-[#C59F00] font-medium bg-yellow-50' : 'text-gray-700'}`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-gray-100 transition-colors flex justify-between items-center ${selectedCategory === cat.id ? 'text-[#C59F00] font-medium bg-yellow-50' : 'text-gray-700'}`}
            >
              <span className="truncate">{cat.name}</span>
              {cat._count?.products && (
                <span className="text-xs text-gray-400 ml-2">{cat._count.products}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
        <Slider
          min={0}
          max={5000}
          step={10}
          value={priceRange}
          onValueChange={(val) => setPriceRange(val as [number, number])}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>GH₵{priceRange[0]}</span>
          <span>GH₵{priceRange[1]}</span>
        </div>
      </div>

      <Separator />

      {/* Condition */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Condition</h3>
        <div className="space-y-2">
          {conditions.map((cond) => (
            <label
              key={cond}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            >
              <Checkbox
                checked={selectedConditions.includes(cond)}
                onCheckedChange={() => toggleCondition(cond)}
              />
              {cond}
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={clearFilters}
          >
            Clear All Filters
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Breadcrumb & Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <button
            onClick={() => navigate('home')}
            className="hover:text-[#C59F00] transition-colors"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {searchQuery ? `Search: "${searchQuery}"` : 'All Products'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {searchQuery ? (
            <>Search results for &ldquo;{searchQuery}&rdquo;</>
          ) : (
            'All Products'
          )}
        </h1>
        {!loading && (
          <p className="text-sm text-gray-500 mt-1">
            Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, totalProducts)}
            {' - '}
            {Math.min(page * ITEMS_PER_PAGE, totalProducts)} of {totalProducts} results
          </p>
        )}
      </div>

      {/* Sort & Filter Bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile filter button */}
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-y-auto max-h-[calc(100vh-8rem)] custom-scrollbar">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-red-500"
            onClick={clearFilters}
          >
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategory !== 'all' && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
              onClick={() => setSelectedCategory('all')}
            >
              {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {selectedConditions.map((cond) => (
            <Badge
              key={cond}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
              onClick={() => toggleCondition(cond)}
            >
              {cond}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
          {(priceRange[0] > 0 || priceRange[1] < 5000) && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors"
              onClick={() => setPriceRange([0, 5000])}
            >
              GH₵{priceRange[0]} - GH₵{priceRange[1]}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <Card className="sticky top-40">
            <CardContent className="p-4">
              <FilterContent />
            </CardContent>
          </Card>
        </aside>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <PackageSearch className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
              <p className="text-gray-500 text-sm mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="popLayout">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
