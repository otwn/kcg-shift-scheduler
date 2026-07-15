import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'

const REGION_STORAGE_KEY = 'kcg-shift-scheduler.region-name'
const EARTH_RADIUS_MILES = 3958.8

const RegionContext = createContext(null)

const toRadians = (degrees) => (degrees * Math.PI) / 180

export function getRegionNames(regionCities) {
  return [...new Set(regionCities.map(({ region_name }) => region_name).filter(Boolean))]
}

export function calculateDistanceMiles(latitudeA, longitudeA, latitudeB, longitudeB) {
  const latitudeDelta = toRadians(latitudeB - latitudeA)
  const longitudeDelta = toRadians(longitudeB - longitudeA)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2

  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export function findRegionForCoordinates(latitude, longitude, regionCities) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  const nearestCity = regionCities.reduce((closest, city) => {
    const cityLatitude = Number(city.latitude)
    const cityLongitude = Number(city.longitude)
    const radiusMiles = Number(city.radius_miles)

    if (
      !city.region_name ||
      city.latitude == null ||
      city.longitude == null ||
      city.radius_miles == null ||
      !Number.isFinite(cityLatitude) ||
      !Number.isFinite(cityLongitude) ||
      !Number.isFinite(radiusMiles) ||
      radiusMiles < 0
    ) {
      return closest
    }

    const distance = calculateDistanceMiles(latitude, longitude, cityLatitude, cityLongitude)
    if (distance > radiusMiles || (closest && distance >= closest.distance)) {
      return closest
    }

    return { distance, regionName: city.region_name }
  }, null)

  return nearestCity?.regionName ?? null
}

function readStoredRegionName() {
  try {
    return window.localStorage.getItem(REGION_STORAGE_KEY)
  } catch {
    return null
  }
}

function saveRegionName(regionName) {
  try {
    if (regionName) {
      window.localStorage.setItem(REGION_STORAGE_KEY, regionName)
      return
    }

    window.localStorage.removeItem(REGION_STORAGE_KEY)
  } catch {
    // The app still works when local storage is unavailable.
  }
}

export function RegionProvider({ children }) {
  const [regionCities, setRegionCities] = useState([])
  const [regionName, setRegionNameState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasManualSelection = useRef(false)

  const regions = useMemo(() => getRegionNames(regionCities), [regionCities])

  const setRegionName = useCallback(
    (nextRegionName) => {
      const normalizedRegionName = typeof nextRegionName === 'string' ? nextRegionName.trim() : null
      const selectedRegionName = regions.includes(normalizedRegionName) ? normalizedRegionName : null

      hasManualSelection.current = true
      setRegionNameState(selectedRegionName)
      saveRegionName(selectedRegionName)
    },
    [regions]
  )

  useEffect(() => {
    let isActive = true

    async function loadRegions() {
      if (!supabase) {
        if (isActive) setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('region_cities')
        .select('region_name, latitude, longitude, radius_miles')

      if (!isActive) return

      const loadedCities = error ? [] : data ?? []
      const loadedRegions = getRegionNames(loadedCities)
      const storedRegionName = readStoredRegionName()

      setRegionCities(loadedCities)
      setIsLoading(false)

      if (storedRegionName && loadedRegions.includes(storedRegionName)) {
        setRegionNameState(storedRegionName)
        return
      }

      if (!navigator.geolocation) return

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (!isActive || hasManualSelection.current) return

          setRegionNameState(findRegionForCoordinates(coords.latitude, coords.longitude, loadedCities))
        },
        () => {},
        { maximumAge: 300000, timeout: 10000 }
      )
    }

    loadRegions()

    return () => {
      isActive = false
    }
  }, [])

  const value = useMemo(
    () => ({ regionName, regions, isLoading, setRegionName }),
    [isLoading, regionName, regions, setRegionName]
  )

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
}

export function useRegion() {
  const context = useContext(RegionContext)

  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider')
  }

  return context
}
