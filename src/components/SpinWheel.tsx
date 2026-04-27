'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, PartyPopper, Clock } from 'lucide-react'

interface Prize {
  name: string
  type: 'percent' | 'shipping' | 'fixed' | 'none'
  value: number
  color: string
  code?: string | null
  minOrder?: number | null
}

const WHEEL_SEGMENTS = [
  { label: '5% Off',        color: '#F59E0B', textColor: '#fff',   rotation: 0 },
  { label: 'Free Shipping',  color: '#10B981', textColor: '#fff',   rotation: 45 },
  { label: 'Try Again',      color: '#6B7280', textColor: '#fff',   rotation: 90 },
  { label: '10% Off',       color: '#F97316', textColor: '#fff',   rotation: 135 },
  { label: 'GH₵10 Off',     color: '#06B6D4', textColor: '#fff',   rotation: 180 },
  { label: '15% Off',       color: '#8B5CF6', textColor: '#fff',   rotation: 225 },
  { label: 'GH₵25 Off',     color: '#EC4899', textColor: '#fff',   rotation: 270 },
  { label: '20% Off',       color: '#EF4444', textColor: '#fff',   rotation: 315 },
]

// Map prize names to segment index for rotation calculation
const PRIZE_INDEX: Record<string, number> = {
  '5% Off': 0,
  'Free Shipping': 1,
  'Try Again': 2,
  '10% Off': 3,
  'GH₵10 Off': 4,
  '15% Off': 5,
  'GH₵25 Off': 6,
  '20% Off': 7,
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('zonkomi-sid')
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('zonkomi-sid', sid)
  }
  return sid
}

