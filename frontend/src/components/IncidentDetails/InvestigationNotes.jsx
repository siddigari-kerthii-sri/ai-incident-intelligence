
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

function NoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 4.75h6l4 4v10.5A1.75 1.75 0 0116.25 21h-8.5A1.75 1.75 0 016 19.25v-12A2.5 2.5 0 018.5 4.75z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 5v4h4M9 13h6M9 16.5h6"
      />
    </svg>
  );
}

export default function InvestigationNotes({
  noteText,
  setNoteText,
  onSaveNote,
  savingNote = false,
  error = '',
}) {
  return (
    <Section
      eyebrow="06 · Investigation"
      title="Investigation notes"
      description="Record findings, evidence, and troubleshooting steps as the investigation progresses."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSaveNote?.();
        }}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/60 dark:text-indigo-300">
            <NoteIcon />
          </span>

          <div className="min-w-0 pt-0.5">
            <label
              htmlFor="investigation-note"
              className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Add an investigation note
            </label>

            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
              Capture what you checked, what you observed, and what to investigate next.
            </p>
          </div>
        </div>

        <textarea
          id="investigation-note"
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          maxLength={2000}
          rows={4}
          disabled={savingNote}
          placeholder="e.g. Checked application logs after deployment. Found recurring timeout errors that need further investigation..."
          className="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-indigo-500 dark:disabled:bg-slate-800"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keep notes factual and evidence-focused.
          </p>

          <p className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
            {(noteText || '').length}/2000
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={savingNote || !noteText?.trim()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/15 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingNote ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                    opacity="0.25"
                  />
                  <path
                    d="M21 12a9 9 0 00-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Saving note...
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 5v14M5 12h14"
                  />
                </svg>
                Save investigation note
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {error}
        </div>
      )}
    </Section>
  );
}

  