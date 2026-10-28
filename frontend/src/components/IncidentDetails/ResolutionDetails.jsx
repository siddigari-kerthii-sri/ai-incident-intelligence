
export default function ResolutionDetails({
  resolutionText,
  setResolutionText,
  onSaveResolution,
  savingResolution = false,
  incidentStatus,
  error = '',
}) {
  const isResolved = incidentStatus === 'Resolved';

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/10">
      <div className="border-b border-slate-100 px-5 py-5 dark:border-slate-700 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-indigo-600 dark:text-indigo-400">
          07 · Closure
        </p>

        <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Resolution details
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Document the fix and verification evidence.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSaveResolution?.();
          }}
        >
          <label
            htmlFor="resolution-details"
            className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            Fix applied and verification evidence
          </label>

          <textarea
            id="resolution-details"
            value={resolutionText}
            onChange={(event) => setResolutionText(event.target.value)}
            maxLength={2000}
            rows={5}
            disabled={savingResolution || isResolved}
            placeholder="Describe the fix applied and how you confirmed the service recovered…"
            className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Include the fix and evidence of recovery.
            </p>

            <p className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
              {(resolutionText || '').length}/2000
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 text-sm leading-6 text-rose-600 dark:text-rose-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              savingResolution ||
              isResolved ||
              !resolutionText?.trim()
            }
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingResolution
              ? 'Saving resolution…'
              : isResolved
                ? 'Incident resolved'
                : 'Save resolution details'}
          </button>

          {!isResolved && (
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Save the fix and verification evidence before marking the
              incident as Resolved.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

  