export default function SpinWheel() {
  const [open, setOpen] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [prize, setPrize] = useState<Prize | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [canSpin, setCanSpin] = useState(true)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [confetti, setConfetti] = useState(false)

  useEffect(() => {
    if (!open) return
    checkSpinStatus()
  }, [open])

  const checkSpinStatus = async () => {
    setChecking(true)
    try {
      const sid = getSessionId()
      const res = await fetch(`/api/spin?sid=${encodeURIComponent(sid)}`)
      const data = await res.json()
      setCanSpin(data.canSpin)
      if (data.lastPrize) {
        setPrize(data.lastPrize)
        setShowResult(true)
      }
    } catch {
      setCanSpin(true)
    } finally {
      setChecking(false)
    }
  }

  const handleSpin = useCallback(async () => {
    if (spinning || !canSpin) return
    setSpinning(true)
    setError('')

    try {
      const sid = getSessionId()
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setSpinning(false)
        return
      }

      const wonPrize: Prize = data.prize

      // Calculate rotation: land on the segment for this prize
      const segmentIndex = PRIZE_INDEX[wonPrize.name] ?? 0
      // Each segment is 45 degrees. The pointer is at top (270°).
      // We want the segment's center to align with the top.
      // Segment center = segmentIndex * 45 + 22.5
      // Rotation needed = 360 - (segment center) + some full rotations
      const segmentCenter = segmentIndex * 45 + 22.5
      const targetAngle = 360 - segmentCenter
      // Add randomness within the segment (±18 degrees from center)
      const jitter = (Math.random() - 0.5) * 30
      // Multiple full rotations for dramatic effect
      const fullSpins = 5 + Math.floor(Math.random() * 3) // 5-7 full spins
      const newRotation = rotation + fullSpins * 360 + targetAngle + jitter - (rotation % 360)

      setRotation(newRotation)

      // Wait for spin animation to finish
      setTimeout(() => {
        setPrize(wonPrize)
        setShowResult(true)
        setSpinning(false)
        setCanSpin(false)

        // Trigger confetti for real prizes
        if (wonPrize.type !== 'none') {
          setConfetti(true)
          setTimeout(() => setConfetti(false), 3000)
        }

        // Save coupon code to localStorage for checkout
        if (wonPrize.code) {
          localStorage.setItem('zonkomi-coupon', JSON.stringify({
            code: wonPrize.code,
            type: wonPrize.type,
            value: wonPrize.value,
            name: wonPrize.name,
            minOrder: wonPrize.minOrder,
          }))
        }
      }, 4500)
    } catch {
      setError('Network error. Please try again.')
      setSpinning(false)
    }
  }, [spinning, canSpin, rotation])

  const handleClose = () => {
    setOpen(false)
    // Reset state after close animation
    setTimeout(() => {
      setShowResult(false)
      setError('')
    }, 300)
  }

  const formatPrizeDescription = (p: Prize) => {
    if (p.type === 'none') return 'Better luck tomorrow!'
    if (p.type === 'percent') return `${p.value}% discount on your next order`
    if (p.type === 'shipping') return 'Free shipping on your next order'
    if (p.type === 'fixed') {
      let desc = `GH₵${p.value} off your next order`
      if (p.minOrder) desc += ` (min. GH₵${p.minOrder})`
      return desc
    }
    return ''
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!open && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2, type: 'spring', stiffness: 200, damping: 15 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          title="Spin & Win!"
        >
          <div className="relative">
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#FCD116] animate-ping opacity-30" />
            {/* Button */}
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#FCD116] to-[#D4AA00] shadow-lg shadow-yellow-300/50 flex items-center justify-center hover:scale-110 transition-transform duration-300 border-4 border-white">
              <Gift className="w-7 h-7 text-[#002B1B]" />
            </div>
            {/* Badge */}
            <div className="absolute -top-1 -right-1 bg-[#CE1126] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
              WIN
            </div>
          </div>
        </motion.button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={handleClose}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Content */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>

              {/* Header */}
              <div className="bg-gradient-to-r from-[#002B1B] via-[#004D2E] to-[#002B1B] px-6 pt-8 pb-6 text-center relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-[#FCD116]/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#CE1126]/10 rounded-full translate-x-1/3 translate-y-1/3" />

                <div className="relative">
                  <Gift className="w-10 h-10 text-[#FCD116] mx-auto mb-2" />
                  <h2 className="text-2xl font-bold text-white">Spin & Win!</h2>
                  <p className="text-sm text-gray-300 mt-1">Spin once daily for exclusive discounts</p>
                </div>
              </div>

              {/* Wheel Area */}
              <div className="px-6 py-8">
                {/* Checking state */}
                {checking ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-[#FCD116] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : showResult && prize ? (
                  /* Result display */
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="text-center py-4"
                  >
                    {prize.type !== 'none' ? (
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FCD116] to-[#D4AA00] flex items-center justify-center shadow-lg">
                        <PartyPopper className="w-10 h-10 text-[#002B1B]" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Clock className="w-10 h-10 text-gray-400" />
                      </div>
                    )}

                    <h3 className={`text-xl font-bold ${prize.type !== 'none' ? 'text-[#002B1B]' : 'text-gray-500'}`}>
                      {prize.type !== 'none' ? '🎉 Congratulations!' : '😊 Almost!'}
                    </h3>

                    <div
                      className="mt-2 inline-block px-4 py-2 rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: prize.color || '#6B7280' }}
                    >
                      {prize.name}
                    </div>

                    <p className="text-sm text-gray-600 mt-3">
                      {formatPrizeDescription(prize)}
                    </p>

                    {prize.code && (
                      <div className="mt-4 bg-yellow-50 border-2 border-dashed border-[#FCD116] rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Your discount code:</p>
                        <p className="text-xl font-mono font-bold text-[#002B1B] tracking-wider">{prize.code}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Use at checkout · Valid for 7 days</p>
                      </div>
                    )}

                    {prize.type === 'none' && (
                      <p className="text-sm text-gray-400 mt-3">
                        Come back tomorrow for another chance!
                      </p>
                    )}

                    <button
                      onClick={handleClose}
                      className="mt-6 px-8 py-2.5 bg-[#002B1B] hover:bg-[#003D26] text-white rounded-full text-sm font-medium transition-colors"
                    >
                      {prize.type !== 'none' ? 'Start Shopping' : 'Close'}
                    </button>
                  </motion.div>
                ) : (
                  /* Wheel */
                  <div className="flex flex-col items-center">
                    {/* Pointer */}
                    <div className="relative z-10 mb-0">
                      <div
                        className="w-0 h-0 mx-auto"
                        style={{
                          borderLeft: '12px solid transparent',
                          borderRight: '12px solid transparent',
                          borderTop: '20px solid #002B1B',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        }}
                      />
                    </div>

                    {/* Wheel container */}
                    <div className="relative">
                      {/* Outer glow */}
                      <div
                        className="absolute inset-[-8px] rounded-full opacity-30 blur-md"
                        style={{
                          background: 'conic-gradient(from 0deg, #F59E0B, #10B981, #8B5CF6, #EC4899, #F59E0B)',
                        }}
                      />

                      {/* Spinning wheel */}
                      <div
                        className="relative w-64 h-64 rounded-full overflow-hidden shadow-xl border-4 border-[#002B1B]"
                        style={{
                          transition: spinning ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                          transform: `rotate(${rotation}deg)`,
                        }}
                      >
                        {WHEEL_SEGMENTS.map((seg, i) => (
                          <div
                            key={i}
                            className="absolute w-full h-full"
                            style={{
                              transform: `rotate(${seg.rotation}deg)`,
                              transformOrigin: 'center center',
                            }}
                          >
                            {/* Segment background */}
                            <div
                              className="absolute inset-0"
                              style={{
                                clipPath: 'polygon(50% 50%, 50% 0%, 75.36% 6.7%)',
                                backgroundColor: seg.color,
                              }}
                            />
                            {/* Segment text */}
                            <div
                              className="absolute inset-0 flex items-start justify-center pt-5"
                              style={{
                                transform: `rotate(${seg.rotation < 180 ? 0 : 180}deg)`,
                              }}
                            >
                              <span
                                className="text-[10px] font-bold whitespace-nowrap"
                                style={{
                                  color: seg.textColor,
                                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                  transform: `rotate(${seg.rotation >= 180 ? -seg.rotation + 90 : 90 - seg.rotation}deg) translateX(${seg.rotation >= 180 ? 0 : 0}px)`,
                                }}
                              >
                                {seg.label}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Center circle */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white shadow-lg border-4 border-[#002B1B] flex items-center justify-center">
                            <Gift className="w-6 h-6 text-[#FCD116]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Spin button */}
                    {canSpin ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSpin}
                        disabled={spinning}
                        className="mt-6 px-10 py-3 bg-gradient-to-r from-[#FCD116] to-[#D4AA00] hover:from-[#D4AA00] hover:to-[#C59F00] text-white rounded-full font-bold text-sm shadow-lg shadow-yellow-300/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                      >
                        {spinning ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Spinning...
                          </span>
                        ) : (
                          'SPIN TO WIN!'
                        )}
                      </motion.button>
                    ) : (
                      <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          Come back tomorrow!
                        </div>
                      </div>
                    )}

                    {error && (
                      <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
                    )}

                    <p className="mt-3 text-[10px] text-gray-400 text-center">
                      1 free spin per day · Discounts apply at checkout
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti overlay */}
      <AnimatePresence>
        {confetti && (
          <div className="fixed inset-0 z-[101] pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: `${Math.random() * 100}vw`,
                  y: '-10vh',
                  scale: Math.random() * 0.5 + 0.5,
                  opacity: 1,
                }}
                animate={{
                  y: '110vh',
                  x: `${Math.random() * 100}vw`,
                  rotate: Math.random() * 720 - 360,
                  opacity: 0,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
                className="absolute"
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: ['#FCD116', '#CE1126', '#10B981', '#F97316', '#8B5CF6', '#EC4899'][
                      Math.floor(Math.random() * 6)
                    ],
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
