// =============================================================
// McWilliams Media Audit Tool — Replit DB Data Layer
// =============================================================
// Key structure:
//   lead:{id}            → full lead object
//   lead:email:{email}   → reverse lookup: email → leadId
//   lead:list            → JSON array of all lead IDs
//   lead:pending         → JSON array of leads awaiting proposal
//   proposal:{id}        → proposal shell linked to a lead
// =============================================================

const Database = require('@replit/database');
const { v4: uuidv4 } = require('uuid');

const db = new Database();

const KEYS = {
  lead:        (id)    => `lead:${id}`,
  leadByEmail: (email) => `lead:email:${encodeURIComponent(email.toLowerCase())}`,
  leadList:    ()      => `lead:list`,
  leadPending: ()      => `lead:pending`,
  proposal:    (id)    => `proposal:${id}`,
};

// ─── LEAD CRUD ───────────────────────────────────────────────

async function createLead({ url, city, challenge }) {
  const id  = uuidv4();
  const now = new Date().toISOString();

  const lead = {
    id,
    createdAt:          now,
    updatedAt:          now,
    source:             'audit_tool',
    status:             'scanning',
    challenge,
    url,
    city,
    scores:             null,
    scanData:           null,
    businessType:       null,
    email:              null,
    emailCapturedAt:    null,
    budget:             null,
    goal:               null,
    qualifiedAt:        null,
    proposalId:         null,
    proposalCreatedAt:  null,
    proposalRequested:  false,
  };

  await db.set(KEYS.lead(id), JSON.stringify(lead));
  await appendToList(KEYS.leadList(), id);
  return lead;
}

async function saveScores(leadId, { scores, scanData, businessType }) {
  const lead = await getLead(leadId);
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const updated = {
    ...lead,
    scores,
    scanData,
    businessType,
    status:    'scored',
    updatedAt: new Date().toISOString(),
  };

  await db.set(KEYS.lead(leadId), JSON.stringify(updated));
  return updated;
}

async function captureEmail(leadId, email) {
  const lead = await getLead(leadId);
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const existingId = await db.get(KEYS.leadByEmail(email));
  if (existingId && existingId !== leadId) {
    return getLead(existingId);
  }

  const now = new Date().toISOString();
  const updated = {
    ...lead,
    email,
    emailCapturedAt: now,
    status:          'email_captured',
    updatedAt:       now,
  };

  await db.set(KEYS.lead(leadId), JSON.stringify(updated));
  await db.set(KEYS.leadByEmail(email), leadId);
  await appendToList(KEYS.leadPending(), leadId);
  return updated;
}

async function saveQualification(leadId, { budget, goal }) {
  const lead = await getLead(leadId);
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const now      = new Date().toISOString();
  const proposal = await createProposalShell(lead, { budget, goal });

  const updated = {
    ...lead,
    budget,
    goal,
    qualifiedAt:         now,
    status:              'proposal_ready',
    proposalId:          proposal.id,
    proposalCreatedAt:   now,
    updatedAt:           now,
  };

  await db.set(KEYS.lead(leadId), JSON.stringify(updated));
  await removeFromList(KEYS.leadPending(), leadId);
  return { lead: updated, proposal };
}

async function markProposalRequested(leadId) {
  const lead = await getLead(leadId);
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  const updated = {
    ...lead,
    proposalRequested:    true,
    proposalRequestedAt:  new Date().toISOString(),
    status:               'proposal_requested',
    updatedAt:            new Date().toISOString(),
  };

  await db.set(KEYS.lead(leadId), JSON.stringify(updated));
  return updated;
}

