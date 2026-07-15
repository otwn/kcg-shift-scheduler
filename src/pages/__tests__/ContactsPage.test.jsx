import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockActiveEq = vi.fn()
const mockActiveOrder = vi.fn()
const mockRemovedNot = vi.fn()
const mockRemovedEq = vi.fn()
const mockRemovedOrder = vi.fn()
const mockMemberUpdate = vi.fn()
const mockMemberUpdateIdEq = vi.fn()
const mockMemberUpdateRegionEq = vi.fn()
const mockMemberInsert = vi.fn()
const mockShiftMemberEq = vi.fn()
const mockShiftRegionEq = vi.fn()
const mockShiftGte = vi.fn()
const mockHistoryInsert = vi.fn()

vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'active_members') {
        return {
          select: vi.fn().mockReturnValue({ eq: mockActiveEq }),
        }
      }
      if (table === 'members') {
        return {
          select: vi.fn().mockReturnValue({ not: mockRemovedNot }),
          update: mockMemberUpdate,
          insert: mockMemberInsert,
        }
      }
      if (table === 'shifts') {
        return {
          select: vi.fn().mockReturnValue({ eq: mockShiftMemberEq }),
        }
      }
      if (table === 'history') {
        return { insert: mockHistoryInsert }
      }
      return { select: vi.fn() }
    }),
  },
}))

vi.mock('../../contexts/RegionContext', () => ({
  useRegion: vi.fn(),
}))

import { supabase } from '../../supabase'
import { useRegion } from '../../contexts/RegionContext'
import ContactsPage from '../ContactsPage'

const MOCK_MEMBERS = [
  { id: '1', name: 'Alice', email: 'alice@test.com', phone: '555-0101', color: '#6366f1' },
  { id: '2', name: 'Bob', email: 'bob@test.com', phone: '555-0102', color: '#ec4899' },
]

const MOCK_REMOVED = [
  { id: '3', name: 'Carol', email: 'carol@test.com', phone: '555-0103', color: '#14b8a6', deleted_at: '2026-01-01T00:00:00Z' },
]

describe('ContactsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRegion.mockReturnValue({ regionName: 'central_texas', isLoading: false })
    mockActiveEq.mockReturnValue({ order: mockActiveOrder })
    mockActiveOrder.mockResolvedValue({ data: MOCK_MEMBERS })
    mockRemovedNot.mockReturnValue({ eq: mockRemovedEq })
    mockRemovedEq.mockReturnValue({ order: mockRemovedOrder })
    mockRemovedOrder.mockResolvedValue({ data: [] })
    mockMemberUpdate.mockReturnValue({ eq: mockMemberUpdateIdEq })
    mockMemberUpdateIdEq.mockReturnValue({ eq: mockMemberUpdateRegionEq })
    mockMemberUpdateRegionEq.mockResolvedValue({ data: null })
    mockMemberInsert.mockResolvedValue({ data: null })
    mockShiftMemberEq.mockReturnValue({ eq: mockShiftRegionEq })
    mockShiftRegionEq.mockReturnValue({ gte: mockShiftGte })
    mockShiftGte.mockResolvedValue({ data: [], count: 0 })
    mockHistoryInsert.mockResolvedValue({ data: null })
  })

  it('renders active members from the selected region by default', async () => {
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(mockActiveEq).toHaveBeenCalledWith('region_name', 'central_texas')
      expect(mockRemovedEq).toHaveBeenCalledWith('region_name', 'central_texas')
    })
  })

  it('does not load member data until a region is selected', async () => {
    useRegion.mockReturnValue({ regionName: null, isLoading: false })

    render(<ContactsPage />)

    await waitFor(() => {
      expect(supabase.from).not.toHaveBeenCalled()
    })
  })

  it('soft deletes members within the selected region and records regional history', async () => {
    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    await user.click(screen.getAllByLabelText(/remove/i)[0])

    await waitFor(() => {
      expect(screen.getByText(/Remove Alice\?/)).toBeInTheDocument()
      expect(mockShiftMemberEq).toHaveBeenCalledWith('member_id', '1')
      expect(mockShiftRegionEq).toHaveBeenCalledWith('region_name', 'central_texas')
    })

    await user.click(screen.getByRole('button', { name: /^Remove$/i }))

    await waitFor(() => {
      expect(mockMemberUpdateIdEq).toHaveBeenCalledWith('id', '1')
      expect(mockMemberUpdateRegionEq).toHaveBeenCalledWith('region_name', 'central_texas')
      expect(mockHistoryInsert).toHaveBeenCalledWith(expect.objectContaining({ region_name: 'central_texas' }))
    })
  })

  it('adds a new member to the selected region', async () => {
    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Add Member$/i }))
    await user.type(screen.getByPlaceholderText('John Doe'), 'Dana')
    await user.click(screen.getAllByRole('button', { name: /^Add Member$/i })[1])

    await waitFor(() => {
      expect(mockMemberInsert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Dana',
        region_name: 'central_texas',
      }))
    })
  })

  it('tab switch shows removed members from the selected region', async () => {
    mockRemovedOrder.mockResolvedValue({ data: MOCK_REMOVED })
    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /removed/i }))

    await waitFor(() => {
      expect(screen.getByText('Carol')).toBeInTheDocument()
    })
  })
})
