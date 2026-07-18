'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { ShieldCheck, ArrowRight, LoaderCircle, Eye, EyeOff, Lock, Mail, AlertTriangle } from 'lucide-react'

export function AdminLoginForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError('')

    const result = await authClient.signIn.email({ email, password })

    if (result.error) {
      setError(result.error.message || 'Email atau kata sandi salah')
      setPending(false)
      return
    }

    // Check if user has admin role
    try {
      const roleCheck = await fetch('/api/admin/check-role')
      const roleData = await roleCheck.json()
      if (roleData.role !== 'admin') {
        await authClient.signOut()
        setError('Akun ini bukan administrator. Silakan hubungi admin lain atau gunakan halaman login driver.')
        setPending(false)
        return
      }
    } catch {
      setError('Gagal memverifikasi role. Coba lagi.')
      setPending(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0a0f1c 0%, #1a1f3a 30%, #0d1526 60%, #0a0f1c 100%)'
    }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-20" style={{
          background: 'radial-gradient(circle, rgba(0,176,80,0.4) 0%, transparent 70%)'
        }} />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full opacity-15" style={{
          background: 'radial-gradient(circle, rgba(0,176,80,0.3) 0%, transparent 70%)'
        }} />
      </div>

      <section className="relative z-10 flex w-full max-w-md flex-col gap-7 rounded-3xl border border-white/10 p-8 shadow-2xl" style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(40px)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 25px 80px rgba(0,0,0,0.5), 0 0 100px rgba(0,176,80,0.08)'
      }}>
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg" style={{
            background: 'linear-gradient(135deg, #00b050 0%, #00843b 100%)',
            boxShadow: '0 8px 32px rgba(0,176,80,0.4)'
          }}>
            <ShieldCheck className="h-10 w-10 text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-center gap-2">
              <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: '#00b050' }}>
                GRAB ADMIN
              </span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{
                background: 'linear-gradient(135deg, #00b050 0%, #00843b 100%)'
              }}>
                v2.0
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Console</h1>
            <p className="mt-2 text-sm text-white/50">
              Panel kontrol manajemen mitra dan operasional.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold tracking-wide uppercase text-white/40">
              Email Administrator
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-emerald-500/40 focus:bg-white/8 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold tracking-wide uppercase text-white/40">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-11 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-emerald-500/40 focus:bg-white/8 focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/30 transition-colors hover:text-white/60"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            disabled={pending}
            className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: pending
                ? 'rgba(0,176,80,0.3)'
                : 'linear-gradient(135deg, #00b050 0%, #00843b 100%)',
              boxShadow: pending ? 'none' : '0 4px 24px rgba(0,176,80,0.3)',
            }}
          >
            {pending ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                <span>Masuk sebagai Admin</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
          <p className="text-center text-xs text-white/30">
            Belum punya akses admin? Hubungi administrator sistem.
          </p>
          <Link
            href="/sign-in"
            className="text-center text-xs text-white/30 transition-colors hover:text-white/50"
          >
            Bukan admin? Login sebagai driver →
          </Link>
        </div>
      </section>
    </main>
  )
}