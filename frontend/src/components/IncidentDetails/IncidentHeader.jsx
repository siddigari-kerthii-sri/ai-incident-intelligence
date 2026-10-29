
const STATUS_OPTIONS = ['Open', 'Investigating', 'Resolved'];

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusClasses(value) {
  const status = String(value || '').toLowerCase();

  if (['resolved', 'approved', 'completed'].includes(status)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  }

  if (
    ['investigating', 'rework_requested', 'pending'].includes(status)
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
  }

  if (['critical', 'high', 'failed'].includes(status)) {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
  }

  return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

function Badge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

export default function IncidentHeader({
  incident,
  displayedAnalysis,
  status,
  savingStatus,
  statusError,
  handleStatusChange,
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] dark:border-slate-700 dark:bg-slate-900">
      <div className="h-1 bg-gradient-to-r from-indigo-600 via-violet-500 to-sky-400" />

      <div className="p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                INCIDENT #{incident.id}
              </Badge>

              <Badge
                className={getStatusClasses(displayedAnalysis.severity)}
              >
                {displayedAnalysis.severity || 'Unclassified'} severity
              </Badge>

              <Badge className={getStatusClasses(status)}>
                {status}
              </Badge>
            </div>

            <h1 className="mt-5 max-w-4xl text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl lg:text-[34px] dark:text-slate-100">
              {incident.title || 'Untitled incident'}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Monitor incident progress, validate AI findings, and document
              the path to resolution.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                ◈ {displayedAnalysis.service || 'Unknown service'}
              </span>

              <span>
                {displayedAnalysis.category || 'Uncategorized'}
              </span>

              <span>Created {formatDate(incident.created_at)}</span>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-4 xl:max-w-[260px] dark:border-slate-700 dark:bg-slate-800/70">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
              Update status
            </p>

            <select
              value={status}
              disabled={savingStatus}
              onChange={(event) =>
                handleStatusChange(event.target.value)
              }
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            

            {statusError && (
              <p className="mt-3 text-xs leading-5 text-rose-600 dark:text-rose-400">
                {statusError}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
