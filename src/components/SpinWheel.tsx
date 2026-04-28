'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Gift,
  PartyPopper,
  Clock,
  ShoppingCart,
  Volume2,
  VolumeX,
  Copy,
  Check,
} from 'lucide-react'
import { useCartStore } from '@/lib/store'

// ─── Constants ───────────────────────────────────────────────────────────────

const SPIN_THRESHOLD = 799

const SEGMENT_COLORS = [
  '#FFB300',
  '#00BFA5',
  '#78909C',
  '#FF6D00',
  '#00ACC1',
  '#7B1FA2',
  '#C2185B',
  '#D32F2F',
]

const SEGMENT_LABELS = [
  '5% OFF',
  'FREE SHIP',
  'TRY AGAIN',
  '10% OFF',
  'GH₵10 OFF',
  '15% OFF',
  'GH₵25 OFF',
  '20% OFF',
]

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

const SOCIAL_PROOF_DATA = [
  { name: 'Kwame A.', city: 'Accra', prize: '15% Off' },
  { name: 'Ama S.', city: 'Kumasi', prize: 'Free Shipping' },
  { name: 'Kofi M.', city: 'Tamale', prize: 'GH₵25 Off' },
  { name: 'Abena K.', city: 'Cape Coast', prize: '20% Off' },
  { name: 'Yaw B.', city: 'Tema', prize: '10% Off' },
  { name: 'Efua N.', city: 'Takoradi', prize: '5% Off' },
  { name: 'Kwasi D.', city: 'Sunyani', prize: 'GH₵10 Off' },
  { name: 'Akosua T.', city: 'Obuasi', prize: 'Free Shipping' },
  { name: 'Nana P.', city: 'Koforidua', prize: '15% Off' },
  { name: 'Adwoa R.', city: 'Ho', prize: '20% Off' },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface Prize {
  name: string
  type: 'percent' | 'shipping' | 'fixed' | 'none'
  value: number
  color: string
  code?: string | null
  minOrder?: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('zonkomi-sid')
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('zonkomi-sid', sid)
  }
  return sid
}

// ─── Audio Engine ────────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

function playTick() {
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1200 + (Math.random() - 0.5) * 400
    gain.gain.value = 0.06
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.03)
  } catch {
    /* ignore */
  }
}

function playWinSound() {
  try {
    const ctx = getAudioContext()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.3)
    })
  } catch {
    /* ignore */
  }
}

// ─── LED Dots ────────────────────────────────────────────────────────────────

