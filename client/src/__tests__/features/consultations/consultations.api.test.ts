/**
 * consultationsApi — ordinea scrierilor pe agregat.
 * Sub-secțiunile (anamneză, examen) se scriu înaintea header-ului, secvențial:
 * scrierile paralele produceau erori nedeterministe la finalizare.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const calls: string[] = []
let release: (() => void) | null = null

vi.mock('@/api/axiosInstance', () => ({
  default: {
    put: vi.fn((url: string) => {
      calls.push(`start PUT ${url}`)
      return new Promise(resolve => {
        // Primul PUT rămâne în așteptare până îl eliberează testul
        const done = () => { calls.push(`end PUT ${url}`); resolve({ success: true, data: true }) }
        if (!release) release = done
        else done()
      })
    }),
    post: vi.fn((url: string) => {
      calls.push(`POST ${url}`)
      return Promise.resolve({ success: true, data: url.endsWith('/finalize') ? true : 'new-id' })
    }),
    get: vi.fn(),
    delete: vi.fn(),
  },
}))

import { consultationsApi } from '@/api/endpoints/consultations.api'

describe('consultationsApi', () => {
  beforeEach(() => {
    calls.length = 0
    release = null
  })

  it('update() scrie anamneza și examenul înaintea header-ului, fără suprapunere', async () => {
    const pending = consultationsApi.update({
      id: 'c1', patientId: 'p', doctorId: 'd', date: '2026-01-01',
      motiv: 'Tuse', puls: 72, recomandari: 'Repaus',
    })

    await vi.waitFor(() => expect(calls).toEqual(['start PUT /api/v1/Consultations/c1/anamnesis']))
    release?.()
    await pending

    expect(calls).toEqual([
      'start PUT /api/v1/Consultations/c1/anamnesis',
      'end PUT /api/v1/Consultations/c1/anamnesis',
      'start PUT /api/v1/Consultations/c1/exam',
      'end PUT /api/v1/Consultations/c1/exam',
      'start PUT /api/v1/Consultations/c1',
      'end PUT /api/v1/Consultations/c1',
    ])
  })

  it('update() nu trimite câmpurile de anamneză/examen în header', async () => {
    const api = (await import('@/api/axiosInstance')).default
    release = () => {}
    await consultationsApi.update({ id: 'c1', patientId: 'p', doctorId: 'd', date: '2026-01-01', motiv: 'Tuse', puls: 72 })

    const headerCall = vi.mocked(api.put).mock.calls.find(([url]) => url === '/api/v1/Consultations/c1')
    expect(headerCall?.[1]).not.toHaveProperty('motiv')
    expect(headerCall?.[1]).not.toHaveProperty('puls')
  })

  it('finalize() apelează endpoint-ul dedicat', async () => {
    await consultationsApi.finalize('c1')
    expect(calls).toEqual(['POST /api/v1/Consultations/c1/finalize'])
  })
})
