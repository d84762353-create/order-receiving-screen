'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { Crosshair } from 'lucide-react'
import { updateLocation } from '@/app/actions/driver'

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

export default function MapView({ order }: { order?: any }) {
  const ref = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const driverMarker = useRef<mapboxgl.Marker | null>(null)
  const pickupMarker = useRef<mapboxgl.Marker | null>(null)
  const dropoffMarker = useRef<mapboxgl.Marker | null>(null)
  const currentStepInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const [gps, setGps] = useState('Menginisialisasi peta...')
  const useRealGps = useRef(false)
  const orderRef = useRef(order)

  // Sync order prop to ref to prevent stale closures in geolocation watcher
  useEffect(() => {
    orderRef.current = order
  }, [order])

  // Initialize Map
  useEffect(() => {
    if (!ref.current || map.current) return
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
    
    // Jakarta Central Fallback Coordinates
    const defaultCenter: [number, number] = [106.8227, -6.2023]

    let watchId: number | null = null
    const lastUpdate = { current: 0 }

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

      // Watch physical GPS position in real-time

      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, accuracy, heading } = position.coords
            setGps('GPS Aktif')
            useRealGps.current = true

            if (map.current && driverMarker.current) {
              const prevCoords = driverMarker.current.getLngLat()
              driverMarker.current.setLngLat([longitude, latitude])
              
              if (heading !== null && heading !== undefined) {
                driverMarker.current.setRotation(heading)
              } else if (prevCoords) {
                const distanceMoved = Math.sqrt(
                  Math.pow(longitude - prevCoords.lng, 2) + Math.pow(latitude - prevCoords.lat, 2)
                )
                if (distanceMoved > 0.00005) { // roughly 5 meters
                  const bearing = calculateBearing(prevCoords.lat, prevCoords.lng, latitude, longitude)
                  if (!isNaN(bearing)) driverMarker.current.setRotation(bearing)
                }
              }

              // Center map on driver if not currently on active simulated route
              const activeOrder = orderRef.current
              if (!activeOrder || ['offered', 'arrived'].includes(activeOrder.status)) {
                map.current.setCenter([longitude, latitude])
              }
            }

            // Throttle database update to once every 5 seconds to prevent write spam
            const now = Date.now()
            if (now - lastUpdate.current > 5000) {
              lastUpdate.current = now
              updateLocation(latitude, longitude, accuracy).catch(() => {})
            }
          },
          (err) => {
            console.warn("Geolocation watch error:", err)
            if (err.code === err.PERMISSION_DENIED) {
              setGps('Izin Lokasi Ditolak')
            } else {
              setGps('Lokasi Kurang Akurat')
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      }
    } catch (e) {
      setGps('Error Peta Mapbox')
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Draw route or animate simulated marker based on order state changes
  useEffect(() => {
    if (!map.current || !driverMarker.current) return

    // Clean up previous animations
    if (currentStepInterval.current) {
      clearInterval(currentStepInterval.current)
    }

    const drawRoute = async (startCoords: [number, number], endCoords: [number, number]) => {
      try {
        const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`)
        if (!res.ok) throw new Error(`Directions API ${res.status}`)
        const data = await res.json()
        if (data.routes && data.routes[0] && map.current) {
          // Draw route on map
          if (map.current.getSource('route')) {
            (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData(data.routes[0].geometry)
          } else {
            map.current.addSource('route', {
              type: 'geojson',
              data: data.routes[0].geometry
            })
            map.current.addLayer({
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
          if (!res.ok) throw new Error(`Directions API ${res.status}`)
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
          const pointsCount = 50
          for (let i = 0; i <= pointsCount; i++) {
            const ratio = i / pointsCount
            const lng = startCoords[0] + (endCoords[0] - startCoords[0]) * ratio
            const lat = startCoords[1] + (endCoords[1] - startCoords[1]) * ratio
            routeCoords.push([lng, lat])
          }
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

      if (useRealGps.current) {
        // Real production GPS mode
        if (order.status === 'accepted') {
          drawRoute([currentDriverPos.lng, currentDriverPos.lat], [pLng, pLat])
          map.current.flyTo({ center: [currentDriverPos.lng, currentDriverPos.lat], zoom: 15 })
        } else if (order.status === 'picked_up') {
          drawRoute([currentDriverPos.lng, currentDriverPos.lat], [dLng, dLat])
          map.current.flyTo({ center: [currentDriverPos.lng, currentDriverPos.lat], zoom: 15 })
        } else if (order.status === 'arrived') {
          map.current.flyTo({ center: [pLng, pLat], zoom: 15.5 })
        } else if (order.status === 'offered') {
          map.current.flyTo({ center: [currentDriverPos.lng, currentDriverPos.lat], zoom: 14 })
        }
      } else {
        // Simulation mode
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
      if (map.current?.getSource('route')) {
         (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } as any)
      }
    }

    return () => {
      if (currentStepInterval.current) clearInterval(currentStepInterval.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
