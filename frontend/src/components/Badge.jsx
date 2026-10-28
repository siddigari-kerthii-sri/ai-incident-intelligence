export const severityClass = {
  Critical: 'bg-rose-50 text-rose-700',
  High: 'bg-orange-50 text-orange-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
};

export const statusClass = {
  Investigating: 'bg-sky-50 text-sky-700',
  Open: 'bg-violet-50 text-violet-700',
  Monitoring: 'bg-amber-50 text-amber-700',
  Resolved: 'bg-emerald-50 text-emerald-700',
};

export default function Badge({ value, map }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[value] ?? 'bg-slate-100 text-slate-600'}`}>
      {value}
    </span>
  );
}
