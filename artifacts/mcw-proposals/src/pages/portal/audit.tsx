import { useState, useEffect, useRef } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Globe,
  MapPin,
  Mail,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Share2,
  Bot,
  Lock,
  Star,
  Shield,
  FileText,
  Target,
  MapPinned,
  ArrowRight,
  Zap,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type WizardStep = "challenge" | "intro" | "scanning" | "results" | "qualify" | "done";

// ── Types ─────────────────────────────────────────────────────────────────

interface Observation {
  summary: string;
  friendlyTranslation: string;
  cliffhanger: string;
  aiQuote?: string;
}

interface NinePillarScores {
  ux:          number | null;
  seo:         number | null;
  gbp:         number | null;
  reviews:     number | null;
  trust:       number | null;
  content:     number | null;
  leadCapture: number | null;
  social:      number | null;
  aiVisibility:number | null;
}

interface NinePillarObs {
  ux?:          Observation;
  seo?:         Observation;
  gbp?:         Observation;
  reviews?:     Observation;
  trust?:       Observation;
  content?:     Observation;
  leadCapture?: Observation;
  social?:      Observation;
  aiVisibility?:Observation;
}

// ── Pillar config ─────────────────────────────────────────────────────────

const PILLARS: {
  key: keyof NinePillarScores;
  label: string;
  Icon: React.ElementType;
  gated?: boolean;
}[] = [
  { key: "ux",          label: "Website UX",              Icon: Globe     },
  { key: "seo",         label: "SEO Presence",            Icon: Search    },
  { key: "gbp",         label: "Google Business Profile", Icon: MapPinned },
  { key: "reviews",     label: "Review Signals",          Icon: Star      },
  { key: "trust",       label: "Trust Signals",           Icon: Shield    },
  { key: "content",     label: "Content Health",          Icon: FileText  },
  { key: "leadCapture", label: "Lead Capture",            Icon: Target    },
  { key: "social",      label: "Social Media",            Icon: Share2,   gated: true },
  { key: "aiVisibility",label: "AI Visibility",           Icon: Bot,      gated: true },
];

const CHALLENGES = [
  { id: "leads",    label: "We're not getting enough leads",     emoji: "📉" },
  { id: "google",   label: "We can't be found on Google",        emoji: "🔍" },
  { id: "outdated", label: "Our website looks outdated",          emoji: "🖥️" },
  { id: "reviews",  label: "We need more reviews / reputation",  emoji: "⭐" },
];

const SCAN_STEPS = [
  { icon: Globe,     label: "Checking page speed & UX…"           },
  { icon: Search,    label: "Analyzing SEO structure…"             },
  { icon: MapPinned, label: "Evaluating Google Business Profile…"  },
  { icon: Star,      label: "Scanning review signals…"             },
  { icon: Shield,    label: "Checking trust indicators…"           },
  { icon: FileText,  label: "Reviewing content strategy…"          },
  { icon: Target,    label: "Testing lead capture readiness…"      },
  { icon: Share2,    label: "Analyzing social presence…"           },
  { icon: Bot,       label: "Assessing AI visibility…"             },
];

// ── Score helpers ─────────────────────────────────────────────────────────

function scoreColor(s: number | null | undefined) {
  if (s == null) return "text-white/30";
  if (s >= 70) return "text-emerald-400";
  if (s >= 50) return "text-amber-400";
  return "text-red-400";
}

