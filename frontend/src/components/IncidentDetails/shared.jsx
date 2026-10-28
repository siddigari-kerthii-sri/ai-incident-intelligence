
export function Section({
    eyebrow,
    title,
    description,
    children,
    action,
    className = '',
  }) {
    return (
      <section
        className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] ${className}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-indigo-600">
                {eyebrow}
              </p>
            )}
  
            <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-900">
              {title}
            </h2>
  
            {description && (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>
  
          {action}
        </div>
  
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    );
  }
  
  export function StatusBadge({ children, status = 'default' }) {
    const styles = {
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      warning: 'border-amber-200 bg-amber-50 text-amber-800',
      danger: 'border-rose-200 bg-rose-50 text-rose-700',
      info: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      default: 'border-slate-200 bg-slate-100 text-slate-700',
    };
  
    return (
      <span
        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${
          styles[status] || styles.default
        }`}
      >
        {children}
      </span>
    );
  }
  
  export function EmptyState({ title, description, action }) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
  
        {description && (
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
  
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
  
  export function formatDate(value) {
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
  