/* eslint-disable react-refresh/only-export-components */
import { Component, type ReactNode, type ErrorInfo } from 'react'
import styles from './ErrorBoundary.module.scss'

interface Props {
  children: ReactNode
  /** 'page'    — ocupă tot spațiul disponibil (wrap la nivel de rută/layout)
   *  'section' — inline compact (wrap pe grid, formular, sidebar) */
  variant?: 'page' | 'section'
  /** Etichetă afișată în mesajul de eroare, ex: "grilă", "formular", "sidebar" */
  label?: string
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
}

const IconAlert = () => (
  <svg
    width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconRefresh = () => (
  <svg
    width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const label = this.props.label ? `[${this.props.label}]` : ''
    console.error(`[ErrorBoundary]${label}`, error, info.componentStack)
    this.props.onError?.(error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const { variant = 'page', label } = this.props
    const sectionName = label ? `secțiunea „${label}"` : 'această secțiune'

    if (variant === 'section') {
      return (
        <div className={styles.section} role="alert">
          <span className={styles.sectionIcon}><IconAlert /></span>
          <span className={styles.sectionText}>
            {`A apărut o eroare în ${sectionName}.`}
          </span>
          <button className={styles.retryBtn} onClick={this.reset} type="button">
            <IconRefresh /> Reîncearcă
          </button>
        </div>
      )
    }

    return (
      <div className={styles.page} role="alert">
        <div className={styles.pageCard}>
          <span className={styles.pageIcon}><IconAlert /></span>
          <h2 className={styles.pageTitle}>
            {label ? `Eroare în ${label}` : 'A apărut o eroare'}
          </h2>
          <p className={styles.pageDesc}>
            {`A apărut o problemă neașteptată în ${sectionName}. Restul aplicației funcționează normal.`}
          </p>
          <button className={styles.pageBtn} onClick={this.reset} type="button">
            <IconRefresh /> Reîncearcă
          </button>
        </div>
      </div>
    )
  }
}
