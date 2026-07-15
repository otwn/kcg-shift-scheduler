import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8').replace(/\r\n/g, '\n')

describe('calendar grid styling', () => {
  it('uses a desktop-visible tint for available dates and stronger emphasis for the first Sunday', () => {
    // Available (shift) days: a soft amber that stays visible on desktop monitors
    expect(css).toContain(
      '.fc .fc-daygrid-day:not(.no-shift-day) {\n  background-color: #fef3c7;\n}'
    )
    expect(css).toContain(
      '.fc .fc-daygrid-day:not(.no-shift-day):hover {\n  background-color: #fde68a;\n}'
    )
    // First Sunday (KRG) stays a step above the normal available tint
    expect(css).toContain(
      '.fc .fc-daygrid-day.first-sunday-krg {\n  background-color: #fde68a;\n}'
    )
    expect(css).toContain(
      '.fc .fc-daygrid-day.first-sunday-krg:hover {\n  background-color: #fcd34d;\n}'
    )
    expect(css).not.toContain('box-shadow: inset 0 0 0 2px #94a3b8;')
  })
})
