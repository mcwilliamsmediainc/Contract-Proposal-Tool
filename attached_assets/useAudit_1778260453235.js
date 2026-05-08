// =============================================================
// McWilliams Media Audit Tool — useAudit.js
// Custom React hook — handles all API calls and stage state
// Place at: src/audit/useAudit.js
// =============================================================

import { useState, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '';

export function useAudit() {
  const [leadId,       setLeadId]       = useState(null);
  const [stage,        setStage]        = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [scores,       setScores]       = useState(null);
  const [observations, setObservations] = useState(null);
  const [businessType, setBusinessType] = useState(null);
  const [proposalId,   setProposalId]   = useState(null);

  const post = useCallback(async (path, body) => {
    const res = await fetch(`${API_BASE}/api/audit${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }, []);

  // Stage 0 — micro-commitment selected, advance to URL form
  const selectChallenge = useCallback((challenge) => {
    sessionStorage.setItem('mcw_challenge', challenge);
    setStage(1);
  }, []);

  // Stage 1 — submit URL + City, create lead, start scan
  const startScan = useCallback(async (url, city) => {
    setLoading(true);
    setError(null);
    try {
      const challenge = sessionStorage.getItem('mcw_challenge');

      // Create the lead record
      const createData = await post('/create', { url, city, challenge });
      setLeadId(createData.leadId);
      setStage(2); // show scan animation

      // Run the actual scan (8–15 seconds)
      const scanData = await post('/scan', { leadId: createData.leadId });

      setScores(scanData.scores);
      setObservations(scanData.observations);
      setBusinessType(scanData.businessType);
      setStage(3); // show results
    } catch (err) {
      setError(err.message);
      setStage(1); // bounce back to form on error
    } finally {
      setLoading(false);
    }
  }, [post]);

  // Stage 3 — capture email, unlock Social + AI Visibility scores
  const captureEmail = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const data = await post('/capture', { leadId, email });
      // All 9 scores now unlocked
      setScores(data.scores);
      setObservations(data.observations);
      setStage(4); // show qualify form
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [leadId, post]);

  // Stage 4 — save qualification, create proposal shell
  const saveQualification = useCallback(async (budget, goal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await post('/qualify', { leadId, budget, goal });
      setProposalId(data.proposalId);
      setStage(5); // show confirmation
    } catch (err) {
      setError(err.message);
      setStage(5); // still advance — email is already captured
    } finally {
      setLoading(false);
    }
  }, [leadId, post]);

  // Skip qualification — go straight to confirm
  const skipQualification = useCallback(() => {
    setStage(5);
  }, []);

  // Request a proposal (from confirmation screen)
  const requestProposal = useCallback(async () => {
    if (!leadId) return;
    try {
      await post('/request-proposal', { leadId });
    } catch (err) {
      console.error('Proposal request failed:', err);
    }
  }, [leadId, post]);

  return {
    stage,
    loading,
    error,
    scores,
    observations,
    businessType,
    proposalId,
    selectChallenge,
    startScan,
    captureEmail,
    saveQualification,
    skipQualification,
    requestProposal,
  };
}
