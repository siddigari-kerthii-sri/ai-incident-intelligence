
function Section({ eyebrow, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-700 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
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

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function getStatusLabel(status) {
  if (!status) return null;

  const value = String(status).toLowerCase().replace(/[_-]/g, " ");

  if (value.includes("resolved")) return "Resolved";
  if (value.includes("investigat")) return "Investigating";
  if (value.includes("closed")) return "Closed";
  if (value.includes("open")) return "Open";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseReportText(text) {
  if (typeof text !== "string" || !text.trim()) return {};

  const labels = [
    ["description", /^Description:\s*/i],
    ["summary", /^AI Summary:\s*/i],
    ["rootCause", /^Human-approved root cause:\s*/i],
    ["recommendedActions", /^Recommended action:\s*/i],
    ["reviewFeedback", /^Review feedback:\s*/i],
    ["reviewStatus", /^Review status:\s*/i],
    ["resolution", /^Resolution:\s*/i],
    ["verification", /^Verification:\s*/i],
    ["service", /^Service:\s*/i],
    ["severity", /^Severity:\s*/i],
  ];

  const result = {};
  let currentKey = null;

  text.split(/\r?\n/).forEach((line) => {
    const match = labels.find(([, regex]) => regex.test(line.trim()));

    if (match) {
      currentKey = match[0];
      result[currentKey] = line.trim().replace(match[1], "").trim();
      return;
    }

    if (currentKey) {
      result[currentKey] +=
        (result[currentKey] ? "\n" : "") + line.trim();
    }
  });

  Object.keys(result).forEach((key) => {
    result[key] = result[key].trim();
  });

  return result;
}

function MetaItem({ label, value }) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}

function ContentCard({ label, children, icon }) {
  if (!children) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2.5">
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            {icon}
          </span>
        )}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {label}
        </h3>
      </div>

      <div className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
        {children}
      </div>
    </div>
  );
}

function ActionList({ actions }) {
  if (!actions) return null;

  const items = Array.isArray(actions)
    ? actions
    : typeof actions === "string"
      ? actions
          .split(/\n/)
          .map((item) =>
            item.replace(/^\s*(?:\d+[\.\)]|[-*])\s*/, "").trim()
          )
          .filter(Boolean)
      : [String(actions)];

  if (!items.length) return null;

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[11px] font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            {String(index + 1).padStart(2, "0")}
          </span>

          <p className="pt-0.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {typeof item === "object"
              ? item.title || item.description || JSON.stringify(item)
              : item}
          </p>
        </div>
      ))}
    </div>
  );
}

