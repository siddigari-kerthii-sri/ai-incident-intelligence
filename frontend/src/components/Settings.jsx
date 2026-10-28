
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'incident-triage-settings';

const DEFAULT_SETTINGS = {
  newIncidentAlerts: true,
  criticalAlerts: true,
  statusUpdates: true,
  appearance: 'light',
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};

    return {
      ...DEFAULT_SETTINGS,
      newIncidentAlerts:
        parsed.newIncidentAlerts ?? DEFAULT_SETTINGS.newIncidentAlerts,
      criticalAlerts:
        parsed.criticalAlerts ?? DEFAULT_SETTINGS.criticalAlerts,
      statusUpdates:
        parsed.statusUpdates ?? DEFAULT_SETTINGS.statusUpdates,
      appearance: parsed.appearance === 'dark' ? 'dark' : 'light',
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function applyTheme(appearance) {
  document.documentElement.classList.toggle(
    'dark',
    appearance === 'dark'
  );
  document.documentElement.style.colorScheme = appearance;
}

function SettingRow({ title, description, children }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="border-b border-slate-100 pb-4 dark:border-slate-700">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {children}
      </div>
    </section>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [savedMessage, setSavedMessage] = useState('');

  // Read the current app theme on mount instead of resetting to saved settings.
 
  // Apply the saved theme when Settings mounts.
  useEffect(() => {
    const savedSettings = loadSettings();
    applyTheme(savedSettings.appearance);

    setSettings(savedSettings);
  }, []);


  useEffect(() => {
    if (!savedMessage) return undefined;

    const timeout = setTimeout(() => setSavedMessage(''), 2500);
    return () => clearTimeout(timeout);
  }, [savedMessage]);

 
function updateSetting(key, value) {
  setSettings((current) => {
    const next = { ...current, [key]: value };

    if (key === 'appearance') {
      applyTheme(value);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error('Unable to save appearance:', error);
      }

      window.dispatchEvent(
        new CustomEvent('incident-triage-settings-updated', {
          detail: next,
        })
      );
    }

    return next;
  });

  setSavedMessage('');
}


  function persistSettings(nextSettings, message) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
      applyTheme(nextSettings.appearance);

      window.dispatchEvent(
        new CustomEvent('incident-triage-settings-updated', {
          detail: nextSettings,
        })
      );

      setSavedMessage(message);
    } catch {
      setSavedMessage('Unable to save settings in this browser.');
    }
  }

  function saveSettings(event) {
    event.preventDefault();
    persistSettings(settings, 'Settings saved successfully.');
  }

  function resetSettings() {
    const defaults = { ...DEFAULT_SETTINGS };
    setSettings(defaults);
    persistSettings(defaults, 'Settings reset to defaults.');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-slate-900 dark:text-slate-100">
      <div>
        <p className="text-sm font-medium text-sky-700 dark:text-sky-400">
          WORKSPACE PREFERENCES
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage notification preferences and appearance.
        </p>
      </div>

      <form onSubmit={saveSettings} className="space-y-5">
        <Section
          title="Notification Preferences"
          description="Choose which incident events you want to receive in-app notifications for."
        >
          <SettingRow
            title="New incidents"
            description="Notify when a new incident is created."
          >
            <Toggle
              label="New incident notifications"
              checked={settings.newIncidentAlerts}
              onChange={(value) => updateSetting('newIncidentAlerts', value)}
            />
          </SettingRow>

          <SettingRow
            title="Critical incidents"
            description="Notify when an incident has Critical severity."
          >
            <Toggle
              label="Critical incident notifications"
              checked={settings.criticalAlerts}
              onChange={(value) => updateSetting('criticalAlerts', value)}
            />
          </SettingRow>

          <SettingRow
            title="Status updates"
            description="Notify when an incident status changes."
          >
            <Toggle
              label="Incident status update notifications"
              checked={settings.statusUpdates}
              onChange={(value) => updateSetting('statusUpdates', value)}
            />
          </SettingRow>

          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            These preferences are saved locally. They will control notification
            delivery once the app's in-app notification center is connected.
          </p>
        </Section>

        <Section
          title="Appearance"
          description="Choose the preferred color theme for the workspace."
        >
          <SettingRow
            title="Theme"
            description="Select light or dark appearance."
          >
            <div className="flex gap-2">
              {['light', 'dark'].map((theme) => (
                <button
                  key={theme}
                  type="button"
                  aria-pressed={settings.appearance === theme}
                  onClick={() => updateSetting('appearance', theme)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    settings.appearance === theme
                      ? 'border-sky-600 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </SettingRow>

          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            Theme changes apply immediately. Save settings to remember your
            preference after refreshing the app. Reset defaults restores light
            mode.
          </p>
        </Section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={resetSettings}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Reset defaults
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {savedMessage && (
              <p
                role="status"
                className="text-sm text-slate-600 dark:text-slate-300"
              >
                {savedMessage}
              </p>
            )}
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Save settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}