function generateLEDPositions(count: number, radius: number): { x: number; y: number; angle: number }[] {
  const positions: { x: number; y: number; angle: number }[] = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 360
    const rad = (angle * Math.PI) / 180
    positions.push({
      x: 50 + radius * Math.cos(rad - Math.PI / 2),
      y: 50 + radius * Math.sin(rad - Math.PI / 2),
      angle,
    })
  }
  return positions
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SpinWheel() {
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const subtotal = getSubtotal()
  const isEligible = subtotal >= SPIN_THRESHOLD

  // Modal state
  const [open, setOpen] = useState(false)
  const [modalSource, setModalSource] = useState<'manual' | 'exit'>('manual')

  // Wheel state
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [ledPhase, setLedPhase] = useState(0)
  const [prize, setPrize] = useState<Prize | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [canSpin, setCanSpin] = useState(true)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [confetti, setConfetti] = useState(false)
  const [copied, setCopied] = useState(false)

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true)
  const tickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Welcome toast state
  const [showWelcome, setShowWelcome] = useState(false)
  const welcomeShownRef = useRef(false)

  // Social proof state
  const [proofToast, setProofToast] = useState<{ name: string; city: string; prize: string; key: number } | null>(null)
  const proofCountRef = useRef(0)

  // Exit intent ref
  const exitShownRef = useRef(false)

  // ─── Derived values ──────────────────────────────────────────────────────

  const amountNeeded = Math.max(0, SPIN_THRESHOLD - subtotal)
  const progress = Math.min(100, (subtotal / SPIN_THRESHOLD) * 100)

  // ─── Check Spin Status ───────────────────────────────────────────────────

  const checkSpinStatus = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    if (!open) return
    checkSpinStatus()
  }, [open, checkSpinStatus])

  // ─── LED Chase Animation During Spin ─────────────────────────────────────

  useEffect(() => {
    if (!spinning) return
    const interval = setInterval(() => {
      setLedPhase((p) => (p + 1) % 3)
    }, 100)
    return () => clearInterval(interval)
  }, [spinning])

  // ─── Tick Sound Loop ─────────────────────────────────────────────────────

  const startTickLoop = useCallback(() => {
    let interval = 60
    const tick = () => {
      if (soundEnabled) playTick()
      interval += 10 + Math.random() * 5
      if (interval > 500) return
      tickTimeoutRef.current = setTimeout(tick, interval)
    }
    tickTimeoutRef.current = setTimeout(tick, interval)
  }, [soundEnabled])

  const stopTickLoop = useCallback(() => {
    if (tickTimeoutRef.current) {
      clearTimeout(tickTimeoutRef.current)
      tickTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopTickLoop()
  }, [stopTickLoop])

  // ─── Welcome Toast ───────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('zonkomi-welcome-seen')) return
    const timer = setTimeout(() => {
      if (!welcomeShownRef.current) {
        welcomeShownRef.current = true
        setShowWelcome(true)
        sessionStorage.setItem('zonkomi-welcome-seen', '1')
        setTimeout(() => setShowWelcome(false), 6000)
      }
    }, 8000)
    return () => clearTimeout(timer)
  }, [])

  // ─── Social Proof Toasts ─────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (proofCountRef.current >= 3) return

    const scheduleNext = () => {
      const delay = 20000 + Math.random() * 25000
      const timer = setTimeout(() => {
        if (proofCountRef.current >= 3 || open) {
          scheduleNext()
          return
        }
        const entry = SOCIAL_PROOF_DATA[Math.floor(Math.random() * SOCIAL_PROOF_DATA.length)]
        proofCountRef.current += 1
        const key = Date.now()
        setProofToast({ ...entry, key })
        setTimeout(() => setProofToast(null), 5000)
        scheduleNext()
      }, delay)
      return timer
    }

    const timer = scheduleNext()
    return () => clearTimeout(timer)
  }, [open])

  // ─── Exit Intent ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof document === 'undefined') return

    const handler = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShownRef.current && subtotal >= SPIN_THRESHOLD && !open) {
        exitShownRef.current = true
        setModalSource('exit')
        setOpen(true)
      }
    }

    document.addEventListener('mouseout', handler)
    return () => document.removeEventListener('mouseout', handler)
  }, [subtotal, open])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleOpen = useCallback(() => {
    setModalSource('manual')
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    stopTickLoop()
    setTimeout(() => {
      setShowResult(false)
      setError('')
    }, 300)
  }, [stopTickLoop])

  const handleSpin = useCallback(async () => {
    if (spinning || !canSpin) return
    setSpinning(true)
    setError('')

    startTickLoop()

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
        stopTickLoop()
        return
      }

      const wonPrize: Prize = data.prize
      const segmentIndex = PRIZE_INDEX[wonPrize.name] ?? 0

      // Rotation calculation
      const segmentCenter = segmentIndex * 45 + 22.5
      const targetAngle = 360 - segmentCenter
      const jitter = (Math.random() - 0.5) * 28
      const fullSpins = 5 + Math.floor(Math.random() * 3)
      const newRotation = rotation + fullSpins * 360 + targetAngle + jitter - (rotation % 360)

      setRotation(newRotation)

      // Reveal result after CSS transition (5.5s + buffer)
      setTimeout(() => {
        stopTickLoop()
        setPrize(wonPrize)
        setShowResult(true)
        setSpinning(false)
        setCanSpin(false)

        if (wonPrize.type !== 'none') {
          setConfetti(true)
          if (soundEnabled) playWinSound()
          setTimeout(() => setConfetti(false), 3500)
        }

        if (wonPrize.code) {
          localStorage.setItem(
            'zonkomi-coupon',
            JSON.stringify({
              code: wonPrize.code,
              type: wonPrize.type,
              value: wonPrize.value,
              name: wonPrize.name,
              minOrder: wonPrize.minOrder,
            })
          )
        }
      }, 5800)
    } catch {
      setError('Network error. Please try again.')
      setSpinning(false)
      stopTickLoop()
    }
  }, [spinning, canSpin, rotation, soundEnabled, startTickLoop, stopTickLoop])

  const handleCopy = useCallback(async () => {
    if (!prize?.code) return
    try {
      await navigator.clipboard.writeText(prize.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }, [prize])

  // ─── Format prize description ───────────────────────────────────────────

  const formatPrizeDescription = (p: Prize) => {
    if (p.type === 'none') return 'Better luck tomorrow!'
    if (p.type === 'percent') return `${p.value}% discount on your next order`
    if (p.type === 'shipping') return 'Free shipping on your next order'
    if (p.type === 'fixed') {
      let desc = `GH₵ ${p.value} off your next order`
      if (p.minOrder) desc += ` (min. GH₵ ${p.minOrder})`
      return desc
    }
    return ''
  }

  // ─── Conic gradient string ───────────────────────────────────────────────

  const conicGradient = SEGMENT_COLORS.map((color, i) => {
    const start = i * 45
    const end = (i + 1) * 45
    return `${color} ${start}deg ${end}deg`
  }).join(', ')

  // ─── LED positions (percentage-based for responsive sizing) ──────────────

  const ledPositions = generateLEDPositions(28, 47)

  // ─── Confetti particles (stable via useMemo to avoid hydration mismatch) ────

  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.5 + Math.random() * 1,
        color: ['#FCD116', '#CE1126', '#00BFA5', '#FF6D00', '#7B1FA2', '#C2185B'][i % 6],
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 720 - 360,
      })),
    []
  )

  // ─── Segment text positions ──────────────────────────────────────────────

  const segmentTexts = SEGMENT_LABELS.map((label, i) => {
    const midAngle = i * 45 + 22.5
    const rad = ((midAngle - 90) * Math.PI) / 180
    const textDist = 0.65
    const x = 50 + textDist * Math.cos(rad) * 50
    const y = 50 + textDist * Math.sin(rad) * 50
    // Flip text for readability when on left side
    const flip = midAngle > 90 && midAngle < 270
    const textRotation = flip ? midAngle + 180 : midAngle
    return { label, x, y, textRotation, flip }
  })

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════
          FLOATING TRIGGER BUTTON
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isEligible && !open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 group"
            title="Spin & Win! - Your order qualifies!"
          >
            <div className="relative">
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-[#FCD116] animate-ping opacity-30" />
              {/* Button */}
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#FCD116] to-[#C59F00] shadow-lg shadow-yellow-300/50 flex items-center justify-center hover:scale-110 transition-transform duration-300 border-4 border-white">
                <Gift className="w-7 h-7 text-[#002B1B]" />
              </div>
              {/* Badge */}
              <div className="absolute -top-1 -right-1 bg-[#CE1126] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                WIN
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 w-48 p-2.5 bg-[#002B1B] text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="font-bold text-[#FCD116]">You qualify! 🎉</p>
                <p className="text-gray-300 mt-0.5">Spin for exclusive discounts</p>
                <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#002B1B]" />
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Locked floating button - has items but below threshold */}
      <AnimatePresence>
        {!isEligible && subtotal > 0 && !open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center relative cursor-default">
              <Gift className="w-5 h-5 text-gray-400" />
              {/* Cart badge */}
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center">
                <ShoppingCart className="w-3 h-3 text-white" />
              </div>
            </div>
            {/* Progress tooltip */}
            <div className="absolute bottom-full right-0 mb-2 w-52 p-3 bg-white text-gray-800 text-xs rounded-xl shadow-xl border border-gray-100 pointer-events-none">
              <p className="font-bold text-gray-900 mb-1">🎁 Unlock Spin & Win!</p>
              <p className="text-gray-500 mb-2">
                Add <span className="font-bold text-[#C59F00]">GH₵ {amountNeeded.toFixed(2)}</span> more to qualify
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-[#FCD116] to-[#C59F00] rounded-full h-1.5 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {progress.toFixed(0)}% of GH₵ {SPIN_THRESHOLD}
              </p>
              <div className="absolute top-full right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          SOCIAL PROOF TOAST
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {proofToast && (
          <motion.div
            key={proofToast.key}
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-6 left-6 z-50"
          >
            <div className="relative flex items-center gap-3 bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 min-w-[280px] max-w-[320px]">
              {/* Left color accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#FCD116]" />
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#002B1B] to-[#004D2E] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#FCD116]">
                  {proofToast.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {proofToast.name}
                  <span className="text-gray-400 font-normal ml-1">· {proofToast.city}</span>
                </p>
                <p className="text-xs text-gray-500">
                  just won{' '}
                  <span className="font-semibold text-[#002B1B]">{proofToast.prize}</span>
                </p>
                <p className="text-[10px] text-gray-300 mt-0.5">A few seconds ago</p>
              </div>
              {/* Dismiss */}
              <button
                onClick={() => setProofToast(null)}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          WELCOME TOAST
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 px-5 py-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FCD116] to-[#C59F00] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Gift className="w-5 h-5 text-[#002B1B]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  Welcome to Zonkomi! 🎉
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Build your cart to GH₵ {SPIN_THRESHOLD}+ and unlock Spin & Win for exclusive discounts!
                </p>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="mt-2 px-4 py-1.5 bg-[#002B1B] text-white text-xs font-semibold rounded-full hover:bg-[#004D2E] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
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
              className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[95vh] overflow-y-auto"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>

              {/* ─── Header ─────────────────────────────────────────────── */}
              <div className="bg-gradient-to-r from-[#002B1B] via-[#004D2E] to-[#002B1B] px-6 pt-8 pb-6 text-center relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-[#FCD116]/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#CE1126]/10 rounded-full translate-x-1/3 translate-y-1/3" />

                {/* Sound toggle */}
                <button
                  onClick={() => setSoundEnabled((s) => !s)}
                  className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#FCD116]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[#FCD116]/50" />
                  )}
                </button>

                <div className="relative">
                  <Gift className="w-10 h-10 text-[#FCD116] mx-auto mb-2" />
                  <h2 className="text-2xl font-bold text-white">Spin & Win!</h2>
                  <p className="text-sm text-gray-300 mt-1">
                    {modalSource === 'exit'
                      ? "Wait! Don't miss your discount!"
                      : 'Spin once daily for exclusive discounts'}
                  </p>
                </div>
              </div>

              {/* ─── Eligibility Badge ──────────────────────────────────── */}
              <div className="px-6 -mt-3 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white rounded-full shadow-md border border-gray-100">
                  <ShoppingCart className="w-3.5 h-3.5 text-[#002B1B]" />
                  <span className="text-xs font-medium text-gray-600">
                    Cart:{' '}
                    <span className="font-bold text-[#002B1B]">
                      GH₵ {subtotal.toFixed(2)}
                    </span>
                    {isEligible ? (
                      <span className="text-[#00BFA5] ml-1">✓ Qualifies!</span>
                    ) : (
                      <span className="text-gray-400 ml-1">
                        (need GH₵ {amountNeeded.toFixed(2)} more)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* ─── Wheel Area ─────────────────────────────────────────── */}
              <div className="px-6 py-6">
                {/* Checking state */}
                {checking ? (
                  <div className="flex items-center justify-center h-72">
                    <div className="w-8 h-8 border-2 border-[#FCD116] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : showResult && prize ? (
                  /* ─── Result Screen ──────────────────────────────────── */
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="text-center py-4"
                  >
                    {/* Prize icon */}
                    {prize.type !== 'none' ? (
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FCD116] to-[#C59F00] flex items-center justify-center shadow-lg">
                        <PartyPopper className="w-10 h-10 text-[#002B1B]" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Clock className="w-10 h-10 text-gray-400" />
                      </div>
                    )}

                    <h3
                      className={`text-xl font-bold ${
                        prize.type !== 'none' ? 'text-[#002B1B]' : 'text-gray-500'
                      }`}
                    >
                      {prize.type !== 'none' ? '🎉 Congratulations!' : '😊 Almost!'}
                    </h3>

                    {/* Prize badge */}
                    <div
                      className="mt-2 inline-block px-5 py-2 rounded-full text-lg font-bold text-white shadow-md"
                      style={{ backgroundColor: prize.color || '#6B7280' }}
                    >
                      {prize.name}
                    </div>

                    <p className="text-sm text-gray-600 mt-3">
                      {formatPrizeDescription(prize)}
                    </p>

                    {/* Coupon code box */}
                    {prize.code && (
                      <div className="mt-4 bg-yellow-50 border-2 border-dashed border-[#FCD116] rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Your discount code:</p>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-xl font-mono font-bold text-[#002B1B] tracking-wider">
                            {prize.code}
                          </p>
                          <button
                            onClick={handleCopy}
                            className="w-8 h-8 rounded-lg bg-[#FCD116]/20 hover:bg-[#FCD116]/30 flex items-center justify-center transition-colors flex-shrink-0"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-[#00BFA5]" />
                            ) : (
                              <Copy className="w-4 h-4 text-[#C59F00]" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Use at checkout · Valid for 7 days
                        </p>
                      </div>
                    )}

                    {/* Try again message */}
                    {prize.type === 'none' && (
                      <p className="text-sm text-gray-400 mt-3">
                        Come back tomorrow for another chance!
                      </p>
                    )}

                    {/* CTA button */}
                    <button
                      onClick={handleClose}
                      className="mt-6 px-8 py-2.5 bg-[#002B1B] hover:bg-[#003D26] text-white rounded-full text-sm font-medium transition-colors"
                    >
                      {prize.type !== 'none' ? 'Apply at Checkout' : 'Close'}
                    </button>
                  </motion.div>
                ) : (
                  /* ─── Wheel ───────────────────────────────────────────── */
                  <div className="flex flex-col items-center">
                    {/* Pointer */}
                    <div className="relative z-10 mb-[-4px]">
                      {/* Attachment circle */}
                      <div className="w-4 h-4 rounded-full bg-[#FCD116] border-2 border-[#002B1B] mx-auto shadow-md" />
                      {/* Triangle */}
                      <div
                        className="mx-auto -mt-1"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '14px solid transparent',
                          borderRight: '14px solid transparent',
                          borderTop: '24px solid #FCD116',
                          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
                        }}
                      />
                    </div>

                    {/* Wheel Container */}
                    <div
                      className="relative w-[280px] h-[280px] md:w-[340px] md:h-[340px]"
                    >
                      {/* ─── Outer Rim (static) ─────────────────────────── */}
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: '#002B1B',
                          padding: '12px',
                        }}
                      >
                        {/* Inner well for wheel */}
                        <div className="relative w-full h-full rounded-full overflow-hidden">
                          {/* ─── Spinning Wheel (rotates) ─────────────────── */}
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `conic-gradient(from 0deg, ${conicGradient})`,
                              transition: spinning
                                ? 'transform 5.5s cubic-bezier(0.15, 0.60, 0.15, 1)'
                                : 'none',
                              transform: `rotate(${rotation}deg)`,
                            }}
                          >
                            {/* Segment divider lines */}
                            {Array.from({ length: 8 }).map((_, i) => {
                              const angle = i * 45
                              return (
                                <div
                                  key={`div-${i}`}
                                  className="absolute top-1/2 left-1/2 w-[50%] h-[1.5px] origin-left"
                                  style={{
                                    transform: `rotate(${angle}deg)`,
                                    background: 'rgba(255,255,255,0.35)',
                                  }}
                                />
                              )
                            })}

                            {/* Segment labels */}
                            {segmentTexts.map((seg, i) => (
                              <div
                                key={`lbl-${i}`}
                                className="absolute text-[10px] md:text-xs font-extrabold whitespace-nowrap select-none"
                                style={{
                                  left: `${seg.x}%`,
                                  top: `${seg.y}%`,
                                  transform: `translate(-50%, -50%) rotate(${seg.textRotation}deg)`,
                                  color: '#fff',
                                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                {seg.label}
                              </div>
                            ))}

                            {/* Glossy overlay */}
                            <div
                              className="absolute inset-0 rounded-full pointer-events-none"
                              style={{
                                background:
                                  'radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)',
                              }}
                            />
                          </div>

                          {/* ─── Center Hub (static) ────────────────────── */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-4 border-[#002B1B] shadow-lg"
                              style={{
                                background: 'linear-gradient(135deg, #FCD116, #C59F00)',
                              }}
                            >
                              <span className="text-xs md:text-sm font-black text-[#002B1B] tracking-wider">
                                SPIN
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ─── LED Dots (static on outer rim) ─────────────── */}
                      {ledPositions.map((led, i) => {
                        const isLit = spinning && (i % 3) === ledPhase
                        return (
                          <div
                            key={`led-${i}`}
                            className="absolute w-2 h-2 md:w-2.5 md:h-2.5 rounded-full"
                            style={{
                              left: `${led.x}%`,
                              top: `${led.y}%`,
                              transform: 'translate(-50%, -50%)',
                              background: isLit ? '#FCD116' : 'rgba(252, 209, 22, 0.2)',
                          boxShadow: isLit
                                ? '0 0 6px 2px rgba(252, 209, 22, 0.6)'
                                : 'none',
                              transition: 'background 0.1s, box-shadow 0.1s',
                            }}
                          />
                        )
                      })}
                    </div>

                    {/* ─── Spin Button ───────────────────────────────────── */}
                    {canSpin ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSpin}
                        disabled={spinning}
                        className="mt-6 px-10 py-3 bg-gradient-to-r from-[#FCD116] to-[#C59F00] hover:from-[#C59F00] hover:to-[#A88500] text-white rounded-full font-bold text-sm shadow-lg shadow-yellow-300/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
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

      {/* ═══════════════════════════════════════════════════════════════════════
          CONFETTI OVERLAY
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {confetti && (
          <div className="fixed inset-0 z-[101] pointer-events-none overflow-hidden">
            {confettiParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  x: `${p.x}vw`,
                  y: '-5vh',
                  scale: 1,
                  opacity: 1,
                }}
                animate={{
                  y: '105vh',
                  x: `${p.x + (Math.random() - 0.5) * 20}vw`,
                  rotate: p.rotation,
                  opacity: [1, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
                className="absolute"
              >
                <div
                  className="rounded-sm"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
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
