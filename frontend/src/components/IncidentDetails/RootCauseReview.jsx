
function Section({ eyebrow, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-700">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-indigo-600 dark:text-indigo-400">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export default function RootCauseReview({
  review,
  proposedRootCause,
  reviewerFeedback,
  setReviewerFeedback,
  onRequestRework,
  onApprove,
  submittingReview,
  reviewError,
}) {
  const approved = Boolean(
    review?.approved || review?.status === 'approved'
  );

  return (
    <Section
      eyebrow="03 · Human verification"
      title="Root-cause review"
      description="Evaluate the AI hypothesis, request further analysis, or approve the proposed explanation."
    >
      {/* Read-only AI hypothesis */}
      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/70 dark:bg-indigo-950/20">
        <div className="flex items-center gap-3 border-b border-indigo-100/80 px-4 py-3.5 sm:px-5 dark:border-indigo-900/70">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 15l1.1 2.1L22 18l-1.9.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
            </svg>
          </span>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Proposed root cause
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              AI-generated hypothesis
            </p>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-300">
            {proposedRootCause?.trim() ||
              'No root-cause hypothesis is available yet.'}
          </p>

          <div className="mt-4 flex items-start gap-2 border-t border-indigo-100/80 pt-3 dark:border-indigo-900/70">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 11v5m0-8h.01" />
            </svg>

            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Treat this as a hypothesis until logs, deployment history,
              or other investigation evidence supports the conclusion.
            </p>
          </div>
        </div>
      </div>

      {/* Reviewer feedback */}
      {!approved && (
        <>
          <div className="mt-6">
            <label
              htmlFor="reviewer-feedback"
              className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Reviewer feedback
            </label>

            <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Guide the next AI analysis by identifying missing evidence
              or the checks that should be prioritized.
            </p>

            <textarea
              id="reviewer-feedback"
              value={reviewerFeedback}
              onChange={(event) =>
                setReviewerFeedback(event.target.value)
              }
              rows={4}
              maxLength={4000}
              disabled={submittingReview}
              placeholder="Describe what needs further investigation..."
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:disabled:bg-slate-800"
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Keep feedback specific and evidence-focused.
              </p>
              <p className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">
                {reviewerFeedback.length}/4000
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
            <button
              type="button"
              onClick={onRequestRework}
              disabled={
                submittingReview || !reviewerFeedback.trim()
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:focus:ring-slate-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7v5h-5M4 17v-5h5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9A7 7 0 0117 5l3 2M4 17l3 2a7 7 0 0011.5-4" />
              </svg>

              {submittingReview ? 'Processing...' : 'Request rework'}
            </button>

            <button
              type="button"
              onClick={onApprove}
              disabled={
                submittingReview || !proposedRootCause?.trim()
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7" />
              </svg>

              {submittingReview ? 'Processing...' : 'Approve root cause'}
            </button>
          </div>
        </>
      )}

      {approved && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/30">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>

          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
              Root cause approved
            </p>
            <p className="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-400">
              This explanation has been approved for the current demo
              session.
            </p>
          </div>
        </div>
      )}

      {reviewError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {reviewError}
        </div>
      )}
    </Section>
  );
}