function scoreBgClass(s: number | null | undefined) {
  if (s == null) return "bg-white/5 border-white/10";
  if (s >= 70) return "bg-emerald-500/10 border-emerald-500/30";
  if (s >= 50) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function scoreLabel(s: number | null | undefined) {
  if (s == null) return "Locked";
  if (s >= 70) return "Good";
  if (s >= 50) return "Needs Work";
  return "Critical";
}

function overallScore(scores: NinePillarScores): number {
  const vals = Object.values(scores).filter((v): v is number => typeof v === "number");
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// ── Progress tracker ──────────────────────────────────────────────────────

const STEP_LABELS: Partial<Record<WizardStep, string>> = {
  challenge: "Challenge",
  intro:     "Your Site",
  scanning:  "Scanning",
  results:   "Results",
  qualify:   "Qualify",
  done:      "Done",
};

function ProgressBar({ step }: { step: WizardStep }) {
  const order: WizardStep[] = ["challenge", "intro", "scanning", "results", "qualify", "done"];
  const current = order.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-1 mb-10">
      {order.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all",
            i < current  ? "bg-[#C9A959]/80 text-[#061e57]"
            : i === current ? "bg-[#b3cee1]/20 text-[#b3cee1]"
            : "bg-white/5 text-white/25"
          )}>
            {STEP_LABELS[s]}
          </div>
          {i < order.length - 1 && (
            <div className={cn("w-4 h-px", i < current ? "bg-[#C9A959]/50" : "bg-white/10")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Pillar card ───────────────────────────────────────────────────────────

interface PillarCardProps {
  Icon: React.ElementType;
  label: string;
  score: number | null | undefined;
  locked?: boolean;
  observation?: Observation;
  expandKey?: string;
  expanded?: string | null;
  onToggle?: (k: string) => void;
}

function PillarCard({ Icon, label, score, locked, observation, expandKey, expanded, onToggle }: PillarCardProps) {
  const isExpanded = expandKey && expanded === expandKey;
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        locked ? "bg-white/5 border-white/10 opacity-70" : scoreBgClass(score),
        !locked && observation && onToggle ? "cursor-pointer hover:opacity-90" : ""
      )}
      onClick={() => !locked && observation && expandKey && onToggle?.(expandKey)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-[#b3cee1]" />
          </div>
          <span className="text-xs font-semibold text-white leading-tight">{label}</span>
        </div>
        {locked ? (
          <div className="flex items-center gap-1 text-white/25">
            <Lock className="w-3 h-3" />
          </div>
        ) : (
          <span className={cn("text-xl font-bold font-mono", scoreColor(score))}>{score}</span>
        )}
      </div>

      {locked ? (
        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1.5 mt-1">
          <Lock className="w-2.5 h-2.5 text-[#C9A959]/50 flex-shrink-0" />
          <p className="text-[10px] text-[#b3cee1]/40">Unlock with email</p>
        </div>
      ) : (
        <>
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-1.5">
            <div
              className={cn("h-1.5 rounded-full transition-all duration-1000",
                score != null && score >= 70 ? "bg-emerald-400"
                : score != null && score >= 50 ? "bg-amber-400"
                : "bg-red-400"
              )}
              style={{ width: `${score ?? 0}%` }}
            />
          </div>
          <p className={cn("text-[10px] font-semibold uppercase tracking-wider", scoreColor(score))}>
            {scoreLabel(score)}
          </p>
          {observation && !isExpanded && (
            <p className="text-[10px] text-[#b3cee1]/50 mt-1 line-clamp-2 leading-relaxed">
              {observation.friendlyTranslation}
            </p>
          )}
          {isExpanded && observation && (
            <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
              <p className="text-xs text-[#b3cee1]/80 leading-relaxed">{observation.summary}</p>
              <p className="text-xs text-amber-300/90 font-medium leading-snug">→ {observation.cliffhanger}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main wizard component ─────────────────────────────────────────────────

export default function AuditWizard() {
  const [step,          setStep]          = useState<WizardStep>("challenge");
  const [challenge,     setChallenge]     = useState("");
  const [leadId,        setLeadId]        = useState<string | null>(null);
  const [url,           setUrl]           = useState("");
  const [city,          setCity]          = useState("");
  const [email,         setEmail]         = useState("");
  const [budget,        setBudget]        = useState("");
  const [goal,          setGoal]          = useState("");
  const [scores,        setScores]        = useState<NinePillarScores>({
    ux: null, seo: null, gbp: null, reviews: null, trust: null, content: null,
    leadCapture: null, social: null, aiVisibility: null,
  });
  const [observations,  setObservations]  = useState<NinePillarObs>({});
  const [businessType,  setBusinessType]  = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [scanProgress,  setScanProgress]  = useState(0);
  const [scanStepIdx,   setScanStepIdx]   = useState(0);
  const [emailLoading,  setEmailLoading]  = useState(false);
  const [emailError,    setEmailError]    = useState("");
  const [qualifyLoading,setQualifyLoading]= useState(false);
  const [qualifyError,  setQualifyError]  = useState("");
  const [proposalSent,  setProposalSent]  = useState(false);
  const [proposalLoading,setProposalLoading]= useState(false);
  const [expanded,      setExpanded]      = useState<string | null>(null);
  const scanFired = useRef(false);

  // Handle ?status=proposal_requested from email link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "proposal_requested") setStep("done");
  }, []);

  // Scan progress ticker while scanning
  useEffect(() => {
    if (step !== "scanning") return;
    const interval = setInterval(() => {
      setScanProgress(p => Math.min(p + Math.random() * 6, 92));
      setScanStepIdx(i => Math.min(i + 1, SCAN_STEPS.length - 1));
    }, 1600);
    return () => clearInterval(interval);
  }, [step]);

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleChallengeSelect(c: string) {
    setChallenge(c);
    setStep("intro");
  }

  async function handleStart() {
    setError(null);
    if (!url.trim() || !city.trim()) {
      setError("Please enter your website URL and city.");
      return;
    }
    const fullUrl = url.trim().startsWith("http") ? url.trim() : "https://" + url.trim();

    try {
      const r = await fetch(`${BASE}/api/audit/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl, city: city.trim(), challenge: challenge || undefined }),
      });
      const data = await r.json() as { leadId?: string; error?: string };
      if (!r.ok) throw new Error(data.error ?? "Failed to create audit");

      setLeadId(data.leadId ?? null);
      setUrl(fullUrl);
      setScanProgress(0);
      setScanStepIdx(0);
      scanFired.current = false;
      setStep("scanning");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  // Fire the actual scan once we're on the scanning step
  useEffect(() => {
    if (step !== "scanning" || !leadId || scanFired.current) return;
    scanFired.current = true;

    (async () => {
      try {
        const scanRes = await fetch(`${BASE}/api/audit/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId }),
        });
        const scanData = await scanRes.json() as {
          scores?: NinePillarScores;
          observations?: NinePillarObs;
          businessType?: string;
          error?: string;
        };
        if (!scanRes.ok) throw new Error(scanData.error ?? "Scan failed");

        setScanProgress(100);
        setScores(scanData.scores ?? scores);
        setObservations(scanData.observations ?? {});
        setBusinessType(scanData.businessType ?? null);
        setTimeout(() => setStep("results"), 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scan failed. Please check the URL and try again.");
        setStep("intro");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, leadId]);

  async function handleEmailCapture() {
    setEmailError("");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailLoading(true);
    try {
      const r = await fetch(`${BASE}/api/audit/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, email: email.trim() }),
      });
      const data = await r.json() as {
        scores?: NinePillarScores;
        observations?: NinePillarObs;
        businessType?: string;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error ?? "Failed to save email.");

      if (data.scores) setScores(data.scores);
      if (data.observations) setObservations(data.observations);
      setStep("qualify");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleQualify(skip = false) {
    setQualifyError("");
    setQualifyLoading(true);
    try {
      await fetch(`${BASE}/api/audit/qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, budget: skip ? null : budget || null, goal: skip ? null : goal || null }),
      });
      setStep("done");
    } catch {
      setQualifyError("Something went wrong — please try again.");
    } finally {
      setQualifyLoading(false);
    }
  }

  async function handleRequestProposal() {
    setProposalLoading(true);
    try {
      await fetch(`${BASE}/api/audit/request-proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      setProposalSent(true);
    } catch {
      setProposalSent(true);
    } finally {
      setProposalLoading(false);
    }
  }

  const urlClean = url.replace(/^https?:\/\//, "") || "your site";
  const overall  = overallScore(scores);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#061e57] text-white">
      <PublicHeader />

      <div className="max-w-2xl mx-auto px-6 py-14">

        {/* ── Stage 0: Challenge Picker ── */}
        {step === "challenge" && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#C9A959]/15 border border-[#C9A959]/30 rounded-full px-4 py-1.5 text-[#C9A959] text-xs font-semibold uppercase tracking-wider mb-8">
              <Zap className="w-3 h-3" />
              Free 9-Pillar Digital Audit
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Is your website<br />
              <span className="text-[#C9A959]">losing you customers?</span>
            </h1>
            <p className="text-[#b3cee1] text-lg leading-relaxed max-w-xl mx-auto mb-10">
              We'll scan your site across 9 digital health areas and show you exactly
              where leads are slipping away — in 60 seconds.
            </p>

            <p className="text-xs font-bold tracking-[0.2em] text-[#C9A959] mb-5 uppercase">
              What's your biggest challenge?
            </p>

            <div className="grid grid-cols-2 gap-3 mb-10">
              {CHALLENGES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleChallengeSelect(c.id)}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition-all duration-200 hover:bg-white/10 hover:border-[#C9A959]/40 hover:scale-[1.02] cursor-pointer"
                >
                  <span className="text-3xl">{c.emoji}</span>
                  <span className="text-sm font-semibold leading-tight text-white">{c.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-[#b3cee1]/40">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#C9A959]/60" /> No login required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#C9A959]/60" /> AI-powered analysis</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#C9A959]/60" /> Free PDF report</span>
            </div>
          </div>
        )}

        {/* ── Stage 1: URL + City Form ── */}
        {step === "intro" && (
          <>
            <ProgressBar step={step} />
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-[#C9A959]/15 border border-[#C9A959]/30 rounded-full px-4 py-1.5 text-[#C9A959] text-xs font-semibold uppercase tracking-wider mb-4">
                {CHALLENGES.find(c => c.id === challenge)?.emoji} &nbsp;
                {CHALLENGES.find(c => c.id === challenge)?.label ?? "Free Digital Audit"}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Tell us where to look</h2>
              <p className="text-[#b3cee1]">We'll audit your site and show you exactly what to fix.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#b3cee1] uppercase tracking-wider mb-2">
                  Your Website URL <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="yourwebsite.com"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/25 focus:border-[#b3cee1] h-12"
                    onKeyDown={e => e.key === "Enter" && void handleStart()}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#b3cee1] uppercase tracking-wider mb-2">
                  Your City / Market <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Tulsa, OK"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/25 focus:border-[#b3cee1] h-12"
                    onKeyDown={e => e.key === "Enter" && void handleStart()}
                  />
                </div>
              </div>

              {error && (
                <p className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </p>
              )}

              <Button
                onClick={() => void handleStart()}
                className="w-full bg-[#C9A959] hover:bg-[#b8954a] text-[#061e57] font-bold text-base h-14 rounded-xl"
              >
                Start My Free Audit
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>

              <button
                onClick={() => setStep("challenge")}
                className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors py-1 cursor-pointer"
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {/* ── Stage 2: Scanning ── */}
        {step === "scanning" && (
          <div className="text-center py-8">
            <ProgressBar step={step} />
            <div className="w-20 h-20 rounded-full bg-[#C9A959]/10 border border-[#C9A959]/20 flex items-center justify-center mx-auto mb-8">
              <Loader2 className="w-9 h-9 text-[#C9A959] animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Scanning {urlClean}…</h2>
            <p className="text-[#b3cee1] mb-8">Our AI is analyzing your site across 9 pillars. Takes about 15 seconds.</p>

            <div className="max-w-sm mx-auto mb-8">
              <div className="flex justify-between text-xs text-[#b3cee1]/60 mb-2">
                <span>Analyzing…</span>
                <span>{Math.round(scanProgress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-[#C9A959] transition-all duration-500"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto text-left">
              {SCAN_STEPS.map(({ icon: StepIcon, label }, i) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-2.5 text-xs rounded-lg px-3 py-2 transition-all",
                    i < scanStepIdx  ? "bg-emerald-500/10 text-emerald-400"
                    : i === scanStepIdx ? "bg-[#C9A959]/10 text-[#C9A959]"
                    : "text-[#b3cee1]/30"
                  )}
                >
                  {i < scanStepIdx
                    ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    : <StepIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  }
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stage 3: Results + Email gate ── */}
        {step === "results" && (
          <>
            <ProgressBar step={step} />

            {/* Overall score hero */}
            <div className="text-center mb-8">
              <p className="text-[#C9A959] text-xs font-bold uppercase tracking-widest mb-2">Scan Complete</p>
              {businessType && (
                <p className="text-[#b3cee1] text-sm mb-3">
                  We identified your site as: <span className="text-white font-semibold">{businessType}</span>
                </p>
              )}
              <div className="inline-flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 mb-4"
                   style={{
                     borderColor: overall >= 70 ? "#10b981" : overall >= 50 ? "#f59e0b" : "#ef4444",
                     background:  overall >= 70 ? "rgba(16,185,129,0.1)" : overall >= 50 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                   }}>
                <span className={cn("text-4xl font-black", scoreColor(overall))}>{overall}</span>
                <span className="text-white/40 text-xs">/100</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {overall >= 70
                  ? "Good foundation — a few opportunities to grow."
                  : overall >= 50
                  ? "Room to improve — several areas need attention."
                  : "Significant gaps found — the good news: they're fixable."}
              </h2>
            </div>

            {/* 7 visible + 2 locked pillars */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {PILLARS.map((p) => (
                <PillarCard
                  key={p.key}
                  Icon={p.Icon}
                  label={p.label}
                  score={p.gated ? null : scores[p.key]}
                  locked={p.gated}
                  observation={p.gated ? undefined : observations[p.key as keyof NinePillarObs]}
                  expandKey={p.key}
                  expanded={expanded}
                  onToggle={k => setExpanded(expanded === k ? null : k)}
                />
              ))}
            </div>

            {/* Cliffhanger from top concern */}
            {observations.ux?.cliffhanger && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">{observations.ux.cliffhanger}</p>
              </div>
            )}

            {/* Email gate */}
            <div className="bg-white/5 border border-[#C9A959]/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#C9A959]/15 border border-[#C9A959]/30 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#C9A959]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Unlock Your Full Report</h3>
                  <p className="text-[#b3cee1] text-xs">Unlock Social + AI Visibility scores + get a free PDF</p>
                </div>
              </div>

              <div className="relative mb-3">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/25 focus:border-[#b3cee1] h-12"
                  onKeyDown={e => e.key === "Enter" && void handleEmailCapture()}
                  autoFocus
                />
              </div>

              {emailError && (
                <p className="flex items-center gap-2 text-red-400 text-sm mb-3">
                  <AlertTriangle className="w-4 h-4" /> {emailError}
                </p>
              )}

              <Button
                onClick={() => void handleEmailCapture()}
                disabled={emailLoading}
                className="w-full bg-[#C9A959] hover:bg-[#b8954a] text-[#061e57] font-bold h-12 rounded-xl"
              >
                {emailLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : <>Unlock Full Report <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
              <p className="text-xs text-white/25 text-center mt-3">No spam. Unsubscribe anytime.</p>
            </div>
          </>
        )}

        {/* ── Stage 4: Qualify ── */}
        {step === "qualify" && (
          <>
            <ProgressBar step={step} />
            <div className="text-center mb-8">
              <p className="text-[#C9A959] text-xs font-bold uppercase tracking-widest mb-2">Almost Done</p>
              <h2 className="text-3xl font-bold text-white mb-2">Two Quick Questions</h2>
              <p className="text-[#b3cee1]">Help us tailor your roadmap — takes 10 seconds.</p>
            </div>

            {/* Score recap */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#b3cee1] uppercase tracking-wider">Your Full 9-Pillar Scores</p>
                <span className={cn("text-lg font-bold font-mono", scoreColor(overall))}>{overall}/100</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {PILLARS.map(p => (
                  <div key={p.key} className="text-center">
                    <p className={cn("text-base font-bold", scoreColor(scores[p.key]))}>{scores[p.key] ?? "—"}</p>
                    <p className="text-[9px] text-white/40 leading-tight">{p.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#b3cee1] uppercase tracking-wider mb-3">
                  Monthly marketing budget
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "under_800",  l: "Under $800/mo"   },
                    { v: "800_2000",   l: "$800 – $2,000/mo"},
                    { v: "2000_plus",  l: "$2,000+/mo"      },
                    { v: "not_sure",   l: "Not sure yet"    },
                  ].map(({ v, l }) => (
                    <button key={v} type="button"
                      onClick={() => setBudget(v)}
                      className={cn(
                        "rounded-lg py-2.5 px-3 text-sm font-medium border transition-all cursor-pointer",
                        budget === v
                          ? "bg-[#C9A959] text-[#061e57] border-[#C9A959]"
                          : "bg-white/5 text-white border-white/10 hover:border-white/30"
                      )}
                    >{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b3cee1] uppercase tracking-wider mb-3">
                  Biggest goal right now
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "more_leads", l: "More website leads"      },
                    { v: "google",     l: "Better Google visibility" },
                    { v: "social",     l: "Grow social media"        },
                    { v: "all",        l: "All of the above"         },
                  ].map(({ v, l }) => (
                    <button key={v} type="button"
                      onClick={() => setGoal(v)}
                      className={cn(
                        "rounded-lg py-2.5 px-3 text-sm font-medium border transition-all cursor-pointer",
                        goal === v
                          ? "bg-[#C9A959] text-[#061e57] border-[#C9A959]"
                          : "bg-white/5 text-white border-white/10 hover:border-white/30"
                      )}
                    >{l}</button>
                  ))}
                </div>
              </div>

              {qualifyError && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {qualifyError}
                </p>
              )}

              <Button
                onClick={() => void handleQualify(false)}
                disabled={qualifyLoading}
                className="w-full bg-[#C9A959] hover:bg-[#b8954a] text-[#061e57] font-bold h-12 rounded-xl"
              >
                {qualifyLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <>Build My Roadmap <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>

              <button
                onClick={() => void handleQualify(true)}
                className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors py-1 cursor-pointer"
              >
                Skip, just take me to my results →
              </button>
            </div>
          </>
        )}

        {/* ── Stage 5: Done / Confirmation ── */}
        {step === "done" && (
          <>
            <ProgressBar step={step} />
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Your report is on its way!</h2>
              {email && (
                <p className="text-[#b3cee1]">
                  Check <span className="text-white font-semibold">{email}</span> for your full 9-pillar PDF report.
                </p>
              )}
            </div>

            {/* Score grid */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
              <p className="text-xs font-bold text-[#b3cee1] uppercase tracking-wider mb-4 text-center">Your Digital Health Scorecard</p>
              <div className="grid grid-cols-3 gap-2">
                {PILLARS.map(p => (
                  <div key={p.key}
                       className={cn("rounded-xl p-3 text-center border", scoreBgClass(scores[p.key]))}>
                    <p className={cn("text-xl font-bold", scoreColor(scores[p.key]))}>
                      {scores[p.key] ?? "—"}
                    </p>
                    <p className="text-[10px] text-white/50 mt-0.5 leading-tight">{p.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposal CTA */}
            <div className="bg-white/5 border border-[#C9A959]/30 rounded-2xl p-6 text-center">
              {proposalSent ? (
                <>
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="text-xl font-bold text-white mb-2">Proposal Request Received!</h3>
                  <p className="text-[#b3cee1] text-sm">
                    Our team will reach out within 1 business day to walk through your results
                    and build a custom plan.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[#C9A959] text-xs font-bold uppercase tracking-widest mb-3">Ready to fix this?</p>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {overall >= 70
                      ? "Let's take your site to the next level"
                      : overall >= 50
                      ? "Let's close the gaps in your digital presence"
                      : "Let's turn these gaps into your biggest advantage"}
                  </h3>
                  <p className="text-[#b3cee1] text-sm mb-5">
                    A free, no-pressure conversation with our team. We'll walk through your results
                    and show you exactly what a custom plan would look like.
                  </p>
                  <Button
                    onClick={() => void handleRequestProposal()}
                    disabled={proposalLoading}
                    className="w-full bg-[#C9A959] hover:bg-[#b8954a] text-[#061e57] font-bold h-12 rounded-xl mb-3"
                  >
                    {proposalLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : <>Request a Free Proposal <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                  <p className="text-xs text-white/25">No obligation. No pushy sales calls.</p>
                </>
              )}
            </div>

            <div className="mt-6 text-center text-xs text-[#b3cee1]/40 space-y-1">
              <p>Questions? We're happy to help.</p>
              <p>
                <a href="tel:9182864995" className="text-[#b3cee1]/70 hover:text-[#b3cee1] underline">(918) 286-4995</a>
                {" "}·{" "}
                <a href="mailto:info@mcwilliamsmedia.com" className="text-[#b3cee1]/70 hover:text-[#b3cee1] underline">info@mcwilliamsmedia.com</a>
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