function StateCard({ title, value, pendingText, complete }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h3>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            complete
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          }`}
        >
          {complete ? "Documented" : "Pending"}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
        {value || pendingText}
      </p>
    </div>
  );
}

export default function FinalReport({
  report,
  approved,
  loading = false,
  error = "",
  onRefresh,
}) {
  const reportData =
    typeof report === "object" && report !== null ? report : {};

  const rawReport =
    typeof report === "string"
      ? report
      : getFirstValue(
          reportData.report,
          reportData.final_report,
          reportData.content,
          reportData.report_content
        );

  const parsed = parseReportText(rawReport);

  const hasReport =
    (typeof report === "string" && report.trim().length > 0) ||
    (typeof report === "object" &&
      report !== null &&
      Object.keys(report).length > 0);

  const service = getFirstValue(reportData.service, parsed.service);
  const severity = getFirstValue(reportData.severity, parsed.severity);

  // Use the AI summary only. Do not append the original description.
  const summary = getFirstValue(
    reportData.summary,
    reportData.incident_summary,
    reportData.ai_summary,
    parsed.summary
  );

  const rootCause = getFirstValue(
    reportData.approved_root_cause,
    reportData.human_approved_root_cause,
    reportData.root_cause,
    parsed.rootCause
  );

  const recommendedActions = getFirstValue(
    reportData.recommended_actions,
    reportData.recommended_action,
    reportData.recommendations,
    parsed.recommendedActions
  );

  const resolution = getFirstValue(
    reportData.resolution_summary,
    reportData.resolution_notes,
    reportData.resolution_details,
    reportData.resolution,
    parsed.resolution
  );

  const verification = getFirstValue(
    reportData.verification_summary,
    reportData.verification_evidence,
    reportData.verification,
    reportData.validation_results,
    parsed.verification
  );

  const reviewFeedback = getFirstValue(
    reportData.review_feedback,
    reportData.reviewer_feedback,
    reportData.feedback,
    parsed.reviewFeedback
  );

  const reviewStatus = getFirstValue(
    reportData.review_status,
    reportData.approval_status,
    parsed.reviewStatus
  );

  const status = getStatusLabel(
    getFirstValue(
      reportData.status,
      reportData.incident_status,
      reportData.current_status
    )
  );

  const isResolved =
    status?.toLowerCase() === "resolved" ||
    status?.toLowerCase() === "closed";

  const updatedAt = getFirstValue(
    reportData.updated_at,
    reportData.last_updated,
    reportData.modified_at
  );

  const hasResolution = Boolean(resolution);
  const hasVerification = Boolean(verification);

  return (
    <Section
      eyebrow="04 · Documentation"
      title="Final incident report"
      description="A clear record of the approved analysis, remediation, and verification."
    >
      {loading ? (
        <div className="rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading latest report...
          </p>
        </div>
      ) : !approved ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/30">
          <h3 className="font-bold text-amber-800 dark:text-amber-300">
            Report awaiting approval
          </h3>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            Approve the root-cause analysis to generate the initial report.
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {error}
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-3 text-sm font-semibold text-rose-700 underline dark:text-rose-300"
            >
              Retry
            </button>
          )}
        </div>
      ) : hasReport ? (
        <div className="space-y-5">

          {/* Compact report metadata */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60 sm:p-6">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              <MetaItem label="Service" value={service} />
              <MetaItem label="Severity" value={severity} />
              <MetaItem
                label="Last updated"
                value={formatDate(updatedAt) || "Not available"}
              />
            </div>
          </div>

          {/* Executive summary */}
          {summary && (
            <ContentCard label="Executive summary" icon="◈">
              {summary}
            </ContentCard>
          )}

          {/* Approved root cause */}
          {rootCause && (
            <ContentCard label="Approved root cause" icon="⌕">
              {rootCause}
            </ContentCard>
          )}

          {/* Recommended actions */}
          {recommendedActions && (
            <ContentCard label="Recommended actions" icon="↗">
              <ActionList actions={recommendedActions} />
            </ContentCard>
          )}

          {/* Resolution and verification */}
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">
                Remediation
              </p>
              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                Resolution & verification
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Documented actions and evidence of service recovery.
              </p>
            </div>

            <StateCard
              title="Resolution"
              value={resolution}
              complete={hasResolution}
              pendingText={
                isResolved
                  ? "The incident is marked resolved, but no resolution details have been documented."
                  : "No resolution details have been documented yet."
              }
            />

            <StateCard
              title="Verification"
              value={verification}
              complete={hasVerification}
              pendingText="Verification evidence has not yet been recorded. Confirm successful end-to-end operation before considering the incident fully verified."
            />
          </div>

          {/* Human review */}
          {(reviewFeedback || reviewStatus) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Human review
                </p>

                {reviewFeedback && (
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {reviewFeedback}
                  </p>
                )}
              </div>

              {reviewStatus && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {getStatusLabel(reviewStatus)}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
            <p className="text-xs text-slate-400">
              {hasResolution
                ? "Report includes the latest documented resolution."
                : "Report updates as investigation and resolution details are documented."}
            </p>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
              >
                ↻ Refresh report
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            The analysis was approved, but the report API returned no content.
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
            >
              Load report
            </button>
          )}
        </div>
      )}
    </Section>
  );
}
