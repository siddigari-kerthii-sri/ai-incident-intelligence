
function formatDate(value) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActivityType(activity) {
  return String(
    activity.activity_type ||
      activity.action ||
      activity.event_type ||
      activity.type ||
      ''
  ).toLowerCase();
}

function getActivityLabel(activity) {
  const raw =
    activity.activity_type ||
    activity.action ||
    activity.event_type ||
    activity.type ||
    'Activity';

  return String(raw)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getActivityDescription(activity) {
  return (
    activity.description ||
    activity.message ||
    activity.details ||
    activity.content ||
    'Incident activity recorded.'
  );
}

function getActivityStyle(activity) {
  const type = getActivityType(activity);

  if (
    type.includes('resolv') ||
    type.includes('approv') ||
    type.includes('complet')
  ) {
    return {
      icon: 'check',
      classes:
        'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900/70',
    };
  }

  if (type.includes('review') || type.includes('rework')) {
    return {
      icon: 'review',
      classes:
        'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900/70',
    };
  }

  if (type.includes('status')) {
    return {
      icon: 'status',
      classes:
        'bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-900/70',
    };
  }

  if (
    type.includes('note') ||
    type.includes('investigat') ||
    type.includes('comment')
  ) {
    return {
      icon: 'note',
      classes:
        'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900/70',
    };
  }

  if (type.includes('creat')) {
    return {
      icon: 'create',
      classes:
        'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900/70',
    };
  }

  return {
    icon: 'activity',
    classes:
      'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  };
}

function ActivityIcon({ type }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'h-4 w-4',
    'aria-hidden': true,
  };

  switch (type) {
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12.5 4.5 4.5L19 7" />
        </svg>
      );

    case 'review':
      return (
        <svg {...common}>
          <path d="M12 8v4l2.5 1.5" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );

    case 'status':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h10M4 17h7" />
          <circle cx="18" cy="15" r="3" />
        </svg>
      );

    case 'note':
      return (
        <svg {...common}>
          <path d="M8 4h6l4 4v11H6V6a2 2 0 0 1 2-2Z" />
          <path d="M14 4v5h4M9 13h6M9 16h6" />
        </svg>
      );

    case 'create':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      );
  }
}

function getStatusClasses(value) {
  const status = String(value || '').toLowerCase();

  if (['resolved', 'approved', 'completed'].includes(status)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300';
  }

  if (
    ['investigating', 'pending', 'rework_requested'].includes(status)
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-300';
  }

  if (['critical', 'high', 'failed'].includes(status)) {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/50 dark:text-rose-300';
  }

  return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

export default function ActivityTimeline({
  activities = [],
  loading = false,
  error = '',
  onRefresh,
}) {
  const items = (Array.isArray(activities) ? activities : [])
    .slice()
    .sort((a, b) => {
      const getTimestamp = (activity) => {
        const value =
          activity.created_at ||
          activity.timestamp ||
          activity.createdAt;

        if (!value) return 0;

        const time = new Date(value).getTime();
        return Number.isNaN(time) ? 0 : time;
      };

      return getTimestamp(b) - getTimestamp(a);
    });

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-700 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Activity timeline
            </h2>

            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {items.length}
            </span>
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Follow the incident from creation through investigation and resolution.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus:ring-slate-700"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            >
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M5.5 9A7 7 0 0 1 17 5l3 2M4 17l3 2a7 7 0 0 0 11.5-4" />
            </svg>

            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/60 dark:bg-rose-950/40"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5m0 3h.01" />
            </svg>

            <p className="text-sm leading-6 text-rose-700 dark:text-rose-300">
              {error}
            </p>
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-10">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading activity history...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-9 text-center dark:border-slate-700 dark:bg-slate-800/40">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
              <ActivityIcon type="activity" />
            </span>

            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No activity recorded yet
            </p>

            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
              Incident events will appear here as the investigation progresses.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-0">
            {items.map((activity, index) => {
              const style = getActivityStyle(activity);
              const isLatest = index === 0;

              const timestamp =
                activity.created_at ||
                activity.timestamp ||
                activity.createdAt;

              return (
                <li
                  key={
                    activity.id ??
                    `${index}-${getActivityLabel(activity)}`
                  }
                  className="relative flex gap-3 pb-7 last:pb-0 sm:gap-4"
                >
                  <div className="relative flex shrink-0 flex-col items-center">
                    <span
                      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ${style.classes}`}
                    >
                      <ActivityIcon type={style.icon} />
                    </span>

                    {index !== items.length - 1 && (
                      <span className="absolute bottom-0 top-10 w-px bg-slate-200 dark:bg-slate-700" />
                    )}
                  </div>

                  <div
                    className={`min-w-0 flex-1 rounded-xl border px-4 py-3.5 transition ${
                      isLatest
                        ? 'border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/70 dark:bg-indigo-950/30'
                        : 'border-slate-100 bg-white hover:border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                      <h3 className="text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
                        {getActivityLabel(activity)}
                      </h3>

                      {activity.status && (
                        <span
                          className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getStatusClasses(activity.status)}`}
                        >
                          {String(activity.status).replaceAll('_', ' ')}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {getActivityDescription(activity)}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 7v5l3 2"
                        />
                      </svg>

                      <time dateTime={timestamp || undefined}>
                        {formatDate(timestamp)}
                      </time>

                      {isLatest && (
                        <span className="ml-1 inline-flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                          Latest event
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
