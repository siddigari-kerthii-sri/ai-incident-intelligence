
import { useState } from 'react';
import supabase from '../supabaseClient';

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setMessage('');

    // Normalize the email before validation and authentication.
    const normalizedEmail = email.trim().toLowerCase();

    // Reject incomplete email addresses such as "keerthi@gmail".
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setError('Please enter a valid email address, such as you@example.com.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      let result;

      if (mode === 'signup') {
        result = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
      }

      if (result.error) {
        throw result.error;
      }

      const session = result.data?.session;

      if (session?.access_token) {
        onLogin(session);
        return;
      }

      if (mode === 'signup') {
        setMessage(
          'Account creation was submitted, but no session was returned. Check your Supabase email-confirmation settings and try again.'
        );
      } else {
        throw new Error(
          'Login succeeded without an active session. Please try again.'
        );
      }
    } catch (err) {
      const authError = err?.message || '';

      if (/invalid login credentials/i.test(authError)) {
        setError(
          'Email or password is incorrect. If you are new here, create an account first.'
        );
      } else if (/already registered|already exists/i.test(authError)) {
        setError(
          'This email already has an account. Switch to Log in instead.'
        );
      } else if (
        /password/i.test(authError) &&
        mode === 'signup'
      ) {
        setError(
          'Please choose a stronger password. Use at least 8 characters.'
        );
      } else if (/fetch|network|failed to connect/i.test(authError)) {
        setError(
          'Unable to connect to Supabase. Check your project URL and frontend environment variables.'
        );
      } else {
        setError(authError || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
    setMessage('');
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
              Create an account to keep your incident history available when
              you return. No email verification is required with the current
              demo configuration.
            </p>
          </div>
        </section>

        <section className="flex flex-col justify-center p-8 sm:p-12">
          <p className="text-sm font-semibold text-indigo-600">
            {mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {mode === 'login'
              ? 'Enter your workspace'
              : 'Create your account'}
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {mode === 'login'
              ? 'Log in to continue to your incident workspace.'
              : 'Sign up to create your own incident workspace.'}
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => changeMode('login')}
              disabled={loading}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Log in
            </button>

            <button
              type="button"
              onClick={() => changeMode('signup')}
              disabled={loading}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="auth-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="auth-password"
                type="password"
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  mode === 'signup'
                    ? 'At least 8 characters'
                    : 'Enter your password'
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />

              {mode === 'signup' && (
                <p className="mt-2 text-xs text-slate-400">
                  Choose a password you can remember.
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Log in'
                  : 'Create account'}

              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}

            <button
              type="button"
              onClick={() =>
                changeMode(mode === 'login' ? 'signup' : 'login')
              }
              disabled={loading}
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
