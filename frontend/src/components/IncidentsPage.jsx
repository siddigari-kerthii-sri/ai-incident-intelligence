
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Badge, { severityClass, statusClass } from './Badge';
import IncidentDetails from './IncidentDetails/IncidentDetails';
import { apiFetch } from '../api';

const INCIDENT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
  { id: 'resolved', label: 'Resolved' },
];

const INCIDENT_STORAGE_KEY = 'incident_selected_id';

function formatCreatedAt(createdAt) {
  if (!createdAt) return '—';

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const surfaceClasses =
  'rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-200 dark:border-slate-700/80 dark:bg-slate-900';

const secondaryTextClasses = 'text-slate-500 dark:text-slate-400';

const searchClasses =
  'w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-3 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20';

const retryButtonClasses =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

const sessionButtonClasses =
  'mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 dark:hover:text-slate-950';

function LoadingState({ message }) {
  return (
    <div
      className={`${surfaceClasses} p-8 text-center text-sm ${secondaryTextClasses}`}
    >
      <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500 dark:border-slate-700 dark:border-t-blue-400" />
      {message}
    </div>
  );
}

function getSavedIncidentId() {
  const saved = sessionStorage.getItem(INCIDENT_STORAGE_KEY);

  if (!saved) return null;

  const id = Number(saved);

  return Number.isFinite(id) && id > 0 ? id : null;
}

export default function IncidentsPage({
  initialSelectedId = null,
  onIncidentOpened,
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // Restore the selected incident when this page mounts.
  const [selectedId, setSelectedId] = useState(
    () => initialSelectedId ?? getSavedIncidentId()
  );

  const [selectedIncident, setSelectedIncident] = useState(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const detailsRequestRef = useRef(0);
  const lastOpenedIdRef = useRef(null);

  const loadIncidents = useCallback(async (signal) => {
    try {
      const data = await apiFetch('/incidents', { signal });

      if (signal?.aborted) return;

      setIncidents(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted) return;

      setError(err.message || 'Could not load incidents.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    loadIncidents(controller.signal);

    return () => controller.abort();
  }, [loadIncidents, retryCount]);

  // Keep the selected incident ID available across refreshes.
  useEffect(() => {
    if (selectedId == null) {
      sessionStorage.removeItem(INCIDENT_STORAGE_KEY);
    } else {
      sessionStorage.setItem(
        INCIDENT_STORAGE_KEY,
        String(selectedId)
      );
    }
  }, [selectedId]);

  const handleIncidentClick = useCallback(async (incidentId) => {
    const requestId = ++detailsRequestRef.current;

    setSelectedId(incidentId);
    setSelectedIncident(null);
    setDetailsLoading(true);
    setDetailsError('');

    try {
      const data = await apiFetch(`/incidents/${incidentId}`);

      if (requestId !== detailsRequestRef.current) return;

      setSelectedIncident(data);
    } catch (err) {
      if (requestId !== detailsRequestRef.current) return;

      setDetailsError(
        err.message || 'Could not load incident details.'
      );
    } finally {
      if (requestId === detailsRequestRef.current) {
        setDetailsLoading(false);
      }
    }
  }, []);

  // Open the saved incident after mounting or refreshing.
  useEffect(() => {
    if (initialSelectedId != null && String(selectedId) !== String(initialSelectedId)) {
      setSelectedId(initialSelectedId);
      return;
    }

    if (selectedId == null) {
      lastOpenedIdRef.current = null;
      return;
    }

    if (String(lastOpenedIdRef.current) === String(selectedId)) {
      return;
    }

    lastOpenedIdRef.current = selectedId;
    handleIncidentClick(selectedId);

    // Do not clear the saved ID here.
    // It is needed to restore this incident after refresh.
  }, [selectedId, initialSelectedId, handleIncidentClick]);

  function handleBack() {
    detailsRequestRef.current += 1;
    lastOpenedIdRef.current = null;

    setSelectedId(null);
    setSelectedIncident(null);
    setDetailsError('');
    setDetailsLoading(false);

    onIncidentOpened?.();
  }

  function startNewSession() {
    sessionStorage.removeItem('incident_demo_token');
    sessionStorage.removeItem('incident_demo_expiry');
    sessionStorage.removeItem('incident_active_nav');
    sessionStorage.removeItem(INCIDENT_STORAGE_KEY);

    window.location.reload();
  }

  function retryLoading() {
    setError('');
    setLoading(true);
    setRetryCount((count) => count + 1);
  }

  const visibleIncidents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return incidents.filter((incident) => {
      const matchesSearch =
        String(incident.title || '').toLowerCase().includes(normalizedQuery) ||
        String(incident.service || '').toLowerCase().includes(normalizedQuery) ||
        String(incident.category || '').toLowerCase().includes(normalizedQuery) ||
        String(incident.id ?? '').toLowerCase().includes(normalizedQuery);

      const severity = String(incident.severity || '').toLowerCase();
      const status = String(incident.status || '').toLowerCase();

      const matchesFilter =
        filter === 'all' || severity === filter || status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [filter, query, incidents]);

  if (loading) {
    return <LoadingState message="Loading incidents..." />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/5">
        <p className="text-sm text-red-700 dark:text-red-300">
          Failed to load incidents: {error}
        </p>

        {error.toLowerCase().includes('session') && (
          <button
            type="button"
            onClick={startNewSession}
            className={sessionButtonClasses}
          >
            Start a new demo session
          </button>
        )}

        <button
          type="button"
          onClick={retryLoading}
          className={`ml-3 mt-4 ${retryButtonClasses}`}
        >
          Retry
        </button>
      </div>
    );
  }

  if (selectedId !== null) {
    if (detailsLoading) {
      return <LoadingState message="Loading incident details..." />;
    }

    if (detailsError) {
      return (
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            ← Back to incidents
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300">
            Failed to load incident details: {detailsError}
          </div>

          {detailsError.toLowerCase().includes('session') && (
            <button
              type="button"
              onClick={startNewSession}
              className={sessionButtonClasses}
            >
              Start a new demo session
            </button>
          )}

          <button
            type="button"
            onClick={() => handleIncidentClick(selectedId)}
            className={`ml-3 ${retryButtonClasses}`}
          >
            Retry
          </button>
        </div>
      );
    }

    if (selectedIncident) {
      return (
        <IncidentDetails
  incident={selectedIncident}
  onBack={handleBack}
  onOpenIncident={handleIncidentClick}
  onStatusUpdated={(updatedStatus) => {
    setIncidents((previous) =>
      previous.map((item) =>
        String(item.id) === String(selectedId)
          ? { ...item, status: updatedStatus }
          : item
      )
    );

    setSelectedIncident((previous) =>
      previous
        ? { ...previous, status: updatedStatus }
        : previous
    );
  }}
/>
      );
    }

    return <LoadingState message="Opening incident..." />;
  }

  return (
    <section
      aria-label="Incidents"
      className="text-slate-800 dark:text-slate-100"
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block min-w-0 flex-1 lg:max-w-md">
          <span className="sr-only">Search incidents</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ID, title, service, or category"
            className={searchClasses}
          />
        </label>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter incidents"
        >
          {INCIDENT_FILTERS.map((item) => {
            const isActive = item.id === filter;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(item.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm dark:border-blue-500 dark:bg-blue-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/60 dark:hover:text-blue-400'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {visibleIncidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            No incidents found
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Try changing your search terms or selecting a different filter.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {visibleIncidents.map((incident) => (
              <button
                key={incident.id}
                type="button"
                onClick={() => handleIncidentClick(incident.id)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-blue-500/50 dark:hover:bg-slate-800/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    #{incident.id}
                  </p>
                  <Badge value={incident.severity} map={severityClass} />
                </div>

                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {incident.title}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{incident.service || 'Unknown service'}</span>
                  <span>•</span>
                  <span>{incident.category || 'Uncategorized'}</span>
                  <Badge value={incident.status} map={statusClass} />
                  <span>{formatCreatedAt(incident.created_at)}</span>
                </div>
              </button>
            ))}
          </div>

          <div className={`hidden overflow-hidden md:block ${surfaceClasses}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-3">ID</th>
                    <th scope="col" className="px-4 py-3">Title</th>
                    <th scope="col" className="px-4 py-3">Service</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Severity</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleIncidents.map((incident) => (
                    <tr
                      key={incident.id}
                      tabIndex={0}
                      onClick={() => handleIncidentClick(incident.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleIncidentClick(incident.id);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-blue-50/70 focus:bg-blue-50 focus:outline-none dark:hover:bg-blue-500/5 dark:focus:bg-blue-500/10"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                        #{incident.id}
                      </td>
                      <td className="min-w-[16rem] px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                        {incident.title}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {incident.service || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {incident.category || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge value={incident.severity} map={severityClass} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge value={incident.status} map={statusClass} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                        {formatCreatedAt(incident.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
