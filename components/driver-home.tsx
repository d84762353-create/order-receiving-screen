'use client'

import {
  Bell,
  CarFront,
  ChevronRight,
  CircleUserRound,
  Crosshair,
  HelpCircle,
  History,
  Home,
  MapPin,
  Menu,
  MoreHorizontal,
  Navigation,
  Power,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

const quickActions = [
  { label: 'Jenis layanan', icon: CarFront },
  { label: 'Tujuan Saya', icon: MapPin },
  { label: 'Orderan Turbo', icon: Zap },
  { label: 'Pusat Keselamatan', icon: ShieldCheck },
  { label: 'Lainnya', icon: MoreHorizontal },
]

const navItems = [
  { label: 'Beranda', icon: Home },
  { label: 'Pendapatan', icon: WalletCards },
  { label: 'Kotak Masuk', icon: Bell },
  { label: 'Pencapaian', icon: History },
  { label: 'Profil', icon: CircleUserRound },
]

function MapView() {
  return (
    <section className="relative h-[48vh] min-h-80 overflow-hidden bg-map" aria-label="Peta area pengemudi">
      <div className="absolute inset-0 opacity-70" aria-hidden="true">
        <div className="road road-a" />
        <div className="road road-b" />
        <div className="road road-c" />
        <div className="road road-d" />
        <div className="road road-e" />
      </div>

      <div className="absolute left-[18%] top-[16%] text-xs text-muted-foreground">Bojong</div>
      <div className="absolute right-[20%] top-[20%] text-xs text-muted-foreground">Cipari</div>
      <div className="absolute left-[48%] top-[28%] text-xs text-muted-foreground">Wirosari</div>
      <div className="absolute left-[11%] top-[56%] text-xs text-muted-foreground">Tanjung</div>
      <div className="absolute right-[13%] top-[64%] text-xs text-muted-foreground">Mojosari</div>
      <div className="absolute left-[40%] top-[68%] rounded-full bg-map-water px-3 py-2 text-[10px] font-semibold text-map-water-foreground">Waduk<br />Sukamaju</div>

      <header className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-5">
        <button className="flex size-11 items-center justify-center rounded-full bg-card shadow-md" aria-label="Buka menu">
          <Menu className="size-5" />
        </button>
        <div className="rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-md">Online</div>
        <button className="flex size-11 items-center justify-center rounded-full bg-card shadow-md" aria-label="Bantuan">
          <HelpCircle className="size-5" />
        </button>
      </header>

      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2">
        <div className="flex size-16 items-center justify-center rounded-full bg-card/70 shadow-sm ring-1 ring-border">
          <div className="flex size-11 items-center justify-center rounded-full bg-map-pin text-primary-foreground shadow-md ring-4 ring-card">
            <Navigation className="size-6 fill-current" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 right-4 flex flex-col gap-3">
        <button className="flex size-11 items-center justify-center rounded-full bg-card shadow-md" aria-label="Area ramai">
          <Sparkles className="size-5" />
        </button>
        <button className="flex size-11 items-center justify-center rounded-full bg-card text-map-pin shadow-md" aria-label="Pusatkan lokasi">
          <Crosshair className="size-5" />
        </button>
      </div>
      <span className="absolute bottom-3 left-3 text-[10px] text-muted-foreground">© GrabMaps</span>
    </section>
  )
}

export function DriverHome() {
  const [turbo, setTurbo] = useState(true)
  const [activeNav, setActiveNav] = useState('Beranda')

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-background shadow-2xl">
      <MapView />

      <section className="relative flex flex-1 flex-col rounded-t-3xl bg-background shadow-[0_-8px_30px_color-mix(in_oklab,var(--foreground)_8%,transparent)]">
        <button
          type="button"
          onClick={() => setTurbo((value) => !value)}
          className="flex items-center gap-3 border-b border-border px-4 py-4 text-left"
          aria-pressed={turbo}
        >
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${turbo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <Power className="size-5" />
          </span>
          <span className="flex-1 text-sm font-medium leading-5">
            {turbo ? 'Menerima orderan turbo secara otomatis.' : 'Orderan turbo sedang dinonaktifkan.'}
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>

        <div className="grid grid-cols-5 px-2 py-4">
          {quickActions.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.label} className="flex flex-col items-center gap-2 px-1 text-center" type="button">
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="text-[10px] font-medium leading-3 text-muted-foreground">{item.label}</span>
              </button>
            )
          })}
        </div>

        <button className="mx-4 flex items-center justify-between rounded-2xl bg-secondary px-4 py-3 text-left" type="button">
          <span>
            <span className="block text-xs font-semibold">Belum ada orderan saat ini</span>
            <span className="mt-1 block text-[10px] text-muted-foreground">Tetap online, orderan akan segera masuk.</span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>

        <nav className="mt-auto grid grid-cols-5 border-t border-border bg-background px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3" aria-label="Navigasi utama">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activeNav === item.label
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveNav(item.label)}
                className={`flex flex-col items-center gap-1 text-[9px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </section>
    </main>
  )
}
