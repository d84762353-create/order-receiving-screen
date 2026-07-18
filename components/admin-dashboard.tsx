'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  updateDriverVerification,
  dispatchCustomOrder,
  updateOrderState,
  resetSystemData
} from '@/app/actions/admin'
import {
  LayoutDashboard,
  Users,
  Bike,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  Ban,
  RefreshCcw,
  PlusCircle,
  Wallet,
  ChevronRight,
  Eye,
  Image,
  X,
  FileText,
  UserRound,
  Car,
} from 'lucide-react'

type AdminDashboardProps = {
  data: {
    drivers: any[]
    vehicles: any[]
    orders: any[]
    earnings: any[]
  }
  adminUser: {
    name: string
    email: string
  }
}

type Tab = 'overview' | 'drivers' | 'orders' | 'financials'

const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0)

const landmarkPresets = [
  { name: 'Stasiun MRT Blok M', lat: '-6.2443280', lng: '106.7989120' },
  { name: 'Grand Indonesia Mall', lat: '-6.1953250', lng: '106.8202960' },
  { name: 'Plaza Senayan Mall', lat: '-6.2255750', lng: '106.7997570' },
  { name: 'Kuningan City Mall', lat: '-6.2248550', lng: '106.8298710' },
  { name: 'Pondok Indah Mall 2', lat: '-6.2697840', lng: '106.7828550' },
  { name: 'Pacific Place Mall', lat: '-6.2246730', lng: '106.8097720' },
  { name: 'Monumen Nasional (Monas)', lat: '-6.1753920', lng: '106.8271530' },
  { name: 'Central Park Mall', lat: '-6.1772650', lng: '106.7909320' },
  { name: 'Kota Tua Jakarta', lat: '-6.1348880', lng: '106.8133030' },
  { name: 'Stasiun Gambir', lat: '-6.1765000', lng: '106.8302000' }
]

