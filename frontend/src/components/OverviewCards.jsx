
import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const ACCENT = {
  open: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300',
  critical:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300',
  resolved:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300',
};

const normalize = (value) =>
  String(value ?? '').trim().toLowerCase();

const isResolved = (incident) =>
  normalize(incident.status) === 'resolved';

export default function OverviewCards() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function fetchIncidents() {
      try {
        const data = await apiFetch('/incidents', {
          signal: controller.signal,
        });

        if (!Array.isArray(data)) {
          throw new Error('Invalid incident data received from the server.');
        }

        setIncidents(data);
        setError('');
      } catch (err) {
        if (err.name === 'AbortError') return;

        setError(err.message || 'Could not load incident statistics.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchIncidents();

    return () => controller.abort();
  }, []);

  const stats = [
    {
      id: 'open',
      label: 'Open Incidents',
      value: incidents.filter(
        (incident) => !isResolved(incident)
      ).length,
      hint: 'Awaiting resolution',
    },
    {
      id: 'critical',
      label: 'Critical Incidents',
      value: incidents.filter(
        (incident) =>
          normalize(incident.severity) === 'critical' &&
          !isResolved(incident)
      ).length,
      hint: 'Urgent incidents needing attention',
    },
    {
      id: 'resolved',
      label: 'Resolved Incidents',
      value: incidents.filter(isResolved).length,
      hint: 'Successfully resolved',
    },
  ];

  const headingClasses =
    'mb-3 text-sm font-semibold text-slate-700 dark:text-slate-100';

  if (loading) {
    return (
      <section className="mb-6">
        <h2 className={headingClasses}>Overview</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {['open', 'critical', 'resolved'].map((id) => (
            <div
              key={id}
              className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700/80 dark:bg-slate-900"
            >
              <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-4 h-8 w-16 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-3 h-3 w-36 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Loading incident statistics...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-6">
        <h2 className={headingClasses}>Overview</h2>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            Unable to load statistics: {error}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="overview-heading" className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2
            id="overview-heading"
            className="text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            Overview
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            A snapshot of your incident activity
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live data
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.id}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-blue-500/40 dark:hover:shadow-blue-950/20"
          >
            <div
              className={`absolute inset-x-0 top-0 h-0.5 ${
                stat.id === 'open'
                  ? 'bg-sky-500'
                  : stat.id === 'critical'
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
              }`}
            />

            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>

              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${ACCENT[stat.id]}`}
              >
                Live
              </span>
            </div>

            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {stat.value}
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {stat.hint}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
