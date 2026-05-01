import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8')

describe('calendar grid styling', () => {
  it('uses a softer background for available dates and preserves first Sunday emphasis', () => {
    expect(css).toContain('.fc .fc-daygrid-day:not(.no-shift-day)')
    expect(css).toContain('background-color: #fffbeb;')
    expect(css).toContain('.fc .fc-daygrid-day:not(.no-shift-day):hover')
    expect(css).toContain('background-color: #fef3c7;')
    expect(css).toContain('.fc .fc-daygrid-day.first-sunday-krg')
    expect(css).toContain('.fc .fc-daygrid-day.first-sunday-krg:hover')
    expect(css).not.toContain('box-shadow: inset 0 0 0 2px #94a3b8;')
  })
})
