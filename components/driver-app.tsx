'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import mapboxgl from 'mapbox-gl'
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
  simulateNewOrder,
  addFakeEarnings
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
  HelpCircle,
  PhoneCall,
  Sparkles,
  LogOut,
  Check,
  Car,
  Package,
  ShoppingBag,
  AlertTriangle,
  Award,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

type Data = {
  profile: any
  orders: any[]
  earnings: any[]
  notifications: any[]
  achievements: any[]
  vehicle: any
}

type Tab = 'home' | 'activity' | 'earnings' | 'inbox' | 'profile'
type Message = { id: number; sender: 'driver' | 'customer'; text: string; time: string }

const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)

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

// Calculate angle between coordinates for dynamically rotating map marker
const calculateBearing = (startLat: number, startLng: number, endLat: number, endLng: number) => {
  const dLng = (endLng - startLng) * (Math.PI / 180)
  const lat1 = startLat * (Math.PI / 180)
  const lat2 = endLat * (Math.PI / 180)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const brng = Math.atan2(y, x) * (180 / Math.PI)
  return (brng + 360) % 360
}

export function DriverApp({ data, user }: { data: Data; user: { name: string; email: string } }) {
  const [tab, setTab] = useState<Tab>('home')
  const [pending, startTransition] = useTransition()
  const [devOpen, setDevOpen] = useState(false)
  const [activeDrawer, setActiveDrawer] = useState<'chat' | 'phone' | 'safety' | 'withdrawal' | 'targets' | 'services' | null>(null)
  
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
  }, [currentOrder])

  // Auto accept order when Turbo mode is active
  useEffect(() => {
    if (currentOrder && currentOrder.status === 'offered' && data.profile.turboEnabled) {
      const timeout = setTimeout(() => {
        run(() => updateOrder(currentOrder.id, 'accepted'), 'accepted', currentOrder)
      }, 1500)
      return () => clearTimeout(timeout)
    }
  }, [currentOrder?.id, currentOrder?.status, data.profile.turboEnabled])

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

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-background shadow-2xl">
      {/* Top Floating Developer Panel Trigger */}
      <button
        onClick={() => setDevOpen(true)}
        className="fixed right-4 top-4 z-50 flex size-10 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 animate-pulse"
        title="Developer Simulation Tools"
      >
        <Wrench className="size-5" />
      </button>

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
          { id: 'inbox', label: 'Inbox', icon: Inbox },
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

      {/* Developer / Simulation Panel Drawer */}
      <DevPanel
        open={devOpen}
        onClose={() => setDevOpen(false)}
        order={currentOrder}
        run={run}
        pending={pending}
      />

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

      {/* Phone Call Drawer */}
      {currentOrder && (
        <PhoneDrawer
          open={activeDrawer === 'phone'}
          onClose={() => setActiveDrawer(null)}
          customerName={currentOrder.customerName}
          customerPhone={currentOrder.customerPhone || '0812-3456-7890'}
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

      {/* Interactive Completed Order Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}
    </main>
  )
}

/* ==========================================================================
   COMPONENT: MAP VIEW WITH MAPBOX HEATMAP ZONE OVERLAYS & ROTATING MOTOR MARKER
   ========================================================================== */
function MapView({ order }: { order?: any }) {
  const ref = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const driverMarker = useRef<mapboxgl.Marker | null>(null)
  const pickupMarker = useRef<mapboxgl.Marker | null>(null)
  const dropoffMarker = useRef<mapboxgl.Marker | null>(null)
  const currentStepInterval = useRef<NodeJS.Timeout | null>(null)
  
  const [gps, setGps] = useState('Menginisialisasi peta...')

  // Initialize Map
  useEffect(() => {
    if (!ref.current || map.current) return
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
    
    // Jakarta Central Fallback Coordinates
    const defaultCenter: [number, number] = [106.8227, -6.2023]

    try {
      map.current = new mapboxgl.Map({
        container: ref.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCenter,
        zoom: 13,
        attributionControl: false
      })

      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')
      setGps('GPS Online')

      // Create Driver Pin (Motorcycle direction pointer element)
      const pinEl = document.createElement('div')
      pinEl.className = 'relative flex items-center justify-center'
      pinEl.innerHTML = `
        <div class="absolute size-9 rounded-full bg-blue-500/20 border border-blue-500/40 animate-ping"></div>
        <div class="z-10 flex size-7 items-center justify-center rounded-full bg-blue-600 text-white shadow shadow-blue-500/50 border border-blue-400">
          <svg class="size-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0L5 12m7-7l7 7"/>
          </svg>
        </div>
      `

      driverMarker.current = new mapboxgl.Marker({ element: pinEl })
        .setLngLat(defaultCenter)
        .addTo(map.current)

      // Add Pulsing Red Heatmap Markers (Surge Zones)
      const surgePoints = [
        { coords: [106.8202960, -6.1953250], rate: '1.8x' }, // Grand Indonesia
        { coords: [106.8097720, -6.2246730], rate: '1.5x' }, // Pacific Place
        { coords: [106.7989120, -6.2443280], rate: '1.3x' }  // Blok M
      ]

      surgePoints.forEach((p) => {
        const el = document.createElement('div')
        el.className = 'relative flex items-center justify-center'
        el.innerHTML = `
          <div class="absolute size-14 rounded-full bg-red-500/20 border border-red-500/40 animate-ping duration-1000"></div>
          <div class="absolute size-8 rounded-full bg-red-600/40 border border-red-600/60"></div>
          <div class="z-10 bg-red-600 text-white font-extrabold text-[8px] px-1 py-0.5 rounded shadow-sm border border-red-700">${p.rate}</div>
        `
        new mapboxgl.Marker({ element: el })
          .setLngLat(p.coords as [number, number])
          .addTo(map.current!)
      })

      // Try actual location if granted
      navigator.geolocation?.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          setGps('Lokasi Akurat')
          map.current?.flyTo({ center: [longitude, latitude], zoom: 15 })
          driverMarker.current?.setLngLat([longitude, latitude])
          updateLocation(latitude, longitude, accuracy)
        },
        () => setGps('GPS Mode Demo')
      )
    } catch (e) {
      setGps('Error Peta Mapbox')
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Animate Marker based on Order Status Transitions with dynamically computed rotation heading
  useEffect(() => {
    if (!map.current || !driverMarker.current) return

    // Clean up previous animations
    if (currentStepInterval.current) {
      clearInterval(currentStepInterval.current)
    }

    if (order) {
      const pLng = Number(order.pickupLongitude)
      const pLat = Number(order.pickupLatitude)
      const dLng = Number(order.dropoffLongitude)
      const dLat = Number(order.dropoffLatitude)

      // Plot/Update Pickup Marker (Green)
      if (!pickupMarker.current) {
        pickupMarker.current = new mapboxgl.Marker({ color: '#00b14f' })
          .setLngLat([pLng, pLat])
          .addTo(map.current)
      } else {
        pickupMarker.current.setLngLat([pLng, pLat])
      }

      // Plot/Update Dropoff Marker (Dark Green / Black)
      if (!dropoffMarker.current) {
        dropoffMarker.current = new mapboxgl.Marker({ color: '#172b24' })
          .setLngLat([dLng, dLat])
          .addTo(map.current)
      } else {
        dropoffMarker.current.setLngLat([dLng, dLat])
      }

      // Simulation Movement Easing and Rotation Heading Pointer via Mapbox Directions API
      const animateMarker = async (startCoords: [number, number], endCoords: [number, number]) => {
        let routeCoords: [number, number][] = []
        try {
          const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`)
          const data = await res.json()
          if (data.routes && data.routes[0]) {
            routeCoords = data.routes[0].geometry.coordinates
            
            // Draw route on map
            if (map.current?.getSource('route')) {
              (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(data.routes[0].geometry)
            } else {
              map.current?.addSource('route', {
                type: 'geojson',
                data: data.routes[0].geometry
              })
              map.current?.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#00b14f', 'line-width': 5, 'line-opacity': 0.8 }
              }, 'waterway-label')
            }
          }
        } catch (err) {
          console.error("Directions API failed", err)
        }

        // If no route coords or failed, fallback to straight line with 50 interpolated points
        if (routeCoords.length === 0) {
          routeCoords = [startCoords, endCoords]
        }

        let currentStep = 0
        const totalSteps = routeCoords.length * 3 // 3 frames per point for smooth movement
        
        map.current?.flyTo({ center: startCoords, zoom: 14.5 })

        currentStepInterval.current = setInterval(() => {
          currentStep++
          
          const progress = currentStep / totalSteps
          const pointIndex = progress * (routeCoords.length - 1)
          const lowerIndex = Math.floor(pointIndex)
          const upperIndex = Math.ceil(pointIndex)
          
          if (lowerIndex >= routeCoords.length - 1) {
            clearInterval(currentStepInterval.current!)
            map.current?.flyTo({ center: endCoords, zoom: 15 })
            driverMarker.current?.setLngLat(endCoords)
            if (map.current?.getSource('route')) {
               // Clear route on arrival
               (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } as any)
            }
            return
          }

          const segmentProgress = pointIndex - lowerIndex
          const p1 = routeCoords[lowerIndex]
          const p2 = routeCoords[upperIndex]
          
          const lng = p1[0] + (p2[0] - p1[0]) * segmentProgress
          const lat = p1[1] + (p2[1] - p1[1]) * segmentProgress

          // Rotate vehicle marker pointing in direction of destination coordinates
          const bearing = calculateBearing(p1[1], p1[0], p2[1], p2[0])
          if (!isNaN(bearing)) driverMarker.current?.setRotation(bearing)
          driverMarker.current?.setLngLat([lng, lat])

        }, 100) // update every 100ms
      }

      const currentDriverPos = driverMarker.current.getLngLat()

      if (order.status === 'accepted') {
        animateMarker([currentDriverPos.lng, currentDriverPos.lat], [pLng, pLat])
      } else if (order.status === 'picked_up') {
        animateMarker([pLng, pLat], [dLng, dLat])
      } else if (order.status === 'arrived') {
        driverMarker.current.setLngLat([pLng, pLat])
        map.current.flyTo({ center: [pLng, pLat], zoom: 15.5 })
      } else if (order.status === 'offered') {
        const startOffsetLng = pLng - 0.005
        const startOffsetLat = pLat + 0.003
        driverMarker.current.setLngLat([startOffsetLng, startOffsetLat])
        map.current.flyTo({ center: [startOffsetLng, startOffsetLat], zoom: 14 })
      }
    } else {
      if (pickupMarker.current) {
        pickupMarker.current.remove()
        pickupMarker.current = null
      }
      if (dropoffMarker.current) {
        dropoffMarker.current.remove()
        dropoffMarker.current = null
      }
    }

    return () => {
      if (currentStepInterval.current) clearInterval(currentStepInterval.current)
    }
  }, [order?.status, order?.id])

  return (
    <div className="relative h-80 w-full overflow-hidden bg-muted">
      <div ref={ref} className="absolute inset-0 z-0 h-full w-full" />
      <div className="absolute left-4 top-4 z-10 rounded-full bg-card/90 backdrop-blur px-3 py-1.5 text-xs font-semibold shadow-lg text-foreground">
        {gps}
      </div>
      <button
        onClick={() => {
          if (map.current && driverMarker.current) {
            const pos = driverMarker.current.getLngLat()
            map.current.flyTo({ center: pos, zoom: 16 })
          }
        }}
        aria-label="Pusatkan lokasi"
        className="absolute bottom-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-card shadow-lg text-primary transition-transform hover:scale-105 active:scale-95"
      >
        <Crosshair className="size-5" />
      </button>
    </div>
  )
}

/* ==========================================================================
   COMPONENT: DEV PANEL MODAL
   ========================================================================== */
function DevPanel({
  open,
  onClose,
  order,
  run,
  pending
}: {
  open: boolean
  onClose: () => void
  order: any
  run: (action: () => Promise<void>, nextStatus?: string, details?: any) => void
  pending: boolean
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <header className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2 text-destructive">
            <Wrench className="size-5" />
            <h2 className="font-bold">Dev Simulator Tools</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="size-5" />
          </button>
        </header>

        <div className="mt-4 flex flex-col gap-3">
          <button
            onClick={() => {
              onClose()
              run(simulateNewOrder)
            }}
            disabled={pending || (order && order.status !== 'cancelled' && order.status !== 'completed')}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50"
          >
            <Sparkles className="size-5" />
            Simulasi Order Baru
          </button>

          {order && !['completed', 'cancelled'].includes(order.status) && (
            <button
              onClick={() => {
                onClose()
                run(() => declineOrder(order.id))
              }}
              disabled={pending}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-destructive/10 text-destructive font-semibold hover:bg-destructive/20"
            >
              <ShieldAlert className="size-5" />
              Tolak/Batalkan Orderan
            </button>
          )}

          <button
            onClick={() => {
              onClose()
              run(addFakeEarnings)
            }}
            disabled={pending}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-muted"
          >
            <CircleDollarSign className="size-5 text-primary" />
            Top Up Simulasi Dompet
          </button>

          <button
            onClick={() => {
              onClose()
              location.assign('/admin')
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-800 text-slate-100 font-semibold hover:bg-slate-700"
          >
            <ShieldCheck className="size-5 text-primary" />
            Buka Portal Admin
          </button>

          <button
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin menghapus semua data profil dan order?')) {
                onClose()
                run(resetDriverData)
              }
            }}
            disabled={pending}
            className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl bg-muted text-destructive font-bold border border-destructive/20"
          >
            <LogOut className="size-5" />
            Reset Data & Ulang Onboarding
          </button>
        </div>
      </div>
    </div>
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
  openDrawer
}: {
  data: Data
  order: any
  pending: boolean
  run: (action: () => Promise<void>, nextStatus?: string, details?: any) => void
  credit: number
  diamonds: number
  tier: { label: string; style: string }
  openDrawer: (drawer: 'chat' | 'phone' | 'safety' | 'withdrawal' | 'targets' | 'services' | null) => void
}) {
  const p = data.profile
  const creditAlert = credit < 10000

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
                ðŸ’Ž {diamonds} Berlian hari ini
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

      {/* Map Segment */}
      <MapView order={order} />

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

        {/* Dynamic Bidding card / Status Card */}
        {order ? (
          <OrderCard order={order} run={run} pending={pending} openDrawer={openDrawer} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center bg-card/20">
            <Bike className="size-10 text-primary animate-bounce duration-1000" />
            <strong className="text-foreground">Menunggu order terdekat</strong>
            <p className="text-xs text-muted-foreground max-w-[250px]">
              {p.isOnline
                ? 'Harap tunggu, orderan akan masuk otomatis. Anda bisa memicu orderan dari panel dev atas.'
                : 'Silakan aktifkan mode Online di atas untuk mulai mencari penumpang.'}
            </p>
          </div>
        )}

        {/* Quick Menu Actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: CircleDollarSign, label: 'Withdrawal', action: () => openDrawer('withdrawal') },
            { icon: Target, label: 'Target', action: () => openDrawer('targets') },
            { icon: ShieldCheck, label: 'Safety', action: () => openDrawer('safety') },
            { icon: Menu, label: 'Lainnya', action: () => openDrawer('safety') }
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
  order: any
  run: (fn: () => Promise<void>, nextStatus?: string, details?: any) => void
  pending: boolean
  openDrawer: (drawer: any) => void
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

  useEffect(() => {
    if (order.status !== 'offered') return
    setCountdown(15)
    
    // Play bidding beep chime
    playBiddingBeep()

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          // Auto-decline order
          run(() => declineOrder(order.id))
          return 0
        }
        playBiddingBeep()
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
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
function ReceiptModal({ order, onClose }: { order: any; onClose: () => void }) {
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
                {o.pickupAddress} â†’ {o.dropoffAddress}
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
            onClick={() => alert('Top Up deposit dompet kredit dapat dilakukan via Simulator Panel (tombol obeng kanan atas).')}
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
                  {e.type.toUpperCase()} â€¢ {new Date(e.createdAt).toLocaleDateString('id-ID')}
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
  profile: any
  vehicle: any
  user: any
  tier: { label: string; style: string }
  diamonds: number
  run: (action: () => Promise<void>) => void
}) {
  return (
    <Page title="Profil" subtitle="Akun Mitra Driver terverifikasi">
      <div className="flex items-center gap-4 rounded-3xl bg-foreground p-5 text-background shadow-lg">
        <img
          src="/placeholder-user.jpg"
          alt={user.name}
          className="size-14 rounded-full border-2 border-primary object-cover shadow-sm bg-primary"
        />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-base">{user.name}</h2>
            <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase border tracking-wider bg-gradient-to-r ${tier.style}`}>
              {tier.label}
            </span>
          </div>
          <p className="text-xs opacity-75">{user.email}</p>
          <span className="mt-1.5 inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
            MITRA: {profile.verificationStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Rating Driver" value={profile.rating} />
        <Metric label="Loyalitas" value={`ðŸ’Ž ${diamonds}`} />
        <Metric label="Penyelesaian" value={`${profile.completionRate}%`} />
      </div>

      <section className="rounded-2xl border bg-card overflow-hidden">
        <Row
          icon={Bike}
          label={`${vehicle?.brand || 'Kendaraan'} ${vehicle?.model || ''}`}
          sub={vehicle?.plateNumber || 'Plat Nomor Belum Diisi'}
        />
        <Row icon={ShieldCheck} label="Pusat Keselamatan" sub="Kelola kontak darurat & SOS" />
        <Row icon={Headphones} label="Layanan Bantuan 24/7" sub="Hubungi pusat bantuan Grab Mitra" />
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
            authClient.signOut().then(() => location.assign('/sign-in'))
          }
        }}
        className="h-12 w-full rounded-xl border border-destructive/20 font-bold text-destructive hover:bg-destructive/5 transition-colors mt-2"
      >
        Keluar Akun
      </button>
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

  const handleSend = (text: string) => {
    if (!text.trim()) return
    const newMsg: Message = { id: Date.now(), sender: 'driver', text, time: 'Baru saja' }
    setMessages((prev) => [...prev, newMsg])
    setInputText('')

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
      // Play soft chat sound on customer reply
      playChatPing()
    }, 1200)
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
  const timer = useRef<NodeJS.Timeout | null>(null)

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
              ðŸ’Ž {diamonds} Berlian
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
  const defaults: Record<string, string> = {
    phone: '0812-3456-7890',
    city: 'DKI Jakarta',
    brand: 'Honda',
    model: 'Vario 150cc',
    plate: 'B 3829 SGB',
    emergency: '0811-9999-8888'
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="bg-slate-950 px-6 pb-10 pt-14 text-slate-100 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/images/grab-driver-logo.png" alt="Grab Driver Logo" className="h-16 w-auto object-contain rounded-2xl shadow-md border border-slate-800" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold text-balance">Daftar Mitra Driver</h1>
        <p className="mt-2 text-xs opacity-75 leading-relaxed">
          Silakan lengkapi formulir pendaftaran di bawah ini untuk memulai simulasi pengantaran.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              await createDriverProfile({
                phone: defaults.phone,
                city: defaults.city,
                brand: defaults.brand,
                model: defaults.model,
                plateNumber: defaults.plate,
                emergencyContact: defaults.emergency
              })
            })
          }
          className="h-12 w-full rounded-xl bg-slate-900 border border-primary/30 text-primary font-black uppercase text-xs tracking-wider transition-transform hover:scale-102 active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 shadow"
        >
          <Sparkles className="size-4 animate-pulse" />
          Daftar Instan (Akun Demo Grab)
        </button>

        <div className="flex items-center my-2">
          <div className="flex-1 border-t border-dashed" />
          <span className="px-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Atau Isi Manual</span>
          <div className="flex-1 border-t border-dashed" />
        </div>

        <form
          action={(fd) =>
            run(async () => {
              await createDriverProfile({
                phone: String(fd.get('phone')),
                city: String(fd.get('city')),
                brand: String(fd.get('brand')),
                model: String(fd.get('model')),
                plateNumber: String(fd.get('plate')),
                emergencyContact: String(fd.get('emergency'))
              })
            })
          }
          className="flex flex-col gap-4"
        >
          {[
            ['phone', 'Nomor Telepon Mitra', 'tel'],
            ['city', 'Kota Operasional', 'text'],
            ['brand', 'Merek Sepeda Motor', 'text'],
            ['model', 'Model / Seri Motor', 'text'],
            ['plate', 'Nomor Polisi (Plat)', 'text'],
            ['emergency', 'Nomor Kontak Darurat', 'tel']
          ].map(([name, label, type]) => (
            <label key={name} className="flex flex-col gap-1.5 text-xs font-semibold text-foreground">
              {label}
              <input
                name={name}
                type={type}
                required
                defaultValue={defaults[name]}
                className="h-12 w-full rounded-xl border bg-card px-4 font-normal outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </label>
          ))}
          <button
            disabled={pending}
            className="mt-4 h-12 w-full rounded-xl bg-primary font-black uppercase text-primary-foreground tracking-wider transition-transform hover:scale-102 active:scale-98 disabled:opacity-60"
          >
            {pending ? 'Mendaftarkan...' : 'Kirim Berkas Pendaftaran'}
          </button>
        </form>
      </div>
    </main>
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
