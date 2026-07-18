'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError('')
    const result = mode === 'sign-up'
      ? await authClient.signUp.email({ email, password, name: name || 'Mitra Driver' })
      : await authClient.signIn.email({ email, password })
    if (result.error) {
      setError(result.error.message || 'Terjadi kesalahan')
      setPending(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4" style={{
      background: 'linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)'
    }}>
      <section className="flex w-full max-w-md flex-col gap-7 rounded-3xl bg-white p-7 shadow-xl border border-emerald-100/50">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <img src="/images/grab-driver-logo.png" alt="Grab Driver Logo" className="h-14 w-auto object-contain self-start rounded-xl mb-1 shadow-sm border border-slate-100" />
          <div>
            <p className="text-sm font-bold tracking-wider uppercase" style={{ color: '#00b050' }}>GRAB DRIVER</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {mode === 'sign-in' ? 'Selamat datang kembali' : 'Mulai perjalanan Anda'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === 'sign-in'
                ? 'Masuk untuk menerima order dan melihat penghasilan.'
                : 'Daftar sebagai mitra pengemudi terverifikasi.'}
            </p>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === 'sign-up' && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              Nama lengkap
              <input
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="h-12 rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-gray-900 font-normal outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Email
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="driver@email.com"
              className="h-12 rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-gray-900 font-normal outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Kata sandi
            <input
              name="password"
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="h-12 rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-gray-900 font-normal outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            disabled={pending}
            className="flex h-12 items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #00b050 0%, #00843b 100%)',
              boxShadow: '0 4px 16px rgba(0,176,80,0.3)'
            }}
          >
            {pending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <>
                <span>{mode === 'sign-in' ? 'Masuk' : 'Daftar'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
          <p className="text-center text-sm text-gray-500">
            {mode === 'sign-in' ? 'Belum menjadi mitra?' : 'Sudah punya akun?'}{' '}
            <Link className="font-semibold" style={{ color: '#00b050' }} href={mode === 'sign-in' ? '/sign-up' : '/sign-in'}>
              {mode === 'sign-in' ? 'Daftar sekarang' : 'Masuk'}
            </Link>
          </p>
          <Link
            href="/admin/login"
            className="flex items-center justify-center gap-2 text-xs text-gray-400 transition-colors hover:text-gray-600"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Login sebagai Admin</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
