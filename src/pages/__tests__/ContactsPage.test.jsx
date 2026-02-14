import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Separate mock chains for active_members vs members (removed)
const mockActiveOrder = vi.fn()
const mockRemovedOrder = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockInsert = vi.fn()
const mockShiftGte = vi.fn()

vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'active_members') {
        return {
          select: vi.fn().mockReturnValue({
            order: mockActiveOrder,
          }),
        }
      }
      if (table === 'members') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn(), // unused in this path
            not: vi.fn().mockReturnValue({
              order: mockRemovedOrder,
            }),
          }),
          update: mockUpdate.mockReturnValue({
            eq: mockEq,
          }),
        }
      }
      if (table === 'shifts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: mockShiftGte,
            }),
          }),
        }
      }
      if (table === 'history') {
        return {
          insert: mockInsert,
        }
      }
      return { select: vi.fn() }
    }),
  },
}))

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
    mockActiveOrder.mockResolvedValue({ data: MOCK_MEMBERS })
    mockRemovedOrder.mockResolvedValue({ data: [] })
  })

  it('renders active members by default', async () => {
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })
  })

  it('soft delete sets deleted_at (not hard delete)', async () => {
    mockShiftGte.mockResolvedValue({ data: [], count: 0 })
    mockEq.mockResolvedValue({ data: null })
    mockInsert.mockResolvedValue({ data: null })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByLabelText(/remove/i)
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Remove Alice\?/)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Remove$/i }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it('shows confirmation modal with shift count', async () => {
    mockShiftGte.mockResolvedValue({ data: [{ id: 's1' }, { id: 's2' }], count: 2 })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByLabelText(/remove/i)
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/2 upcoming shift/)).toBeInTheDocument()
    })
  })

  it('toast appears after delete with undo button', async () => {
    mockShiftGte.mockResolvedValue({ data: [], count: 0 })
    mockEq.mockResolvedValue({ data: null })
    mockInsert.mockResolvedValue({ data: null })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByLabelText(/remove/i)
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Remove Alice\?/)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Remove$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Alice removed from team/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    })
  })

  it('undo restores member (clears deleted_at)', async () => {
    mockShiftGte.mockResolvedValue({ data: [], count: 0 })
    mockEq.mockResolvedValue({ data: null })
    mockInsert.mockResolvedValue({ data: null })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByLabelText(/remove/i)
    await user.click(deleteButtons[0])
    await waitFor(() => {
      expect(screen.getByText(/Remove Alice\?/)).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /^Remove$/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /undo/i }))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledTimes(2)
    })
  })

  it('tab switch shows removed members', async () => {
    mockRemovedOrder.mockResolvedValue({ data: MOCK_REMOVED })

    const user = userEvent.setup()
    render(<ContactsPage />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    const removedTab = screen.getByRole('button', { name: /removed/i })
    await user.click(removedTab)

    await waitFor(() => {
      expect(screen.getByText('Carol')).toBeInTheDocument()
    })
  })
})
