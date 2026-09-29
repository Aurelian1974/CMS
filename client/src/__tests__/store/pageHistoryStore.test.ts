import { describe, it, expect } from 'vitest'
import { getLabelForPath } from '@/store/pageHistoryStore'

describe('getLabelForPath', () => {
  it('should not show the raw id for an appointment detail before it loads', () => {
    expect(getLabelForPath('/appointments/c2fafb02-eb35-4b30-aa37-6a29b4b77198')).toBe('Programare')
  })

  it('should keep the scheduler label', () => {
    expect(getLabelForPath('/appointments/scheduler')).toBe('Scheduler')
  })
})
