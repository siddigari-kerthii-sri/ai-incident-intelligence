
const PAGE_COPY = {
  dashboard: {
    title: "Incident Dashboard",
    subtitle: "Live operations overview",
  },
  incidents: {
    title: "Incidents",
    subtitle: "Search, filter, and inspect the incident queue",
  },
  settings: {
    title: "Settings",
    subtitle: "Manage your application preferences",
  },
  "create-incident": {
    title: "Create Incident",
    subtitle: "Report a new incident for investigation",
  },
  profile: {
    title: "My Profile",
    subtitle: "Manage your account information",
  },
};

export default function Header({
  onMenuClick,
  activeNav = "dashboard",
  onProfileClick,
  onLogout,
}) {
  const copy = PAGE_COPY[activeNav] ?? PAGE_COPY.dashboard;

  return (
    <header className="sticky top-0 z-20 flex min-h-[88px] items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
            {copy.title}
          </h1>
          <p className="mt-1 hidden truncate text-sm text-slate-500 dark:text-slate-400 sm:block">
            {copy.subtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 sm:flex dark:border-emerald-900/60 dark:bg-emerald-950/40">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Systems operational
          </span>
        </div>

        {/* Profile button */}
        <button
          type="button"
          onClick={onProfileClick}
          aria-label="Open profile"
          title="My Profile"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 dark:focus:ring-indigo-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
          </svg>
        </button>

        {/* Logout button */}
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
          className="flex h-10 items-center justify-center gap-2 rounded-full border border-rose-200 bg-white px-3 text-rose-600 shadow-sm transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100 dark:border-rose-900/60 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:focus:ring-rose-900 sm:px-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          </svg>
          <span className="hidden text-sm font-semibold sm:inline">
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}

