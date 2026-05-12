import { describe, it, expect } from 'vitest'
import { getDayCellClasses } from '../scheduleRules'

// Reference month: May 2026
//   May 1 Fri, 3 Sun(1st), 10 Sun(2nd), 17 Sun(3rd), 23 Sat, 24 Sun(4th)
describe('getDayCellClasses', () => {
  it('greys out the 3rd Sunday', () => {
    expect(getDayCellClasses(new Date(2026, 4, 17))).toContain('no-shift-day')
  })

  it('marks Jan 1 as first-sunday-krg only', () => {
    expect(getDayCellClasses(new Date(2026, 0, 1))).toEqual(['first-sunday-krg'])
  })

  it('greys out Dec 24 through Dec 31', () => {
    expect(getDayCellClasses(new Date(2026, 11, 24))).toEqual(['no-shift-day'])
    expect(getDayCellClasses(new Date(2026, 11, 31))).toEqual(['no-shift-day'])
  })

  it('greys out Mon/Tue/Thu/Fri', () => {
    expect(getDayCellClasses(new Date(2026, 4, 4))).toContain('no-shift-day') // Mon
    expect(getDayCellClasses(new Date(2026, 4, 5))).toContain('no-shift-day') // Tue
    expect(getDayCellClasses(new Date(2026, 4, 7))).toContain('no-shift-day') // Thu
    expect(getDayCellClasses(new Date(2026, 4, 8))).toContain('no-shift-day') // Fri
  })

  it('marks the 1st Sunday (non-January) as first-sunday-krg', () => {
    expect(getDayCellClasses(new Date(2026, 4, 3))).toContain('first-sunday-krg')
  })

  it('leaves a normal Wed/Sat/Sun untouched', () => {
    expect(getDayCellClasses(new Date(2026, 4, 6))).toEqual([])  // Wed
    expect(getDayCellClasses(new Date(2026, 4, 9))).toEqual([])  // Sat
    expect(getDayCellClasses(new Date(2026, 4, 10))).toEqual([]) // 2nd Sun
  })
})
