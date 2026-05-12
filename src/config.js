export const CONFIG = {
  // Your Google Calendar embed URL (public calendar)
  googleCalendarUrl: '',

  // App name shown in header
  appName: 'KCG Shift Scheduler',

  // Shift / calendar grey-out rules. Days-of-week use 0=Sun … 6=Sat.
  // Weeks are Sunday-start (week 1 = day-of-month 1–7, week 2 = 8–14, …).
  shiftRules: {
    // Weekdays that have shifts. All other weekdays are greyed out.
    shiftWeekdays: [0, 3, 6],          // Sun, Wed, Sat

    // District meeting week (Sun-Sat). The Sunday is always greyed out.
    // The same-week Saturday is greyed out only from districtSaturdayStart
    // onward (YYYY-MM) so historical months keep their original behavior.
    districtMeetingWeekOfMonth: 3,
    districtSaturdayStart: '2026-05',

    // Sunday in this week-of-month (non-January) is the KRG day — needs
    // extra staff. January 1st always substitutes as January's KRG day.
    krgSundayWeekOfMonth: 1,

    // Year-end holiday block: from this day of December through Dec 31.
    yearEndBlockStartDay: 24,
  },
}
