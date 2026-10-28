
function CriticReview({ review }) {
    const verdict = review?.critic_verdict;
    const reasoning = review?.critic_reasoning;
  
    const styles = {
      PASS: {
        label: 'PASS',
        className:
          'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
      },
      NEEDS_MORE_EVIDENCE: {
        label: 'Needs more evidence',
        className:
          'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
      },
      FAIL: {
        label: 'FAIL',
        className:
          'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
      },
    };
  
    const result = styles[verdict] || null;
  
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-700">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-indigo-600 dark:text-indigo-400">
            03 · Validation
          </p>
  
          <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            AI Critic Review
          </h2>
  
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            An independent check of the proposed root-cause hypothesis.
          </p>
        </div>
  
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Verdict
            </span>
  
            {result ? (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${result.className}`}
              >
                {result.label}
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Not available
              </span>
            )}
          </div>
  
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Critic reasoning
            </h3>
  
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
              {reasoning ||
                'No critic reasoning is available yet. Run or re-run the AI analysis to generate a review.'}
            </p>
          </div>
  
          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            This review evaluates the available information; it does not confirm
            the actual root cause without supporting evidence.
          </p>
        </div>
      </section>
    );
  }
  
  export default CriticReview;
  