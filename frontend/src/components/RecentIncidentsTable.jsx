
import { useEffect, useState } from 'react';
import Badge, { severityClass, statusClass } from './Badge';
import { apiFetch } from '../api';

export default function RecentIncidentsTable({ onIncidentClick }) {
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

        setIncidents((Array.isArray(data) ? data : []).slice(0, 5));
        setError('');
      } catch (err) {
        if (err.name === 'AbortError') return;

        setError(err.message || 'Could not load recent incidents.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchIncidents();

    return () => controller.abort();
  }, []);

  const headingClasses =
    'text-sm font-semibold text-slate-800 dark:text-slate-100';

  const tableSurfaceClasses =
    'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900';

  const cellClasses =
    'whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300';

  const stateCellClasses =
    'px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400';

  return (
    <section
      aria-labelledby="recent-incidents-heading"
      className="mt-8"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="recent-incidents-heading"
            className={headingClasses}
          >
            Recent Incidents
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            A quick look at your latest activity
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Latest 5 incidents
        </span>
      </div>

      <div className={tableSurfaceClasses}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3">ID</th>
                <th scope="col" className="px-4 py-3">Incident</th>
                <th scope="col" className="px-4 py-3">Service</th>
                <th scope="col" className="px-4 py-3">Severity</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Opened</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className={stateCellClasses}>
                    Loading incidents...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    role="alert"
                    className="px-4 py-8 text-center text-sm text-red-600 dark:text-red-300"
                  >
                    {error}
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className={stateCellClasses}>
                    No incidents found. Create an incident to see it here.
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    tabIndex={0}
                    aria-label={`Open incident ${incident.id}: ${incident.title}`}
                    onClick={() => onIncidentClick?.(incident.id)}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' ||
                        event.key === ' '
                      ) {
                        event.preventDefault();
                        onIncidentClick?.(incident.id);
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 dark:hover:bg-slate-800/70 dark:focus:bg-sky-400/10"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-blue-700 dark:text-sky-300">
                      #{incident.id}
                    </td>

                    <td className="min-w-[16rem] px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {incident.title || 'Untitled incident'}
                    </td>

                    <td className={cellClasses}>
                      {incident.service || '—'}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge
                        value={incident.severity}
                        map={severityClass}
                      />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge
                        value={incident.status}
                        map={statusClass}
                      />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                      {incident.created_at
                        ? new Date(incident.created_at).toLocaleString(
                            'en-IN'
                          )
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

