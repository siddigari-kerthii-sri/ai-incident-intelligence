

import { useCallback, useEffect, useState } from 'react';

import { apiFetch } from '../../api';

import IncidentHeader from './IncidentHeader';
import IncidentOverview from './IncidentOverview';
import AIAnalysis from './AIAnalysis';
import RootCauseReview from './RootCauseReview';
import CriticReview from './CriticReview';
import FinalReport from './FinalReport';
import SimilarIncidents from './SimilarIncidents';
import InvestigationNotes from './InvestigationNotes';
import ActivityTimeline from './ActivityTimeline';
import ResolutionDetails from './ResolutionDetails';

const STATUS_OPTIONS = ['Open', 'Investigating', 'Resolved'];

const INCIDENT_VIEWS = [
  { id: 'details', label: 'Details', icon: '◈' },
  { id: 'investigation', label: 'Investigation', icon: '⌕' },
  { id: 'resolution', label: 'Resolution', icon: '✓' },
  { id: 'activity', label: 'Activity Timeline', icon: '↗' },
  { id: 'report', label: 'Final Report', icon: '▤' },
];

function getSafeMessage(value, fallback = 'Something went wrong.') {
  if (typeof value === 'string') return value;

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value && typeof value === 'object') {
    if (typeof value.message === 'string') return value.message;
    if (typeof value.detail === 'string') return value.detail;
    if (typeof value.error === 'string') return value.error;

    if (Array.isArray(value)) {
      return value
        .map((item) => getSafeMessage(item, ''))
        .filter(Boolean)
        .join(', ');
    }
  }

  return fallback;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className="fixed right-5 top-5 z-[100] flex w-auto max-w-[320px] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
          isError
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
        }`}
      >
        {isError ? '!' : '✓'}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {isError ? 'Action needed' : 'Successfully saved'}
        </p>

        <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
          {getSafeMessage(toast.message)}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="rounded-lg px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        ×
      </button>
    </div>
  );
}

function LockedReport({ onGoToDetails }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/60 dark:bg-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-lg flex-col items-center py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
          🔒
        </div>

        <span className="mt-5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          Approval required
        </span>

        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          Final report is locked
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Review the AI-generated root cause and approve it before accessing
          the final incident report. This keeps the report gated by human
          verification.
        </p>

        <button
          type="button"
          onClick={onGoToDetails}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Go to root-cause review →
        </button>
      </div>
    </section>
  );
}

export default function IncidentDetails({
  incident,
  onBack,
  onStatusUpdated,
  onOpenIncident,
}) {
  const incidentId = incident?.id;

  const [activeView, setActiveView] = useState('details');

  const [status, setStatus] = useState(incident?.status || 'Open');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activityError, setActivityError] = useState('');

  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  const [resolutionText, setResolutionText] = useState('');
  const [savedResolution, setSavedResolution] = useState('');
  const [savingResolution, setSavingResolution] = useState(false);
  const [resolutionError, setResolutionError] = useState('');

  const [review, setReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewerFeedback, setReviewerFeedback] = useState('');
  const [proposedRootCause, setProposedRootCause] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');

  const [finalReport, setFinalReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  const [toast, setToast] = useState(null);

  const similarIncidents = Array.isArray(incident?.similar_incidents)
    ? incident.similar_incidents
    : [];

  const loadingSimilarIncidents = false;
  const similarIncidentsError = '';

  const showToast = useCallback((type, message) => {
    setToast({
      type,
      message: getSafeMessage(message, 'Action completed.'),
    });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    const incomingStatus =
      typeof incident?.status === 'string' &&
      STATUS_OPTIONS.includes(incident.status)
        ? incident.status
        : 'Open';

    setStatus(incomingStatus);
  }, [incident?.id, incident?.status]);

  const fetchActivities = useCallback(async () => {
    if (!incidentId) return;

    setLoadingActivities(true);
    setActivityError('');

    try {
      const data = await apiFetch(`/incidents/${incidentId}/activity`);

      const items = Array.isArray(data)
        ? data
        : data?.activities || data?.items || [];

      const safeItems = Array.isArray(items) ? items : [];

      setActivities(safeItems);

      // Restore the latest saved resolution from the persisted timeline.
      const resolutionActivity = [...safeItems]
        .filter(
          (item) =>
            item?.event_type === 'resolution_added' &&
            typeof item?.message === 'string' &&
            item.message.trim()
        )
        .sort((a, b) => {
          const dateA = new Date(a?.created_at || 0).getTime();
          const dateB = new Date(b?.created_at || 0).getTime();
          return dateB - dateA;
        })[0];

      setSavedResolution(resolutionActivity?.message || '');
    } catch (error) {
      setActivities([]);
      setSavedResolution('');

      setActivityError(
        getSafeMessage(
          error?.message ?? error,
          'Unable to load the activity timeline.'
        )
      );
    } finally {
      setLoadingActivities(false);
    }
  }, [incidentId]);

  const fetchFinalReport = useCallback(async () => {
    if (!incidentId) return;

    setLoadingReport(true);
    setReportError('');

    try {
      const data = await apiFetch(`/incidents/${incidentId}/final-report`);
      setFinalReport(data?.final_report ?? data?.report ?? data);
    } catch (error) {
      setFinalReport(null);

      setReportError(
        getSafeMessage(
          error?.message ?? error,
          'Unable to load the final report.'
        )
      );
    } finally {
      setLoadingReport(false);
    }
  }, [incidentId]);

  const fetchReview = useCallback(async () => {
    if (!incidentId) return;

    setLoadingReview(true);
    setReviewError('');

    try {
      const data = await apiFetch(`/incidents/${incidentId}/review`);
      const record = data?.review ?? data;

      setReview(record);

      setReviewerFeedback(
        typeof record?.feedback === 'string' ? record.feedback : ''
      );

      setProposedRootCause(
        record?.revised_analysis?.possible_root_cause ||
          record?.revised_root_cause ||
          record?.proposed_root_cause ||
          ''
      );

      if (record?.review_status === 'approved') {
        await fetchFinalReport();
      } else {
        setFinalReport(null);
        setReportError('');
      }
    } catch (error) {
      setReviewError(
        getSafeMessage(
          error?.message ?? error,
          'Unable to load the root-cause review.'
        )
      );
    } finally {
      setLoadingReview(false);
    }
  }, [incidentId, fetchFinalReport]);

  useEffect(() => {
    setActiveView('details');
    setReview(null);
    setFinalReport(null);
    setReviewError('');
    setReportError('');
    setReviewMessage('');
    setReviewerFeedback('');
    setProposedRootCause('');
    setNoteText('');
    setNoteError('');
    setResolutionText('');
    setSavedResolution('');
    setResolutionError('');
    setToast(null);

    fetchActivities();
    fetchReview();
  }, [incidentId, fetchActivities, fetchReview]);

  async function handleStatusChange(newStatus) {
    if (newStatus === status || savingStatus) return;

    // The backend remains the source of truth for saved resolution validation.
    // This avoids blocking resolution because the editor was cleared after saving.
    const previousStatus = status;

    setStatus(newStatus);
    setSavingStatus(true);
    setStatusError('');

    try {
      const data = await apiFetch(`/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const response =
        data && typeof data === 'object' && !Array.isArray(data)
          ? data
          : {};

      const responseIncident =
        response.incident &&
        typeof response.incident === 'object' &&
        !Array.isArray(response.incident)
          ? response.incident
          : {};

      const returnedStatus =
        response.status ??
        response.session_status ??
        response.incident_status ??
        responseIncident.status;

      const savedStatus =
        typeof returnedStatus === 'string' &&
        STATUS_OPTIONS.includes(returnedStatus)
          ? returnedStatus
          : newStatus;

      setStatus(savedStatus);
      onStatusUpdated?.(savedStatus);

      showToast('success', 'Incident status updated successfully.');
      await fetchActivities();
    } catch (error) {
      setStatus(previousStatus);

      const message = getSafeMessage(
        error?.message ?? error,
        'Unable to update incident status.'
      );

      setStatusError(message);
      showToast('error', message);
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleSaveNote(event) {
    event?.preventDefault();

    if (!noteText.trim()) {
      const message = 'Please enter an investigation note before saving.';
      setNoteError(message);
      showToast('error', message);
      return;
    }

    setSavingNote(true);
    setNoteError('');

    try {
      await apiFetch(`/incidents/${incidentId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: noteText.trim(),
          event_type: 'note_added',
        }),
      });

      setNoteText('');
      showToast(
        'success',
        'Investigation note saved to the activity timeline.'
      );

      await fetchActivities();
    } catch (error) {
      const message = getSafeMessage(
        error?.message ?? error,
        'Unable to save the investigation note.'
      );

      setNoteError(message);
      showToast('error', message);
    } finally {
      setSavingNote(false);
    }
  }

  async function handleSaveResolution(event) {
    event?.preventDefault();

    if (!resolutionText.trim()) {
      const message = 'Please enter the resolution details before saving.';
      setResolutionError(message);
      showToast('error', message);
      return;
    }

    setSavingResolution(true);
    setResolutionError('');

    try {
      const message = resolutionText.trim();

      await apiFetch(`/incidents/${incidentId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          event_type: 'resolution_added',
        }),
      });

      setSavedResolution(message);
      setResolutionText('');

      showToast('success', 'Resolution details saved successfully.');

      await fetchActivities();
    } catch (error) {
      const message = getSafeMessage(
        error?.message ?? error,
        'Unable to save resolution details.'
      );

      setResolutionError(message);
      showToast('error', message);
    } finally {
      setSavingResolution(false);
    }
  }

  async function submitReview(payload, successMessage) {
    setSubmittingReview(true);
    setReviewError('');
    setReviewMessage('');

    try {
      const data = await apiFetch(`/incidents/${incidentId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const record = data?.review ?? data;

      if (!record || typeof record !== 'object') {
        throw new Error('The server returned an invalid review response.');
      }

      setReview(record);

      setReviewerFeedback(
        typeof record.feedback === 'string'
          ? record.feedback
          : reviewerFeedback
      );

      setProposedRootCause(
        record.revised_analysis?.possible_root_cause ||
          record.revised_root_cause ||
          proposedRootCause
      );

      const message =
        record.review_status === 'rework_requested'
          ? 'AI reanalysis completed. Review the updated analysis below.'
          : successMessage;

      setReviewMessage(message);
      showToast('success', message);

      if (record.review_status === 'approved') {
        await fetchFinalReport();
      } else {
        setFinalReport(null);
        setReportError('');
      }

      await fetchActivities();
      await fetchReview();
    } catch (error) {
      const message = getSafeMessage(
        error?.message ?? error,
        'Unable to submit the root-cause review.'
      );

      setReviewError(message);
      showToast('error', message);
    } finally {
      setSubmittingReview(false);
    }
  }

  function handleRequestRework() {
    if (!reviewerFeedback.trim()) {
      showToast(
        'error',
        'Add reviewer feedback explaining what needs further investigation.'
      );
      return;
    }

    submitReview(
      {
        decision: 'request_rework',
        feedback: reviewerFeedback.trim(),
      },
      'Further investigation requested.'
    );
  }

  function handleApproveRootCause() {
    if (!proposedRootCause.trim()) {
      showToast('error', 'Enter a root-cause explanation before approving.');
      return;
    }

    submitReview(
      {
        decision: 'approve',
        revised_root_cause: proposedRootCause.trim(),
      },
      'Root cause approved. The final report is ready.'
    );
  }

  function handleSelectSimilarIncident(similarIncident) {
    const similarId = similarIncident?.id;

    if (similarId == null) return;

    if (String(similarId) === String(incidentId)) {
      showToast('success', 'You are already viewing this incident.');
      return;
    }

    if (typeof onOpenIncident === 'function') {
      onOpenIncident(similarId);
    } else {
      showToast('error', 'Unable to open this incident.');
    }
  }

  function handleViewChange(viewId) {
    if (viewId === 'report' && !isRootCauseApproved) return;
    setActiveView(viewId);
  }

  if (!incident) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          No incident selected
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Return to the incident queue and select an incident.
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Back to incidents
        </button>
      </div>
    );
  }

  const revisedAnalysis = review?.revised_analysis;

  const hasRevisedAnalysis = Boolean(
    revisedAnalysis &&
      typeof revisedAnalysis === 'object' &&
      revisedAnalysis.summary
  );

  const rawConfidence = hasRevisedAnalysis
    ? revisedAnalysis.confidence
    : incident.confidence;

  const parsedConfidence =
    rawConfidence === '' || rawConfidence == null
      ? null
      : Number(rawConfidence);

  const confidence =
    parsedConfidence == null || !Number.isFinite(parsedConfidence)
      ? null
      : Math.min(100, Math.max(0, parsedConfidence));

  const displayedAnalysis = {
    summary: revisedAnalysis?.summary || incident.summary,
    possible_root_cause:
      revisedAnalysis?.possible_root_cause ||
      review?.revised_root_cause ||
      review?.proposed_root_cause ||
      proposedRootCause ||
      incident.possible_root_cause,
    recommended_action:
      revisedAnalysis?.recommended_action || incident.recommended_action,
    severity: revisedAnalysis?.severity || incident.severity,
    category: revisedAnalysis?.category || incident.category,
    service: revisedAnalysis?.service || incident.service,
    confidence,
  };

  const aiAnalysisStatus =
    incident.ai_analysis_status || incident.analysis_status || 'completed';

  const isRootCauseApproved = review?.review_status === 'approved';

  const criticReview = review?.root_cause_review ?? review;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 pb-10 text-slate-800 dark:text-slate-100">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
      >
        <span aria-hidden="true">←</span>
        Back to incidents
      </button>

      <IncidentHeader
        incident={incident}
        displayedAnalysis={displayedAnalysis}
        status={status}
        savingStatus={savingStatus}
        statusError={statusError}
        handleStatusChange={handleStatusChange}
      />

      <nav
        aria-label="Incident sections"
        className="sticky top-0 z-20 -mx-1 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
      >
        <div className="flex gap-1 overflow-x-auto">
          {INCIDENT_VIEWS.map((view) => {
            const isActive = activeView === view.id;
            const isLocked = view.id === 'report' && !isRootCauseApproved;

            return (
              <button
                key={view.id}
                type="button"
                onClick={() => handleViewChange(view.id)}
                disabled={isLocked}
                aria-current={isActive ? 'page' : undefined}
                title={
                  isLocked
                    ? 'Approve the root cause before opening the final report'
                    : view.label
                }
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isLocked
                      ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <span aria-hidden="true" className="text-base">
                  {isLocked ? '🔒' : view.icon}
                </span>

                {view.label}

                {view.id === 'report' && isRootCauseApproved && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="min-w-0">
        {activeView === 'details' && (
          <div className="space-y-6">
            <IncidentOverview
              incident={incident}
              displayedAnalysis={displayedAnalysis}
              revisedAnalysis={revisedAnalysis}
            />

            <AIAnalysis
              displayedAnalysis={displayedAnalysis}
              aiAnalysisStatus={aiAnalysisStatus}
            />

            <CriticReview review={criticReview} />

            <RootCauseReview
              review={review}
              proposedRootCause={proposedRootCause}
              setProposedRootCause={setProposedRootCause}
              reviewerFeedback={reviewerFeedback}
              setReviewerFeedback={setReviewerFeedback}
              onRequestRework={handleRequestRework}
              onApprove={handleApproveRootCause}
              submittingReview={submittingReview}
              reviewError={reviewError}
            />

            {reviewMessage && (
              <p
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
              >
                {reviewMessage}
              </p>
            )}

            {loadingReview && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading root-cause review...
              </p>
            )}

            <SimilarIncidents
              incidents={similarIncidents}
              loading={loadingSimilarIncidents}
              error={similarIncidentsError}
              onRefresh={() => {}}
              onSelectIncident={handleSelectSimilarIncident}
            />
          </div>
        )}

        {activeView === 'investigation' && (
          <div className="space-y-5">
            <InvestigationNotes
              notes={[]}
              noteText={noteText}
              setNoteText={setNoteText}
              onSaveNote={handleSaveNote}
              savingNote={savingNote}
              error={noteError}
            />

            <button
              type="button"
              onClick={() => setActiveView('activity')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View investigation history →
            </button>
          </div>
        )}

        {activeView === 'resolution' && (
          <div className="space-y-5">
            <ResolutionDetails
              resolutionText={resolutionText}
              setResolutionText={setResolutionText}
              onSaveResolution={handleSaveResolution}
              savingResolution={savingResolution}
              incidentStatus={status}
              error={resolutionError}
            />
          </div>
        )}

        {activeView === 'activity' && (
          <div className="space-y-5">
            <ActivityTimeline
              activities={activities}
              loading={loadingActivities}
              error={activityError}
              onRefresh={fetchActivities}
            />
          </div>
        )}

        {activeView === 'report' && (
          <div className="space-y-5">
            {isRootCauseApproved ? (
              <FinalReport
                report={finalReport}
                approved={isRootCauseApproved}
                loading={loadingReport}
                error={reportError}
                onRefresh={fetchFinalReport}
              />
            ) : (
              <LockedReport
                onGoToDetails={() => setActiveView('details')}
              />
            )}
          </div>
        )}
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
