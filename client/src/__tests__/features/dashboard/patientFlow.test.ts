/**
 * Stadiile fluxului și tipurile de „necesită atenție” sunt string-uri pe ambele părți;
 * testul citește constantele C# și le compară cu cele din client.
 */
import { describe, it, expect } from 'vitest'
import stagesSource from '../../../../../src/ValyanClinic.Application/Common/Constants/DashboardFlowStages.cs?raw'
import attentionSource from '../../../../../src/ValyanClinic.Application/Common/Constants/DashboardAttentionTypes.cs?raw'
import { ATTENTION_TYPES, FLOW_STAGE_ORDER, FLOW_STAGES } from '@/features/dashboard/components/widgets/patientFlow'

const constantsOf = (source: string) =>
  [...source.matchAll(/const string \w+\s*=\s*"([^"]+)"/g)].map((m) => m[1]).sort()

describe('patientFlow constants', () => {
  it('should mirror DashboardFlowStages.cs', () => {
    expect(Object.values(FLOW_STAGES).sort()).toEqual(constantsOf(stagesSource))
  })

  it('should give every stage a place in the pipeline', () => {
    expect(FLOW_STAGE_ORDER.map((s) => s.stage).sort()).toEqual(Object.values(FLOW_STAGES).sort())
  })

  it('should mirror DashboardAttentionTypes.cs', () => {
    expect(Object.values(ATTENTION_TYPES).sort()).toEqual(constantsOf(attentionSource))
  })
})
