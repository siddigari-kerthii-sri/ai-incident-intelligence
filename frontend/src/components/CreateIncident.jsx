
import { useState } from 'react';
import { apiFetch } from '../api';

const DEMO_INCIDENTS = [
  {
    title: 'Payment API Returning HTTP 500',
    description:
      'The Payment API has started returning HTTP 500 errors following a recent deployment. The payment failure rate increased from 1% to 18%, affecting customers completing transactions. Investigate deployment changes, application exceptions, database connectivity, and downstream payment dependencies.',
  },
  {
    title: 'Authentication Service Login Failures',
    description:
      'Users are intermittently unable to log in. The Authentication API returns HTTP 401 responses for some otherwise valid login attempts. Investigate token validation, recent authentication changes, session expiry, and identity-provider responses.',
  },
  {
    title: 'Database Connection Timeouts',
    description:
      'Several application requests are failing with database connection timeout errors during peak traffic. Some requests succeed after retries. Investigate connection-pool utilization, database capacity, long-running queries, and connection timeout settings.',
  },
  {
    title: 'Order API Response Latency Spike',
    description:
      'The Order API response time has increased significantly, and some requests are timing out. The issue began during a period of increased traffic. Investigate endpoint latency, database query duration, dependency response times, and resource utilization.',
  },
  {
    title: 'Deployment Causing Checkout Regression',
    description:
      'Checkout requests began failing shortly after a new application version was deployed. The checkout page loads, but submitting an order sometimes returns an internal server error. Compare application versions, configuration changes, and error traces.',
  },
  {
    title: 'Message Queue Processing Backlog',
    description:
      'Background jobs are accumulating in the message queue, and processing is falling behind incoming traffic. Some orders remain in a pending state longer than expected. Investigate consumer health, processing errors, retry behavior, and queue throughput.',
  },
  {
    title: 'Application Memory Usage Increasing',
    description:
      'Application memory usage has increased steadily over several hours, followed by slower responses and occasional process restarts. Investigate memory metrics, garbage collection behavior, recent code changes, and possible resource leaks.',
  },
  {
    title: 'Cache Service Returning Stale Data',
    description:
      'Users are seeing outdated product information even after updates have been saved successfully. The issue appears intermittent across application instances. Investigate cache invalidation, expiration settings, cache key consistency, and read paths.',
  },
  {
    title: 'Third-Party Payment Provider Timeout',
    description:
      'Payment requests are taking longer than usual and some transactions fail after waiting for the external payment provider. Investigate dependency latency, timeout configuration, retry behavior, and provider error responses before retrying transactions.',
  },
  {
    title: 'File Upload Service Failures',
    description:
      'File uploads are failing for some users while smaller files continue to succeed. The API returns intermittent errors during upload processing. Investigate file-size limits, storage permissions, request timeouts, and available disk or object-storage capacity.',
  },
  {
    title: 'Email Notifications Not Delivered',
    description:
      'Users complete account and order actions successfully but do not consistently receive email notifications. Investigate notification job status, queue failures, email-provider responses, delivery limits, and retry handling.',
  },
  {
    title: 'API Rate Limiting Rejecting Valid Requests',
    description:
      'Legitimate clients are receiving HTTP 429 responses despite reporting normal request volumes. Investigate rate-limit counters, client identification, shared IP behavior, proxy configuration, and rate-limit thresholds.',
  },
  {
    title: 'Database Connection Pool Exhaustion',
    description:
      'New API requests are waiting for database connections and eventually timing out. The database remains reachable, but application connection usage is close to its configured maximum. Investigate connection leaks, transaction duration, pool sizing, and session cleanup.',
  },
  {
    title: 'Background Job Retries Failing',
    description:
      'Scheduled background jobs repeatedly fail and enter retry cycles without completing. The API remains available, but downstream data processing is delayed. Investigate job payloads, exception traces, retry limits, and dependency availability.',
  },
  {
    title: 'Slow Database Queries Affecting Reports',
    description:
      'Report generation has become significantly slower while other application features remain responsive. Database query duration has increased for report requests. Investigate query plans, missing or ineffective indexes, table growth, and lock contention.',
  },
  {
    title: 'Service-to-Service Communication Errors',
    description:
      'Requests between two internal services intermittently fail with connection reset and timeout errors. Retrying sometimes succeeds. Investigate service health, network connectivity, connection reuse, DNS resolution, and upstream timeout settings.',
  },
  {
    title: 'Expired TLS Certificate Warning',
    description:
      'A service integration is failing TLS connections after certificate validation errors appeared. Investigate certificate expiry, certificate-chain configuration, renewal status, and whether all service instances are using the expected certificate.',
  },
  {
    title: 'Inventory Stock Synchronization Delayed',
    description:
      'Inventory counts differ between the order service and the inventory service after recent order activity. Some updates appear delayed or processed more than once. Investigate event delivery, consumer offsets, idempotency, and synchronization retries.',
  },
  {
    title: 'Search Results Missing Recently Added Items',
    description:
      'Newly created products are visible in the primary database but do not consistently appear in search results. Older products remain searchable. Investigate indexing jobs, indexer errors, refresh intervals, and failed document updates.',
  },
  {
    title: 'Scheduled Report Job Not Running',
    description:
      'A scheduled reporting task did not execute at its expected time, leaving the latest report unavailable. Investigate scheduler health, job configuration, timezone settings, execution logs, and failures in prerequisite tasks.',
  },
];

