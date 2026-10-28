
import { useState } from 'react';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleStartDemo() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/demo/session`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(
          'Unable to start the demo session. Please try again.'
        );
      }

      const data = await response.json();

      if (!data.access_token || !data.expires_in) {
        throw new Error('Invalid session response from the server.');
      }

      onLogin(data);
    } catch (err) {
      setError(
        err.message ||
          'Cannot connect to the server. Make sure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-slate-950 px-5 py-12 text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl md:grid-cols-2">
        <section className="flex flex-col justify-between bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 sm:p-12">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/15 text-xl font-bold text-indigo-200">
              I
            </div>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              Incident Intelligence
            </p>

            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Understand incidents.
              <span className="block text-indigo-300">
                Resolve them smarter.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              An AI-powered incident triage platform that helps you analyze
              issues, investigate possible root causes, and discover similar
              incidents.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium text-slate-200">
              AI-assisted incident analysis
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              Explore the platform with a temporary demo session. No account
              registration is required.
            </p>
          </div>
        </section>

        <section className="flex flex-col justify-center p-8 sm:p-12">
          <p className="text-sm font-semibold text-indigo-600">
            WELCOME
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Enter your workspace
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Start a demo session to explore the incident management dashboard.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">
              Demo Login
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Get temporary access to your incident workspace without creating
              an account.
            </p>

            <button
              type="button"
              onClick={handleStartDemo}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Starting demo session...' : 'Start Demo Login'}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            Demo login only · No registration required
          </p>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
