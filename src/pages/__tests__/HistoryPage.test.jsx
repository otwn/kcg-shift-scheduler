import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockHistoryEq = vi.fn()
const mockHistoryOrder = vi.fn()
const mockHistoryLimit = vi.fn()

vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'history') {
        return {
          select: vi.fn().mockReturnValue({ eq: mockHistoryEq }),
        }
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
import HistoryPage from '../HistoryPage'

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRegion.mockReturnValue({ regionName: 'central_texas', isLoading: false })
    mockHistoryEq.mockReturnValue({ order: mockHistoryOrder })
    mockHistoryOrder.mockReturnValue({ limit: mockHistoryLimit })
    mockHistoryLimit.mockResolvedValue({
      data: [{
        id: 'h1',
        member_name: 'Alice',
        action: 'assigned',
        shift_date: '2026-07-12',
        created_at: '2026-07-12T12:00:00Z',
      }],
    })
  })

  it('loads history for the selected region only', async () => {
    render(<HistoryPage />)

    await waitFor(() => {
      expect(mockHistoryEq).toHaveBeenCalledWith('region_name', 'central_texas')
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
  })

  it('does not fetch history until a region is selected', async () => {
    useRegion.mockReturnValue({ regionName: null, isLoading: false })

    render(<HistoryPage />)

    await waitFor(() => {
      expect(supabase.from).not.toHaveBeenCalled()
    })
  })
})
