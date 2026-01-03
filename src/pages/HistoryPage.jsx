import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase } from '../supabase'
import { Icons } from '../components/Icons'
import LoadingSpinner from '../components/LoadingSpinner'

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setHistory(data)
      setLoading(false)
    }

    fetchHistory()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">History</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {history.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {history.map(item => (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.action === 'assigned' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-slate-800">
                        <span className="font-medium">{item.member_name}</span>
                        {' '}
                        <span className={item.action === 'assigned' ? 'text-green-600' : 'text-red-600'}>
                          {item.action}
                        </span>
                        {' '}
                        shift for{' '}
                        <span className="font-medium">
                          {format(parseISO(item.shift_date), 'MMM d, yyyy')}
                        </span>
                      </p>
                      {item.reason && (
                        <p className="text-sm text-slate-500 mt-1">
                          Reason: {item.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {format(parseISO(item.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Icons.History />
            <p className="text-slate-500 mt-2">No history yet. Assign or cancel shifts to see activity here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
