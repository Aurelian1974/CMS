import { useEffect, useMemo } from 'react'
import type { QuestionnaireSchema } from '@/features/consultations/investigations/config/investigationSchemas'
import styles from './QuestionnaireRenderer.module.scss'

interface Props {
  schema: QuestionnaireSchema
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  disabled?: boolean
}

export const QuestionnaireRenderer = ({ schema, value, onChange, disabled }: Props) => {
  const answers = useMemo(() => {
    const out: Record<string, number | undefined> = {}
    for (const q of schema.questions) {
      const v = value[q.key]
      out[q.key] = typeof v === 'number' ? v : v == null ? undefined : Number(v)
    }
    return out
  }, [schema, value])

  const { totalScore, interpretation } = useMemo(() => schema.scoring(answers), [schema, answers])

  // Auto-update totalScore + severity în obiectul valoare.
  useEffect(() => {
    const sevKey = 'totalScore' in value && 'severity' in value
      ? 'severity'
      : 'totalScore' in value && 'riskLevel' in value
        ? 'riskLevel'
        : 'totalScore' in value && 'impactLevel' in value
          ? 'impactLevel'
          : 'severity'
    if (value.totalScore !== totalScore || value[sevKey] !== interpretation) {
      onChange({ ...value, totalScore, [sevKey]: interpretation })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalScore, interpretation])

  const setAnswer = (qKey: string, val: number) => {
    onChange({ ...value, [qKey]: val })
  }

  return (
    <div className={styles.questionnaire}>
      {schema.questions.map((q, idx) => (
        <div key={q.key} className={styles.question}>
          <div className={styles.qText}>{idx + 1}. {q.text}</div>
          <div className={styles.options}>
            {q.options.map((opt) => (
              <label key={opt.value}>
                <input
                  type="radio"
                  name={`${schema.typeCode}-${q.key}`}
                  checked={answers[q.key] === opt.value}
                  onChange={() => setAnswer(q.key, opt.value)}
                  disabled={disabled}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className={styles.score}>
        Scor total: <strong>{totalScore}</strong> — {interpretation}
      </div>
    </div>
  )
}
