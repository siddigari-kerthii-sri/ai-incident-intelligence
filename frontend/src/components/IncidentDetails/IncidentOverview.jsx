
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

export default function IncidentOverview({
  incident,
  displayedAnalysis,
  revisedAnalysis,
}) {
  return (
    <Section
      eyebrow="01 · Overview"
      title="Incident description"
      description="Reported symptoms, context, and potential customer impact."
    >
      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
        {incident.description || 'No description provided.'}
      </p>

      {displayedAnalysis.summary && (
        <div className="mt-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 sm:p-5 dark:border-indigo-900/70 dark:from-indigo-950/50 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white">
              AI
            </span>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Incident summary
              </h3>

              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {revisedAnalysis
                  ? 'Revised AI analysis'
                  : 'AI-generated overview'}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
            {displayedAnalysis.summary}
          </p>
        </div>
      )}
    </Section>
  );
}
