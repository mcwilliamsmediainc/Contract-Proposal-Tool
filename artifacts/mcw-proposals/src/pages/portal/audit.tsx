import { useState, useEffect } from "react";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Globe,
  MapPin,
  MessageSquare,
  Mail,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Share2,
  Bot,
  Lock,
  Unlock,
  Target,
  DollarSign,
  ArrowRight,
  Zap,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type WizardStep = "intro" | "scanning" | "teaser" | "email-gate" | "full-report" | "qualify" | "done";

interface TeaserScores {
  ux: number | null;
  seo: number | null;
  social: number | null;
  aiVisibility: number | null;
}

interface Observation {
  summary: string;
  friendlyTranslation: string;
  cliffhanger: string;
  aiQuote?: string;
}

interface FullData {
  scores: { ux: number; seo: number; social: number; aiVisibility: number };
  observations: { ux: Observation; seo: Observation; social: Observation; aiVisibility: Observation };
  businessType: string;
}

function scoreColor(s: number | null): string {
  if (s === null) return "text-white/30";
  if (s >= 70) return "text-emerald-400";
  if (s >= 50) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(s: number | null): string {
  if (s === null) return "bg-white/5 border-white/10";
  if (s >= 70) return "bg-emerald-500/10 border-emerald-500/30";
  if (s >= 50) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function scoreLabel(s: number | null): string {
  if (s === null) return "Locked";
  if (s >= 70) return "Good";
  if (s >= 50) return "Needs Work";
  return "Critical";
}

function scoreLabelColor(s: number | null): string {
  if (s === null) return "text-white/20";
  if (s >= 70) return "text-emerald-400";
  if (s >= 50) return "text-amber-400";
  return "text-red-400";
}

interface PillarCardProps {
  icon: React.ElementType;
  label: string;
  score: number | null;
  locked?: boolean;
  observation?: Observation;
  aiQuote?: string;
}

function PillarCard({ icon: Icon, label, score, locked, observation }: PillarCardProps) {
  return (
    <div className={cn("rounded-2xl border p-5 transition-all", scoreBg(locked ? null : score))}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-[#b3cee1]" />
          </div>
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        {locked ? (
          <div className="flex items-center gap-1.5 text-white/30">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-mono">—</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className={cn("text-2xl font-bold font-mono", scoreColor(score))}>{score}</span>
            <span className="text-white/30 text-sm">/100</span>
          </div>
        )}
      </div>

      {locked ? (
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2.5">
          <Lock className="w-3 h-3 text-[#C9A959]/60 flex-shrink-0" />
          <p className="text-xs text-[#b3cee1]/50">Enter your email to unlock full report</p>
        </div>
      ) : (
        <>
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
            <div
              className={cn("h-1.5 rounded-full transition-all duration-1000", score !== null && score >= 70 ? "bg-emerald-400" : score !== null && score >= 50 ? "bg-amber-400" : "bg-red-400")}
              style={{ width: `${score ?? 0}%` }}
            />
          </div>
          <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", scoreLabelColor(score))}>{scoreLabel(score)}</p>
          {observation && (
            <p className="text-xs text-[#b3cee1]/70 leading-relaxed mt-1">{observation.friendlyTranslation}</p>
          )}
        </>
      )}
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  const steps = ["Your Site", "Scanning", "Results", "Email", "Full Report"];
  const stepMap: Record<WizardStep, number> = {
    intro: 0,
    scanning: 1,
    teaser: 2,
    "email-gate": 3,
    "full-report": 4,
    qualify: 4,
    done: 4,
  };
  return (
    <div className="flex items-center justify-center gap-1 mb-10">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all",
            i < step ? "bg-[#C9A959]/80 text-[#061e57]" : i === step ? "bg-[#b3cee1]/20 text-[#b3cee1]" : "bg-white/5 text-white/25"
          )}>
            {s}
          </div>
          {i < steps.length - 1 && <div className={cn("w-4 h-px", i < step ? "bg-[#C9A959]/50" : "bg-white/10")} />}
        </div>
      ))}
    </div>
  );
}

