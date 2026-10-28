
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

function getSimilarity(item) {
  const raw =
    item.similarity ??
    item.similarity_score ??
    item.score;

  if (raw == null || !Number.isFinite(Number(raw))) return null;

  const value = Number(raw);
  // Accommodate scores returned either as 0–1 or 0–100.
  return Math.round(
    Math.max(0, Math.min(100, value <= 1 ? value * 100 : value))
  );
}

export default function SimilarIncidents({
  incidents = [],
  loading = false,
  error = '',
  onSelectIncident,
  onRefresh,
}) {
  const items = Array.isArray(incidents) ? incidents : [];

  return (
    <Section
      eyebrow="05 · Related intelligence"
      title="Similar incidents"
      description="Historical incidents retrieved using semantic similarity."
    >
      {loading ? (
        <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Searching historical incidents…
        </p>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/70 dark:bg-rose-950/30">
          <p role="alert" className="text-sm leading-6 text-rose-700 dark:text-rose-300">
            {error}
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              Retry
            </button>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No similar incidents found
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Related incidents will appear here when matching historical
            records are available.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const id = item.id ?? item.incident_id;
            const similarity = getSimilarity(item);
            const title = item.title || item.name || `Incident #${id}`;

            return (
              <button
                key={id ?? `${title}-${index}`}
                type="button"
                onClick={() => onSelectIncident?.(item)}
                disabled={!onSelectIncident}
                className="block w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30 disabled:cursor-default dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      INCIDENT #{id ?? '—'}
                    </p>
                    <h3 className="mt-1 text-sm font-bold leading-6 text-slate-900 dark:text-slate-100">
                      {title}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {item.service && (
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {item.service}
                        </span>
                      )}
                      {item.severity && (
                        <span className="rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300">
                          {item.severity}
                        </span>
                      )}
                      {item.status && (
                        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {similarity !== null && (
                    <span className="shrink-0 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                      {similarity.toFixed(1)}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Similarity is a retrieval score, not proof that two incidents share
        the same root cause.
      </p>
    </Section>
  );
}
