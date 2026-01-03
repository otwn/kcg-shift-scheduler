import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Icons } from '../components/Icons'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e', '#3b82f6']

export default function ContactsPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', color: '#6366f1' })

  const fetchMembers = async () => {
    const { data } = await supabase.from('members').select('*').order('name')
    if (data) setMembers(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchMembers()
  }, [])

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

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will remove all their shifts too.')) return

    try {
      await supabase.from('members').delete().eq('id', id)
      fetchMembers()
    } catch (error) {
      console.error('Error deleting member:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Team Members</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-all"
        >
          <Icons.Plus />
          Add Member
        </button>
      </div>

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
                  onClick={() => handleDelete(member.id)}
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

      {members.length === 0 && (
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
    </div>
  )
}
