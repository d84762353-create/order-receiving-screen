'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import {
  createDriverProfile,
  markNotificationRead,
  toggleOnline,
  toggleTurbo,
  updateLocation,
  updateOrder,
  declineOrder,
  withdrawFunds,
  resetDriverData,
  assignNewOrder,
  addDailyIncentive,
  confirmActivationPayment,
  toggleQuietRide,
  setDestinationDirection
} from '@/app/actions/driver'
import {
  Activity,
  Bell,
  Bike,
  Bolt,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Crosshair,
  Headphones,
  History,
  Home,
  Inbox,
  LoaderCircle,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Phone,
  Power,
  Route,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  UserRound,
  Wallet,
  X,
  Send,
  Wrench,
  ShieldAlert,
  PhoneCall,
  Sparkles,
  LogOut,
  Check,
  Car,
  Package,
  ShoppingBag,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Bot,
  VolumeX,
  Briefcase,
  GraduationCap,
  Map,
  Compass,
  FileText,
  CreditCard,
  Camera,
  Gift,
  Upload,
  ImagePlus,
  Trash2,
  CheckCircle2,
  Eye
} from 'lucide-react'

interface DriverProfile {
  id: number
  userId: string
  phone: string | null
  city: string | null
  verificationStatus: string
  isOnline: boolean
  turboEnabled: boolean
  rating: string
  acceptanceRate: number
  completionRate: number
  emergencyContact: string | null
  nik: string | null
  simNumber: string | null
  address: string | null
  bankAccount: string | null
  bankName: string | null
  hasVerifiedDocuments: boolean
  hasPaidActivation: boolean
  quietRideEnabled: boolean
  destinationDirection: string | null
  photoKtp: string | null
  photoSim: string | null
  photoStnk: string | null
  photoSelfie: string | null
  photoVehicle: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

interface Order {
  id: number
  userId: string
  serviceType: string
  status: string
  pickupAddress: string
  pickupLatitude: string
  pickupLongitude: string
  dropoffAddress: string
  dropoffLatitude: string
  dropoffLongitude: string
  customerName: string
  customerPhone: string | null
  fare: number
  distanceKm: string | null
  durationMinutes: number | null
  paymentMethod: string
  offeredAt: Date | string
  acceptedAt: Date | string | null
  pickedUpAt: Date | string | null
  completedAt: Date | string | null
  cancelledAt: Date | string | null
  createdAt: Date | string
}

interface Earning {
  id: number
  userId: string
  orderId: number | null
  type: string
  amount: number
  description: string | null
  createdAt: Date | string
}

interface NotificationItem {
  id: number
  userId: string
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: Date | string
}

interface Achievement {
  id: number
  userId: string
  code: string
  title: string
  description: string | null
  progress: number
  target: number
  unlockedAt: Date | string | null
  createdAt: Date | string
}

interface Vehicle {
  id: number
  userId: string
  type: string
  brand: string | null
  model: string | null
  plateNumber: string | null
  color: string | null
  year: number | null
  stnkNumber: string | null
  createdAt: Date | string
}

type Data = {
  profile: DriverProfile | null
  orders: Order[]
  earnings: Earning[]
  notifications: NotificationItem[]
  achievements: Achievement[]
  vehicle: Vehicle | null
}

type Tab = 'home' | 'activity' | 'earnings' | 'inbox' | 'profile'
type Message = { id: number; sender: 'driver' | 'customer'; text: string; time: string }

const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0)

// Shared Audio Context to bypass mobile autoplay restrictions after first interaction
let globalAudioContext: AudioContext | null = null
const getAudioContext = () => {
  if (typeof window === 'undefined') return null
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume()
  }
  return globalAudioContext
}

// Web Audio API Synthesizers for authentic sound effects
const playBiddingBeep = () => {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5 tone
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
  } catch (e) {
    console.log("Audiobeep failed", e)
  }
}

const playAcceptSound = () => {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)
    osc1.type = 'sine'
    osc2.type = 'sine'
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08) // E5
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    osc1.start()
    osc2.start()
    osc1.stop(ctx.currentTime + 0.25)
    osc2.stop(ctx.currentTime + 0.25)
  } catch (e) {
    console.log("Acceptsound failed", e)
  }
}

const playCompleteSound = () => {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    
    // Metallic chime ringing tones
    const freqs = [1046.50, 1318.51, 1567.98, 2093.00]
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      osc.connect(gain)
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.05)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    })
  } catch (e) {
    console.log("Completesound failed", e)
  }
}

const playChatPing = () => {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    osc.start()
    osc.stop(ctx.currentTime + 0.06)
  } catch (e) {
    console.log("Chatping failed", e)
  }
}

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => (
    <div className="relative h-80 w-full overflow-hidden bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
      Memuat peta...
    </div>
  )
})

