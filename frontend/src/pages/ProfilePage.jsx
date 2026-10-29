import { useEffect, useState } from 'react';
import supabase from '../supabaseClient';

export default function ProfilePage({ user, onBack }) {
  const email = user?.email || 'Email unavailable';

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [toast, setToast] = useState(null);

  // Automatically dismiss the success toast.
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  async function handlePasswordUpdate(event) {
    event.preventDefault();

    setFeedback(null);
    setToast(null);

    if (newPassword.length < 8) {
      setFeedback({
        type: 'error',
        message: 'Your new password must contain at least 8 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        type: 'error',
        message: 'The passwords do not match. Please try again.',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');

      setToast({
        type: 'success',
        message: 'Password updated successfully!',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error.message ||
          'Unable to update your password. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Password update success toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 top-5 z-[100] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-xl dark:border-emerald-400/30 dark:bg-slate-900"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            ✓
          </span>

          <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
            {toast.message}
          </p>

          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Profile header */}
        <div className="flex flex-col items-center gap-4 border-b border-slate-200 pb-6 sm:flex-row dark:border-slate-800">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-10 w-10"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </div>

          <div className="min-w-0 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              My Account
            </h2>

            <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">
              {email}
            </p>
          </div>
        </div>

        {/* Account information */}
        <div className="space-y-5 pt-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Email address
            </p>

            <p className="mt-2 break-all text-sm font-medium text-slate-800 dark:text-slate-200">
              {email}
            </p>
          </div>

          {createdAt && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Account created
              </p>

              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                {createdAt}
              </p>
            </div>
          )}
        </div>

        {/* Change password */}
        <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Change password
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose a new password for your account.
          </p>

          <form onSubmit={handlePasswordUpdate} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                New password
              </label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                minLength={8}
                required
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Confirm new password
              </label>

              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter new password"
                minLength={8}
                required
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {/* Validation and API errors remain visible in the form */}
            {feedback && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300"
              >
                {feedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}