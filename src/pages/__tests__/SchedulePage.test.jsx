import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockMembersEq,
  mockMembersOrder,
  mockShiftsSelect,
  mockShiftsEq,
  mockChannelOn,
  mockSubscribe,
  mockUnsubscribe,
} = vi.hoisted(() => ({
  mockMembersEq: vi.fn(),
  mockMembersOrder: vi.fn(),
  mockShiftsSelect: vi.fn(),
  mockShiftsEq: vi.fn(),
  mockChannelOn: vi.fn(),
  mockSubscribe: vi.fn(),
  mockUnsubscribe: vi.fn(),
}))

vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'active_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: mockMembersEq,
          }),
        }
      }
      if (table === 'members') {
        return { select: vi.fn() }
      }
      if (table === 'shifts') {
        return {
          select: mockShiftsSelect,
        }
      }
      return { select: vi.fn() }
    }),
    channel: vi.fn().mockReturnValue({
      on: mockChannelOn,
    }),
  },
}))

vi.mock('../../contexts/RegionContext', () => ({
  useRegion: vi.fn(),
}))

import { supabase } from '../../supabase'
import { useRegion } from '../../contexts/RegionContext'

const MOCK_ACTIVE_MEMBERS = [
  { id: '1', name: 'Alice', color: '#6366f1' },
  { id: '2', name: 'Bob', color: '#ec4899' },
]

describe('SchedulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRegion.mockReturnValue({ regionName: 'central_texas', isLoading: false })
    mockMembersEq.mockReturnValue({ order: mockMembersOrder })
    mockMembersOrder.mockResolvedValue({ data: MOCK_ACTIVE_MEMBERS })
    mockShiftsSelect.mockReturnValue({ eq: mockShiftsEq })
    mockShiftsEq.mockResolvedValue({ data: [] })
    mockSubscribe.mockReturnValue({ unsubscribe: mockUnsubscribe })
    mockChannelOn.mockReturnValue({ subscribe: mockSubscribe })
  })

  it('queries active members and shifts for the selected region', async () => {
    const { default: SchedulePage } = await import('../SchedulePage')
    const { render, waitFor } = await import('@testing-library/react')
    const { MemoryRouter } = await import('react-router-dom')

    render(
      <MemoryRouter>
        <SchedulePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockMembersEq).toHaveBeenCalledWith('region_name', 'central_texas')
      expect(mockShiftsSelect).toHaveBeenCalledWith(
        '*, members!shifts_member_id_region_name_fkey(*)'
      )
      expect(mockShiftsEq).toHaveBeenCalledWith('region_name', 'central_texas')
    })
  })

  it('does not query members directly for the calendar member list', async () => {
    const { default: SchedulePage } = await import('../SchedulePage')
    const { render, waitFor } = await import('@testing-library/react')
    const { MemoryRouter } = await import('react-router-dom')

    render(
      <MemoryRouter>
        <SchedulePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockMembersEq).toHaveBeenCalled()
    })

    const membersCalls = supabase.from.mock.calls.filter(([table]) => table === 'members')
    expect(membersCalls).toHaveLength(0)
  })

  it('does not load data until a region is selected', async () => {
    useRegion.mockReturnValue({ regionName: null, isLoading: false })
    const { default: SchedulePage } = await import('../SchedulePage')
    const { render, waitFor } = await import('@testing-library/react')
    const { MemoryRouter } = await import('react-router-dom')

    render(
      <MemoryRouter>
        <SchedulePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(supabase.from).not.toHaveBeenCalled()
      expect(supabase.channel).not.toHaveBeenCalled()
    })
  })

  it('filters realtime shift updates by the selected region', async () => {
    const { default: SchedulePage } = await import('../SchedulePage')
    const { render, waitFor } = await import('@testing-library/react')
    const { MemoryRouter } = await import('react-router-dom')

    render(
      <MemoryRouter>
        <SchedulePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(mockChannelOn).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ filter: 'region_name=eq.central_texas' }),
        expect.any(Function)
      )
    })
  })
})
