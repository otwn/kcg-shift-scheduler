import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Toast from '../Toast'

describe('Toast', () => {
  it('renders message text', () => {
    render(<Toast message="Member removed" onClose={() => {}} />)
    expect(screen.getByText('Member removed')).toBeInTheDocument()
  })

  it('calls onUndo when Undo button clicked', async () => {
    const onUndo = vi.fn()
    const user = userEvent.setup()

    render(<Toast message="Member removed" onUndo={onUndo} onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: /undo/i }))
    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when X button clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(<Toast message="Member removed" onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('hides Undo button when no onUndo prop', () => {
    render(<Toast message="Member removed" onClose={() => {}} />)
    expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument()
  })
})
