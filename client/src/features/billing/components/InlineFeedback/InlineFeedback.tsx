interface InlineFeedbackProps {
  successMsg?: string | null
  errorMsg?: string | null
}

/**
 * Mesaje afișate în interiorul unui dialog. Alertele paginii (FeedbackAlerts) rămân sub
 * overlay-ul modalului, deci operațiile din dialog își raportează rezultatul aici.
 */
export const InlineFeedback = ({ successMsg, errorMsg }: InlineFeedbackProps) => (
  <>
    {errorMsg && <div className="alert alert-danger py-2 px-3 mb-0 small" role="alert">{errorMsg}</div>}
    {successMsg && <div className="alert alert-success py-2 px-3 mb-0 small" role="status">{successMsg}</div>}
  </>
)
