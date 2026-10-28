
import { useEffect, useState } from 'react';

import Header from './components/Header';
import IncidentsPage from './components/IncidentsPage';
import OverviewCards from './components/OverviewCards';
import RecentIncidentsTable from './components/RecentIncidentsTable';
import Sidebar from './components/Sidebar';
import CreateIncident from './components/CreateIncident';
import Settings from './components/Settings';

import LoginPage from './pages/LoginPage';

const STORAGE_KEY = 'incident-triage-settings';
const NAV_STORAGE_KEY = 'incident_active_nav';
const INCIDENT_STORAGE_KEY = 'incident_selected_id';

const VALID_PAGES = [
  'dashboard',
  'incidents',
  'create-incident',
  'settings',
];

function getSavedAppearance() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '{}'
    );

    return saved.appearance === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function getSavedDemoToken() {
  const token = sessionStorage.getItem('incident_demo_token');
  const expiry = Number(
    sessionStorage.getItem('incident_demo_expiry')
  );

  if (!token || !expiry || Date.now() >= expiry) {
    sessionStorage.removeItem('incident_demo_token');
    sessionStorage.removeItem('incident_demo_expiry');
    return null;
  }

  return token;
}

function getSavedActiveNav() {
  const saved = sessionStorage.getItem(NAV_STORAGE_KEY);

  return VALID_PAGES.includes(saved) ? saved : 'dashboard';
}

function getSavedIncidentId() {
  const saved = sessionStorage.getItem(INCIDENT_STORAGE_KEY);

  if (!saved) return null;

  const id = Number(saved);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function App() {
  const [demoToken, setDemoToken] = useState(getSavedDemoToken);
  const [activeNav, setActiveNav] = useState(getSavedActiveNav);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] =
    useState(getSavedIncidentId);

  const [globalToast, setGlobalToast] = useState(null);

  // Apply saved appearance and listen for settings changes.
  useEffect(() => {
    function applyAppearance(nextAppearance) {
      document.documentElement.classList.toggle(
        'dark',
        nextAppearance === 'dark'
      );

      document.documentElement.style.colorScheme = nextAppearance;
    }

    applyAppearance(getSavedAppearance());

    function handleSettingsUpdate(event) {
      const nextAppearance =
        event.detail?.appearance === 'dark' ? 'dark' : 'light';

      applyAppearance(nextAppearance);
    }

    window.addEventListener(
      'incident-triage-settings-updated',
      handleSettingsUpdate
    );

    return () => {
      window.removeEventListener(
        'incident-triage-settings-updated',
        handleSettingsUpdate
      );
    };
  }, []);

  // Persist the current page across refreshes.
  useEffect(() => {
    sessionStorage.setItem(NAV_STORAGE_KEY, activeNav);
  }, [activeNav]);

  // Persist the selected incident across refreshes.
  useEffect(() => {
    if (selectedIncidentId == null) {
      sessionStorage.removeItem(INCIDENT_STORAGE_KEY);
    } else {
      sessionStorage.setItem(
        INCIDENT_STORAGE_KEY,
        String(selectedIncidentId)
      );
    }
  }, [selectedIncidentId]);

  // Automatically dismiss the global toast.
  useEffect(() => {
    if (!globalToast) return;

    const timer = setTimeout(() => setGlobalToast(null), 3500);

    return () => clearTimeout(timer);
  }, [globalToast]);

  function handleDemoLogin(data) {
    if (!data?.access_token || !data?.expires_in) {
      console.error('The demo session response is invalid.');
      return;
    }

    sessionStorage.setItem(
      'incident_demo_token',
      data.access_token
    );

    sessionStorage.setItem(
      'incident_demo_expiry',
      String(Date.now() + data.expires_in * 1000)
    );

    sessionStorage.removeItem(NAV_STORAGE_KEY);
    sessionStorage.removeItem(INCIDENT_STORAGE_KEY);

    setDemoToken(data.access_token);
    setActiveNav('create-incident');
    setSelectedIncidentId(null);
    setGlobalToast(null);
  }

  function handleLogout() {
    sessionStorage.removeItem('incident_demo_token');
    sessionStorage.removeItem('incident_demo_expiry');
    sessionStorage.removeItem(NAV_STORAGE_KEY);
    sessionStorage.removeItem(INCIDENT_STORAGE_KEY);

    setDemoToken(null);
    setActiveNav('dashboard');
    setSelectedIncidentId(null);
    setSidebarOpen(false);
    setGlobalToast(null);
  }

  function handleNavigate(id) {
    setActiveNav(id);
    setSelectedIncidentId(null);
    setSidebarOpen(false);
  }

  function handleOpenIncident(incidentId) {
    setSelectedIncidentId(incidentId);
    setActiveNav('incidents');
    setSidebarOpen(false);
  }

  function handleIncidentCreated(data) {
    if (!data?.id) {
      console.error(
        'Incident creation succeeded without returning an incident ID.'
      );
      return;
    }

    setSelectedIncidentId(data.id);
    setActiveNav('incidents');
    setSidebarOpen(false);
  }

  function handleCreateSuccess(incident) {
    if (!incident?.id) return;

    setGlobalToast({
      type: 'success',
      message: `Incident #${incident.id} created successfully!`,
    });

    handleIncidentCreated(incident);
  }

  if (!demoToken) {
    return <LoginPage onLogin={handleDemoLogin} />;
  }

  return (
    <div className="flex min-h-svh bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* Global toast */}
      {globalToast && (
        <div
          role={globalToast.type === 'error' ? 'alert' : 'status'}
          aria-live={globalToast.type === 'error' ? 'assertive' : 'polite'}
          className={`fixed right-5 top-5 z-[100] flex w-auto max-w-[320px] items-start gap-2 rounded-xl border bg-white p-3 shadow-xl dark:bg-slate-900 ${
            globalToast.type === 'success'
              ? 'border-emerald-200 dark:border-emerald-400/30'
              : 'border-red-200 dark:border-red-400/30'
          }`}
        >
          <span
            className={`mt-0.5 text-lg ${
              globalToast.type === 'success'
                ? 'text-emerald-600'
                : 'text-red-600'
            }`}
          >
            {globalToast.type === 'success' ? '✓' : '✕'}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {globalToast.type === 'success' ? 'Success' : 'Error'}
            </p>

            <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
              {globalToast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setGlobalToast(null)}
            aria-label="Dismiss notification"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ×
          </button>
        </div>
      )}

      <Sidebar
        activeId={activeNav}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          activeNav={activeNav}
          onNavigate={handleNavigate}
          user={null}
          onLogout={handleLogout}
          isDemo={true}
        />

        <main className="flex-1 p-4 transition-colors duration-200 sm:p-6">
          {activeNav === 'dashboard' ? (
            <>
              <OverviewCards />
              <RecentIncidentsTable
                onIncidentClick={handleOpenIncident}
              />
            </>
          ) : activeNav === 'incidents' ? (
            <IncidentsPage
              key={selectedIncidentId ?? 'incidents-list'}
              initialSelectedId={selectedIncidentId}
              onIncidentOpened={() => setSelectedIncidentId(null)}
            />
          ) : activeNav === 'create-incident' ? (
            <CreateIncident onCreated={handleCreateSuccess} />
          ) : activeNav === 'settings' ? (
            <Settings />
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Page not found
              </h2>

              <button
                type="button"
                onClick={() => handleNavigate('dashboard')}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
              >
                Go to dashboard
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