export function AdminDashboard({ data, adminUser }: AdminDashboardProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [pending, startTransition] = useTransition()

  // Custom order dispatcher state
  const [selectedDriverId, setSelectedDriverId] = useState(data.drivers[0]?.userId || '')
  const [customCustomer, setCustomCustomer] = useState('Anisa')
  const [pickupSelect, setPickupSelect] = useState(0)
  const [dropoffSelect, setDropoffSelect] = useState(1)
  const [customFare, setCustomFare] = useState(25000)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [reviewDriver, setReviewDriver] = useState<any>(null)

  // Sync selectedDriverId when drivers list changes (after router.refresh)
  useEffect(() => {
    if (data.drivers.length > 0 && !data.drivers.find((d) => d.userId === selectedDriverId)) {
      setSelectedDriverId(data.drivers[0].userId)
    }
  }, [data.drivers, selectedDriverId])

  // Calculate statistics
  const totalCompletedTrips = data.orders.filter((o) => o.status === 'completed').length
  const totalRevenue = data.earnings.filter((e) => e.amount > 0).reduce<number>((sum, e) => sum + (Number(e.amount) || 0), 0)
  const totalWithdrawals = Math.abs(data.earnings.filter((e) => e.amount < 0).reduce<number>((sum, e) => sum + (Number(e.amount) || 0), 0))
  const netEarningsReserve = totalRevenue - totalWithdrawals
  const activeOnlineDriversCount = data.drivers.filter((d) => d.isOnline).length
  const pendingVerificationsCount = data.drivers.filter((d) => d.verificationStatus === 'pending').length

  const runAdminAction = (action: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await action()
        router.refresh()
      } catch (err: any) {
        alert(err.message || 'Terjadi kesalahan')
      }
    })
  }

  const handleDispatch = () => {
    if (!selectedDriverId) {
      alert('Silakan pilih driver online terlebih dahulu')
      return
    }

    if (!customCustomer.trim()) {
      alert('Nama customer tidak boleh kosong')
      return
    }

    if (Number(customFare) < 1000) {
      alert('Tarif minimal Rp 1.000')
      return
    }

    const pLand = landmarkPresets[pickupSelect]
    const dLand = landmarkPresets[dropoffSelect]

    if (pickupSelect === dropoffSelect) {
      alert('Lokasi jemput dan tujuan tidak boleh sama')
      return
    }

    runAdminAction(async () => {
      await dispatchCustomOrder({
        userId: selectedDriverId,
        pickupAddress: pLand.name,
        pickupLatitude: pLand.lat,
        pickupLongitude: pLand.lng,
        dropoffAddress: dLand.name,
        dropoffLatitude: dLand.lat,
        dropoffLongitude: dLand.lng,
        customerName: customCustomer,
        customerPhone: '0812-3456-7890',
        fare: Number(customFare),
        paymentMethod,
        serviceType: 'ride'
      })
      alert('Order berhasil dikirim ke aplikasi driver!')
      setCustomCustomer('Anisa')
      setCustomFare(25000)
      setPaymentMethod('cash')
    })
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Top Banner Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 sticky top-0 z-40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex size-9 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-primary tracking-wide">GRAB MITRA ADMIN</h1>
              <p className="text-xs text-slate-400">Portal monitoring pusat pesanan pengemudi</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-sm uppercase">
              {adminUser.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold">{adminUser.name}</p>
              <p className="text-[10px] text-slate-400">{adminUser.email}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-slate-800 pr-0 md:pr-6">
          {[
            { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
            { id: 'drivers', label: 'Mitra Pengemudi', icon: Users, badge: pendingVerificationsCount },
            { id: 'orders', label: 'Dispatcher Order', icon: Bike },
            { id: 'financials', label: 'Laporan Keuangan', icon: DollarSign }
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id as Tab)}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all shrink-0 ${
                tab === id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {label}
              </span>
              {badge !== undefined && badge > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    tab === id ? 'bg-primary-foreground text-primary' : 'bg-destructive text-destructive-foreground animate-pulse'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
          <div className="hidden md:block border-t border-slate-800 my-4" />
          <button
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin menghapus semua database driver, orderan, dan transaksi?')) {
                runAdminAction(resetSystemData)
              }
            }}
            disabled={pending}
            className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors mt-auto disabled:opacity-50 shrink-0"
          >
            <RefreshCcw className={`size-3.5 ${pending ? 'animate-spin' : ''}`} />
            Reset Semua Data
          </button>
        </nav>

        {/* Dynamic Panel Content */}
        <section className="flex-1 min-w-0 bg-slate-900/20 rounded-3xl border border-slate-800/80 p-6 md:p-8">
          {tab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Users}
                  title="Mitra Pengemudi"
                  value={data.drivers.length}
                  subText={`${activeOnlineDriversCount} Driver Online`}
                  color="border-blue-500/20 text-blue-400"
                />
                <StatCard
                  icon={Bike}
                  title="Completed Trip"
                  value={totalCompletedTrips}
                  subText={`Dari total ${data.orders.length} pesanan`}
                  color="border-emerald-500/20 text-emerald-400"
                />
                <StatCard
                  icon={DollarSign}
                  title="Omset Sistem"
                  value={rupiah(totalRevenue)}
                  subText={`Penarikan: ${rupiah(totalWithdrawals)}`}
                  color="border-primary/20 text-primary"
                />
                <StatCard
                  icon={Wallet}
                  title="Dana Cadangan"
                  value={rupiah(netEarningsReserve)}
                  subText="Saldo kas bersih saat ini"
                  color="border-amber-500/20 text-amber-400"
                />
              </div>

              {/* Grid Layouts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Active Drivers Status */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                    <h3 className="font-extrabold text-sm text-foreground">Aktivitas Driver</h3>
                    <ChevronRight className="size-4 text-slate-500" />
                  </div>
                  <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                    {data.drivers.map((d) => {
                      const v = data.vehicles.find((v) => v.userId === d.userId)
                      return (
                        <div key={d.id} className="flex items-center justify-between rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/40">
                          <div>
                            <strong className="block text-xs font-bold">{d.name}</strong>
                            <small className="text-[10px] text-slate-400">
                              {d.city} • {v?.brand || 'Motor'} ({v?.plateNumber || 'n/a'})
                            </small>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              d.isOnline ? 'bg-primary/10 text-primary' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {d.isOnline ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Verification Queue */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                    <h3 className="font-extrabold text-sm text-foreground">Antrean Verifikasi Dokumen</h3>
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-black text-destructive">
                      {pendingVerificationsCount} Antrean
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                    {data.drivers.filter(d => d.verificationStatus === 'pending').map((d) => (
                      <div key={d.id} className="rounded-xl bg-slate-900/60 border border-slate-800/40 overflow-hidden">
                        <div className="flex items-center justify-between p-3.5">
                          <div>
                            <strong className="block text-xs font-bold">{d.name}</strong>
                            <small className="text-[10px] text-slate-400">{d.phone} • {d.city}</small>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setReviewDriver(d)}
                              className="rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white px-2.5 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1"
                            >
                              <Eye className="size-3" /> Tinjau
                            </button>
                            <button
                              onClick={() => runAdminAction(() => updateDriverVerification(d.id, 'approved'))}
                              disabled={pending}
                              className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-black text-primary-foreground hover:bg-primary/95 transition-all"
                            >
                              Setujui
                            </button>
                          </div>
                        </div>
                        {/* Photo thumbnails row */}
                        {(d.photoKtp || d.photoSim || d.photoStnk || d.photoSelfie || d.photoVehicle) && (
                          <div className="px-3.5 pb-3 flex gap-1.5">
                            {[{key:'photoKtp',label:'KTP'},{key:'photoSim',label:'SIM'},{key:'photoStnk',label:'STNK'},{key:'photoSelfie',label:'Selfie'},{key:'photoVehicle',label:'Kndrn'}].map(({key,label}) => (
                              <div key={key} className="flex flex-col items-center gap-0.5">
                                {d[key] ? (
                                  <img src={d[key]} alt={label} className="size-10 rounded-md object-cover border border-slate-700 cursor-pointer hover:border-primary" onClick={() => setReviewDriver(d)} />
                                ) : (
                                  <div className="size-10 rounded-md bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center">
                                    <X className="size-3 text-slate-600" />
                                  </div>
                                )}
                                <span className="text-[7px] text-slate-500 font-bold">{label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {pendingVerificationsCount === 0 && (
                      <div className="py-8 text-center text-xs text-slate-500">
                        Antrean kosong. Semua dokumen driver telah diproses.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'drivers' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-md font-bold text-foreground pb-2 border-b border-slate-800 mb-2">
                Daftar Pengemudi Mitra Terdaftar
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
                <table className="w-full border-collapse text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-4">Mitra Driver</th>
                      <th className="p-4">Info Kontak</th>
                      <th className="p-4">Spesifikasi Motor</th>
                      <th className="p-4">Kota</th>
                      <th className="p-4 text-center">Status Peta</th>
                      <th className="p-4">Dokumen</th>
                      <th className="p-4">Kemitraan</th>
                      <th className="p-4 text-center">Aksi Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {data.drivers.map((d) => {
                      const v = data.vehicles.find((v) => v.userId === d.userId)
                      return (
                        <tr key={d.id} className="hover:bg-slate-900/30">
                          <td className="p-4 font-bold text-foreground">{d.name}</td>
                          <td className="p-4">
                            <p>{d.phone}</p>
                            <p className="text-[10px] text-slate-400">{d.email}</p>
                          </td>
                          <td className="p-4">
                            {v ? (
                              <>
                                <p className="font-semibold text-slate-200">{v.brand} {v.model}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-mono">{v.plateNumber}</p>
                              </>
                            ) : (
                              <span className="text-slate-500">n/a</span>
                            )}
                          </td>
                          <td className="p-4">{d.city}</td>
                          <td className="p-4 text-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                d.isOnline ? 'bg-primary/10 text-primary animate-pulse' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {d.isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                d.verificationStatus === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : d.verificationStatus === 'pending'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-destructive/10 text-destructive'
                              }`}
                            >
                              {d.verificationStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              {[d.photoKtp, d.photoSim, d.photoStnk, d.photoSelfie].filter(Boolean).length > 0 ? (
                                <button
                                  onClick={() => setReviewDriver(d)}
                                  className="rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white px-2 py-1 text-[9px] font-bold transition-colors flex items-center gap-1"
                                >
                                  <Image className="size-3" /> {[d.photoKtp, d.photoSim, d.photoStnk, d.photoSelfie, d.photoVehicle].filter(Boolean).length} Foto
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500">Belum ada</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1 justify-center">
                              {d.verificationStatus !== 'approved' && (
                                <button
                                  onClick={() => runAdminAction(() => updateDriverVerification(d.id, 'approved'))}
                                  className="rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white p-1.5 transition-colors"
                                  title="Setujui Kemitraan"
                                >
                                  <CheckCircle className="size-4" />
                                </button>
                              )}
                              {d.verificationStatus !== 'suspended' && (
                                <button
                                  onClick={() => runAdminAction(() => updateDriverVerification(d.id, 'suspended'))}
                                  className="rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white p-1.5 transition-colors"
                                  title="Tangguhkan Akun"
                                >
                                  <Ban className="size-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="flex flex-col gap-6">
              {/* Order Dispatcher form */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 mb-4">
                  <PlusCircle className="size-5 text-primary" />
                  Kirim Dispatch Order Kustom
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-300">
                    Pilih Mitra Driver Penerima
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="h-11 rounded-xl border border-slate-700 bg-slate-800 px-3 outline-none text-xs focus:ring-1 focus:ring-primary text-slate-200"
                    >
                      {data.drivers.length === 0 && (
                        <option value="" disabled>Tidak ada driver tersedia</option>
                      )}
                      {data.drivers.map((d) => (
                        <option key={d.userId} value={d.userId}>
                          {d.name} ({d.isOnline ? 'Online' : 'Offline'})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-300">
                    Nama Penumpang (Customer)
                    <input
                      value={customCustomer}
                      onChange={(e) => setCustomCustomer(e.target.value)}
                      className="h-11 rounded-xl border border-slate-700 bg-slate-800 px-4 outline-none text-xs focus:ring-1 focus:ring-primary"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-300">
                    Titik Jemput (Preset Landmark)
                    <select
                      value={pickupSelect}
                      onChange={(e) => setPickupSelect(Number(e.target.value))}
                      className="h-11 rounded-xl border border-slate-700 bg-slate-800 px-3 outline-none text-xs focus:ring-1 focus:ring-primary"
                    >
                      {landmarkPresets.map((l, i) => (
                        <option key={l.name} value={i}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-300">
                    Titik Tujuan (Preset Landmark)
                    <select
                      value={dropoffSelect}
                      onChange={(e) => setDropoffSelect(Number(e.target.value))}
                      className="h-11 rounded-xl border border-slate-700 bg-slate-800 px-3 outline-none text-xs focus:ring-1 focus:ring-primary"
                    >
                      {landmarkPresets.map((l, i) => (
                        <option key={l.name} value={i}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-300">
                    Tarif Perjalanan (Fare IDR)
                    <input
                      type="number"
                      min={1000}
                      step={500}
                      value={customFare}
                      onChange={(e) => setCustomFare(Number(e.target.value))}
                      className="h-11 rounded-xl border border-slate-700 bg-slate-800 px-4 outline-none text-xs focus:ring-1 focus:ring-primary"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-300">
                    Metode Pembayaran
                    <div className="flex gap-2 h-11 items-center">
                      {['cash', 'Gopay', 'OVO'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPaymentMethod(p)}
                          className={`flex-1 h-full rounded-xl border text-xs font-bold uppercase transition-all ${
                            paymentMethod === p
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-slate-700 bg-slate-800 text-slate-400'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleDispatch}
                  disabled={pending || data.drivers.length === 0}
                  className="mt-6 h-12 w-full rounded-xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-wider shadow-lg shadow-primary/10 transition-transform active:scale-98 disabled:opacity-50"
                >
                  {pending ? 'Sedang Mengirim...' : 'Kirim Dispatch Orderan Sekarang'}
                </button>
              </div>

              {/* Order State Manager */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-foreground">Semua Transaksi Perjalanan (Orders)</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
                  <table className="w-full border-collapse text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-4">ID / Driver</th>
                        <th className="p-4">Pelanggan</th>
                        <th className="p-4">Alamat Rute</th>
                        <th className="p-4">Tarif</th>
                        <th className="p-4">Status Kerja</th>
                        <th className="p-4 text-center">Status Driver Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {data.orders.map((o) => {
                        const drv = data.drivers.find((d) => d.userId === o.userId)
                        return (
                          <tr key={o.id} className="hover:bg-slate-900/30">
                            <td className="p-4 font-bold text-foreground">
                              #{o.id}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {drv?.name || 'Mitra'}
                              </span>
                            </td>
                            <td className="p-4 font-semibold">{o.customerName}</td>
                            <td className="p-4 max-w-[200px] truncate">
                              <p className="font-semibold text-slate-200">{o.pickupAddress}</p>
                              <p className="text-[10px] text-slate-400">→ {o.dropoffAddress}</p>
                            </td>
                            <td className="p-4">{rupiah(o.fare)}</td>
                            <td className="p-4 font-black uppercase text-[10px] tracking-wide">
                              <span
                                className={`${
                                  o.status === 'completed'
                                    ? 'text-primary'
                                    : o.status === 'cancelled'
                                    ? 'text-destructive'
                                    : 'text-blue-400 animate-pulse'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1 justify-center">
                                {!['completed', 'cancelled'].includes(o.status) && (
                                  <>
                                    <button
                                      onClick={() =>
                                        runAdminAction(() =>
                                          updateOrderState(
                                            o.id,
                                            o.status === 'offered'
                                              ? 'accepted'
                                              : o.status === 'accepted'
                                              ? 'arrived'
                                              : o.status === 'arrived'
                                              ? 'picked_up'
                                              : 'completed'
                                          )
                                        )
                                      }
                                      className="rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-[10px] font-black px-2.5 py-1.5 transition-colors"
                                    >
                                      Selesai Tahap
                                    </button>
                                    <button
                                      onClick={() => runAdminAction(() => updateOrderState(o.id, 'cancelled'))}
                                      className="rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white text-[10px] font-black px-2.5 py-1.5 transition-colors"
                                    >
                                      Batalkan
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {data.orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            Belum ada pesanan masuk.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'financials' && (
            <div className="flex flex-col gap-6">
              {/* Financial Balance Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Total Pemasukan (Trip Fare)</span>
                  <strong className="block text-xl text-primary mt-2">{rupiah(totalRevenue)}</strong>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Total Penarikan (Withdrawals)</span>
                  <strong className="block text-xl text-destructive mt-2">{rupiah(totalWithdrawals)}</strong>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Saldo Neto Cadangan Kas</span>
                  <strong className="block text-xl text-amber-400 mt-2">{rupiah(netEarningsReserve)}</strong>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-foreground">Buku Jurnal Keuangan (Ledger)</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
                  <table className="w-full border-collapse text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-extrabold uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-4">Ref ID</th>
                        <th className="p-4">Tanggal Jurnal</th>
                        <th className="p-4">Nama Driver</th>
                        <th className="p-4">Deskripsi Rincian</th>
                        <th className="p-4">Jenis</th>
                        <th className="p-4 text-right">Debit / Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {data.earnings.map((e) => {
                        const drv = data.drivers.find((d) => d.userId === e.userId)
                        return (
                          <tr key={e.id} className="hover:bg-slate-900/30">
                            <td className="p-4 font-mono text-[10px]">#TR{e.id}</td>
                            <td className="p-4">
                              {new Date(e.createdAt).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-4 font-bold text-slate-300">{drv?.name || 'n/a'}</td>
                            <td className="p-4 truncate max-w-[220px]">{e.description}</td>
                            <td className="p-4 uppercase text-[9px] font-black">
                              <span
                                className={`rounded-full px-2 py-0.5 ${
                                  e.amount > 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                                }`}
                              >
                                {e.amount > 0 ? 'Trip' : 'Withdrawal'}
                              </span>
                            </td>
                            <td className={`p-4 text-right font-bold ${e.amount > 0 ? 'text-primary' : 'text-destructive'}`}>
                              {e.amount > 0 ? `+${rupiah(e.amount)}` : rupiah(e.amount)}
                            </td>
                          </tr>
                        )
                      })}
                      {data.earnings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            Belum ada rekam transaksi keuangan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

/* ==========================================================================
   HELPER UTILITY SUB-COMPONENTS
   ========================================================================== */
function StatCard({
  icon: Icon,
  title,
  value,
  subText,
  color
}: {
  icon: any
  title: string
  value: string | number
  subText: string
  color: string
}) {
  return (
    <div className={`rounded-2xl border bg-slate-900/40 p-5 flex flex-col justify-between h-32 ${color}`}>
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{title}</span>
        <Icon className="size-5" />
      </div>
      <div>
        <strong className="block text-2xl font-black text-foreground tracking-tight">{value}</strong>
        <span className="text-[10px] text-slate-400 block mt-1">{subText}</span>
      </div>
    </div>
  )
}
