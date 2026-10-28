
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

function InfoCard({ label, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <div className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {children || 'Not available'}
      </div>
    </div>
  );
}

export default function AIAnalysis({
  displayedAnalysis,
  aiAnalysisStatus,
}) {
  const analysis = displayedAnalysis || {};

  // Support both array-based actions and AI responses returned as text.
  const rawActions = Array.isArray(analysis.recommended_actions)
    ? analysis.recommended_actions
    : Array.isArray(analysis.recommended_action)
      ? analysis.recommended_action
      : typeof analysis.recommended_action === 'string'
        ? [analysis.recommended_action]
        : [];

  // Split numbered steps even when the AI returns them in one paragraph.
  const actions = rawActions.flatMap((item) =>
    String(item)
      .split(/(?:^|\s+)(?=\d{1,2}[.)]\s)/)
      .map((step) => step.replace(/^\s*\d{1,2}[.)]\s*/, '').trim())
      .filter(Boolean)
  );

  const rawConfidence = analysis.confidence;
  const parsedConfidence =
    rawConfidence === '' || rawConfidence == null
      ? null
      : Number(rawConfidence);

  const confidence =
    parsedConfidence !== null && Number.isFinite(parsedConfidence)
      ? Math.max(0, Math.min(100, parsedConfidence))
      : null;

  const status =
    aiAnalysisStatus || analysis.ai_analysis_status || 'Completed';

  return (
    <Section
      eyebrow="02 · Intelligence"
      title="AI analysis"
      description="Classification, potential cause, and recommended next steps."
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          AI analysis status
        </span>

        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {status}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard label="Service">{analysis.service}</InfoCard>
        <InfoCard label="Category">{analysis.category}</InfoCard>
        <InfoCard label="Severity">{analysis.severity}</InfoCard>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Confidence score
          </h3>

          <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">
            {confidence === null ? '—' : `${confidence}%`}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${confidence ?? 0}%` }}
          />
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Confidence reflects the AI's assessment, not proof that the root
          cause is confirmed.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5 dark:border-amber-900/70 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            !
          </span>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Possible root cause
            </h3>

            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
              AI hypothesis · Requires verification
            </p>
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
          {analysis.possible_root_cause ||
            'No root-cause hypothesis available.'}
        </p>

        
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Recommended actions
        </h3>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Suggested investigation steps
        </p>

        {actions.length > 0 ? (
          <ol className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
            {actions.map((action, index) => (
              <li
                key={`${index}-${action}`}
                className="flex items-start gap-3 px-3 py-2.5"
              >
                <span className="mt-0.5 shrink-0 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <p className="text-sm leading-5 text-slate-600 dark:text-slate-300">
                  {action}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No recommended actions available.
          </p>
        )}
      </div>
    </Section>
  );
}
