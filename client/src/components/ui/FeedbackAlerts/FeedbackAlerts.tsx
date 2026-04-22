interface FeedbackAlertsProps {
  successMsg: string | null
  errorMsg?: string | null
  onDismissSuccess: () => void
  onDismissError?: () => void
  /** Clasă CSS adăugată pe fiecare alert; default 'mt-3' pentru success, 'mb-0' pentru error */
  successClass?: string
  errorClass?: string
}

/**
 * Afișează alertele de feedback (succes/eroare) — pattern Bootstrap alert-dismissible.
 * Înlocuiește blocuri identice din toate paginile cu operații CRUD.
 */
export const FeedbackAlerts = ({
  successMsg,
  errorMsg,
  onDismissSuccess,
  onDismissError,
  successClass = 'mt-3',
  errorClass = 'mb-0',
}: FeedbackAlertsProps) => (
  <>
    {successMsg && (
      <div className={`alert alert-success alert-dismissible fade show ${successClass}`} role="alert">
        {successMsg}
        <button type="button" className="btn-close" onClick={onDismissSuccess} />
      </div>
    )}
    {errorMsg && (
      <div className={`alert alert-danger alert-dismissible fade show ${errorClass}`} role="alert">
        {errorMsg}
        <button type="button" className="btn-close" onClick={onDismissError} />
      </div>
    )}
  </>
)
