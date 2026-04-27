import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Prize wheel configuration - balanced so small wins dominate
const PRIZES = [
  { name: '5% Off',       type: 'percent',   value: 5,  weight: 30, color: '#F59E0B' },
  { name: 'Free Shipping', type: 'shipping', value: 0,  weight: 25, color: '#10B981' },
  { name: 'Try Again',     type: 'none',     value: 0,  weight: 15, color: '#6B7280' },
  { name: '10% Off',      type: 'percent',   value: 10, weight: 12, color: '#F97316' },
  { name: 'GH₵10 Off',    type: 'fixed',    value: 10, weight: 8,  color: '#06B6D4' },
  { name: '15% Off',      type: 'percent',   value: 15, weight: 5,  color: '#8B5CF6' },
  { name: 'GH₵25 Off',    type: 'fixed',    value: 25, weight: 3,  color: '#EC4899', minOrder: 300 },
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

    // Check spins in the last 24 hours for this session
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentSpins = await db.spin.count({
      where: {
        sessionId,
        createdAt: { gte: oneDayAgo },
      },
    })

    const canSpin = recentSpins === 0

    // Get the last won prize if any
    const lastSpin = await db.spin.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      canSpin,
      spinsToday: recentSpins,
      maxSpinsPerDay: 1,
      lastPrize: lastSpin && !lastSpin.used ? {
        name: lastSpin.prize,
        type: lastSpin.prizeType,
        value: lastSpin.prizeValue,
        code: lastSpin.code,
      } : null,
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

    // Rate limit: 1 spin per 24h per session
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentSpins = await db.spin.count({
      where: {
        sessionId,
        createdAt: { gte: oneDayAgo },
      },
    })

    if (recentSpins > 0) {
      return NextResponse.json(
        { error: 'You already spun today! Come back tomorrow.', canSpin: false, spinsToday: recentSpins },
        { status: 429 }
      )
    }

    // Pick a prize
    const prize = pickPrize()
    const code = prize.type === 'none' ? null : generateCode()

    // Save to database
    await db.spin.create({
      data: {
        sessionId,
        userId: body.userId || null,
        prize: prize.name,
        prizeType: prize.type,
        prizeValue: prize.value,
        code,
      },
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
