import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { Icons } from '../components/Icons'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e', '#3b82f6']

export default function ContactsPage() {
  const [members, setMembers] = useState([])
  const [removedMembers, setRemovedMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('active')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', color: '#6366f1' })

  // Confirmation modal state
  const [confirmMember, setConfirmMember] = useState(null)
  const [upcomingShiftCount, setUpcomingShiftCount] = useState(0)

  // Toast state
  const [toast, setToast] = useState(null)

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('active_members')
      .select('*')
      .order('name')

    if (data) setMembers(data)
    setLoading(false)
  }, [])

  const fetchRemovedMembers = useCallback(async () => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('name')

    if (data) setRemovedMembers(data)
  }, [])

  useEffect(() => {
    fetchMembers()
    fetchRemovedMembers()
  }, [fetchMembers, fetchRemovedMembers])

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingMember(member)
      setFormData({ name: member.name, email: member.email || '', phone: member.phone || '', color: member.color })
    } else {
      setEditingMember(null)
      setFormData({ name: '', email: '', phone: '', color: '#6366f1' })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return

    try {
      if (editingMember) {
        await supabase.from('members').update(formData).eq('id', editingMember.id)
      } else {
        await supabase.from('members').insert(formData)
      }
      setIsModalOpen(false)
      fetchMembers()
    } catch (error) {
      console.error('Error saving member:', error)
    }
  }

  const handleDeleteClick = async (member) => {
    // Fetch upcoming shift count for this member
    const today = new Date().toISOString().split('T')[0]
    const { data: upcomingShifts } = await supabase
      .from('shifts')
      .select('id')
      .eq('member_id', member.id)
      .gte('shift_date', today)

    setUpcomingShiftCount(upcomingShifts?.length || 0)
    setConfirmMember(member)
  }

  const handleConfirmDelete = async () => {
    if (!confirmMember) return

    try {
      await supabase
        .from('members')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', confirmMember.id)

      await supabase.from('history').insert({
        member_id: confirmMember.id,
        member_name: confirmMember.name,
        action: 'member_removed',
      })

      const removedMember = confirmMember
      setConfirmMember(null)
      fetchMembers()
      fetchRemovedMembers()

      setToast({
        message: `${removedMember.name} removed from team`,
        onUndo: () => handleRestore(removedMember),
      })
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const handleRestore = async (member) => {
    try {
      await supabase
        .from('members')
        .update({ deleted_at: null })
        .eq('id', member.id)

      await supabase.from('history').insert({
        member_id: member.id,
        member_name: member.name,
        action: 'member_restored',
      })

      setToast(null)
      fetchMembers()
      fetchRemovedMembers()
    } catch (error) {
      console.error('Error restoring member:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const displayedMembers = viewMode === 'active' ? members : removedMembers

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Team Members</h1>
        {viewMode === 'active' && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-all"
          >
            <Icons.Plus />
            Add Member
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setViewMode('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            viewMode === 'active'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => { setViewMode('removed'); fetchRemovedMembers() }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            viewMode === 'removed'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Removed {removedMembers.length > 0 && `(${removedMembers.length})`}
        </button>
      </div>

      {/* Active members grid */}
      {viewMode === 'active' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map(member => (
            <div
              key={member.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-slate-800">{member.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(member)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                  >
                    <Icons.Edit />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(member)}
                    aria-label={`Remove ${member.name}`}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-500"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {member.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Icons.Email />
                    <a href={`mailto:${member.email}`} className="hover:text-indigo-600">{member.email}</a>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Icons.Phone />
                    <a href={`tel:${member.phone}`} className="hover:text-indigo-600">{member.phone}</a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Removed members grid */}
      {viewMode === 'removed' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {removedMembers.map(member => (
            <div
              key={member.id}
              className="bg-slate-50 rounded-xl p-5 border border-slate-200 opacity-75"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold opacity-50"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-slate-500">{member.name}</h3>
                </div>
                <button
                  onClick={() => handleRestore(member)}
                  aria-label={`Restore ${member.name}`}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Icons.Undo />
                  Restore
                </button>
              </div>

              <div className="space-y-2 text-sm">
                {member.email && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Icons.Email />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Icons.Phone />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {removedMembers.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-500">No removed members.</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'active' && members.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Icons.Users />
          <p className="text-slate-500 mt-2">No team members yet. Add your first member to get started!</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'Edit Member' : 'Add Member'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="555-0123"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="w-full py-3 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {editingMember ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmMember !== null}
        onClose={() => setConfirmMember(null)}
        title="Confirm Removal"
      >
        {confirmMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <Icons.AlertTriangle />
              <span className="text-lg font-semibold">Remove {confirmMember.name}?</span>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              {upcomingShiftCount > 0 && (
                <p>{upcomingShiftCount} upcoming shift{upcomingShiftCount !== 1 ? 's' : ''} will remain on the calendar</p>
              )}
              <p>This member will no longer appear in the assignment dropdown</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmMember(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          onUndo={toast.onUndo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