const ROTATION_KEY = 'incident_demo_example_index';

function getInitialIndex() {
  try {
    const saved = Number(sessionStorage.getItem(ROTATION_KEY));

    return (
      Number.isInteger(saved) &&
      saved >= 0 &&
      saved < DEMO_INCIDENTS.length
    )
      ? saved
      : 0;
  } catch {
    return 0;
  }
}

function getNextExampleIndex(currentIndex) {
  return (currentIndex + 1) % DEMO_INCIDENTS.length;
}

export default function CreateIncident({ onCreated }) {
  const [exampleIndex, setExampleIndex] = useState(getInitialIndex);

  // Start with an empty form.
  const [form, setForm] = useState({
    title: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function tryExample() {
    if (loading) return;

    // Fill the form with the current example.
    setForm({ ...DEMO_INCIDENTS[exampleIndex] });
    setToast(null);

    // Advance the index for the next click.
    const nextIndex = getNextExampleIndex(exampleIndex);
    setExampleIndex(nextIndex);

    try {
      sessionStorage.setItem(ROTATION_KEY, String(nextIndex));
    } catch {
      // The form still works if session storage is unavailable.
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    if (!form.title.trim() || !form.description.trim()) {
      setToast({
        type: 'error',
        message: 'Please enter an incident title and description.',
      });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      const data = await apiFetch('/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
        }),
      });

      const incident = data?.incident ?? data;

      if (!incident?.id) {
        console.error('Unexpected create incident response:', data);

        throw new Error(
          'Incident was created, but the response did not contain an incident ID.'
        );
      }

      // Only the submit action creates an incident.
      onCreated?.(incident);
    } catch (error) {
      console.error('Create incident error:', error);

      setToast({
        type: 'error',
        message:
          error.message || 'Failed to create incident. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative mx-auto max-w-3xl">
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed right-5 top-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-red-200 bg-white p-4 shadow-xl dark:border-red-400/30 dark:bg-slate-900"
        >
          <span className="mt-0.5 text-lg text-red-600">✕</span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Error
            </p>
            <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          AI-Powered Incident Intelligence
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700/80 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Incident Information
            </h3>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Describe an incident or try a sample to get started.
            </p>
          </div>

          <button
            type="button"
            onClick={tryExample}
            disabled={loading}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-50 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-sky-400/20"
          >
            ✨ Try an example
          </button>
        </div>

        <div>
          <label
            htmlFor="incident-title"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Incident Title
          </label>

          <input
            id="incident-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={150}
            disabled={loading}
            placeholder="e.g. Payment service outage"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="incident-description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Incident Description
            </label>

            <span className="text-xs text-slate-400 dark:text-slate-500">
              {form.description.length}/5000
            </span>
          </div>

          <textarea
            id="incident-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            maxLength={5000}
            rows={4}
            disabled={loading}
            placeholder="Describe the incident, affected service, and observed errors..."
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
          />

          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Include symptoms, impact, error messages, and recent changes.
          </p>
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            !form.title.trim() ||
            !form.description.trim()
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:ring-offset-slate-900"
        >
          {loading && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}

          {loading ? 'Analyzing incident...' : 'Create Incident & Analyze'}
        </button>

        <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-3.5 dark:border-sky-400/15 dark:bg-sky-400/5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
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
                  d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
                />
                <path
                  strokeLinecap="round"
                  d="M19 15l1.1 2.9L23 19l-2.9 1.1L19 23l-1.1-2.9L15 19l2.9-1.1L19 15z"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                What happens next?
              </p>
              <p className="mt-1 text-sm leading-5 text-sky-800/80 dark:text-sky-100/70">
                AI analyzes the incident and finds similar historical
                incidents. You can review the suggested root cause,
                request rework, approve it, and access the final report.
                Human review is required before approval.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Submitting creates a shared incident visible to demo sessions.
        </p>
      </form>
    </section>
  );
}