async function getLead(id) {
  const raw = await db.get(KEYS.lead(id));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function getLeadByEmail(email) {
  const id = await db.get(KEYS.leadByEmail(email));
  if (!id) return null;
  return getLead(id);
}

async function getAllLeads() {
  const ids   = await getList(KEYS.leadList());
  const leads = await Promise.all(ids.map(id => getLead(id)));
  return leads
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getPendingLeads() {
  const ids   = await getList(KEYS.leadPending());
  const leads = await Promise.all(ids.map(id => getLead(id)));
  return leads.filter(Boolean);
}

// ─── PROPOSAL SHELLS ─────────────────────────────────────────

async function createProposalShell(lead, { budget, goal }) {
  const id  = uuidv4();
  const now = new Date().toISOString();

  const recommendedServices = mapScoresToServices(lead.scores, goal);

  const proposal = {
    id,
    createdAt:  now,
    updatedAt:  now,
    status:     'pending_review',
    source:     'audit_tool',
    leadId:     lead.id,
    client: {
      email:        lead.email,
      website:      lead.url,
      city:         lead.city,
      businessType: lead.businessType,
      challenge:    lead.challenge,
    },
    auditSummary: {
      scores:    lead.scores,
      topIssues: getTopIssues(lead.scores),
    },
    qualification: {
      budget,
      estimatedMonthlyValue: mapBudgetToValue(budget),
      goal,
    },
    recommendedServices,
    proposalNotes: generateProposalNotes(lead, budget, goal, recommendedServices),
  };

  await db.set(KEYS.proposal(id), JSON.stringify(proposal));
  return proposal;
}

async function getProposal(id) {
  const raw = await db.get(KEYS.proposal(id));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function updateProposalStatus(proposalId, status) {
  const proposal = await getProposal(proposalId);
  if (!proposal) throw new Error(`Proposal not found: ${proposalId}`);
  const updated = { ...proposal, status, updatedAt: new Date().toISOString() };
  await db.set(KEYS.proposal(proposalId), JSON.stringify(updated));
  return updated;
}

// ─── SERVICE + SCORE MAPPING ─────────────────────────────────

function mapScoresToServices(scores, goal) {
  if (!scores) return [];
  const services = [];

  if (scores.ux < 60) services.push({
    name:     'Website Design',
    reason:   'Your site needs structural and mobile improvements to convert visitors into leads.',
    priority: 'high',
    url:      'https://mcwilliamsmedia.com/website-design/',
  });

  if (scores.seo < 60) services.push({
    name:     'SEO',
    reason:   'Low keyword visibility means customers searching for your service can\'t find you.',
    priority: scores.seo < 40 ? 'high' : 'medium',
    url:      'https://mcwilliamsmedia.com/seo/',
  });

  if (scores.social < 60) services.push({
    name:     'Social Media Management',
    reason:   'Inconsistent social presence is costing you brand trust and reach.',
    priority: 'medium',
    url:      'https://mcwilliamsmedia.com/social-media-management/',
  });

  if (scores.aiVisibility < 50) services.push({
    name:     'AI Search Optimization',
    reason:   'You\'re not showing up when customers use AI to find local businesses.',
    priority: 'high',
    url:      'https://mcwilliamsmedia.com/search-engine-optimization/#search',
  });

  if (scores.gbp < 65) services.push({
    name:     'Google Business Profile Management',
    reason:   'Your GBP profile needs regular activity to rank in the local pack.',
    priority: 'medium',
    url:      'https://mcwilliamsmedia.com/digital-marketing/',
  });

  if (scores.leadCapture < 60) services.push({
    name:     'Conversion Rate Optimization',
    reason:   'Visitors are landing on your site but leaving without being asked for anything.',
    priority: 'high',
    url:      'https://mcwilliamsmedia.com/website-design/',
  });

  if (goal === 'leads' || goal === 'all') services.push({
    name:     'Google Ads',
    reason:   'Fastest path to qualified leads while organic strategies build.',
    priority: 'medium',
    url:      'https://mcwilliamsmedia.com/google-adds/',
  });

  return services;
}

function mapBudgetToValue(budget) {
  const map = { lean: '$299–$799', mid: '$800–$2,000', high: '$2,000+' };
  return map[budget] || 'TBD';
}

function getTopIssues(scores) {
  if (!scores) return [];
  return Object.entries(scores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .map(([key]) => key);
}

function generateProposalNotes(lead, budget, goal, services) {
  const serviceNames = services.map(s => s.name).join(', ');
  return `Lead from Audit Tool — ${new Date().toLocaleDateString()}
Website: ${lead.url} (${lead.city})
Business type: ${lead.businessType || 'Unknown'}
Challenge: ${lead.challenge || '—'}
Goal: ${goal || '—'}
Budget: ${mapBudgetToValue(budget)}
Services recommended: ${serviceNames}
Scores — UX: ${lead.scores?.ux}/100 | SEO: ${lead.scores?.seo}/100 | Social: ${lead.scores?.social}/100 | AI Visibility: ${lead.scores?.aiVisibility}/100 | GBP: ${lead.scores?.gbp}/100 | Reviews: ${lead.scores?.reviews}/100 | Trust: ${lead.scores?.trust}/100 | Content: ${lead.scores?.content}/100 | Lead Capture: ${lead.scores?.leadCapture}/100`;
}

// ─── DASHBOARD ───────────────────────────────────────────────

async function getDashboardStats() {
  const allLeads = await getAllLeads();
  const pending  = await getPendingLeads();

  return {
    total:             allLeads.length,
    pending:           pending.length,
    emailCaptured:     allLeads.filter(l => l.email).length,
    proposalReady:     allLeads.filter(l => l.status === 'proposal_ready').length,
    proposalRequested: allLeads.filter(l => l.proposalRequested).length,
    avgScores:         computeAvgScores(allLeads),
    recentLeads:       allLeads.slice(0, 10),
  };
}

function computeAvgScores(leads) {
  const scored = leads.filter(l => l.scores);
  if (!scored.length) return null;
  const keys = ['ux', 'seo', 'social', 'aiVisibility', 'gbp', 'reviews', 'trust', 'content', 'leadCapture'];
  const avgs  = {};
  keys.forEach(k => {
    avgs[k] = Math.round(
      scored.reduce((sum, l) => sum + (l.scores?.[k] || 0), 0) / scored.length
    );
  });
  return avgs;
}

// ─── UTILITIES ───────────────────────────────────────────────

async function appendToList(key, value) {
  const raw  = await db.get(key);
  const list = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
  if (!list.includes(value)) list.push(value);
  await db.set(key, JSON.stringify(list));
}

async function removeFromList(key, value) {
  const raw     = await db.get(key);
  const list    = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
  const updated = list.filter(v => v !== value);
  await db.set(key, JSON.stringify(updated));
}

async function getList(key) {
  const raw = await db.get(key);
  if (!raw) return [];
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

module.exports = {
  createLead,
  saveScores,
  captureEmail,
  saveQualification,
  markProposalRequested,
  getLead,
  getLeadByEmail,
  getAllLeads,
  getPendingLeads,
  getProposal,
  updateProposalStatus,
  getDashboardStats,
};
