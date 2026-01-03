import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { isSupabaseConfigured } from './supabase'
import Navigation from './components/Navigation'
import ConfigError from './components/ConfigError'
import SchedulePage from './pages/SchedulePage'
import ContactsPage from './pages/ContactsPage'
import HistoryPage from './pages/HistoryPage'
import GoogleCalendarPage from './pages/GoogleCalendarPage'

export default function App() {
  if (!isSupabaseConfigured) {
    return <ConfigError />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<SchedulePage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/google-calendar" element={<GoogleCalendarPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
