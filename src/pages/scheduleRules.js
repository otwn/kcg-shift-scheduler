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

  // Saturday that ends the same Sun-Sat week as the district-meeting Sunday
  // is 6 days after the Sunday, so its dom shifts up by 6. Gated by a
  // YYYY-MM cutover so historical months retain their original behavior.
  const districtSatStart = districtSunStart + 6
  const districtSatEnd   = districtSunEnd + 6
  const ym = `${date.getFullYear()}-${String(month + 1).padStart(2, '0')}`
  const districtSaturdayActive = ym >= rules.districtSaturdayStart
  const isDistrictSaturday = districtSaturdayActive && dow === 6 && dom >= districtSatStart && dom <= districtSatEnd

  const isNoShiftWeekday = !rules.shiftWeekdays.includes(dow)

  const krgSunStart = (rules.krgSundayWeekOfMonth - 1) * 7 + 1
  const krgSunEnd   = rules.krgSundayWeekOfMonth * 7
  const isKrgSunday = dow === 0 && dom >= krgSunStart && dom <= krgSunEnd && month !== 0

  const classes = []
  if (isNoShiftWeekday || isDistrictSunday || isDistrictSaturday) classes.push('no-shift-day')
  if (isKrgSunday) classes.push('first-sunday-krg')
  return classes
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Reminder shown after assigning a shift, e.g. "Sunday 8:30am - 12:30pm".
// On KRG days (first Sunday / Jan 1) the prep note is appended.
export function getShiftTimeReminder(date, rules = CONFIG.shiftRules) {
  const dow = date.getDay()
  const time = rules.shiftTimes[dow]
  let label = time ? `${DAY_NAMES[dow]} ${time}` : DAY_NAMES[dow]
  if (getDayCellClasses(date, rules).includes('first-sunday-krg')) {
    label += `. ${rules.krgNote}`
  }
  return label
}
