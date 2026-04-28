import { NextResponse } from 'next/server'
import { getSpinsForSession, addSpin } from '@/lib/memory-store'

// Prize wheel configuration - balanced so small wins dominate
const PRIZES = [
  { name: '5% Off',       type: 'percent',   value: 5,  weight: 30, color: '#F59E0B' },
  { name: 'Free Shipping', type: 'shipping', value: 0,  weight: 25, color: '#10B981' },
  { name: 'Try Again',     type: 'none',     value: 0,  weight: 15, color: '#6B7280' },
  { name: '10% Off',      type: 'percent',   value: 10, weight: 12, color: '#F97316' },
  { name: 'GH₵10 Off',    type: 'fixed',    value: 10, weight: 8,  color: '#06B6D4' },
  { name: '15% Off',      type: 'percent',   value: 15, weight: 5,  color: '#8B5CF6' },
  { name: 'GH₵25 Off',    type: 'fixed',    value: 25, weight: 3,  color: '#EC4899', minOrder: 799 },
  { name: '20% Off',      type: 'percent',   value: 20, weight: 2,  color: '#EF4444' },
]

const TOTAL_WEIGHT = PRIZES.reduce((sum, p) => sum + p.weight, 0)

function pickPrize() {
  let r = Math.random() * TOTAL_WEIGHT
  for (const prize of PRIZES) {
    r -= prize.weight
    if (r <= 0) return prize
  }
  return PRIZES[0]
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'ZK-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// GET /api/spin — check if user can spin today
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sid')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const recentSpins = getSpinsForSession(sessionId)
    const canSpin = recentSpins.length === 0

    const lastPrize = recentSpins.length > 0 && !recentSpins[0].used ? {
      name: recentSpins[0].prize,
      type: recentSpins[0].prizeType,
      value: recentSpins[0].prizeValue,
      code: recentSpins[0].code,
    } : null

    return NextResponse.json({
      canSpin,
      spinsToday: recentSpins.length,
      maxSpinsPerDay: 1,
      lastPrize,
    })
  } catch (error) {
    console.error('Error checking spin:', error)
    return NextResponse.json({ error: 'Failed to check spin status' }, { status: 500 })
  }
}

// POST /api/spin — spin the wheel
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sessionId = body.sid

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const recentSpins = getSpinsForSession(sessionId)

    if (recentSpins.length > 0) {
      return NextResponse.json(
        { error: 'You already spun today! Come back tomorrow.', canSpin: false, spinsToday: recentSpins.length },
        { status: 429 }
      )
    }

    const prize = pickPrize()
    const code = prize.type === 'none' ? null : generateCode()

    addSpin({
      sessionId,
      userId: body.userId || null,
      prize: prize.name,
      prizeType: prize.type,
      prizeValue: prize.value,
      code,
    })

    return NextResponse.json({
      prize: {
        name: prize.name,
        type: prize.type,
        value: prize.value,
        color: prize.color,
        code,
        minOrder: prize.minOrder || null,
      },
    })
  } catch (error) {
    console.error('Error processing spin:', error)
    return NextResponse.json({ error: 'Failed to process spin' }, { status: 500 })
  }
}
