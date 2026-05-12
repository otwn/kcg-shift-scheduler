import { CONFIG } from '../config'

// Day-cell classification for the schedule calendar.
// dow: 0=Sun … 6=Sat. dom: 1-31. month: 0=Jan … 11=Dec.
// Weeks are Sunday-start: week n covers dom ((n-1)*7+1)..(n*7).
export function getDayCellClasses(date, rules = CONFIG.shiftRules) {
  const dow = date.getDay()
  const dom = date.getDate()
  const month = date.getMonth()

  // January 1st always substitutes as January's KRG day (the generic
  // krgSunday rule excludes January so January would otherwise have none).
  if (month === 0 && dom === 1) return ['first-sunday-krg']

  if (month === 11 && dom >= rules.yearEndBlockStartDay) return ['no-shift-day']

  const districtSunStart = (rules.districtMeetingWeekOfMonth - 1) * 7 + 1
  const districtSunEnd   = rules.districtMeetingWeekOfMonth * 7
  const isDistrictSunday = dow === 0 && dom >= districtSunStart && dom <= districtSunEnd

  const isNoShiftWeekday = !rules.shiftWeekdays.includes(dow)

  const krgSunStart = (rules.krgSundayWeekOfMonth - 1) * 7 + 1
  const krgSunEnd   = rules.krgSundayWeekOfMonth * 7
  const isKrgSunday = dow === 0 && dom >= krgSunStart && dom <= krgSunEnd && month !== 0

  const classes = []
  if (isNoShiftWeekday || isDistrictSunday) classes.push('no-shift-day')
  if (isKrgSunday) classes.push('first-sunday-krg')
  return classes
}
