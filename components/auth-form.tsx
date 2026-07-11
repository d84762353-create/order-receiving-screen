'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { authClient } from '@/lib/auth-client'
import { ArrowRight, LoaderCircle } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(formData: FormData) {
    setPending(true); setError('')
    const email = String(formData.get('email')); const password = String(formData.get('password')); const name = String(formData.get('name') || 'Mitra Driver')
    const result = mode === 'sign-up' ? await authClient.signUp.email({ email, password, name }) : await authClient.signIn.email({ email, password })
    if (result.error) { setError(result.error.message || 'Terjadi kesalahan'); setPending(false); return }
    router.push('/'); router.refresh()
  }
  return <main className="flex min-h-dvh items-center justify-center bg-muted p-4"><section className="flex w-full max-w-md flex-col gap-8 rounded-3xl bg-card p-7 shadow-xl">
    <header className="flex flex-col gap-4"><Image src="/images/grab-driver-logo.png" alt="Grab Driver" width={80} height={80} priority className="size-20 rounded-2xl object-cover shadow-sm" /><div><p className="font-semibold text-primary">GRAB DRIVER</p><h1 className="mt-2 text-3xl font-bold text-balance">{mode === 'sign-in' ? 'Selamat datang kembali' : 'Mulai perjalanan Anda'}</h1><p className="mt-2 text-muted-foreground">{mode === 'sign-in' ? 'Masuk untuk menerima order dan melihat penghasilan.' : 'Daftar sebagai mitra pengemudi terverifikasi.'}</p></div></header>
    <form action={submit} className="flex flex-col gap-4">{mode === 'sign-up' && <label className="flex flex-col gap-2 text-sm font-medium">Nama lengkap<input name="name" required className="h-12 rounded-xl border bg-background px-4 font-normal outline-none focus:ring-2 focus:ring-ring" /></label>}<label className="flex flex-col gap-2 text-sm font-medium">Email<input name="email" type="email" required className="h-12 rounded-xl border bg-background px-4 font-normal outline-none focus:ring-2 focus:ring-ring" /></label><label className="flex flex-col gap-2 text-sm font-medium">Kata sandi<input name="password" type="password" minLength={8} required className="h-12 rounded-xl border bg-background px-4 font-normal outline-none focus:ring-2 focus:ring-ring" /></label>{error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<button disabled={pending} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" /> : <><span>{mode === 'sign-in' ? 'Masuk' : 'Daftar'}</span><ArrowRight /></>}</button></form>
    <p className="text-center text-sm text-muted-foreground">{mode === 'sign-in' ? 'Belum menjadi mitra?' : 'Sudah punya akun?'} <Link className="font-semibold text-primary" href={mode === 'sign-in' ? '/sign-up' : '/sign-in'}>{mode === 'sign-in' ? 'Daftar sekarang' : 'Masuk'}</Link></p>
  </section></main>
}