export default function AuditWizard() {
  const [step, setStep] = useState<WizardStep>("intro");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [city, setCity] = useState("");
  const [challenge, setChallenge] = useState("");
  const [email, setEmail] = useState("");
  const [budget, setBudget] = useState("");
  const [goal, setGoal] = useState("");
  const [teaserScores, setTeaserScores] = useState<TeaserScores>({ ux: null, seo: null, social: null, aiVisibility: null });
  const [teaserObs, setTeaserObs] = useState<{ ux?: Observation; seo?: Observation } | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [fullData, setFullData] = useState<FullData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [qualifySubmitting, setQualifySubmitting] = useState(false);
  const [proposalRequesting, setProposalRequesting] = useState(false);
  const [qualifyError, setQualifyError] = useState("");
  const [proposalRequestError, setProposalRequestError] = useState("");

  const stepIndex: Record<WizardStep, number> = {
    intro: 0, scanning: 1, teaser: 2, "email-gate": 3, "full-report": 4, qualify: 4, done: 4,
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "proposal_requested") {
      setStep("done");
    }
  }, []);

  useEffect(() => {
    if (step !== "scanning") return;
    const interval = setInterval(() => {
      setScanProgress((p) => Math.min(p + Math.random() * 8, 90));
    }, 400);
    return () => clearInterval(interval);
  }, [step]);

  async function handleStart() {
    setError(null);
    if (!url.trim() || !city.trim()) {
      setError("Please enter your website URL and city.");
      return;
    }

    try {
      const r = await fetch(`${BASE}/api/audit/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), city: city.trim(), challenge: challenge.trim() || undefined }),
      });
      const data = await r.json() as { leadId?: string; error?: string };
      if (!r.ok) throw new Error(data.error ?? "Failed to create audit");

      setLeadId(data.leadId ?? null);
      setScanProgress(0);
      setStep("scanning");

      const scanRes = await fetch(`${BASE}/api/audit/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: data.leadId }),
      });
      const scanData = await scanRes.json() as {
        scores?: TeaserScores;
        observations?: { ux?: Observation; seo?: Observation };
        businessType?: string;
        error?: string;
      };
      if (!scanRes.ok) throw new Error(scanData.error ?? "Scan failed");

      setScanProgress(100);
      setTeaserScores(scanData.scores ?? { ux: null, seo: null, social: null, aiVisibility: null });
      setTeaserObs(scanData.observations ?? null);
      setBusinessType(scanData.businessType ?? null);

      setTimeout(() => setStep("teaser"), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("intro");
    }
  }

  async function handleEmailCapture() {
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const r = await fetch(`${BASE}/api/audit/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, email: email.trim() }),
    });
    const data = await r.json() as {
      scores?: FullData["scores"];
      observations?: FullData["observations"];
      businessType?: string;
      error?: string;
    };
    if (!r.ok) {
      setError(data.error ?? "Failed to save email.");
      return;
    }

    setFullData({
      scores: data.scores ?? { ux: 0, seo: 0, social: 0, aiVisibility: 0 },
      observations: data.observations ?? {} as FullData["observations"],
      businessType: data.businessType ?? businessType ?? "",
    });
    setStep("full-report");
  }

  async function handleQualify() {
    setQualifySubmitting(true);
    try {
      const qualifyRes = await fetch(`${BASE}/api/audit/qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, budget: budget || null, goal: goal || null }),
      });
      if (!qualifyRes.ok) throw new Error("qualify failed");

      const proposalRes = await fetch(`${BASE}/api/audit/request-proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (!proposalRes.ok) throw new Error("request-proposal failed");

      setStep("done");
    } catch {
      setQualifyError("Something went wrong — please try again or call us directly.");
    } finally {
      setQualifySubmitting(false);
    }
  }

  async function handleRequestProposal() {
    setProposalRequesting(true);
    try {
      const res = await fetch(`${BASE}/api/audit/request-proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (!res.ok) throw new Error("request failed");
      setStep("done");
    } catch {
      setProposalRequestError("Something went wrong — please try again or call us directly.");
    } finally {
      setProposalRequesting(false);
    }
  }

  const urlClean = url.replace(/^https?:\/\//, "") || "your site";

  return (
    <div className="min-h-screen bg-[#061e57] text-white">
      <PublicHeader />

      <div className="max-w-2xl mx-auto px-6 py-14">

        {step === "intro" && (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-[#C9A959]/15 border border-[#C9A959]/30 rounded-full px-4 py-1.5 text-[#C9A959] text-xs font-semibold uppercase tracking-wider mb-6">
                <Zap className="w-3 h-3" />
                Free Digital Health Check
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                How Does Your<br />
                <span className="text-[#C9A959]">Website Stack Up?</span>
              </h1>
              <p className="text-[#b3cee1] text-lg leading-relaxed max-w-xl mx-auto">
                Get a free AI-powered audit of your website's UX, SEO, social presence, and AI visibility. Takes 60 seconds.
              </p>
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
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="yourwebsite.com"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/25 focus:border-[#b3cee1] h-12"
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
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
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Tulsa, OK"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/25 focus:border-[#b3cee1] h-12"
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b3cee1] uppercase tracking-wider mb-2">
                  Biggest Challenge <span className="text-white/30 font-normal text-[10px] normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
                  <Input
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    placeholder="e.g. Not getting enough leads from Google"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/25 focus:border-[#b3cee1] h-12"
                  />
                </div>
              </div>

              {error && (
                <p className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                </p>
              )}

              <Button
                onClick={handleStart}
                className="w-full bg-[#C9A959] hover:bg-[#b8954a] text-[#061e57] font-bold text-base h-14 rounded-xl"
              >
                Scan My Website
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-xs text-[#b3cee1]/50">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#C9A959]/60" />No login required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#C9A959]/60" />AI-powered analysis</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#C9A959]/60" />Free PDF report</span>
            </div>
          </>
        )}

        {step === "scanning" && (
          <div className="text-center py-16">
            <ProgressBar step={stepIndex[step]} />
            <div className="w-20 h-20 rounded-full bg-[#C9A959]/10 border border-[#C9A959]/20 flex items-center justify-center mx-auto mb-8">
              <Loader2 className="w-9 h-9 text-[#C9A959] animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Scanning {urlClean}…</h2>
            <p className="text-[#b3cee1] mb-8">Our AI is analyzing your website across 4 key pillars.</p>

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

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
              {[
                { icon: Globe, label: "Website UX & Design" },
                { icon: Search, label: "SEO Presence" },
                { icon: Share2, label: "Social Media Signals" },
                { icon: Bot, label: "AI Visibility" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-[#b3cee1]/60 bg-white/5 rounded-lg px-3 py-2">
                  <Icon className="w-3.5 h-3.5 text-[#C9A959]/60" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "teaser" && (
          <>
            <ProgressBar step={stepIndex[step]} />
            <div className="text-center mb-8">
              <p className="text-[#C9A959] text-xs font-bold uppercase tracking-widest mb-2">Scan Complete</p>
              <h2 className="text-3xl font-bold text-white mb-2">
                Here's a Preview of Your Results
              </h2>
              {businessType && (
                <p className="text-[#b3cee1] text-sm">
                  We identified your site as: <span className="text-white font-semibold">{businessType}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <PillarCard
                icon={Globe}
                label="Website UX"
                score={teaserScores.ux}
                observation={teaserObs?.ux}
              />
              <PillarCard
                icon={Search}
                label="SEO Presence"
                score={teaserScores.seo}
                observation={teaserObs?.seo}
              />
              <PillarCard
                icon={Share2}
                label="Social Media"
                score={null}
                locked
              />
              <PillarCard
                icon={Bot}
                label="AI Visibility"
                score={null}
                locked
              />
            </div>

            {teaserObs?.ux?.cliffhanger && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">{teaserObs.ux.cliffhanger}</p>
              </div>
            )}

            <div className="bg-white/5 border border-[#C9A959]/30 rounded-2xl p-6 text-center">
              <Unlock className="w-8 h-8 text-[#C9A959] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Unlock Your Full Report</h3>
              <p className="text-[#b3cee1] text-sm mb-4">
                Enter your email to unlock all 4 scores + receive a branded PDF report with specific recommendations.
              </p>
              <Button
                onClick={() => setStep("email-gate")}
                className="w-full bg-[#C9A959] hover:bg-[#b8954a] text-[#061e57] font-bold h-12 rounded-xl"
              >
                Unlock Full Report
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-white/25 mt-3">No spam. One-click unsubscribe.</p>
            </div>
          </>
        )}

        {step === "email-gate" && (
          <>
            <ProgressBar step={stepIndex[step]} />
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#C9A959]/10 border border-[#C9A959]/20 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-7 h-7 text-[#C9A959]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Where Should We Send It?</h2>
              <p className="text-[#b3cee1]">
                We'll email your full report as a branded PDF — complete with all 4 scores, observations, and recommendations.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#b3cee1] uppercase tracking-wider mb-2">
                  Your Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourcompany.com"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/25 focus:border-[#b3cee1] h-12"
                    onKeyDown={(e) => e.key === "Enter" && handleEmailCapture()}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </p>
              )}

              <Button
                onClick={handleEmailCapture}
                className="w-full bg-[#C9A959] hover:bg-[#b8954a] text-[#061e57] font-bold h-12 rounded-xl"
              >
                Send Me My Full Report
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-[#b3cee1]/40">
                <span>📄 PDF attached</span>
                <span>·</span>
                <span>🔒 Your info is private</span>
                <span>·</span>
                <span>No spam</span>
              </div>
            </div>

            <button
              onClick={() => setStep("teaser")}
              className="mt-4 w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              ← Back to preview
            </button>
          </>
        )}

        {step === "full-report" && fullData && (
          <>
            <ProgressBar step={stepIndex[step]} />
            <div className="text-center mb-8">
              <p className="text-[#C9A959] text-xs font-bold uppercase tracking-widest mb-2">Full Report Unlocked</p>
              <h2 className="text-3xl font-bold text-white mb-2">Your Digital Health Check</h2>
              <p className="text-[#b3cee1] text-sm">
                Check your inbox for your full PDF report. Here's everything we found:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <PillarCard icon={Globe} label="Website UX" score={fullData.scores.ux} observation={fullData.observations.ux} />
              <PillarCard icon={Search} label="SEO Presence" score={fullData.scores.seo} observation={fullData.observations.seo} />
              <PillarCard icon={Share2} label="Social Media" score={fullData.scores.social} observation={fullData.observations.social} />
              <PillarCard icon={Bot} label="AI Visibility" score={fullData.scores.aiVisibility} observation={fullData.observations.aiVisibility} />
            </div>

            {fullData.observations.aiVisibility?.aiQuote && (
              <div className="bg-[#061e57] border border-[#b3cee1]/20 rounded-xl px-5 py-4 mb-6">
                <p className="text-xs font-bold text-[#C9A959] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5" />
                  When customers ask AI about your business…
                </p>
                <p className="text-sm text-[#b3cee1] italic leading-relaxed">
                  "{fullData.observations.aiVisibility.aiQuote}"
                </p>
              </div>
            )}

            {/* Recommended services based on scores */}
            {(() => {
              const recs: { icon: React.ElementType; service: string; reason: string }[] = [];
              if (fullData.scores.ux < 60) recs.push({ icon: Globe, service: "Website Redesign", reason: "Structural UX improvements to convert more visitors into leads." });
              if (fullData.scores.seo < 60) recs.push({ icon: Search, service: "SEO", reason: `People searching your service in ${city} are having difficulty finding you.` });
              if (fullData.scores.social < 60) recs.push({ icon: Share2, service: "Social Media Management", reason: "Inconsistent social presence is hurting your brand credibility." });
              if (fullData.scores.aiVisibility < 50) recs.push({ icon: Bot, service: "AI Search Optimization", reason: "You're not showing up when customers use AI to find local businesses." });
              if (recs.length === 0) recs.push({ icon: TrendingUp, service: "Marketing Strategy", reason: "Build on your solid foundation with a custom growth strategy." });
              return recs.length > 0 ? (
                <div className="mb-6">
                  <p className="text-xs font-bold text-[#C9A959] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" />
                    Recommended for You
                  </p>
                  <div className="space-y-2">
                    {recs.map(({ icon: Icon, service, reason }, i) => (
                      <div key={service} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <div className="w-6 h-6 rounded-full bg-[#C9A959]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[#C9A959] text-xs font-bold">{i + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{service}</p>
                          <p className="text-xs text-[#b3cee1]/70 leading-relaxed mt-0.5">{reason}</p>
                        </div>
                        <Icon className="w-4 h-4 text-[#b3cee1]/30 flex-shrink-0 mt-1 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            <div className="bg-[#C9A959]/10 border border-[#C9A959]/30 rounded-2xl p-6 text-center">
              <Target className="w-8 h-8 text-[#C9A959] mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Ready to Fix These Issues?</h3>
              <p className="text-[#b3cee1] text-sm mb-5">
                Tell us a little more about your goals and we'll put together a custom proposal — no obligation.
              </p>
              <Button
                onClick={() => setStep("qualify")}
                className="w-full bg-[#C9A959] hover:bg-[#b8954a] text-[#061e57] font-bold h-12 rounded-xl mb-3"
              >
                Get a Free Custom Proposal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              {proposalRequestError && (
                <p className="text-red-400 text-xs text-center">{proposalRequestError}</p>
              )}
              <button
                onClick={() => { setProposalRequestError(""); handleRequestProposal(); }}
                disabled={proposalRequesting}
                className="text-xs text-[#b3cee1]/60 hover:text-[#b3cee1] transition-colors"
              >
                {proposalRequesting ? "Sending…" : "Or just request a proposal now →"}
              </button>
            </div>
          </>
        )}

        {step === "qualify" && (
          <>
            <ProgressBar step={stepIndex[step]} />
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">One More Thing</h2>
              <p className="text-[#b3cee1]">Help us tailor your proposal. Both fields are optional.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#b3cee1] uppercase tracking-wider mb-2">
                  Monthly Marketing Budget <span className="text-white/30 font-normal text-[10px] normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full pl-10 pr-4 bg-white/10 border border-white/20 text-white rounded-md h-12 text-sm focus:outline-none focus:border-[#b3cee1] appearance-none"
                  >
                    <option value="" className="bg-[#061e57]">Select a range…</option>
                    <option value="Under $500/mo" className="bg-[#061e57]">Under $500/mo</option>
                    <option value="$500–$1,000/mo" className="bg-[#061e57]">$500–$1,000/mo</option>
                    <option value="$1,000–$2,500/mo" className="bg-[#061e57]">$1,000–$2,500/mo</option>
                    <option value="$2,500–$5,000/mo" className="bg-[#061e57]">$2,500–$5,000/mo</option>
                    <option value="$5,000+/mo" className="bg-[#061e57]">$5,000+/mo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b3cee1] uppercase tracking-wider mb-2">
                  Primary Goal <span className="text-white/30 font-normal text-[10px] normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full pl-10 pr-4 bg-white/10 border border-white/20 text-white rounded-md h-12 text-sm focus:outline-none focus:border-[#b3cee1] appearance-none"
                  >
                    <option value="" className="bg-[#061e57]">What's your main goal?</option>
                    <option value="More leads from Google" className="bg-[#061e57]">More leads from Google</option>
                    <option value="Better website conversions" className="bg-[#061e57]">Better website conversions</option>
                    <option value="Grow social media presence" className="bg-[#061e57]">Grow social media presence</option>
                    <option value="Show up in AI search results" className="bg-[#061e57]">Show up in AI search results</option>
                    <option value="Build brand awareness" className="bg-[#061e57]">Build brand awareness</option>
                    <option value="Launch a new website" className="bg-[#061e57]">Launch a new website</option>
                  </select>
                </div>
              </div>

              {qualifyError && (
                <p className="text-red-400 text-sm text-center pt-1">{qualifyError}</p>
              )}
              <Button
                onClick={() => { setQualifyError(""); handleQualify(); }}
                disabled={qualifySubmitting}
                className="w-full bg-[#C9A959] hover:bg-[#b8954a] text-[#061e57] font-bold h-12 rounded-xl"
              >
                {qualifySubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Request My Free Proposal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <button
                onClick={() => setStep("full-report")}
                className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">We're On It!</h2>
            <p className="text-[#b3cee1] leading-relaxed max-w-md mx-auto mb-8">
              Your proposal request has been received. One of our strategists will reach out within one business day to talk through your goals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-[#b3cee1]/60">
              <a href="tel:9182864995" className="flex items-center gap-2 hover:text-[#C9A959] transition-colors">
                <span>📞</span> (918) 286-4995
              </a>
              <span className="hidden sm:block">·</span>
              <a href="mailto:info@mcwilliamsmedia.com" className="flex items-center gap-2 hover:text-[#C9A959] transition-colors">
                <span>✉</span> info@mcwilliamsmedia.com
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