export function DriverApp({ data, user }: { data: Data; user: { name: string; email: string } }) {
  const [tab, setTab] = useState<Tab>('home')
  const [pending, startTransition] = useTransition()
  const [devOpen, setDevOpen] = useState(false)
  const [activeDrawer, setActiveDrawer] = useState<'chat' | 'phone' | 'safety' | 'withdrawal' | 'targets' | 'services' | 'coach' | 'destination' | null>(null)
  const [showActivationModal, setShowActivationModal] = useState(false)
  
  // Custom operational states
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [receiptOrder, setReceiptOrder] = useState<any>(null)
  const [serviceToggles, setServiceToggles] = useState({
    bike: true,
    car: false,
    food: true,
    express: true
  })
  
  const currentOrder = data.orders.find((o) => !['completed', 'cancelled'].includes(o.status))
  const completedTripsCount = data.orders.filter((o) => o.status === 'completed').length

  // Calculate diamonds loyalty points
  // GrabBike: 10 diamonds, GrabCar: 15 diamonds, GrabFood: 15 diamonds, GrabExpress: 8 diamonds
  const diamondsCount = data.orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => {
      if (o.serviceType === 'car') return sum + 15
      if (o.serviceType === 'food') return sum + 15
      if (o.serviceType === 'express') return sum + 8
      return sum + 10 // GrabBike / Default
    }, 0)

  // Determine Driver Elite Tier Badge
  // Silver (<3 completed trips), Gold (3-5 completed trips), Platinum/Elite (>5 completed trips)
  let driverTier = 'Silver'
  let tierColor = 'from-slate-400 to-slate-500 text-slate-900 border-slate-300'
  if (completedTripsCount >= 3 && completedTripsCount <= 5) {
    driverTier = 'Gold'
    tierColor = 'from-amber-400 to-yellow-500 text-amber-950 border-amber-300'
  } else if (completedTripsCount > 5) {
    driverTier = 'Jawara (Elite)'
    tierColor = 'from-emerald-400 to-emerald-600 text-emerald-950 border-emerald-300 animate-shimmer bg-[length:200%_auto]'
  }

  // Wallet separation
  const cashBalance = data.earnings
    .filter((e) => ['trip', 'withdrawal'].includes(e.type))
    .reduce((sum, item) => sum + item.amount, 0)
    
  const creditBalance = data.earnings
    .filter((e) => ['credit', 'commission'].includes(e.type))
    .reduce((sum, item) => sum + item.amount, 0)

  // Prepopulate chat messages when an order is accepted
  useEffect(() => {
    if (currentOrder && chatMessages.length === 0) {
      setChatMessages([
        {
          id: 1,
          sender: 'customer',
          text: `Halo pak, saya menunggu sesuai titik jemput di ${currentOrder.pickupAddress.split('(')[0].trim()} ya.`,
          time: 'Baru saja'
        }
      ])
    } else if (!currentOrder) {
      setChatMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrder])

  // Auto accept order when Turbo mode is active
  useEffect(() => {
    if (currentOrder && currentOrder.status === 'offered' && data.profile?.turboEnabled) {
      const timeout = setTimeout(() => {
        run(() => updateOrder(currentOrder.id, 'accepted'), 'accepted', currentOrder)
      }, 1500)
      return () => clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrder?.id, currentOrder?.status, data.profile?.turboEnabled])

  // Custom runner to trigger play sounds and receipts on state changes
  const run = (action: () => Promise<void>, nextStatus?: string, orderDetails?: any) =>
    startTransition(async () => {
      try {
        await action()
        if (nextStatus === 'accepted') {
          playAcceptSound()
        } else if (nextStatus === 'completed' && orderDetails) {
          playCompleteSound()
          setReceiptOrder(orderDetails)
        }
      } catch (err: any) {
        alert(err.message || 'Terjadi kesalahan')
      }
    })

  if (!data.profile) return <Onboarding pending={pending} run={(a) => run(a)} />

  if (data.profile.verificationStatus === 'pending') {
    return <PendingVerification pending={pending} run={(a) => run(a)} />
  }

  if (data.profile.verificationStatus === 'suspended') {
    return <SuspendedAccount />
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-background shadow-2xl">

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-y-auto pb-24">
        {tab === 'home' && (
          <HomeView
            data={data}
            order={currentOrder}
            pending={pending}
            run={run}
            credit={creditBalance}
            diamonds={diamondsCount}
            tier={{ label: driverTier, style: tierColor }}
            openDrawer={(drawer) => setActiveDrawer(drawer)}
            onActivationRequired={() => setShowActivationModal(true)}
          />
        )}
        {tab === 'activity' && <ActivityView orders={data.orders} />}
        {tab === 'earnings' && (
          <EarningsView
            earnings={data.earnings}
            cash={cashBalance}
            credit={creditBalance}
            openDrawer={() => setActiveDrawer('withdrawal')}
          />
        )}
        {tab === 'inbox' && <InboxView items={data.notifications} run={(a) => run(a)} />}
        {tab === 'profile' && (
          <ProfileView
            profile={data.profile}
            vehicle={data.vehicle}
            user={user}
            tier={{ label: driverTier, style: tierColor }}
            diamonds={diamondsCount}
            run={(a) => run(a)}
          />
        )}
      </div>

      {/* Bottom Navigation Menu */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 mx-auto flex h-20 max-w-md items-center justify-around border-t bg-card px-2 pb-[env(safe-area-inset-bottom)]"
      >
        {([
          { id: 'home', label: 'Beranda', icon: Home },
          { id: 'activity', label: 'Aktivitas', icon: History },
          { id: 'earnings', label: 'Pendapatan', icon: Wallet },
          { id: 'inbox', label: 'Kotak Masuk', icon: Inbox },
          { id: 'profile', label: 'Profil', icon: UserRound }
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setTab(id)
              setActiveDrawer(null)
            }}
            className={`relative flex min-w-16 flex-col items-center gap-1 text-xs font-medium transition-colors ${
              tab === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-5" />
            {label}
            {id === 'inbox' && data.notifications.some((n) => !n.isRead) && (
              <span className="absolute right-4 top-0 size-2 rounded-full bg-destructive animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      {/* Call Drawer */}
      {currentOrder && (
        <PhoneDrawer
          open={activeDrawer === 'phone'}
          onClose={() => setActiveDrawer(null)}
          customerName={currentOrder.customerName}
          customerPhone={currentOrder.customerPhone || '0812-3456-7890'}
        />
      )}

      {/* Chat Drawer */}
      {currentOrder && (
        <ChatDrawer
          open={activeDrawer === 'chat'}
          onClose={() => setActiveDrawer(null)}
          messages={chatMessages}
          setMessages={setChatMessages}
          customerName={currentOrder.customerName}
        />
      )}

      {/* Safety SOS Drawer */}
      <SafetyDrawer open={activeDrawer === 'safety'} onClose={() => setActiveDrawer(null)} />

      {/* Balance Withdrawal Drawer */}
      <WithdrawalDrawer
        open={activeDrawer === 'withdrawal'}
        onClose={() => setActiveDrawer(null)}
        balance={cashBalance}
        run={run}
        pending={pending}
      />

      {/* Daily Targets Drawer */}
      <TargetsDrawer
        open={activeDrawer === 'targets'}
        onClose={() => setActiveDrawer(null)}
        orders={data.orders}
        achievements={data.achievements}
        diamonds={diamondsCount}
      />

      {/* Services Operational Selection Picker Drawer */}
      <ServicesDrawer
        open={activeDrawer === 'services'}
        onClose={() => setActiveDrawer(null)}
        toggles={serviceToggles}
        setToggles={setServiceToggles}
      />

      {/* Destination Direction Drawer */}
      <DestinationDrawer
        open={activeDrawer === 'destination'}
        onClose={() => setActiveDrawer(null)}
        profile={data.profile}
        run={run}
        pending={pending}
      />

      {/* Coach AI Drawer */}
      <CoachDrawer
        open={activeDrawer === 'coach'}
        onClose={() => setActiveDrawer(null)}
      />

      {/* VIP Activation Modal */}
      {showActivationModal && (
        <ActivationModal
          onClose={() => setShowActivationModal(false)}
          onConfirm={() => {
            setShowActivationModal(false)
            run(confirmActivationPayment)
            setTimeout(() => run(toggleOnline), 300)
          }}
        />
      )}

      {/* Interactive Completed Order Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}
    </main>
  )
}





/* ==========================================================================
   VIEW: DASHBOARD / HOME VIEW
   ========================================================================== */
function HomeView({
  data,
  order,
  pending,
  run,
  credit,
  diamonds,
  tier,
  openDrawer,
  onActivationRequired
}: {
  data: Data
  order: any
  pending: boolean
  run: (action: () => Promise<void>, nextStatus?: string, details?: any) => void
  credit: number
  diamonds: number
  tier: { label: string; style: string }
  openDrawer: (drawer: 'chat' | 'phone' | 'safety' | 'withdrawal' | 'targets' | 'services' | 'coach' | 'destination' | null) => void
  onActivationRequired: () => void
}) {
  const p = data.profile
  if (!p) return null
  const creditAlert = credit < 10000

  // 100% Genuine automatic order simulation
  useEffect(() => {
    if (p.isOnline && !order && !pending) {
      // Random delay between 4 to 12 seconds
      const delay = Math.floor(Math.random() * 8000) + 4000
      const timer = setTimeout(() => {
        run(assignNewOrder)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [p.isOnline, order, pending, run])

  return (
    <div className="flex flex-col">
      {/* Low Credit Warning Banner */}
      {creditAlert && p.isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between animate-pulse">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="size-4 shrink-0" />
            Saldo Dompet Kredit kritis ({rupiah(credit)}). Harap Top-Up segera agar tetap menerima orderan.
          </span>
        </div>
      )}

      {/* Driver Header Profile & Tier Badges */}
      <header className="flex items-center justify-between bg-card px-5 py-4 border-b">
        <div className="flex items-center gap-3">
          <img src="/images/grab-driver-logo.png" alt="Grab" className="h-8 w-auto object-contain rounded-lg shadow-sm" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-md font-extrabold text-foreground">{p.city || 'Jakarta'}</h1>
              <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase border tracking-wider bg-gradient-to-r ${tier.style}`}>
                {tier.label}
              </span>
            </div>
            {p.isOnline && (
              <span className="text-[10px] text-primary font-bold flex items-center gap-1 mt-0.5">
                <span className="size-1.5 rounded-full bg-primary animate-ping" />
                💎 {diamonds} Berlian hari ini
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openDrawer('services')}
            className="flex items-center gap-1 rounded-full border bg-muted/30 px-3 py-1.5 text-xs font-bold text-foreground"
          >
            Layanan
          </button>
          <div className="flex items-center gap-1 rounded-full border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground">
            <Star className="size-3.5 fill-primary text-primary" />
            {p.rating}
          </div>
        </div>
      </header>

      <div className="relative w-full">
        {/* Floating Earnings Bar */}
        {p.isOnline && (
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/85 p-3.5 text-slate-100 backdrop-blur-md shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Wallet className="size-5" />
              </span>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Pendapatan Hari Ini</span>
                <strong className="text-md font-extrabold text-white">
                  {rupiah(data.orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.fare - Math.round(o.fare * 0.20)), 0))}
                </strong>
              </div>
            </div>
            <button
              onClick={() => openDrawer('withdrawal')}
              className="rounded-xl bg-primary px-3 py-1.5 text-[10px] font-black text-primary-foreground uppercase transition-all hover:bg-primary/90 active:scale-95 shadow-sm shadow-primary/25"
            >
              Tarik Tunai
            </button>
          </div>
        )}

        {/* Map Segment */}
        <MapView order={order} />
      </div>

      <section className="relative -mt-4 flex flex-col gap-4 rounded-t-3xl bg-background p-5 shadow-2xl">
        {/* Toggle Online/Offline */}
        <div className="flex items-center justify-between rounded-2xl border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-11 items-center justify-center rounded-full transition-colors ${
                p.isOnline ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Power className="size-5" />
            </span>
            <div>
              <p className="font-bold text-foreground">{p.isOnline ? 'Anda sedang online' : 'Anda sedang offline'}</p>
              <p className="text-xs text-muted-foreground">
                {p.isOnline ? 'Order terdekat siap masuk' : 'Aktifkan untuk menerima order'}
              </p>
            </div>
          </div>
          <button
            disabled={pending || (creditAlert && !p.isOnline)}
            onClick={() => {
              getAudioContext()
              if (!p.isOnline && !p.hasPaidActivation) {
                onActivationRequired()
                return
              }
              run(toggleOnline)
            }}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
              p.isOnline
                ? 'bg-foreground text-background hover:bg-foreground/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/95'
            } disabled:opacity-40`}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : p.isOnline ? 'Offline' : 'Online'}
          </button>
        </div>

        {/* Toggle Turbo Order */}
        <button
          onClick={() => run(toggleTurbo)}
          disabled={pending}
          className="flex items-center justify-between rounded-2xl bg-secondary p-4 text-left transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Bolt className="size-5" />
            </span>
            <span>
              <strong className="block text-foreground text-sm">Turbo Order</strong>
              <small className="text-muted-foreground text-xs">Terima order cocok secara otomatis</small>
            </span>
          </span>
          <span
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
              p.turboEnabled ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`block size-5 rounded-full bg-card shadow-sm transition-transform ${
                p.turboEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </span>
        </button>

        {/* Toggle Quiet Ride */}
        <button
          onClick={() => run(toggleQuietRide)}
          disabled={pending}
          className="flex items-center justify-between rounded-2xl bg-secondary p-4 text-left transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <VolumeX className="size-5" />
            </span>
            <span>
              <strong className="block text-foreground text-sm">Mode Bisu (Quiet Ride)</strong>
              <small className="text-muted-foreground text-xs">Kurangi obrolan dengan penumpang</small>
            </span>
          </span>
          <span
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
              p.quietRideEnabled ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`block size-5 rounded-full bg-card shadow-sm transition-transform ${
                p.quietRideEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </span>
        </button>

        {/* Dynamic Bidding card / Status Card */}
        {order ? (
          <OrderCard order={order} run={run} pending={pending} openDrawer={openDrawer} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center bg-card/20">
            <Bike className="size-10 text-primary animate-bounce duration-1000" />
            <strong className="text-foreground">Menunggu order terdekat</strong>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              {p.isOnline
                ? 'Harap tunggu, sistem sedang mencari orderan yang cocok di sekitar area ini.'
                : 'Silakan aktifkan mode Online di atas untuk mulai mencari penumpang.'}
            </p>
          </div>
        )}

        {/* Quick Menu Actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: CircleDollarSign, label: 'Withdrawal', action: () => openDrawer('withdrawal') },
            { icon: Compass, label: 'Tujuan Searah', action: () => openDrawer('destination') },
            { icon: Bot, label: 'Coach AI', action: () => openDrawer('coach') },
            { icon: Menu, label: 'Lainnya', action: () => openDrawer('services') }
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-card border p-3 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-95 shadow-2xs"
            >
              <Icon className="size-5 text-primary" />
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ==========================================================================
   COMPONENT: ORDER DETAIL CARD (Pulsing Bidding Chime & Circular Countdown)
   ========================================================================== */
function OrderCard({
  order,
  run,
  pending,
  openDrawer
}: {
  order: Order
  run: (fn: () => Promise<void>, nextStatus?: string, details?: Order) => void
  pending: boolean
  openDrawer: (drawer: 'chat' | 'phone' | 'safety' | 'withdrawal' | 'targets' | 'services' | null) => void
}) {
  const steps: Record<string, { label: string; next: string }> = {
    offered: { label: 'Terima Orderan', next: 'accepted' },
    accepted: { label: 'Saya Sudah Tiba', next: 'arrived' },
    arrived: { label: 'Mulai Perjalanan', next: 'picked_up' },
    picked_up: { label: 'Selesaikan Orderan', next: 'completed' }
  }
  const step = steps[order.status]
  
  // Offered Countdown State
  const [countdown, setCountdown] = useState(15)
  const countdownRef = useRef(15)

  useEffect(() => {
    if (order.status !== 'offered') return
    setCountdown(15)
    countdownRef.current = 15
    
    // Play bidding beep chime
    playBiddingBeep()

    const interval = setInterval(() => {
      countdownRef.current -= 1
      if (countdownRef.current <= 0) {
        clearInterval(interval)
        setCountdown(0)
        run(() => declineOrder(order.id))
        return
      }
      if (countdownRef.current <= 3) {
        playBiddingBeep()
      }
      setCountdown(countdownRef.current)
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id, order.status])

  // Styling based on Grab Service Type
  const serviceConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    ride: { label: 'GrabBike', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-500', icon: Bike },
    car: { label: 'GrabCar', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-500', icon: Car },
    food: { label: 'GrabFood', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-500', icon: ShoppingBag },
    express: { label: 'GrabExpress', bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-500', icon: Package }
  }

  const sc = serviceConfig[order.serviceType] || serviceConfig.ride
  const ServiceIcon = sc.icon

  return (
    <article className="relative flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-lg border-primary/20 animate-in slide-in-from-bottom duration-300">
      
      {/* Circular Ticking Countdown on Offered Bid */}
      {order.status === 'offered' && (
        <div className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-full bg-slate-900 border border-slate-800 shadow shadow-primary/10">
          <svg className="size-10 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="transparent"
              stroke="#00b14f"
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * 16}
              strokeDashoffset={2 * Math.PI * 16 * (1 - countdown / 15)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="absolute text-xs font-black text-foreground">{countdown}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${sc.bg} ${sc.text}`}>
          <ServiceIcon className="size-3.5" />
          {sc.label}
        </span>
        {order.status === 'offered' && (
          <span className="text-[10px] text-destructive font-bold animate-pulse">Order Masuk!</span>
        )}
      </div>

      <div className="mt-1 flex justify-between items-baseline">
        <small className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Tarif bersih</small>
        <strong className="text-2xl font-extrabold text-foreground">{rupiah(order.fare)}</strong>
      </div>

      {/* Pickup & Dropoff Routing UI */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <span className="size-3 rounded-full bg-primary border-2 border-card shadow-sm" />
          <span className="h-10 w-0.5 bg-border border-dashed" />
          <MapPin className="size-4 text-destructive" />
        </div>
        <div className="flex flex-1 flex-col gap-4 text-sm">
          <div>
            <small className="block text-[10px] text-muted-foreground uppercase font-black tracking-wider">
              Jemput ({order.customerName})
            </small>
            <p className="font-bold text-foreground text-sm truncate">{order.pickupAddress}</p>
          </div>
          <div>
            <small className="block text-[10px] text-muted-foreground uppercase font-black tracking-wider">Tujuan</small>
            <p className="font-bold text-foreground text-sm truncate">{order.dropoffAddress}</p>
          </div>
        </div>
      </div>

      {/* Trip Details Row */}
      <div className="flex gap-4 border-y py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Route className="size-4 text-primary" />
          <strong>{order.distanceKm} km</strong>
        </span>
        <span className="flex items-center gap-1">
          <Clock3 className="size-4 text-primary" />
          <strong>{order.durationMinutes} mnt</strong>
        </span>
        <span className="ml-auto font-black uppercase tracking-wider text-foreground">
          {order.paymentMethod}
        </span>
      </div>

      {/* Bidding Accept button */}
      {step && (
        <button
          disabled={pending}
          onClick={() => run(() => updateOrder(order.id, step.next), step.next, order)}
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-black tracking-wide text-md shadow-md shadow-primary/20 transition-all hover:bg-primary/95 active:scale-98 disabled:opacity-50"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <LoaderCircle className="size-5 animate-spin" />
              Memproses...
            </span>
          ) : (
            step.label
          )}
        </button>
      )}

      {/* Decline Bidding Option only if status is offered */}
      {order.status === 'offered' && (
        <button
          disabled={pending}
          onClick={() => run(() => declineOrder(order.id))}
          className="text-center text-xs font-semibold text-muted-foreground hover:text-destructive py-1"
        >
          Tolak Orderan Ini
        </button>
      )}

      {/* Active Trip Communications & Navigation buttons */}
      {order.status !== 'offered' && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => openDrawer('phone')}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary py-3 text-xs font-bold text-foreground hover:bg-muted active:scale-95"
          >
            <Phone className="size-4 text-primary" />
            Telepon
          </button>
          <button
            onClick={() => {
              openDrawer('chat')
              playChatPing()
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary py-3 text-xs font-bold text-foreground hover:bg-muted active:scale-95"
          >
            <MessageCircle className="size-4 text-primary" />
            Chat
          </button>
          <button
            onClick={() => {
              window.open(
                `https://www.google.com/maps/dir/?api=1&origin=${order.pickupLatitude},${order.pickupLongitude}&destination=${order.dropoffLatitude},${order.dropoffLongitude}&travelmode=driving`,
                '_blank'
              )
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary py-3 text-xs font-bold text-foreground hover:bg-muted active:scale-95"
          >
            <Navigation className="size-4 text-primary" />
            Navigasi
          </button>
        </div>
      )}
    </article>
  )
}

/* ==========================================================================
   COMPONENT: TRIP RECEIPT INVOICE OVERLAY POPUP
   ========================================================================== */
function ReceiptModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const commission = Math.round(order.fare * 0.20)
  const netEarnings = order.fare - commission
  const [driverRating, setDriverRating] = useState(5)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-primary/20 animate-in zoom-in-95 duration-150 text-slate-100 flex flex-col gap-4">
        
        <header className="flex flex-col items-center gap-2 pb-4 border-b border-slate-800 text-center">
          <img src="/images/grab-driver-logo.png" alt="Grab" className="h-10 w-auto object-contain mb-1" />
          <h2 className="text-lg font-black text-foreground mt-2">Perjalanan Selesai!</h2>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Ringkasan Pendapatan</p>
        </header>

        <div className="flex flex-col gap-3 text-sm py-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tarif Penumpang</span>
            <strong className="text-foreground">{rupiah(order.fare)}</strong>
          </div>
          <div className="flex justify-between text-destructive">
            <span>Potongan Layanan Grab (20%)</span>
            <strong>-{rupiah(commission)}</strong>
          </div>
          <div className="border-t border-slate-800 my-2 pt-3 flex justify-between items-baseline">
            <span className="font-extrabold text-foreground">Pendapatan Bersih</span>
            <strong className="text-xl font-black text-primary">{rupiah(netEarnings)}</strong>
          </div>
        </div>

        <div className="bg-muted/40 rounded-2xl p-4 flex flex-col items-center gap-2">
          <small className="text-[10px] text-muted-foreground font-bold">Beri Rating Penumpang ({order.customerName})</small>
          <div className="flex gap-2 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setDriverRating(star)}
                className="transition-transform active:scale-95"
              >
                <Star
                  className={`size-6 ${
                    star <= driverRating ? 'fill-primary text-primary' : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-wider shadow-lg shadow-primary/15 transition-transform active:scale-98 mt-2"
        >
          Konfirmasi & Selesai
        </button>
      </div>
    </div>
  )
}

/* ==========================================================================
   COMPONENT: VIP ACTIVATION MODAL
   ========================================================================== */
function ActivationModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const uniqueAmount = 1300 + Math.floor(Math.random() * 700)
  const rupiahAmount = new Intl.NumberFormat('id-ID').format(uniqueAmount)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-amber-500/30 animate-in zoom-in-95 duration-150 text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

        <header className="flex flex-col items-center gap-3 pb-4 border-b border-slate-800 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
            <ShieldCheck className="size-7" />
          </span>
          <h2 className="text-lg font-black text-foreground mt-1">Aktivasi Akun VIP</h2>
          <p className="text-[10px] text-amber-400 uppercase font-black tracking-widest">PRIORITAS ORDERAN PREMIUM</p>
        </header>

        <div className="flex flex-col gap-3 text-sm py-1">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 rounded-2xl p-4 border border-amber-500/20 text-center">
            <p className="text-[10px] text-amber-400 uppercase font-black tracking-wider mb-2">SETORAN AWAL AKTIVASI</p>
            <p className="text-3xl font-black text-amber-400">Rp{rupiahAmount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">*Nominal unik, berlaku sekali</p>
          </div>

          <div className="bg-muted/40 rounded-2xl p-4 text-xs leading-relaxed text-muted-foreground flex flex-col gap-2">
            <p className="text-foreground font-bold text-sm">Ketentuan Aktivasi:</p>
            <p>
              Sebagai mitra <strong className="text-amber-400">VIP jalur prioritas</strong>, akun Anda perlu diaktivasi dengan melakukan setoran awal pengamanan saldo driver.
            </p>
            <p>
              Setoran ini menjamin Anda mendapatkan <strong className="text-amber-400">prioritas orderan tertinggi</strong>, 
              <strong className="text-amber-400"> akses ke penumpang eksklusif</strong>, serta 
              <strong className="text-amber-400"> peningkatan kualitas akun</strong> secara menyeluruh.
            </p>
            <p>
              Dana setoran bersifat <strong>refundable penuh</strong> dan akan dikembalikan ketika Anda menonaktifkan akun.
            </p>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-4 text-xs flex flex-col gap-2">
            <p className="text-foreground font-bold text-sm flex items-center gap-2">
              <Phone className="size-3.5 text-primary" /> Hubungi Admin
            </p>
            <p className="text-muted-foreground">Lakukan pembayaran ke nomor di bawah ini, lalu kirim bukti transfer:</p>
            <div className="flex flex-col gap-1.5 mt-1">
              <a
                href="https://wa.me/6283865410818"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MessageCircle className="size-3.5" />
                </span>
                +62 838-6541-0818
              </a>
              <a
                href="https://wa.me/628979152029"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MessageCircle className="size-3.5" />
                </span>
                +62 897-9152-029
              </a>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer bg-muted/30 rounded-xl p-3 border border-slate-700/50">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 size-4 rounded border-slate-600 accent-primary"
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            Saya menyatakan telah melakukan setoran aktivasi sebesar <strong className="text-amber-400">Rp{rupiahAmount}</strong> 
            dan telah mengirimkan bukti transfer kepada admin. Saya memahami bahwa dana ini adalah 
            <strong> setoran refundable</strong> yang akan dikembalikan saat akun dinonaktifkan.
          </span>
        </label>

        <div className="flex flex-col gap-2">
          <button
            disabled={!confirmed}
            onClick={onConfirm}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black uppercase text-xs tracking-wider shadow-lg shadow-amber-500/20 transition-transform active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Aktifkan Akun VIP
          </button>
          <button
            onClick={onClose}
            className="text-center text-xs font-semibold text-muted-foreground hover:text-foreground py-1"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   VIEW: ACTIVITY HISTORY VIEW
   ========================================================================== */
function ActivityView({ orders }: { orders: any[] }) {
  const filtered = orders.filter((o) => ['completed', 'cancelled'].includes(o.status))

  return (
    <Page title="Aktivitas" subtitle="Riwayat perjalanan Anda">
      {filtered.length ? (
        <div className="flex flex-col gap-3">
          {filtered.map((o) => (
            <article key={o.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-2xs">
              <div className="flex justify-between items-start">
                <div>
                  <strong className="block text-foreground text-sm">{o.customerName}</strong>
                  <span className="text-[10px] text-muted-foreground">ID Order: #{o.id}</span>
                </div>
                <strong className="text-sm font-extrabold text-foreground">{rupiah(o.fare)}</strong>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {o.pickupAddress} → {o.dropoffAddress}
              </p>
              <div className="flex justify-between items-center text-[10px] border-t pt-2 mt-1">
                <span
                  className={`font-black uppercase tracking-wider ${
                    o.status === 'completed' ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {o.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                </span>
                <span className="text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty icon={Activity} text="Belum ada riwayat perjalanan." />
      )}
    </Page>
  )
}

/* ==========================================================================
   VIEW: DUAL WALLETS (DOMPET TUNAI & DOMPET KREDIT) WITH WEEKLY INCOME CHARTS
   ========================================================================== */
function EarningsView({
  earnings,
  cash,
  credit,
  openDrawer
}: {
  earnings: any[]
  cash: number
  credit: number
  openDrawer: () => void
}) {
  // Mock weekly earnings chart data
  const mockWeeklyData = [
    { day: 'Sen', amount: 120000 },
    { day: 'Sel', amount: 85000 },
    { day: 'Rab', amount: 155000 },
    { day: 'Kam', amount: 95000 },
    { day: 'Jum', amount: 190000 },
    { day: 'Sab', amount: 230000 },
    { day: 'Ahd', amount: cash > 0 ? cash : 40000 } // link Sunday/Today with actual cash if populated
  ]

  const maxAmount = Math.max(...mockWeeklyData.map((d) => d.amount))

  return (
    <Page title="Pendapatan" subtitle="Kelola dompet tunai & kredit Anda">
      
      {/* Grab Dual Wallet Cards */}
      <div className="flex flex-col gap-3">
        {/* Dompet Tunai (Cash Wallet) */}
        <div className="rounded-3xl bg-foreground p-5 text-background shadow-lg relative overflow-hidden">
          <p className="text-[10px] opacity-75 uppercase font-black tracking-widest">Dompet Tunai</p>
          <p className="mt-2 text-3xl font-extrabold">{rupiah(cash)}</p>
          <p className="text-[9px] opacity-70 mt-1">Gunakan dompet tunai untuk pencairan penghasilan.</p>
          <button
            onClick={openDrawer}
            disabled={cash <= 0}
            className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-black uppercase text-primary-foreground tracking-wide transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-sm shadow-primary/25"
          >
            Tarik Tunai
          </button>
        </div>

        {/* Dompet Kredit (Credit Wallet) */}
        <div className="rounded-3xl border bg-card p-5 shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Dompet Kredit</p>
          <p className="mt-2 text-2xl font-black text-foreground">{rupiah(credit)}</p>
          <p className="text-[9px] text-muted-foreground mt-1">Digunakan untuk deposit potongan komisi sistem (20%).</p>
          <button
            onClick={() => alert('Isi ulang dompet kredit dapat dilakukan di agen atau minimarket terdekat.')}
            className="mt-4 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
          >
            Isi Ulang Kredit
          </button>
        </div>
      </div>

      {/* Weekly Earnings Bar Diagram */}
      <section className="rounded-2xl border bg-card p-4 flex flex-col gap-3 shadow-2xs mt-1">
        <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Laporan Pendapatan Mingguan</h4>
        <div className="flex h-32 items-end justify-between gap-1 pt-4 px-2">
          {mockWeeklyData.map((w, idx) => {
            const pct = (w.amount / maxAmount) * 100
            const isToday = idx === 6
            return (
              <div key={w.day} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                <span className={`text-[8px] font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {w.amount >= 1000 ? `${Math.round(w.amount / 1000)}k` : w.amount}
                </span>
                <div
                  style={{ height: `${pct * 0.7}%` }}
                  className={`w-full rounded-t-sm transition-all duration-500 ${
                    isToday ? 'bg-primary shadow shadow-primary/30' : 'bg-slate-700/50'
                  }`}
                />
                <span className={`text-[9px] font-black uppercase ${isToday ? 'text-primary' : 'text-slate-500'}`}>
                  {w.day}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <h3 className="text-sm font-bold text-foreground mt-4 mb-2">Riwayat Transaksi Dompet</h3>

      {earnings.length ? (
        <div className="flex flex-col gap-2">
          {earnings.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-2xs">
              <span
                className={`flex size-10 items-center justify-center rounded-full ${
                  e.amount > 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                }`}
              >
                <CircleDollarSign className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{e.description}</p>
                <small className="text-[9px] text-muted-foreground">
                  {e.type.toUpperCase()} • {new Date(e.createdAt).toLocaleDateString('id-ID')}
                </small>
              </div>
              <strong className={`text-xs ${e.amount > 0 ? 'text-primary' : 'text-destructive'}`}>
                {e.amount > 0 ? `+${rupiah(e.amount)}` : rupiah(e.amount)}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon={Wallet} text="Belum ada catatan transaksi." />
      )}
    </Page>
  )
}

/* ==========================================================================
   VIEW: INBOX & SYSTEM NOTIFICATIONS
   ========================================================================== */
function InboxView({
  items,
  run
}: {
  items: any[]
  run: (action: () => Promise<void>) => void
}) {
  return (
    <Page title="Kotak Masuk" subtitle="Pengumuman dan pemberitahuan penting">
      {items.length ? (
        <div className="flex flex-col gap-3">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => run(() => markNotificationRead(n.id))}
              className={`flex gap-3 rounded-2xl border p-4 text-left transition-colors hover:bg-muted ${
                n.isRead ? 'bg-card' : 'bg-primary/5 border-primary/20'
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  n.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                }`}
              >
                <Bell className="size-5" />
              </span>
              <div>
                <strong className="block text-xs font-bold text-foreground">{n.title}</strong>
                <span className="mt-1 block text-xs text-muted-foreground leading-normal">{n.body}</span>
                <span className="mt-2 block text-[9px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Empty icon={Inbox} text="Kotak masuk Anda kosong." />
      )}
    </Page>
  )
}

/* ==========================================================================
   VIEW: PROFILE & MITRA ACCOUNT DETAILS
   ========================================================================== */
function ProfileView({
  profile,
  vehicle,
  user,
  tier,
  diamonds,
  run
}: {
  profile: DriverProfile
  vehicle: Vehicle | null
  user: { name: string; email: string }
  tier: { label: string; style: string }
  diamonds: number
  run: (action: () => Promise<void>) => void
}) {
  const [activeModal, setActiveModal] = useState<'benefits' | 'academy' | null>(null)
  const [expandedSection, setExpandedSection] = useState<'personal' | 'vehicle' | 'legal' | 'bank' | null>(null)

  const toggleSection = (section: 'personal' | 'vehicle' | 'legal' | 'bank') => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  // Mask sensitive data
  const maskString = (str: string | null, start = 4, end = 4) => {
    if (!str) return 'Belum Diisi'
    if (str.length <= start + end) return str
    const masked = '*'.repeat(str.length - start - end)
    return str.slice(0, start) + masked + str.slice(-end)
  }

  return (
    <Page title="Profil Saya" subtitle="Kelola identitas, kendaraan, & dokumen kemitraan">
      {/* Premium Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-primary/20 p-6 text-slate-100 shadow-xl border border-primary/10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="/placeholder-user.jpg"
              alt={user.name}
              className="size-16 rounded-full border-2 border-primary object-cover shadow-md bg-primary/20"
            />
            <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Check className="size-3 font-black" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-white">{user.name}</h2>
              <span className={`rounded-sm px-1.5 py-0.5 text-[8px] font-black uppercase border tracking-wider bg-gradient-to-r ${tier.style}`}>
                {tier.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">ID: M-{profile.id || '294719'}-JKT</p>
            <div className="flex items-center gap-1.5 mt-2">
              {profile.verificationStatus === 'approved' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Status: Aktif
                </span>
              ) : profile.verificationStatus === 'pending' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Status: Ditinjau
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive border border-destructive/20">
                  <span className="size-1.5 rounded-full bg-destructive" />
                  Status: Ditangguhkan
                </span>
              )}
              <span className="text-[10px] text-slate-400">
                • {vehicle?.type === 'car' ? 'Mitra GrabCar' : 'Mitra GrabBike'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Performance Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border bg-card p-3 text-center shadow-xs flex flex-col justify-between">
          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Rating</span>
          <strong className="block text-md font-extrabold text-foreground mt-1 flex items-center justify-center gap-1">
            <Star className="size-4 fill-primary text-primary" /> {profile.rating}
          </strong>
        </div>
        <div className="rounded-2xl border bg-card p-3 text-center shadow-xs flex flex-col justify-between">
          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Penerimaan</span>
          <strong className="block text-md font-extrabold text-foreground mt-1">{profile.acceptanceRate}%</strong>
        </div>
        <div className="rounded-2xl border bg-card p-3 text-center shadow-xs flex flex-col justify-between">
          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider">Penyelesaian</span>
          <strong className="block text-md font-extrabold text-foreground mt-1">{profile.completionRate}%</strong>
        </div>
      </div>

      {/* Detailed Accordions for Full Profile Information */}
      <div className="flex flex-col gap-2 rounded-2xl border bg-card overflow-hidden">
        {/* Personal Details */}
        <div className="border-b last:border-0">
          <button 
            onClick={() => toggleSection('personal')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-3">
              <UserRound className="size-5 text-primary" />
              <span>
                <strong className="block text-xs font-bold text-foreground">Informasi Personal</strong>
                <small className="text-[9px] text-muted-foreground">Telepon, alamat, kontak darurat</small>
              </span>
            </span>
            <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expandedSection === 'personal' ? 'rotate-90' : ''}`} />
          </button>
          {expandedSection === 'personal' && (
            <div className="bg-muted/20 px-12 pb-4 text-xs flex flex-col gap-2 border-t pt-3">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">No. Telepon</span>
                <span className="font-semibold text-foreground">{profile.phone || 'Belum Diisi'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Kontak Darurat</span>
                <span className="font-semibold text-foreground">{profile.emergencyContact || 'Belum Diisi'}</span>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-muted-foreground mb-0.5">Alamat Lengkap</span>
                <span className="font-semibold text-foreground leading-normal">{profile.address || 'Belum Diisi'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        <div className="border-b last:border-0">
          <button 
            onClick={() => toggleSection('vehicle')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-3">
              <Bike className="size-5 text-primary" />
              <span>
                <strong className="block text-xs font-bold text-foreground">Detail Kendaraan</strong>
                <small className="text-[9px] text-muted-foreground">Merek, model, plat nomor, nomor STNK</small>
              </span>
            </span>
            <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expandedSection === 'vehicle' ? 'rotate-90' : ''}`} />
          </button>
          {expandedSection === 'vehicle' && (
            <div className="bg-muted/20 px-12 pb-4 text-xs flex flex-col gap-2 border-t pt-3">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Kendaraan</span>
                <span className="font-semibold text-foreground">{vehicle?.brand} {vehicle?.model}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Plat Nomor</span>
                <span className="font-semibold text-foreground uppercase">{vehicle?.plateNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">No. STNK</span>
                <span className="font-semibold text-foreground uppercase">{maskString(vehicle?.stnkNumber || null, 5, 3)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Legal Documents */}
        <div className="border-b last:border-0">
          <button 
            onClick={() => toggleSection('legal')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-3">
              <FileText className="size-5 text-primary" />
              <span>
                <strong className="block text-xs font-bold text-foreground">Dokumen Legal Kemitraan</strong>
                <small className="text-[9px] text-muted-foreground">NIK KTP, nomor lisensi mengemudi (SIM)</small>
              </span>
            </span>
            <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expandedSection === 'legal' ? 'rotate-90' : ''}`} />
          </button>
          {expandedSection === 'legal' && (
            <div className="bg-muted/20 px-12 pb-4 text-xs flex flex-col gap-2 border-t pt-3">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">NIK KTP</span>
                <span className="font-semibold text-foreground">{maskString(profile.nik, 4, 4)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Nomor SIM</span>
                <span className="font-semibold text-foreground">{maskString(profile.simNumber, 4, 3)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bank & Payout Info */}
        <div className="border-b last:border-0">
          <button 
            onClick={() => toggleSection('bank')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-3">
              <CreditCard className="size-5 text-primary" />
              <span>
                <strong className="block text-xs font-bold text-foreground">Rekening Pencairan Pendapatan</strong>
                <small className="text-[9px] text-muted-foreground">Nama bank, nomor rekening penerima</small>
              </span>
            </span>
            <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expandedSection === 'bank' ? 'rotate-90' : ''}`} />
          </button>
          {expandedSection === 'bank' && (
            <div className="bg-muted/20 px-12 pb-4 text-xs flex flex-col gap-2 border-t pt-3">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Nama Bank</span>
                <span className="font-semibold text-foreground">{profile.bankName || 'Belum Diisi'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">No. Rekening</span>
                <span className="font-semibold text-foreground">{maskString(profile.bankAccount, 3, 3)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grab Benefits, GrabAcademy, safety, admin, and logout */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <button 
          onClick={() => setActiveModal('benefits')}
          className="flex w-full items-center gap-3 border-b p-4 text-left last:border-0 hover:bg-muted/40 transition-colors"
        >
          <Gift className="size-5 text-primary" />
          <span className="flex-1 min-w-0">
            <strong className="block text-xs font-bold text-foreground truncate">GrabBenefits</strong>
            <small className="text-[10px] text-muted-foreground block truncate">Keuntungan eksklusif & diskon Mitra</small>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>

        <button 
          onClick={() => setActiveModal('academy')}
          className="flex w-full items-center gap-3 border-b p-4 text-left last:border-0 hover:bg-muted/40 transition-colors"
        >
          <GraduationCap className="size-5 text-primary" />
          <span className="flex-1 min-w-0">
            <strong className="block text-xs font-bold text-foreground truncate">GrabAcademy</strong>
            <small className="text-[10px] text-muted-foreground block truncate">Pelatihan online & sertifikasi Mitra</small>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>

        <Row icon={ShieldCheck} label="Pusat Keselamatan SOS" sub="Kelola kontak darurat & keselamatan berkendara" />
        <Row icon={Headphones} label="Layanan Bantuan 24/7" sub="Hubungi pusat bantuan Grab Mitra Indonesia" />
        
        <button
          onClick={() => location.assign('/admin')}
          className="flex w-full items-center gap-3 border-b p-4 text-left last:border-0 hover:bg-muted/40 transition-colors"
        >
          <Power className="size-5 text-primary" />
          <span className="flex-1 min-w-0">
            <strong className="block text-xs font-bold text-foreground truncate">Portal Admin Dashboard</strong>
            <small className="text-[10px] text-muted-foreground block truncate">Akses kontrol dispatch & verifikasi</small>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </section>

      <button
        onClick={() => {
          if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
            authClient.signOut().then(() => location.assign('/sign-in')).catch(() => location.assign('/sign-in'))
          }
        }}
        className="h-12 w-full rounded-xl border border-destructive/20 font-bold text-destructive hover:bg-destructive/5 transition-colors mt-2"
      >
        Keluar Akun
      </button>

      {/* GrabBenefits Modal Sheet */}
      {activeModal === 'benefits' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 text-foreground flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            <header className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-primary">
                <Gift className="size-5" /> Keuntungan GrabBenefits
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-muted rounded-full text-muted-foreground">
                <X className="size-5" />
              </button>
            </header>
            <p className="text-xs text-muted-foreground leading-normal">Berikut adalah voucher keuntungan aktif khusus kategori level Anda ({tier.label}):</p>
            <div className="flex flex-col gap-3">
              {[
                { title: 'Diskon Shell V-Power', desc: 'Hemat Rp 2.000 per liter untuk BBM tipe V-Power', code: 'SHELLGRAB2K' },
                { title: 'Service Motor Yamaha', desc: 'Diskon 15% untuk paket servis rutin & ganti oli mesin', code: 'YMHGRAB15' },
                { title: 'Asuransi Kesehatan BPJS', desc: 'Subsidi iuran BPJS Ketenagakerjaan Mitra Aktif', code: 'BPJSGRABSBS' }
              ].map((b, idx) => (
                <div key={idx} className="rounded-xl border p-4 bg-muted/20 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <strong className="text-xs font-bold text-foreground">{b.title}</strong>
                    <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black tracking-wide">AKTIF</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">{b.desc}</p>
                  <div className="flex items-center justify-between bg-card border border-dashed p-2 rounded-lg mt-1">
                    <span className="text-[9px] font-mono font-bold select-all tracking-wider text-muted-foreground">{b.code}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(b.code)
                        alert('Kode promo disalin!')
                      }}
                      className="text-[9px] text-primary font-bold uppercase hover:underline"
                    >
                      Salin Kode
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-bold mt-2"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* GrabAcademy Modal Sheet */}
      {activeModal === 'academy' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 text-foreground flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            <header className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-primary">
                <GraduationCap className="size-5" /> Kursus Pelatihan GrabAcademy
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-muted rounded-full text-muted-foreground">
                <X className="size-5" />
              </button>
            </header>
            <p className="text-xs text-muted-foreground leading-normal">Selesaikan materi pelatihan berikut untuk meningkatkan rating & meminimalkan pelanggaran akun:</p>
            <div className="flex flex-col gap-3">
              {[
                { title: 'Etika Pelayanan Pelanggan bintang 5', status: 'Selesai', score: '100/100', desc: 'Cara berkomunikasi ramah & profesional dengan penumpang.' },
                { title: 'Defensive Riding & Safety First', status: 'Selesai', score: '95/100', desc: 'Panduan berkendara aman, patuh lalu lintas, & antipelanggaran.' },
                { title: 'Anti-Pelecehan Seksual & Kekerasan di Jalan', status: 'Selesai', score: '100/100', desc: 'Mengenali tanda bahaya & melaporkan perilaku ofensif penumpang.' }
              ].map((c, idx) => (
                <div key={idx} className="rounded-xl border p-4 bg-muted/20 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <strong className="text-xs font-bold text-foreground">{c.title}</strong>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">LULUS</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">{c.desc}</p>
                  <div className="flex justify-between items-center mt-1 text-[10px] text-muted-foreground bg-card p-2 rounded-lg">
                    <span>Skor Ujian: <strong>{c.score}</strong></span>
                    <span>Wajib Tahunan</span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-bold mt-2"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </Page>
  )
}

/* ==========================================================================
   COMPONENT: IN-APP MOCK CHAT DRAWER
   ========================================================================== */
function ChatDrawer({
  open,
  onClose,
  messages,
  setMessages,
  customerName
}: {
  open: boolean
  onClose: () => void
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  customerName: string
}) {
  const [inputText, setInputText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  if (!open) return null

  const handleSend = async (text: string) => {
    if (!text.trim()) return
    const newMsg: Message = { id: Date.now(), sender: 'driver', text, time: 'Baru saja' }
    setMessages((prev) => [...prev, newMsg])
    setInputText('')

    try {
      const historyText = messages.map(m => `${m.sender === 'driver' ? 'Driver' : customerName}: ${m.text}`).join('\n')
      const fullPrompt = historyText + `\nDriver: ${text}\nBalasan dari ${customerName}:`
      const systemInstruction = `Anda adalah penumpang ojek online bernama ${customerName}. Jawab chat dari Driver. Balas dengan singkat, natural, dan santai (maksimal 1 kalimat). Jangan gunakan tanda kutip di awal atau akhir.`

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          systemInstruction,
          temperature: 0.8
        })
      })

      if (!response.ok) throw new Error('API Error')
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'customer', text: data.text.trim(), time: 'Baru saja' }
      ])
      playChatPing()
    } catch (err) {
      // Graceful fallback to static replies if API fails or KEY is missing
      setTimeout(() => {
        const answers = [
          'Baik pak, saya tunggu ya.',
          'Oke pak, saya sudah dekat titik jemput.',
          'Siap pak driver, hati-hati di jalan.',
          'Siap, sesuai peta ya pak.'
        ]
        const randomAns = answers[Math.floor(Math.random() * answers.length)]
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'customer', text: randomAns, time: 'Baru saja' }
        ])
        playChatPing()
      }, 1200)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85vh] max-w-md flex-col rounded-t-3xl bg-card border-t shadow-2xl animate-in slide-in-from-bottom duration-250">
      <header className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-primary animate-ping" />
          <h2 className="font-extrabold text-foreground">Chat dengan {customerName}</h2>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted text-muted-foreground">
          <X className="size-5" />
        </button>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[80%] gap-1 ${
              m.sender === 'driver' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm ${
                m.sender === 'driver'
                  ? 'bg-primary text-primary-foreground rounded-tr-none'
                  : 'bg-muted text-foreground rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[9px] text-muted-foreground px-1">{m.time}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 py-2 border-t bg-muted/20">
        {[
          'Saya sudah sampai di titik jemput.',
          'Mohon ditunggu sebentar ya.',
          'Oke, saya jalan ke sana.',
          'Sesuai titik di peta ya?'
        ].map((t) => (
          <button
            key={t}
            onClick={() => handleSend(t)}
            className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-muted font-medium"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t px-4 py-3 bg-card pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
          placeholder="Ketik pesan untuk penumpang..."
          className="h-12 flex-1 rounded-xl border bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => handleSend(inputText)}
          className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 active:scale-95 shadow-md shadow-primary/10"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  )
}

/* ==========================================================================
   COMPONENT: PHONE CALL SIMULATOR OVERLAY
   ========================================================================== */
function PhoneDrawer({
  open,
  onClose,
  customerName,
  customerPhone
}: {
  open: boolean
  onClose: () => void
  customerName: string
  customerPhone: string
}) {
  const [status, setStatus] = useState('Menghubungkan...')

  useEffect(() => {
    if (!open) return
    setStatus('Menghubungkan...')
    const t = setTimeout(() => {
      setStatus('Tersambung (00:02)')
    }, 1500)
    return () => clearTimeout(t)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-slate-900 text-white animate-in fade-in duration-200">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <PhoneCall className="size-16 text-primary animate-pulse" />
        <div className="text-center">
          <h2 className="text-2xl font-black">{customerName}</h2>
          <p className="mt-1 text-sm text-slate-400">{customerPhone}</p>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-primary">{status}</p>
        </div>
      </div>
      <div className="p-10 flex justify-center pb-[max(2.5rem,env(safe-area-inset-bottom))] bg-slate-950">
        <button
          onClick={onClose}
          className="flex size-16 items-center justify-center rounded-full bg-destructive text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
        >
          <Phone className="size-8 rotate-135" />
        </button>
      </div>
    </div>
  )
}

/* ==========================================================================
   COMPONENT: SAFETY CENTER AND SOS TRIGGER DRAWER
   ========================================================================== */
function SafetyDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sosCountdown, setSosCountdown] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerSOS = () => {
    setSosCountdown(5)
  }

  useEffect(() => {
    if (sosCountdown === null) return
    if (sosCountdown === 0) {
      alert('SOS ALERT: Sinyal Darurat telah dikirim ke Pusat Komando dan Kepolisian terdekat!')
      setSosCountdown(null)
      onClose()
      return
    }

    timer.current = setTimeout(() => {
      setSosCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [sosCountdown])

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[75vh] max-w-md flex-col rounded-t-3xl bg-card border-t shadow-2xl animate-in slide-in-from-bottom duration-250">
      <header className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="size-5" />
          <h2 className="font-extrabold text-foreground">Safety Center</h2>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted text-muted-foreground">
          <X className="size-5" />
        </button>
      </header>

      {sosCountdown !== null ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-destructive/10 text-center animate-in fade-in">
          <ShieldAlert className="size-20 text-destructive animate-bounce" />
          <h3 className="text-xl font-black text-destructive mt-4">PANGGILAN DARURAT DIKIRIM</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Bantuan darurat akan dikirim secara otomatis dalam hitungan mundur di bawah:
          </p>
          <div className="text-6xl font-black text-destructive mt-6">{sosCountdown}</div>
          <button
            onClick={() => {
              setSosCountdown(null)
              if (timer.current) clearTimeout(timer.current)
            }}
            className="mt-8 h-12 px-6 rounded-full bg-foreground text-background font-bold"
          >
            Batalkan Panggilan
          </button>
        </div>
      ) : (
        <div className="flex-1 p-5 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground leading-normal">
            Gunakan fitur ini apabila Anda mengalami kendala keamanan, kecelakaan, atau ancaman selama perjalanan.
          </p>

          <button
            onClick={triggerSOS}
            className="flex items-center gap-4 rounded-2xl bg-destructive text-destructive-foreground p-5 text-left shadow-lg transition-transform active:scale-98"
          >
            <ShieldAlert className="size-8" />
            <div>
              <strong className="block text-md">Panggil Bantuan Darurat (SOS)</strong>
              <span className="text-xs opacity-90 block">Kirim koordinat GPS dan kontak kantor polisi</span>
            </div>
          </button>

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => alert('Link pelacakan GPS perjalanan berhasil disalin ke clipboard.')}
              className="flex items-center justify-between rounded-xl border p-4 text-left hover:bg-muted"
            >
              <span>
                <strong className="block text-xs font-bold">Bagikan Detail Perjalanan</strong>
                <small className="text-[10px] text-muted-foreground">Kirim link share-trip ke keluarga Anda</small>
              </span>
              <ChevronRight className="size-4" />
            </button>

            <button
              onClick={() => alert('Menyambungkan panggilan ke Layanan Pelanggan Grab Mitra...')}
              className="flex items-center justify-between rounded-xl border p-4 text-left hover:bg-muted"
            >
              <span>
                <strong className="block text-xs font-bold">Pusat Layanan Mitra</strong>
                <small className="text-[10px] text-muted-foreground">Bantuan operasional 24 jam non-stop</small>
              </span>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   COMPONENT: TRANSACTIONS WITHDRAWAL SYSTEM
   ========================================================================== */
function WithdrawalDrawer({
  open,
  onClose,
  balance,
  run,
  pending
}: {
  open: boolean
  onClose: () => void
  balance: number
  run: (action: () => Promise<void>, nextStatus?: string, details?: any) => void
  pending: boolean
}) {
  const [method, setMethod] = useState<'Gopay' | 'OVO' | 'Bank Transfer'>('Gopay')
  const [amountInput, setAmountInput] = useState('')
  const [success, setSuccess] = useState(false)

  const handleWithdrawal = () => {
    const amt = Number(amountInput)
    if (isNaN(amt) || amt <= 0) {
      alert('Jumlah penarikan tidak valid')
      return
    }
    if (amt > balance) {
      alert('Saldo tunai tidak mencukupi')
      return
    }

    run(async () => {
      await withdrawFunds(amt, method)
      setSuccess(true)
      setAmountInput('')
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[80vh] max-w-md flex-col rounded-t-3xl bg-card border-t shadow-2xl animate-in slide-in-from-bottom duration-250">
      <header className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-extrabold text-foreground">Tarik Saldo Dompet</h2>
        <button
          onClick={() => {
            onClose()
            setSuccess(false)
          }}
          className="rounded-full p-1.5 hover:bg-muted text-muted-foreground"
        >
          <X className="size-5" />
        </button>
      </header>

      {success ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="size-10" />
          </div>
          <h3 className="text-lg font-black text-foreground mt-4">Penarikan Berhasil</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-normal">
            Uang penarikan Anda telah dikirim dan akan segera masuk ke rekening/wallet Anda dalam waktu 1-5 menit.
          </p>
          <button
            onClick={() => {
              setSuccess(false)
              onClose()
            }}
            className="mt-6 h-12 w-full max-w-xs rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/10"
          >
            Selesai
          </button>
        </div>
      ) : (
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-muted p-4">
              <span className="text-[10px] text-muted-foreground uppercase font-black">Saldo Dompet Tunai</span>
              <strong className="block text-xl text-foreground mt-1">{rupiah(balance)}</strong>
            </div>

            {/* Select Method */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-black">Metode Penarikan</span>
              <div className="grid grid-cols-3 gap-2">
                {(['Gopay', 'OVO', 'Bank Transfer'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`h-11 rounded-xl border text-xs font-bold transition-all ${
                      method === m
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Amount */}
            <label className="flex flex-col gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-black">Jumlah Penarikan (Rp)</span>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Contoh: 10000"
                className="h-12 w-full rounded-xl border bg-muted px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>

          <div className="pt-4 border-t pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              onClick={handleWithdrawal}
              disabled={pending || !amountInput}
              className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/10 disabled:opacity-50"
            >
              {pending ? 'Memproses...' : 'Tarik Sekarang'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   COMPONENT: TARGETS AND ACHIEVEMENTS PROGRESS DRAWER (Diamonds Tracker)
   ========================================================================== */
function TargetsDrawer({
  open,
  onClose,
  orders,
  achievements,
  diamonds
}: {
  open: boolean
  onClose: () => void
  orders: any[]
  achievements: any[]
  diamonds: number
}) {
  const completedToday = orders.filter((o) => o.status === 'completed').length
  const targetTrips = 5
  const progressPercent = Math.min(100, (completedToday / targetTrips) * 100)

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[80vh] max-w-md flex-col rounded-t-3xl bg-card border-t shadow-2xl animate-in slide-in-from-bottom duration-250">
      <header className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-extrabold text-foreground">Target Harian & Berlian</h2>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted text-muted-foreground">
          <X className="size-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        {/* Daily Target Progress */}
        <section className="rounded-2xl border p-4 bg-muted/20">
          <div className="flex justify-between items-start">
            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Target Harian</h3>
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              💎 {diamonds} Berlian
            </span>
          </div>
          <div className="flex justify-between items-end mt-3">
            <strong className="text-2xl font-black text-foreground">
              {completedToday} / {targetTrips} <span className="text-xs font-normal text-muted-foreground">Trip</span>
            </strong>
            <span className="text-xs font-black text-primary">{Math.floor(progressPercent)}%</span>
          </div>

          <div className="mt-3 h-2.5 w-full rounded-full bg-border overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full rounded-full bg-primary transition-all duration-500"
            />
          </div>

          <p className="text-[10px] text-muted-foreground mt-3 leading-normal">
            Selesaikan 5 orderan hari ini untuk mencairkan bonus loyalitas mitra sebesar{' '}
            <strong className="text-foreground">Rp 50.000</strong>.
          </p>
        </section>

        {/* Achievements Section */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            <Trophy className="size-4 text-primary" />
            Lencana Pencapaian
          </h3>

          <div className="flex flex-col gap-2">
            {achievements.length ? (
              achievements.map((a) => (
                <div
                  key={a.id}
                  className={`flex gap-3 items-center rounded-2xl border p-4 ${
                    a.progress >= a.target ? 'bg-primary/5 border-primary/20' : 'bg-card'
                  }`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                      a.progress >= a.target ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Trophy className="size-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <strong className="text-xs font-bold text-foreground">{a.title}</strong>
                      <span className="text-[9px] text-muted-foreground font-semibold">
                        {a.progress} / {a.target}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal truncate">
                      {a.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">Belum ada data pencapaian.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ==========================================================================
   COMPONENT: SERVICES OPERATIONAL DRAWER (Layanan Pilihan Toggles)
   ========================================================================== */
function ServicesDrawer({
  open,
  onClose,
  toggles,
  setToggles
}: {
  open: boolean
  onClose: () => void
  toggles: { bike: boolean; car: boolean; food: boolean; express: boolean }
  setToggles: React.Dispatch<React.SetStateAction<{ bike: boolean; car: boolean; food: boolean; express: boolean }>>
}) {
  if (!open) return null

  const toggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[65vh] max-w-md flex-col rounded-t-3xl bg-card border-t shadow-2xl animate-in slide-in-from-bottom duration-250">
      <header className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-extrabold text-foreground">Pilihan Jenis Layanan</h2>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted text-muted-foreground">
          <X className="size-5" />
        </button>
      </header>
      <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
        <p className="text-xs text-muted-foreground mb-2">
          Matikan jenis layanan tertentu jika Anda sedang tidak ingin mengambil orderan tipe tersebut.
        </p>

        {[
          { key: 'bike', label: 'GrabBike (Penghantar Penumpang)', icon: Bike, desc: 'Kirim tumpangan motor standar' },
          { key: 'car', label: 'GrabCar (Mobil Roda Empat)', icon: Car, desc: 'Penerimaan tumpangan mobil eksekutif' },
          { key: 'food', label: 'GrabFood (Pesan-Antar Makanan)', icon: ShoppingBag, desc: 'Pesan makanan resto terdekat' },
          { key: 'express', label: 'GrabExpress (Kirim Barang)', icon: Package, desc: 'Kurir paket instan dan dokumen' }
        ].map(({ key, label, icon: Icon, desc }) => (
          <div key={key} className="flex items-center justify-between rounded-2xl border p-4 bg-muted/10">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <strong className="block text-xs text-foreground font-bold">{label}</strong>
                <span className="text-[10px] text-muted-foreground">{desc}</span>
              </div>
            </div>
            <button
              onClick={() => toggle(key as keyof typeof toggles)}
              className="text-primary hover:scale-105 transition-transform"
            >
              {toggles[key as keyof typeof toggles] ? (
                <ToggleRight className="size-9" />
              ) : (
                <ToggleLeft className="size-9 text-slate-600" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ==========================================================================
   COMPONENT: ONBOARDING VIEW
   ========================================================================== */
function Onboarding({ pending, run }: { pending: boolean; run: (action: () => Promise<void>) => void }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    phone: '', city: '', emergencyContact: '', address: '',
    brand: '', model: '', plateNumber: '', stnkNumber: '', type: 'motorcycle',
    nik: '', simNumber: '',
    bankName: '', bankAccount: ''
  })
  const [photos, setPhotos] = useState<{ ktp: string | null; sim: string | null; stnk: string | null; selfie: string | null; vehicle: string | null }>({
    ktp: null, sim: null, stnk: null, selfie: null, vehicle: null
  })
  const [uploading, setUploading] = useState<string | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 6) setStep(step + 1)
  }

  const submitFinal = () => {
    run(async () => {
      await createDriverProfile({
        ...formData,
        photoKtp: photos.ktp || undefined,
        photoSim: photos.sim || undefined,
        photoStnk: photos.stnk || undefined,
        photoSelfie: photos.selfie || undefined,
        photoVehicle: photos.vehicle || undefined,
      })
    })
  }

  const handleFileUpload = async (docType: 'ktp' | 'sim' | 'stnk' | 'selfie' | 'vehicle', file: File) => {
    setUploading(docType)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', docType)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok && data.url) {
        setPhotos(prev => ({ ...prev, [docType]: data.url }))
      } else {
        alert(data.error || 'Gagal mengunggah file')
      }
    } catch {
      alert('Gagal mengunggah file. Periksa koneksi internet Anda.')
    } finally {
      setUploading(null)
    }
  }

  const triggerFileInput = (docType: 'ktp' | 'sim' | 'stnk' | 'selfie' | 'vehicle') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.capture = docType === 'selfie' ? 'user' : 'environment'
    input.onchange = (e: any) => {
      const file = e.target.files?.[0]
      if (file) handleFileUpload(docType, file)
    }
    input.click()
  }

  const removePhoto = (docType: 'ktp' | 'sim' | 'stnk' | 'selfie' | 'vehicle') => {
    setPhotos(prev => ({ ...prev, [docType]: null }))
  }

  const stepLabels = ['Data Diri', 'Kendaraan', 'Dokumen', 'Foto', 'Rekening', 'Konfirmasi']

  const PhotoUploadBox = ({ docType, label, description, icon: BoxIcon }: { docType: 'ktp' | 'sim' | 'stnk' | 'selfie' | 'vehicle'; label: string; description: string; icon: any }) => {
    const photoUrl = photos[docType]
    const isUploading = uploading === docType
    return (
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="flex items-center gap-3 p-3.5 border-b border-slate-100">
          <div className={`size-9 rounded-xl flex items-center justify-center ${photoUrl ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            {photoUrl ? <CheckCircle2 className="size-5" /> : <BoxIcon className="size-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <strong className="block text-xs font-bold text-slate-800 truncate">{label}</strong>
            <span className="text-[10px] text-muted-foreground block truncate">{description}</span>
          </div>
          {photoUrl && (
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">TERUNGGAH</span>
          )}
        </div>
        {photoUrl ? (
          <div className="relative">
            <img src={photoUrl} alt={label} className="w-full h-40 object-cover" />
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              <button type="button" onClick={() => setPreviewPhoto(photoUrl)} className="size-8 rounded-lg bg-white/90 backdrop-blur text-slate-700 flex items-center justify-center shadow-md hover:bg-white">
                <Eye className="size-4" />
              </button>
              <button type="button" onClick={() => removePhoto(docType)} className="size-8 rounded-lg bg-red-500/90 backdrop-blur text-white flex items-center justify-center shadow-md hover:bg-red-500">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => triggerFileInput(docType)}
            className="w-full h-32 flex flex-col items-center justify-center gap-2 text-center hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <LoaderCircle className="size-8 text-primary animate-spin" />
                <span className="text-[10px] font-bold text-primary">Mengunggah...</span>
              </>
            ) : (
              <>
                <div className="size-12 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  <ImagePlus className="size-6" />
                </div>
                <span className="text-[10px] font-bold text-slate-500">Ketuk untuk ambil foto atau pilih dari galeri</span>
                <span className="text-[8px] text-slate-400">JPG, PNG, WebP • Maks 5MB</span>
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  return (
    <main className="flex min-h-dvh flex-col bg-slate-50/50">
      {/* Official Grab Driver White/Green Header */}
      <header className="bg-white px-5 pb-5 pt-14 border-b border-slate-100 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <img src="/images/grab-driver-logo.png" alt="Grab Driver" className="h-10 w-auto object-contain" />
          <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Pendaftaran Mitra
          </span>
        </div>
        
        {/* Step Progress Track */}
        <div className="flex justify-between items-center gap-1 mt-4">
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div key={s} className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center gap-0.5">
                <div className={`size-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all duration-300 ${
                  step > s ? 'bg-primary border-primary text-white' :
                  step === s ? 'border-primary text-primary bg-primary/10' :
                  'border-slate-200 text-slate-400 bg-white'
                }`}>
                  {step > s ? <Check className="size-3" /> : s}
                </div>
                {s < 6 && <div className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${step > s ? 'bg-primary' : 'bg-slate-200'}`} />}
              </div>
              <span className={`text-[7px] font-bold uppercase text-center truncate leading-none ${step === s ? 'text-primary' : step > s ? 'text-emerald-600' : 'text-slate-400'}`}>
                {stepLabels[s - 1]}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto pb-8">
        {/* Step Title Card */}
        <div className="bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-800">
            {step === 1 && '👤 Lengkapi Informasi Data Diri'}
            {step === 2 && '🏍️ Lengkapi Informasi Kendaraan'}
            {step === 3 && '📄 Data Dokumen Legal Kemitraan'}
            {step === 4 && '📸 Unggah Foto Dokumen & Selfie'}
            {step === 5 && '🏦 Rekening Pencairan Pendapatan'}
            {step === 6 && '✅ Konfirmasi Akhir & Verifikasi'}
          </h2>
          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
            {step === 1 && 'Pastikan data diri Anda sesuai dengan KTP asli yang masih berlaku. Data ini digunakan untuk validasi identitas kemitraan.'}
            {step === 2 && 'Merek, model, dan nomor polisi harus sesuai dengan kendaraan fisik yang akan digunakan beroperasi.'}
            {step === 3 && 'Masukkan nomor NIK KTP, SIM, dan STNK Anda. Data akan diverifikasi silang oleh tim peninjau.'}
            {step === 4 && 'Unggah foto dokumen yang jelas dan tidak buram. Semua foto wajib asli, bukan fotokopi atau screenshot.'}
            {step === 5 && 'Rekening bank harus atas nama yang sama dengan nama pendaftar. Dana operasional akan ditransfer ke rekening ini.'}
            {step === 6 && 'Periksa kembali semua data dan dokumen. Dengan mengirim, Anda menyetujui Kode Etik Mitra Pengemudi Grab.'}
          </p>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col gap-4 flex-1">
          <form onSubmit={step === 6 ? (e) => { e.preventDefault(); submitFinal(); } : handleNext} className="flex flex-col gap-4 flex-1">
            {step === 1 && (
              <div className="flex flex-col gap-3.5">
                <Input label="Nama Lengkap (Sesuai KTP)" value={formData.address ? '' : ''} onChange={() => {}} icon={UserRound} placeholder="Otomatis dari data akun" disabled />
                <Input label="Nomor Telepon Seluler" value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} icon={Phone} placeholder="Contoh: 081234567890" />
                <Input label="Kota Operasional" value={formData.city} onChange={v => setFormData({ ...formData, city: v })} icon={MapPin} placeholder="Contoh: Jakarta Selatan" />
                <Input label="Alamat Lengkap (Sesuai KTP)" value={formData.address} onChange={v => setFormData({ ...formData, address: v })} icon={Home} placeholder="Jl., RT/RW, Kel., Kec., Kota" multiline />
                <Input label="Kontak Darurat (Keluarga)" value={formData.emergencyContact} onChange={v => setFormData({ ...formData, emergencyContact: v })} icon={PhoneCall} placeholder="Nomor HP keluarga terdekat" />
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-700">Jenis Kendaraan</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setFormData({ ...formData, type: 'motorcycle' })}
                      className={`h-14 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        formData.type === 'motorcycle' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}>
                      <Bike className="size-5" /> GrabBike
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, type: 'car' })}
                      className={`h-14 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        formData.type === 'car' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}>
                      <Car className="size-5" /> GrabCar
                    </button>
                  </div>
                </div>
                <Input label="Merek Kendaraan" value={formData.brand} onChange={v => setFormData({ ...formData, brand: v })} icon={Bike} placeholder="Contoh: Yamaha, Honda, Toyota" />
                <Input label="Model / Tipe / CC" value={formData.model} onChange={v => setFormData({ ...formData, model: v })} icon={Bike} placeholder="Contoh: NMAX 155cc, Avanza 1.3" />
                <Input label="Nomor Polisi (Plat)" value={formData.plateNumber} onChange={v => setFormData({ ...formData, plateNumber: v })} icon={Compass} placeholder="Contoh: B 1234 XYZ" />
              </div>
            )}
            {step === 3 && (
              <div className="flex flex-col gap-3.5">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5">
                  <AlertTriangle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                    Pastikan nomor dokumen yang Anda masukkan valid dan masih berlaku. Data akan diverifikasi silang dengan database pemerintah.
                  </p>
                </div>
                <Input label="Nomor Induk Kependudukan (NIK)" value={formData.nik} onChange={v => setFormData({ ...formData, nik: v })} icon={FileText} placeholder="16 digit angka pada KTP" />
                <Input label="Nomor SIM (Surat Izin Mengemudi)" value={formData.simNumber} onChange={v => setFormData({ ...formData, simNumber: v })} icon={FileText} placeholder="Nomor SIM A/C aktif" />
                <Input label="Nomor STNK Kendaraan" value={formData.stnkNumber} onChange={v => setFormData({ ...formData, stnkNumber: v })} icon={FileText} placeholder="Nomor registrasi STNK" />
              </div>
            )}
            {step === 4 && (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start gap-2.5">
                  <Camera className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                    Foto harus jelas, tidak buram, tidak terpotong, dan bukan hasil fotokopi. Gunakan pencahayaan yang baik saat mengambil foto.
                  </p>
                </div>
                <PhotoUploadBox docType="ktp" label="Foto KTP (Depan)" description="Foto KTP asli tampak depan, semua teks terbaca jelas" icon={FileText} />
                <PhotoUploadBox docType="sim" label="Foto SIM (Depan)" description="SIM A untuk GrabCar, SIM C untuk GrabBike" icon={FileText} />
                <PhotoUploadBox docType="stnk" label="Foto STNK" description="Halaman utama STNK yang memuat data kendaraan" icon={FileText} />
                <PhotoUploadBox docType="selfie" label="Foto Selfie dengan KTP" description="Pegang KTP di sebelah wajah, pastikan keduanya terlihat jelas" icon={UserRound} />
                <PhotoUploadBox docType="vehicle" label="Foto Kendaraan" description="Foto kendaraan tampak samping, plat nomor terlihat jelas" icon={formData.type === 'car' ? Car : Bike} />
              </div>
            )}
            {step === 5 && (
              <div className="flex flex-col gap-3.5">
                <Input label="Nama Bank" value={formData.bankName} onChange={v => setFormData({ ...formData, bankName: v })} icon={CreditCard} placeholder="Contoh: BCA, Mandiri, BNI, BRI" />
                <Input label="Nomor Rekening" value={formData.bankAccount} onChange={v => setFormData({ ...formData, bankAccount: v })} icon={CreditCard} placeholder="Nomor rekening tanpa spasi" />
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2.5 mt-1">
                  <ShieldCheck className="size-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                    Rekening bank harus atas nama yang sama dengan nama di KTP pendaftar. Grab tidak bertanggung jawab atas kesalahan transfer akibat data rekening yang keliru.
                  </p>
                </div>
              </div>
            )}
            {step === 6 && (
              <div className="flex flex-col gap-4">
                {/* Summary Cards */}
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                    <strong className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ringkasan Data Pribadi</strong>
                  </div>
                  <div className="p-4 flex flex-col gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Telepon</span><span className="font-bold">{formData.phone || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Kota</span><span className="font-bold">{formData.city || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">NIK</span><span className="font-bold">{formData.nik ? formData.nik.slice(0, 4) + '****' + formData.nik.slice(-4) : '-'}</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                    <strong className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ringkasan Kendaraan</strong>
                  </div>
                  <div className="p-4 flex flex-col gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Jenis</span><span className="font-bold">{formData.type === 'car' ? 'GrabCar' : 'GrabBike'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Kendaraan</span><span className="font-bold">{formData.brand} {formData.model}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Plat</span><span className="font-bold">{formData.plateNumber || '-'}</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                    <strong className="text-[10px] font-black uppercase tracking-wider text-slate-500">Dokumen Terunggah</strong>
                  </div>
                  <div className="p-4 grid grid-cols-5 gap-2">
                    {(['ktp', 'sim', 'stnk', 'selfie', 'vehicle'] as const).map(key => (
                      <div key={key} className="flex flex-col items-center gap-1">
                        {photos[key] ? (
                          <img src={photos[key]!} alt={key} className="size-12 rounded-lg object-cover border border-slate-200" />
                        ) : (
                          <div className="size-12 rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center">
                            <X className="size-4 text-slate-400" />
                          </div>
                        )}
                        <span className="text-[8px] font-bold uppercase text-slate-500">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                    <strong className="text-[10px] font-black uppercase tracking-wider text-slate-500">Rekening Bank</strong>
                  </div>
                  <div className="p-4 flex flex-col gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-bold">{formData.bankName || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">No. Rekening</span><span className="font-bold">{formData.bankAccount ? '****' + formData.bankAccount.slice(-4) : '-'}</span></div>
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2.5">
                  <ShieldCheck className="size-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                    Dengan menekan "Kirim Pendaftaran", Anda menyatakan bahwa semua data yang diisi adalah benar dan menyetujui Syarat & Ketentuan serta Kode Etik Mitra Pengemudi Grab Indonesia.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-auto pt-5 flex gap-3">
              {step > 1 && (
                <button 
                  type="button" 
                  onClick={() => setStep(step - 1)} 
                  className="h-12 w-24 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Kembali
                </button>
              )}
              <button
                type="submit"
                disabled={pending || uploading !== null}
                className="h-12 flex-1 rounded-xl bg-primary font-black uppercase text-primary-foreground text-xs tracking-wider transition-all hover:bg-primary/95 active:scale-98 disabled:opacity-60 shadow-md shadow-primary/10"
              >
                {pending ? 'Memproses...' : step === 6 ? 'Kirim Pendaftaran' : 'Lanjutkan'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-md w-full">
            <img src={previewPhoto} alt="Preview" className="w-full rounded-2xl shadow-2xl" />
            <button onClick={() => setPreviewPhoto(null)} className="absolute -top-3 -right-3 size-8 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-lg">
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

function Input({ 
  label, 
  value, 
  onChange, 
  icon: Icon, 
  placeholder,
  disabled,
  multiline
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
  icon: any;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-700">
      {label}
      <div className="relative">
        <span className={`absolute left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground/80 ${multiline ? 'top-3' : 'inset-y-0'}`}>
          <Icon className="size-4" />
        </span>
        {multiline ? (
          <textarea
            required={!disabled}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3 font-normal text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 text-sm shadow-2xs resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        ) : (
          <input
            required={!disabled}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 font-normal text-slate-800 outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 text-sm shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          />
        )}
      </div>
    </label>
  )
}

function DestinationDrawer({ open, onClose, profile, run, pending }: any) {
  if (!open || !profile) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[50vh] max-w-md flex-col rounded-t-3xl bg-card border-t shadow-2xl animate-in slide-in-from-bottom">
      <header className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-extrabold flex items-center gap-2"><Compass className="size-5 text-primary"/> Tujuan Searah</h2>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted text-muted-foreground"><X className="size-5" /></button>
      </header>
      <div className="p-5 flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">Aktifkan fitur ini agar sistem hanya mencari orderan yang searah dengan tujuan akhir Anda (misal: rumah).</p>
        <div className="flex items-center gap-3 bg-muted/40 p-4 rounded-xl border">
          <MapPin className="size-5 text-destructive" />
          <div className="flex-1">
            <strong className="block text-xs">Lokasi Tujuan:</strong>
            <span className="text-sm font-semibold">{profile.city || 'Jakarta'} - Rumah</span>
          </div>
        </div>
        <button
          disabled={pending}
          onClick={() => {
            run(async () => { await setDestinationDirection(profile.destinationDirection ? null : 'home') })
            onClose()
          }}
          className={`h-12 w-full rounded-xl font-bold transition-all ${profile.destinationDirection ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-primary text-primary-foreground'}`}
        >
          {profile.destinationDirection ? 'Matikan Tujuan Searah' : 'Aktifkan Tujuan Searah'}
        </button>
      </div>
    </div>
  )
}

function CoachDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-slate-950 text-slate-100 animate-in slide-in-from-bottom">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary animate-pulse"><Bot className="size-5" /></span>
          <h2 className="font-extrabold text-white">GrabCoach AI</h2>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-800 text-slate-400"><X className="size-5" /></button>
      </header>
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-4">
        <div className="size-24 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-[0_0_40px_rgba(0,200,100,0.3)] mb-4 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
           <Bot className="size-10 text-white" />
        </div>
        <h3 className="text-xl font-black">Halo, Mitra!</h3>
        <p className="text-sm text-slate-400 max-w-[280px]">
          Saya adalah asisten suara AI Anda. Saya dapat membantu menganalisis order, membacakan pesan penumpang, dan memantau performa tanpa perlu Anda menyentuh layar.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-left">
            <span className="block text-primary mb-1">Coba sebutkan:</span>
            "Coach, bacakan pesan terbaru dari penumpang"
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-left">
            <span className="block text-primary mb-1">Atau:</span>
            "Coach, berapa pendapatan saya hari ini?"
          </div>
        </div>
        <button onClick={onClose} className="mt-6 h-12 w-full rounded-full border border-slate-700 bg-slate-900 font-bold hover:bg-slate-800">
          Tutup
        </button>
      </div>
    </div>
  )
}

/* ==========================================================================
   HELPER UTILITY SUB-COMPONENTS
   ========================================================================== */
function Page({
  title,
  subtitle,
  children
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 p-5 animate-in fade-in duration-200">
      <header className="pb-1 pt-3">
        <h1 className="text-2xl font-black text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground leading-normal mt-0.5">{subtitle}</p>
      </header>
      {children}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-card p-3.5 text-center shadow-2xs">
      <strong className="block text-lg font-black text-foreground">{value}</strong>
      <small className="text-[9px] text-muted-foreground uppercase font-semibold">{label}</small>
    </div>
  )
}

function Row({ icon: Icon, label, sub }: any) {
  return (
    <button className="flex w-full items-center gap-3 border-b p-4 text-left last:border-0 hover:bg-muted/40 transition-colors">
      <Icon className="size-5 text-primary" />
      <span className="flex-1 min-w-0">
        <strong className="block text-xs font-bold text-foreground truncate">{label}</strong>
        <small className="text-[10px] text-muted-foreground block truncate">{sub}</small>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  )
}

function Empty({ icon: Icon, text }: any) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-20 text-muted-foreground text-center">
      <Icon className="size-9 opacity-50" />
      <p className="text-xs">{text}</p>
    </div>
  )
}

function PendingVerification({ pending, run }: { pending: boolean; run: (action: () => Promise<void>) => void }) {
  const router = useRouter()
  return (
    <main className="flex min-h-dvh flex-col bg-slate-50 items-center justify-center p-6 text-slate-800">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl border border-slate-100 flex flex-col gap-6 items-center text-center">
        <img src="/images/grab-driver-logo.png" alt="Grab" className="h-10 w-auto object-contain" />
        
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 size-20 rounded-full bg-amber-500/10 animate-ping"></div>
          <div className="size-20 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
            <Clock3 className="size-10 animate-spin duration-3000" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Pendaftaran Ditinjau</h1>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Berkas kemitraan Anda (KTP, SIM, STNK, Rekening Bank) sedang diperiksa oleh verifikator Grab Partner Indonesia. Akun Anda akan aktif maksimal 1x24 jam.
          </p>
        </div>

        <div className="w-full rounded-2xl bg-slate-50/50 p-4 border border-slate-100 flex flex-col gap-2.5 text-left text-[11px] font-bold">
          <div className="flex justify-between items-center text-emerald-600">
            <span>✔ Informasi Personal & Kontak</span>
            <span>Berhasil</span>
          </div>
          <div className="flex justify-between items-center text-emerald-600">
            <span>✔ Dokumen Legal & Kendaraan</span>
            <span>Berhasil</span>
          </div>
          <div className="flex justify-between items-center text-amber-600">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Pemeriksaan Berkas Latar Belakang
            </span>
            <span>Proses</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              router.refresh()
            }}
            disabled={pending}
            className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider transition-all hover:bg-primary/95 shadow-md shadow-primary/10"
          >
            Segarkan Status
          </button>
          
          <button
            onClick={() => {
              if (confirm('Keluar dari akun kemitraan Anda?')) {
                authClient.signOut().then(() => location.assign('/sign-in')).catch(() => location.assign('/sign-in'))
              }
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-500 hover:bg-slate-50"
          >
            Keluar Akun
          </button>
        </div>
      </div>
    </main>
  )
}

function SuspendedAccount() {
  return (
    <main className="flex min-h-dvh flex-col bg-slate-50 items-center justify-center p-6 text-slate-800">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl border border-slate-100 flex flex-col gap-6 items-center text-center">
        <img src="/images/grab-driver-logo.png" alt="Grab" className="h-10 w-auto object-contain" />
        
        <div className="size-20 rounded-full bg-red-500/10 text-destructive border border-red-500/20 flex items-center justify-center">
          <ShieldAlert className="size-10" />
        </div>

        <div>
          <h1 className="text-xl font-extrabold text-red-600">Akun Ditangguhkan</h1>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Akses ke sistem order kemitraan Grab Driver Anda telah dinonaktifkan sementara karena terdeteksi adanya pelanggaran kode etik pengemudi atau dokumen kemitraan kedaluwarsa.
          </p>
        </div>

        <button
          onClick={() => alert('Silakan datang ke Grab Driver Center terdekat untuk verifikasi ulang berkas fisik (KTP, SIM, & STNK).')}
          className="h-12 w-full rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800"
        >
          Ajukan Banding / Bantuan
        </button>

        <button
          onClick={() => {
            authClient.signOut().then(() => location.assign('/sign-in')).catch(() => location.assign('/sign-in'))
          }}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-500 hover:bg-slate-50"
        >
          Keluar Akun
        </button>
      </div>
    </main>
  )
}
