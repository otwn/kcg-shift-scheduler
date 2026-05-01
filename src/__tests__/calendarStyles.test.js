import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8')

describe('calendar grid styling', () => {
  it('emphasizes boundaries only for available dates', () => {
    expect(css).toContain('--fc-border-color: #e2e8f0;')
    expect(css).toContain('.fc .fc-daygrid-day:not(.no-shift-day)')
    expect(css).toContain('box-shadow: inset 0 0 0 2px #94a3b8;')
    expect(css).not.toContain('.fc .fc-scrollgrid,\n.fc .fc-scrollgrid table')
  })
})
