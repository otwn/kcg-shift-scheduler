import { describe, expect, it } from 'vitest'
import {
  calculateDistanceMiles,
  findRegionForCoordinates,
  getRegionNames,
} from '../contexts/RegionContext.jsx'

describe('region coordinate helpers', () => {
  it('returns unique selectable region names', () => {
    const regionNames = getRegionNames([
      { region_name: 'central_texas' },
      { region_name: 'central_texas' },
      { region_name: 'north_texas' },
    ])

    expect(regionNames).toEqual(['central_texas', 'north_texas'])
  })

  it('calculates no distance between identical coordinates', () => {
    expect(calculateDistanceMiles(30.2672, -97.7431, 30.2672, -97.7431)).toBe(0)
  })

  it('uses the nearest matching city radius to select a region', () => {
    const regionName = findRegionForCoordinates(30.2672, -97.7431, [
      {
        region_name: 'central_texas',
        latitude: 30.2672,
        longitude: -97.7431,
        radius_miles: 50,
      },
      {
        region_name: 'north_texas',
        latitude: 30.5,
        longitude: -97.5,
        radius_miles: 100,
      },
    ])

    expect(regionName).toBe('central_texas')
  })

  it('leaves the region unselected when no city radius contains the location', () => {
    const regionName = findRegionForCoordinates(35, -100, [
      {
        region_name: 'central_texas',
        latitude: 30.2672,
        longitude: -97.7431,
        radius_miles: 50,
      },
    ])

    expect(regionName).toBeNull()
  })
})
