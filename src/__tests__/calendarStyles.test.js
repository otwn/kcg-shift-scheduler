import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8')

describe('calendar grid styling', () => {
  it('uses darker and slightly thicker day boundary lines', () => {
    expect(css).toContain('--fc-border-color: #94a3b8;')
    expect(css).toContain('.fc .fc-scrollgrid,')
    expect(css).toContain('border-width: 2px;')
  })
})
