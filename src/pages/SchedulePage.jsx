import { useState, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { format, parseISO } from 'date-fns'
import { supabase } from '../supabase'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'

export default function SchedulePage() {
  const [members, setMembers] = useState([])
  const [shifts, setShifts] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [existingShift, setExistingShift] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, shiftsRes] = await Promise.all([
        supabase.from('members').select('*').order('name'),
        supabase.from('shifts').select('*, members(*)'),
      ])

      if (membersRes.data) setMembers(membersRes.data)
      if (shiftsRes.data) setShifts(shiftsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    const shiftsSubscription = supabase
      .channel('shifts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, fetchData)
      .subscribe()

    return () => {
      shiftsSubscription.unsubscribe()
    }
  }, [fetchData])

  const events = shifts.map(shift => ({
    id: shift.id,
    title: shift.members?.name || 'Unknown',
    date: shift.shift_date,
    backgroundColor: shift.members?.color || '#6366f1',
    borderColor: shift.members?.color || '#6366f1',
    extendedProps: { shift },
  }))

  const handleDateClick = (info) => {
    const dateStr = info.dateStr
    const existing = shifts.find(s => s.shift_date === dateStr)

    setSelectedDate(dateStr)
    setExistingShift(existing || null)
    setSelectedMember(existing?.member_id || '')
    setCancelReason('')
    setIsModalOpen(true)
  }

  const handleAssign = async () => {
    if (!selectedMember || !selectedDate) return

    try {
      if (existingShift) {
        await supabase.from('shifts').delete().eq('id', existingShift.id)
      }

      await supabase.from('shifts').insert({
        member_id: selectedMember,
        shift_date: selectedDate,
      })

      const member = members.find(m => m.id === selectedMember)
      await supabase.from('history').insert({
        member_id: selectedMember,
        member_name: member?.name || 'Unknown',
        shift_date: selectedDate,
        action: 'assigned',
      })

      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error assigning shift:', error)
    }
  }

  const handleCancel = async () => {
    if (!existingShift) return

    try {
      await supabase.from('shifts').delete().eq('id', existingShift.id)

      await supabase.from('history').insert({
        member_id: existingShift.member_id,
        member_name: existingShift.members?.name || 'Unknown',
        shift_date: selectedDate,
        action: 'cancelled',
        reason: cancelReason || null,
      })

      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error cancelling shift:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-wrap gap-4">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: member.color }}
              />
              <span className="text-sm text-slate-600">{member.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          eventClick={(info) => handleDateClick({ dateStr: info.event.startStr })}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek',
          }}
          height="auto"
          dayMaxEvents={3}
        />
      </div>

      {/* Assign/Cancel Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDate ? format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy') : 'Select Date'}
      >
        <div className="space-y-4">
          {existingShift && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-500 mb-1">Currently assigned</p>
              <p className="font-medium text-slate-800 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: existingShift.members?.color }}
                />
                {existingShift.members?.name}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {existingShift ? 'Reassign to' : 'Assign to'}
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">Select a person...</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssign}
            disabled={!selectedMember}
            className="w-full py-3 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {existingShift ? 'Reassign Shift' : 'Assign Shift'}
          </button>

          {existingShift && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">or</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cancel reason (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Sick leave, schedule conflict..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                  rows={2}
                />
              </div>

              <button
                onClick={handleCancel}
                className="w-full py-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-all"
              >
                Cancel Shift
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
