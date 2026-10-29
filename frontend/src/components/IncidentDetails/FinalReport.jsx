
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
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return null;
  }

  const displayValue =
    typeof value === "string"
      ? value
      : typeof value === "object"
        ? JSON.stringify(value, null, 2)
        : String(value);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </h3>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-300">
        {displayValue}
      </p>
    </div>
  );
}

function getFirstValue(...values) {
  return values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
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

function getStatusLabel(status) {
  if (!status) return null;

  const normalized = String(status).toLowerCase().replace(/[_-]/g, " ");

  if (normalized.includes("resolved")) return "Resolved";
  if (normalized.includes("investigat")) return "Investigating";
  if (normalized.includes("open")) return "Open";
  if (normalized.includes("closed")) return "Closed";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getStatusStyle(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("resolved") || normalized.includes("closed")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300";
  }

  if (normalized.includes("investigat")) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export default function FinalReport({
  report,
  approved,
  loading = false,
  error = "",
  onRefresh,
}) {
  const hasReport =
    report !== null &&
    report !== undefined &&
    (typeof report === "string"
      ? report.trim().length > 0
      : typeof report === "object" && Object.keys(report).length > 0);

  const reportData =
    typeof report === "object" && report !== null ? report : {};

  const reportText =
    typeof report === "string"
      ? report
      : getFirstValue(
          reportData.report,
          reportData.final_report,
          reportData.content,
          reportData.report_content
        );

  const updatedAt = getFirstValue(
    reportData.updated_at,
    reportData.last_updated,
    reportData.modified_at
  );

  // Prefer the latest incident state supplied by the report API.
  const status = getStatusLabel(
    getFirstValue(
      reportData.status,
      reportData.incident_status,
      reportData.current_status
    )
  );

  const title = getFirstValue(
    reportData.title,
    reportData.incident_title,
    reportData.incident_name
  );

  const incidentId = getFirstValue(
    reportData.incident_id,
    reportData.id
  );

  const service = reportData.service;
  const severity = reportData.severity;

  const summary = getFirstValue(
    reportData.summary,
    reportData.incident_summary,
    reportData.ai_summary
  );

  const rootCause = getFirstValue(
    reportData.approved_root_cause,
    reportData.human_approved_root_cause,
    reportData.root_cause,
    reportData.possible_root_cause
  );

  const resolution = getFirstValue(
    reportData.resolution_summary,
    reportData.resolution_notes,
    reportData.resolution_details,
    reportData.resolution
  );

  const verification = getFirstValue(
    reportData.verification_summary,
    reportData.verification_evidence,
    reportData.verification
  );

  const isResolved =
    status?.toLowerCase() === "resolved" ||
    status?.toLowerCase() === "closed";

  return (
    <Section
      eyebrow="04 · Documentation"
      title="Final incident report"
      description="A concise summary of the approved incident analysis and its latest resolution state."
    >
      {loading ? (
        <div
          className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/60"
          role="status"
        >
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Loading latest report…
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
              Approve the incident analysis to make the initial report
              available. The resolution can be added later.
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
              className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
            >
              Retry loading report
            </button>
          )}
        </div>
      ) : hasReport ? (
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                status
              )}`}
            >
              {status || "Approved"}
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
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-950/60 sm:p-5">
              <ReportField label="Report" value={reportText} />
            </div>
          ) : (
            <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-950/60 sm:p-5">
              {(title || incidentId) && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {title || `Incident #${incidentId}`}
                  </h3>

                  {incidentId && title && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Incident #{incidentId}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <ReportField label="Service" value={service} />
                <ReportField label="Severity" value={severity} />
              </div>

              <ReportField label="Summary" value={summary} />

              <ReportField
                label="Root Cause"
                value={rootCause || "Not available yet."}
              />

              <ReportField
                label="Resolution"
                value={
                  resolution ||
                  (isResolved
                    ? "The incident is marked resolved, but no resolution summary was returned."
                    : "Pending investigation and verification.")
                }
              />

              {isResolved && verification && (
                <ReportField
                  label="Verification"
                  value={verification}
                />
              )}
            </div>
          )}

          <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {isResolved
              ? "This report reflects the resolved incident state and the resolution information returned by the server."
              : "This report is available after root-cause approval and can be updated as the incident progresses. Approval does not by itself mean the incident is resolved."}
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
              disabled={loading}
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Load report
            </button>
          )}
        </div>
      )}
    </Section>
  );
}
