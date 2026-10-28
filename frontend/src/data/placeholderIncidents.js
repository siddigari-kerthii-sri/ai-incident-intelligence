export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'settings', label: 'Settings' },
  { id: 'create-incident', label: 'Create Incident' },
];

export const OVERVIEW_STATS = [
  {
    id: 'open',
    label: 'Open Incidents',
    value: '12',
    hint: 'Across production services',
  },
  {
    id: 'critical',
    label: 'Critical Incidents',
    value: '3',
    hint: 'Requires immediate attention',
  },
  {
    id: 'resolved',
    label: 'Resolved Today',
    value: '7',
    hint: 'Closed in the last 24 hours',
  },
];

export const INCIDENT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'resolved', label: 'Resolved' },
];

export const INCIDENTS = [
  {
    id: 'INC-1042',
    title: 'Checkout API latency above SLO',
    service: 'payments-api',
    severity: 'Critical',
    status: 'Investigating',
    openedAt: '2026-10-07 14:12',
    description:
      'p95 latency on POST /checkout exceeded the 400ms SLO for 18 consecutive minutes. Downstream payment authorizations are delayed and conversion is dropping.',
    timeline: [
      { time: '14:12', event: 'Alert fired from SLO burn-rate monitor.' },
      { time: '14:16', event: 'On-call acknowledged the incident.' },
      { time: '14:28', event: 'Traffic shifted away from canary pool (placeholder).' },
    ],
    similarIncidents: ['INC-0988', 'INC-0912'],
  },
  {
    id: 'INC-1041',
    title: 'Elevated 5xx on auth gateway',
    service: 'identity',
    severity: 'High',
    status: 'Open',
    openedAt: '2026-10-07 13:48',
    description:
      'Auth gateway 5xx rate rose above 2% in us-east-1. Login and token refresh failures are concentrated on a single replica set.',
    timeline: [
      { time: '13:48', event: 'Error-rate alert triggered.' },
      { time: '13:55', event: 'Incident opened by identity on-call.' },
    ],
    similarIncidents: ['INC-1011'],
  },
  {
    id: 'INC-1039',
    title: 'Search index lag on catalog cluster',
    service: 'catalog',
    severity: 'Medium',
    status: 'Monitoring',
    openedAt: '2026-10-07 11:05',
    description:
      'Catalog search index is lagging 12 minutes behind the source of truth. New product updates are slow to appear in search results.',
    timeline: [
      { time: '11:05', event: 'Index lag exceeded 10-minute threshold.' },
      { time: '11:40', event: 'Indexer workers scaled up (placeholder).' },
    ],
    similarIncidents: ['INC-1004', 'INC-0960'],
  },
  {
    id: 'INC-1036',
    title: 'Disk pressure on log ingest nodes',
    service: 'observability',
    severity: 'Low',
    status: 'Resolved',
    openedAt: '2026-10-07 08:21',
    description:
      'Hot retention volumes on log ingest nodes crossed 85% utilization. Ingest continued, with delayed compaction.',
    timeline: [
      { time: '08:21', event: 'Disk pressure alert opened.' },
      { time: '09:10', event: 'Retention job completed; volumes recovered.' },
      { time: '09:18', event: 'Incident marked resolved.' },
    ],
    similarIncidents: ['INC-0875'],
  },
  {
    id: 'INC-1034',
    title: 'Intermittent timeouts in notification worker',
    service: 'notifications',
    severity: 'Medium',
    status: 'Resolved',
    openedAt: '2026-10-06 22:40',
    description:
      'Notification worker jobs timed out when calling the email provider. Retry backlog drained after the provider recovered.',
    timeline: [
      { time: '22:40', event: 'Timeout rate crossed warning threshold.' },
      { time: '23:15', event: 'Provider status page confirmed degradation.' },
      { time: '00:02', event: 'Backlog drained; incident resolved.' },
    ],
    similarIncidents: ['INC-0890'],
  },
  {
    id: 'INC-1031',
    title: 'Cache stampede on session store',
    service: 'identity',
    severity: 'Critical',
    status: 'Investigating',
    openedAt: '2026-10-07 12:04',
    description:
      'Session cache miss rate spiked, causing a stampede against the primary store. Active sessions are experiencing increased login latency.',
    timeline: [
      { time: '12:04', event: 'Cache miss ratio alert fired.' },
      { time: '12:11', event: 'Investigating eviction policy and key TTL (placeholder).' },
    ],
    similarIncidents: ['INC-0944'],
  },
  {
    id: 'INC-1028',
    title: 'Inventory sync job exceeding runtime',
    service: 'catalog',
    severity: 'High',
    status: 'Open',
    openedAt: '2026-10-07 10:22',
    description:
      'Nightly inventory sync is still running past its SLA window and blocking downstream replenishment updates.',
    timeline: [
      { time: '10:22', event: 'Job duration SLO breached.' },
      { time: '10:45', event: 'Batch size reduced for the current run (placeholder).' },
    ],
    similarIncidents: ['INC-0991'],
  },
  {
    id: 'INC-1024',
    title: 'CDN cache miss ratio above baseline',
    service: 'edge',
    severity: 'Medium',
    status: 'Monitoring',
    openedAt: '2026-10-07 09:33',
    description:
      'Origin traffic increased after a cache-key change. Static assets are being fetched from origin more often than usual.',
    timeline: [
      { time: '09:33', event: 'Cache miss ratio exceeded baseline.' },
      { time: '09:50', event: 'Change freeze requested on edge config (placeholder).' },
    ],
    similarIncidents: ['INC-0882'],
  },
  {
    id: 'INC-1019',
    title: 'Webhook delivery failures to billing partner',
    service: 'payments-api',
    severity: 'High',
    status: 'Resolved',
    openedAt: '2026-10-06 18:07',
    description:
      'Signed webhooks to the billing partner failed certificate validation after a downstream certificate rotation.',
    timeline: [
      { time: '18:07', event: 'Webhook failure alert opened.' },
      { time: '18:40', event: 'Trust store updated; retries succeeded.' },
      { time: '19:02', event: 'Incident resolved.' },
    ],
    similarIncidents: ['INC-0766'],
  },
  {
    id: 'INC-1012',
    title: 'Elevated CPU on recommendation workers',
    service: 'recommendations',
    severity: 'Critical',
    status: 'Open',
    openedAt: '2026-10-07 15:01',
    description:
      'Recommendation workers are saturating CPU after a model rollout. Homepage personalization latency is degraded.',
    timeline: [
      { time: '15:01', event: 'CPU saturation alert fired.' },
      { time: '15:08', event: 'Rollback of model revision under review (placeholder).' },
    ],
    similarIncidents: ['INC-0973', 'INC-0901'],
  },
];

export const RECENT_INCIDENTS = INCIDENTS.slice(0, 5);

export function matchesIncidentFilter(incident, filterId) {
  if (filterId === 'critical') return incident.severity === 'Critical';
  if (filterId === 'high') return incident.severity === 'High';
  if (filterId === 'medium') return incident.severity === 'Medium';
  if (filterId === 'resolved') return incident.status === 'Resolved';
  return true;
}

export function matchesIncidentSearch(incident, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [incident.id, incident.title, incident.service].some((value) =>
    value.toLowerCase().includes(q),
  );
}
