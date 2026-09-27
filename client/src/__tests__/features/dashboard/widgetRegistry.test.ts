/**
 * Id-urile widget-urilor sunt string-uri pe ambele părți, deci compilatorul nu prinde o
 * desincronizare. Testul citește DashboardWidgetIds.cs și îl compară cu registry-ul.
 */
import { describe, it, expect } from 'vitest'
import csSource from '../../../../../src/ValyanClinic.Application/Features/Dashboard/Widgets/DashboardWidgetIds.cs?raw'
import { WIDGET_REGISTRY } from '@/features/dashboard/widgets/widgetRegistry'

const backendIds = [...csSource.matchAll(/const string \w+\s*=\s*"([^"]+)"/g)]
  .map((m) => m[1])
  .sort()

describe('widgetRegistry', () => {
  it('should parse the backend widget ids', () => {
    expect(backendIds.length).toBeGreaterThan(20)
  })

  it('should map exactly the widget ids declared by the backend', () => {
    expect(Object.keys(WIDGET_REGISTRY).sort()).toEqual(backendIds)
  })
})
