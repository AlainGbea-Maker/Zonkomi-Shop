'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAppStore, useUserStore } from '@/lib/store'
import { Shield } from 'lucide-react'
import { ArrowLeft, Mail, User, Loader2, Zap } from 'lucide-react'

export default function LoginPage() {
  const { navigate } = useAppStore()
  const { setUser } = useUserStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail.trim()) {
      setError('Please enter your email')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const userData = data.user || data
      setUser(userData, data.token)
      if (userData?.role === 'admin') navigate('admin')
      else navigate('home')
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerName.trim() || !registerEmail.trim()) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerName, email: registerEmail }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const userData = data.user || data
      setUser(userData, data.token)
      if (userData?.role === 'admin') navigate('admin')
      else navigate('home')
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/demo')
      if (!res.ok) throw new Error()
      const data = await res.json()
      const userData = data.user || data
      setUser(userData, data.token)
      if (userData?.role === 'admin') navigate('admin')
      else navigate('home')
    } catch {
      setError('Demo login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back */}
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#C59F00] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#FCD116] rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login'
              ? 'Sign in to your Zonkomi Shop account'
              : 'Join Zonkomi Shop and start saving'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Account
          </button>
        </div>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="login-email">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full h-11 font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Sign In
                  </Button>

                  <div className="relative my-4">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">
                      OR
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full h-11 text-[#C59F00] border-[#FCD116]/30 hover:bg-yellow-50"
                    onClick={handleDemoLogin}
                    disabled={loading}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Sign in as Demo User
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="reg-name">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="reg-name"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="John Doe"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-email">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full bg-[#FCD116] hover:bg-[#D4AA00] text-white rounded-full h-11 font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Create Account
                  </Button>

                  <div className="relative my-4">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">
                      OR
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full h-11 text-[#C59F00] border-[#FCD116]/30 hover:bg-yellow-50"
                    onClick={handleDemoLogin}
                    disabled={loading}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Sign in as Demo User
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to Zonkomi Shop&apos;s Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  )
}
