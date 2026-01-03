import { CONFIG } from '../config'
import { Icons } from '../components/Icons'

export default function GoogleCalendarPage() {
  if (!CONFIG.googleCalendarUrl) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <Icons.Google />
        <p className="text-slate-500 mt-2">Google Calendar not configured.</p>
        <p className="text-sm text-slate-400 mt-1">
          Set your Google Calendar URL in src/config.js
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Google Calendar Events</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden google-calendar-embed">
        <iframe
          src={CONFIG.googleCalendarUrl}
          style={{ border: 0 }}
          width="100%"
          height="600"
          frameBorder="0"
          scrolling="no"
          title="Google Calendar"
        />
      </div>

      <p className="text-sm text-slate-500 text-center">
        This calendar is read-only. Events are managed in Google Calendar.
      </p>
    </div>
  )
}
