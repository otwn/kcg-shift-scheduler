import { NavLink } from 'react-router-dom'
import { Icons } from './Icons'
import { CONFIG } from '../config'

export default function Navigation() {
  const navItems = [
    { to: '/', icon: Icons.Calendar, label: 'Schedule' },
    { to: '/contacts', icon: Icons.Users, label: 'Contacts' },
    { to: '/history', icon: Icons.History, label: 'History' },
  ]

  if (CONFIG.googleCalendarUrl) {
    navItems.push({ to: '/google-calendar', icon: Icons.Google, label: 'Events' })
  }

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
              <Icons.Calendar />
            </div>
            <span className="font-semibold text-slate-800 text-lg">{CONFIG.appName}</span>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`
                }
              >
                <Icon />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
