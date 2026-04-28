import { NextResponse } from 'next/server'
import { getCategoriesWithCount } from '@/lib/memory-store'

export async function GET() {
  try {
    const categories = getCategoriesWithCount()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    )
  }
}
