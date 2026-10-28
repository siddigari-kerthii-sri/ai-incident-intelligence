
function Section({ eyebrow, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/10">
      <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-700 sm:px-6">
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

function ReportField({ label, value }) {
  if (!value) return null;

  return (
    <div className="border-b border-slate-100 py-4 last:border-0 dark:border-slate-700">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
      </p>
    </div>
  );
}

export default function FinalReport({
  report,
  approved,
  loading = false,
  error = '',
  onRefresh,
}) {
  const hasReport = report && Object.keys(report).length > 0;

  const reportText =
    typeof report === 'string'
      ? report
      : report?.report ||
        report?.final_report ||
        report?.content ||
        report?.report_content;

  return (
    <Section
      eyebrow="04 · Documentation"
      title="Final incident report"
      description="The session-specific report generated after human approval."
    >
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Loading final report…
          </p>
        </div>
      ) : !approved ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 dark:border-amber-900/60 dark:bg-amber-950/30 sm:p-8">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-white text-xl text-amber-700 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-400">
              ◈
            </span>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
              Report awaiting approval
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Approve the revised root cause to unlock the final report for
              this demo session.
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/40">
          <p role="alert" className="text-sm leading-6 text-rose-700 dark:text-rose-300">
            {error}
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
            >
              Retry loading report
            </button>
          )}
        </div>
      ) : hasReport ? (
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300">
              Approved
            </span>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                ↻ Refresh report
              </button>
            )}
          </div>

          {reportText ? (
            <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300 sm:p-5">
              {reportText}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <ReportField label="Incident" value={report.title} />
              <ReportField label="Incident ID" value={report.incident_id} />
              <ReportField label="Service" value={report.service} />
              <ReportField label="Severity" value={report.severity} />
              <ReportField label="Summary" value={report.summary} />
              <ReportField
                label="Root cause"
                value={report.root_cause || report.approved_root_cause}
              />
              <ReportField
                label="Resolution"
                value={report.resolution || report.resolution_details}
              />
              <ReportField
                label="Verification"
                value={report.verification || report.verification_evidence}
              />
              <ReportField label="Created at" value={report.created_at} />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            The root cause is approved, but no report content was returned.
            Check the report API response.
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Load report
            </button>
          )}
        </div>
      )}
    </Section>
  );
}
