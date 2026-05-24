import { describe, it, expect } from 'vitest'
import { getDayCellClasses, getShiftTimeReminder } from '../scheduleRules'

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

  it('greys out the Saturday that ends the same week as the district-meeting Sunday', () => {
    // May 2026: 3rd Sun = May 17, same Sun-Sat week ends Sat May 23
    expect(getDayCellClasses(new Date(2026, 4, 23))).toContain('no-shift-day')
  })

  it('does not grey out the district-meeting-week Saturday before the cutover', () => {
    // May 2025: 3rd Sun = May 18, same-week Sat = May 24, pre-cutover (2026-05)
    expect(getDayCellClasses(new Date(2025, 4, 24))).toEqual([])
  })
})

// Reference month: May 2026 (see above)
describe('getShiftTimeReminder', () => {
  it('returns the Sunday time', () => {
    // May 10 = 2nd Sunday (regular shift day)
    expect(getShiftTimeReminder(new Date(2026, 4, 10))).toBe('Sunday 8:30am - 12:30pm')
  })

  it('returns the Wednesday time', () => {
    expect(getShiftTimeReminder(new Date(2026, 4, 6))).toBe('Wednesday 6:45pm - 8:15pm')
  })

  it('returns the Saturday time', () => {
    expect(getShiftTimeReminder(new Date(2026, 4, 9))).toBe('Saturday 9:30am - 12:30pm')
  })

  it('appends the KRG prep note on the first Sunday', () => {
    // May 3 = 1st Sunday (KRG)
    expect(getShiftTimeReminder(new Date(2026, 4, 3)))
      .toBe('Sunday 8:30am - 12:30pm. Note that you may need to be there earlier for KRG prep')
  })
})
