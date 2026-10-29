
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
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return null;
  }

  const displayValue =
    typeof value === 'string'
      ? value
      : JSON.stringify(value, null, 2);

  return (
    <div className="border-b border-slate-100 py-4 last:border-0 dark:border-slate-700">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </h3>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-300">
        {displayValue}
      </p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

export default function FinalReport({
  report,
  approved,
  loading = false,
  error = '',
  onRefresh,
}) {
  const hasReport =
    report !== null &&
    report !== undefined &&
    (typeof report === 'string'
      ? report.trim().length > 0
      : Object.keys(report).length > 0);

  const reportText =
    typeof report === 'string'
      ? report
      : report?.report ||
        report?.final_report ||
        report?.content ||
        report?.report_content;

  const updatedAt =
    report?.updated_at ||
    report?.last_updated ||
    report?.modified_at;

  const investigationNotes =
    report?.investigation_notes ??
    report?.investigation_details ??
    report?.investigation;

  const resolutionNotes =
    report?.resolution_notes ??
    report?.resolution_details ??
    report?.resolution;

  const timeline =
    report?.timeline ??
    report?.history ??
    report?.audit_history;

  return (
    <Section
      eyebrow="04 · Documentation"
      title="Final incident report"
      description="The incident report generated after human review. Refresh to retrieve the latest available report data."
    >
      {loading ? (
        <div
          className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/60"
          role="status"
        >
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
              Approve the revised incident analysis to unlock the final
              report for this demo session.
            </p>
          </div>
        </div>
      ) : error ? (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/40"
          role="alert"
        >
          <p className="text-sm leading-6 text-rose-700 dark:text-rose-300">
            {error}
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
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
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                ↻ Refresh report
              </button>
            )}
          </div>

          {updatedAt && (
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Last updated: {formatDate(updatedAt)}
            </p>
          )}

          {reportText ? (
            <div className="space-y-4">
              <div className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300 sm:p-5">
                {reportText}
              </div>

              {/* Display newer incident notes even when the report is text. */}
              {(investigationNotes ||
                resolutionNotes ||
                timeline) && (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 dark:border-slate-700 dark:divide-slate-700 sm:px-5">
                  <ReportField
                    label="Latest investigation notes"
                    value={investigationNotes}
                  />

                  <ReportField
                    label="Latest resolution notes"
                    value={resolutionNotes}
                  />

                  <ReportField
                    label="Incident timeline and history"
                    value={timeline}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <ReportField
                label="Incident"
                value={report.title}
              />

              <ReportField
                label="Incident ID"
                value={report.incident_id ?? report.id}
              />

              <ReportField
                label="Service"
                value={report.service}
              />

              <ReportField
                label="Severity"
                value={report.severity}
              />

              <ReportField
                label="Status"
                value={report.status}
              />

              <ReportField
                label="Summary"
                value={report.summary}
              />

              <ReportField
                label="AI analysis"
                value={report.ai_summary}
              />

              <ReportField
                label="Human-approved root-cause hypothesis"
                value={
                  report.approved_root_cause ||
                  report.root_cause ||
                  report.possible_root_cause
                }
              />

              <ReportField
                label="Investigation notes"
                value={investigationNotes}
              />

              <ReportField
                label="Resolution notes"
                value={resolutionNotes}
              />

              <ReportField
                label="Verification evidence"
                value={
                  report.verification ||
                  report.verification_evidence
                }
              />

              <ReportField
                label="Timeline and audit history"
                value={timeline}
              />

              <ReportField
                label="Created at"
                value={formatDate(report.created_at)}
              />

              <ReportField
                label="Last updated"
                value={formatDate(updatedAt)}
              />
            </div>
          )}

          <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
            Approval indicates that the reviewer approved the documented
            analysis. It does not independently establish that the
            proposed root cause is correct. Verification evidence should
            be recorded separately.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            The analysis has been approved, but no report content was
            returned. Check the report API response.
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
