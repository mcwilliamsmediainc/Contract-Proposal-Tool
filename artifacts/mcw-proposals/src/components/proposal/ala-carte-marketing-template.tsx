import { useState, useMemo } from "react";
import { Check, CheckCircle2, Loader2, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ProposalCover,
  SectionIntro,
  SituationSection,
  TeamSection,
  TestimonialSection,
} from "./proposal-template";
import type { ProposalData } from "./proposal-template";

// ─── Service catalog ────────────────────────────────────────────────────────

type BillingType = "monthly" | "one-time";

interface ServiceOption {
  id: string;
  name: string;
  price: number;
  billing: BillingType;
  setupFee: number;
  priceLabel: string;
  note?: string;
  features: string[];
  /** services sharing the same group are mutually exclusive */
  group?: string;
  isAddon?: boolean;
}

const SERVICES: ServiceOption[] = [
  // ── SEO plans (mutually exclusive)
  {
    id: "seo-pro",
    name: "SEO Pro Plan",
    price: 497, billing: "monthly", setupFee: 500, priceLabel: "$497/mo",
    group: "seo",
    features: [
      "SEO Keywords (20)",
      "SEO Monthly Backlinks (23)",
      "SEO Backend Blog (1/mo)",
      "Monthly Performance Report",
      "GBP: 1 Post / Week",
      "GBP: 1 Image Optimization / Week",
      "GBP: 1 Q&A / Month",
      "AI Data-Driven Training & Custom Tuning",
      "AI Review Replies + Human Content Verification",
      "Weekly Work Logs",
    ],
  },
  {
    id: "seo-plus",
    name: "SEO Plus Plan",
    price: 697, billing: "monthly", setupFee: 500, priceLabel: "$697/mo",
    group: "seo",
    features: [
      "Everything in Pro Plan +",
      "+111 SEO Backlinks",
      "+1 SEO Backend Blog",
      "SEO Press Release + Submission",
      "5 SEO Services Pages",
      "10 SEO Location Pages",
    ],
  },
  {
    id: "seo-platinum",
    name: "SEO Platinum Plan",
    price: 997, billing: "monthly", setupFee: 500, priceLabel: "$997/mo",
    group: "seo",
    features: [
      "Everything in Plus Plan +",
      "+40 SEO Backlinks",
      "+5 SEO Services Pages",
      "+10 SEO Location Pages",
    ],
  },
  // ── SEO add-ons (independent)
  {
    id: "seo-blog",
    name: "Front-Facing Blog Add-On",
    price: 100, billing: "monthly", setupFee: 0, priceLabel: "$100/mo",
    isAddon: true,
    features: [
      "1 × 1,000+ word blog post/mo published to your website",
      "Keyword & topic research every month",
    ],
  },
  {
    id: "seo-gbp-setup",
    name: "GBP Setup + Optimization",
    price: 547, billing: "one-time", setupFee: 0, priceLabel: "$547 one-time",
    note: "$247 one-time for setup only",
    isAddon: true,
    features: [
      "Create or claim your Google Business Profile",
      "Clean up outdated or incorrect listings",
      "Add branded photos & update key details",
      "Position your business for local search",
    ],
  },
  // ── Google PPC (mutually exclusive by budget tier)
  {
    id: "ppc-397",
    name: "Google PPC Ads",
    price: 397, billing: "monthly", setupFee: 500, priceLabel: "$397/mo",
    note: "$0 – $2,500 ad spend budget",
    group: "ppc",
    features: [
      "Ad Account Setup & Pixel Installation",
      "Campaign Build-Out (Maps, Conversion & Call Ads)",
      "Custom Search & Display Ads",
      "Weekly Performance Optimization",
      "Monthly Report + Strategic Planning Meetings",
    ],
  },
  {
    id: "ppc-497",
    name: "Google PPC Ads",
    price: 497, billing: "monthly", setupFee: 500, priceLabel: "$497/mo",
    note: "$2,500 – $5,000 ad spend budget",
    group: "ppc",
    features: [
      "Everything in $397 plan +",
      "Higher-budget campaign management",
    ],
  },
  {
    id: "ppc-647",
    name: "Google PPC Ads",
    price: 647, billing: "monthly", setupFee: 500, priceLabel: "$647/mo",
    note: "$5,000+ ad spend budget",
    group: "ppc",
    features: [
      "Everything in $497 plan +",
      "Enterprise-level campaign management",
    ],
  },
  // ── Google LSA (independent)
  {
    id: "lsa",
    name: "Google Local Service Ads",
    price: 347, billing: "monthly", setupFee: 500, priceLabel: "$347/mo",
    note: "Eligibility required",
    isAddon: true,
    features: [
      "Goal: 2–5 calls/week",
      "Call tracking included",
      "Pay-per-lead advertising",
    ],
  },
  // ── Social Media Ads (mutually exclusive by budget tier)
  {
    id: "sm-ads-497",
    name: "Social Media Ads",
    price: 497, billing: "monthly", setupFee: 500, priceLabel: "$497/mo",
    note: "$0 – $2,500 ad spend (Facebook & Instagram)",
    group: "sm-ads",
    features: [
      "Ad Account Setup & Pixel Installation",
      "Up to 3 initial campaign ads",
      "Custom Multi-Channel Ad Creative",
      "Monthly Optimization & Report",
      "Strategic Planning Meetings",
    ],
  },
  {
    id: "sm-ads-597",
    name: "Social Media Ads",
    price: 597, billing: "monthly", setupFee: 500, priceLabel: "$597/mo",
    note: "$2,500 – $5,000 ad spend (Facebook & Instagram)",
    group: "sm-ads",
    features: [
      "Everything in $497 plan +",
      "Larger-budget campaign management",
    ],
  },
  {
    id: "sm-ads-697",
    name: "Social Media Ads",
    price: 697, billing: "monthly", setupFee: 500, priceLabel: "$697/mo",
    note: "$5,000+ ad spend (Facebook & Instagram)",
    group: "sm-ads",
    features: [
      "Everything in $597 plan +",
      "Enterprise-level social campaign management",
    ],
  },
  // ── Social Media Posting (mutually exclusive)
  {
    id: "sm-post-pro",
    name: "Social Media Posting — Pro",
    price: 197, billing: "monthly", setupFee: 500, priceLabel: "$197/mo",
    group: "sm-posting",
    features: [
      "4+ in-feed custom graphics & captions/mo",
      "Facebook & Instagram",
      "Monthly Report + Strategic Planning",
    ],
  },
  {
    id: "sm-post-plus",
    name: "Social Media Posting — Plus",
    price: 297, billing: "monthly", setupFee: 500, priceLabel: "$297/mo",
    group: "sm-posting",
    features: [
      "8+ in-feed custom graphics & captions/mo",
      "Facebook & Instagram",
      "Monthly Report + Strategic Planning",
    ],
  },
  {
    id: "sm-post-platinum",
    name: "Social Media Posting — Platinum",
    price: 397, billing: "monthly", setupFee: 500, priceLabel: "$397/mo",
    group: "sm-posting",
    features: [
      "12+ in-feed custom graphics & captions/mo",
      "Facebook & Instagram",
      "Monthly Report + Strategic Planning",
    ],
  },
  // ── Social Media Video (independent)
  {
    id: "sm-video",
    name: "Social Media Video Add-On",
    price: 397, billing: "monthly", setupFee: 0, priceLabel: "+$397/mo",
    isAddon: true,
    features: [
      "12+ in-feed videos & captions/mo",
      "Requires an active Social Media Posting plan",
    ],
  },
  // ── Email Marketing (mutually exclusive)
  {
    id: "email-pro",
    name: "Email Marketing — Pro",
    price: 197, billing: "monthly", setupFee: 500, priceLabel: "$197/mo",
    group: "email",
    features: [
      "1 email/month to your list",
      "Signup form embed on website",
      "Master email list management",
      "Custom email template",
      "Monthly Report",
    ],
  },
  {
    id: "email-plus",
    name: "Email Marketing — Plus",
    price: 297, billing: "monthly", setupFee: 500, priceLabel: "$297/mo",
    group: "email",
    features: [
      "1 custom-designed email/month",
      "Signup form, list management",
      "Monthly Report",
    ],
  },
  {
    id: "email-platinum",
    name: "Email Marketing — Platinum",
    price: 497, billing: "monthly", setupFee: 500, priceLabel: "$497/mo",
    group: "email",
    features: [
      "2 custom-designed emails/month",
      "Signup form, list management",
      "Monthly Report",
    ],
  },
  // ── Brand Shoot (mutually exclusive options)
  {
    id: "brand-photos",
    name: "Brand Shoot — Photos Only",
    price: 850, billing: "one-time", setupFee: 0, priceLabel: "$850 one-time",
    note: "Tulsa-area pricing; travel fees apply beyond 30 miles",
    group: "brand-shoot",
    features: [
      "1 location · up to 2 hours",
      "50+ professionally edited images",
      "All files are your intellectual property",
    ],
  },
  {
    id: "brand-photos-video",
    name: "Brand Shoot — Photos + Video",
    price: 1000, billing: "one-time", setupFee: 0, priceLabel: "$1,000 one-time",
    note: "Includes iPhone Video B-Roll clips",
    group: "brand-shoot",
    features: [
      "Everything in Photos Only +",
      "iPhone Video B-Roll clip add-on",
    ],
  },
];

// ─── Category layout ─────────────────────────────────────────────────────────

interface Category {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  serviceIds: string[];
  accent: string;
}

const CATEGORIES: Category[] = [
  {
    id: "seo",
    title: "Search Engine Optimization",
    subtitle: "SEO",
    description: "Boost your website's visibility and rank higher on search engines. Select the SEO plan that works best for your business goals.",
    serviceIds: ["seo-pro", "seo-plus", "seo-platinum", "seo-blog", "seo-gbp-setup"],
    accent: "#3a4856",
  },
  {
    id: "google-ads",
    title: "Google Paid Advertising",
    subtitle: "Google Ads",
    description: "Harness the power of Pay-Per-Click and Local Service Ads to drive traffic and generate leads.",
    serviceIds: ["ppc-397", "ppc-497", "ppc-647", "lsa"],
    accent: "#3a4856",
  },
  {
    id: "sm-ads",
    title: "Social Media Advertising",
    subtitle: "Facebook & Instagram Ads",
    description: "Take your social media advertising to the next level with visually compelling ads tailored to your audience.",
    serviceIds: ["sm-ads-497", "sm-ads-597", "sm-ads-697"],
    accent: "#061e57",
  },
  {
    id: "sm-posting",
    title: "Social Media Posting",
    subtitle: "Organic Social",
    description: "Build audience loyalty, drive engagement, and enhance brand awareness with our managed organic social media plans.",
    serviceIds: ["sm-post-pro", "sm-post-plus", "sm-post-platinum", "sm-video"],
    accent: "#3a4856",
  },
  {
    id: "email",
    title: "Email Marketing",
    subtitle: "Email",
    description: "Stay top of mind and enhance brand awareness with professionally crafted monthly email campaigns.",
    serviceIds: ["email-pro", "email-plus", "email-platinum"],
    accent: "#3a4856",
  },
  {
    id: "brand-shoot",
    title: "Brand Photography",
    subtitle: "Brand Shoot",
    description: "High-quality branded images and video can significantly elevate the effectiveness of your marketing.",
    serviceIds: ["brand-photos", "brand-photos-video"],
    accent: "#061e57",
  },
];

const SERVICE_MAP = new Map(SERVICES.map((s) => [s.id, s]));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) { return `$${n.toLocaleString()}`; }

function useServiceSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    const svc = SERVICE_MAP.get(id)!;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Deselect others in same group
        if (svc.group) {
          for (const s of SERVICES) {
            if (s.group === svc.group && s.id !== id) next.delete(s.id);
          }
        }
        next.add(id);
      }
      return next;
    });
  }

  const totals = useMemo(() => {
    let monthly = 0, oneTime = 0, setupFees = 0;
    for (const id of selected) {
      const s = SERVICE_MAP.get(id)!;
      if (s.billing === "monthly") monthly += s.price;
      else oneTime += s.price;
      setupFees += s.setupFee;
    }
    return { monthly, oneTime, setupFees };
  }, [selected]);

  return { selected, toggle, totals };
}

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({
  service, isSelected, onToggle, readOnly,
}: {
  service: ServiceOption;
  isSelected: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
}) {
  return (
    <div
      onClick={readOnly ? undefined : onToggle}
      className={cn(
        "rounded-2xl flex flex-col transition-all duration-200",
        readOnly ? "" : "cursor-pointer",
        isSelected
          ? "ring-4 ring-amber-400 shadow-xl shadow-amber-400/20 bg-white scale-[1.01]"
          : "ring-1 ring-gray-200 bg-white hover:ring-[#b3cee1] hover:shadow-md"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-5 pt-5 pb-4 rounded-t-2xl transition-colors",
        isSelected ? "bg-[#eef4f9]" : "bg-gray-50"
      )}>
        {service.isAddon && (
          <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-amber-100 text-amber-700 rounded-full mb-2">
            Add-On
          </span>
        )}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-gray-900 text-base leading-tight">{service.name}</h4>
          {isSelected && !readOnly && (
            <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          )}
        </div>
        <p className={cn(
          "text-2xl font-bold mt-2",
          isSelected ? "text-[#061e57]" : "text-gray-800"
        )}>
          {service.priceLabel}
        </p>
        {service.note && (
          <p className="text-xs text-gray-500 mt-1 italic">{service.note}</p>
        )}
        {service.setupFee > 0 && (
          <p className="text-xs text-gray-400 mt-1">+ ${service.setupFee.toLocaleString()} one-time setup fee</p>
        )}
        {!readOnly && (
          <div className={cn(
            "mt-3 w-full py-2 px-3 rounded-xl text-sm font-semibold text-center transition-colors",
            isSelected
              ? "bg-amber-400 text-amber-900"
              : "bg-[#061e57] text-white hover:bg-[#061e57]"
          )}>
            {isSelected ? "✓ Selected" : "Select"}
          </div>
        )}
      </div>
      {/* Features */}
      <div className="px-5 py-4 flex-1">
        <ul className="space-y-2">
          {service.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-600 leading-snug">
              <Check className="w-3.5 h-3.5 text-[#3a4856] flex-shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({
  category, selected, onToggle, readOnly,
}: {
  category: Category;
  selected: Set<string>;
  onToggle?: (id: string) => void;
  readOnly?: boolean;
}) {
  const services = category.serviceIds.map((id) => SERVICE_MAP.get(id)!).filter(Boolean);
  const mainServices = services.filter((s) => !s.isAddon);
  const addons = services.filter((s) => s.isAddon);

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Category header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#3a4856] mb-2">{category.subtitle}</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {category.title}
          </h2>
          <p className="text-gray-600 max-w-2xl leading-relaxed">{category.description}</p>
          {mainServices.length > 1 && !mainServices[0].isAddon && (
            <p className="text-xs text-gray-400 mt-3 italic">Select one plan from this category.</p>
          )}
        </div>

        {/* Main service cards */}
        {mainServices.length > 0 && (
          <div className={cn(
            "grid gap-5 mb-8",
            mainServices.length === 1 ? "grid-cols-1 max-w-sm" :
            mainServices.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl" :
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}>
            {mainServices.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                isSelected={selected.has(svc.id)}
                onToggle={() => onToggle?.(svc.id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}

        {/* Add-ons */}
        {addons.length > 0 && (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Optional Add-Ons</p>
            <div className={cn(
              "grid gap-5",
              addons.length === 1 ? "grid-cols-1 max-w-sm" :
              addons.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl" :
              "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
              {addons.map((svc) => (
                <ServiceCard
                  key={svc.id}
                  service={svc}
                  isSelected={selected.has(svc.id)}
                  onToggle={() => onToggle?.(svc.id)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ─── Floating total bar ───────────────────────────────────────────────────────

function FloatingTotalBar({ monthly, oneTime, setupFees, count }: {
  monthly: number; oneTime: number; setupFees: number; count: number;
}) {
  if (count === 0) return null;
  return (
    <div className="no-print fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto px-4 pb-4">
        <div className="pointer-events-auto bg-[#061e57] border border-white/10 rounded-2xl shadow-2xl px-6 py-3 flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-2 text-sm text-[#b3cee1]/80">
            <ShoppingCart className="w-4 h-4" />
            <span>{count} service{count !== 1 ? "s" : ""} selected</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            {monthly > 0 && (
              <span className="text-white font-semibold">{fmt(monthly)}<span className="text-[#b3cee1] font-normal">/mo</span></span>
            )}
            {(oneTime + setupFees) > 0 && (
              <span className="text-amber-300 font-semibold">{fmt(oneTime + setupFees)}<span className="text-[#b3cee1] font-normal text-xs"> one-time</span></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Accept section ───────────────────────────────────────────────────────────

function AlaCarteAcceptSection({
  clientName, selected, totals, onAccept, isPending,
}: {
  clientName: string;
  selected: Set<string>;
  totals: { monthly: number; oneTime: number; setupFees: number };
  onAccept?: () => void;
  isPending?: boolean;
}) {
  const selectedServices = SERVICES.filter((s) => selected.has(s.id));

  return (
    <section
      className="py-20 px-6"
      style={{ background: "#061e57" }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-10 h-0.5 bg-[#b3cee1] mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black text-white mb-1 uppercase tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>Ready to work</h2>
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "'Montserrat', sans-serif", color: "#b3cee1" }}>together?</h3>
          <p className="text-white/60 text-sm">Review your selected services below and click Accept to move forward.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Selected services list */}
          {selectedServices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-amber-600 font-semibold">↑ Select one or more services above to continue.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {selectedServices.map((svc) => (
                <div key={svc.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{svc.name}</p>
                    {svc.note && <p className="text-xs text-gray-400">{svc.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{svc.priceLabel}</p>
                    {svc.setupFee > 0 && (
                      <p className="text-xs text-gray-400">+{fmt(svc.setupFee)} setup</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          {selectedServices.length > 0 && (
            <div className="bg-gray-50 px-6 py-5 space-y-3 border-t border-gray-200">
              {totals.monthly > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Monthly Total</span>
                  <span className="text-xl font-bold text-gray-900">{fmt(totals.monthly)}<span className="text-sm text-gray-400 font-normal">/mo</span></span>
                </div>
              )}
              {(totals.oneTime + totals.setupFees) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">One-Time Fees</span>
                  <span className="text-xl font-bold text-gray-900">{fmt(totals.oneTime + totals.setupFees)}</span>
                </div>
              )}
              {totals.monthly > 0 && (totals.oneTime + totals.setupFees) > 0 && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-700 text-sm font-semibold">First Month Total</span>
                  <span className="text-2xl font-bold text-[#061e57]">{fmt(totals.monthly + totals.oneTime + totals.setupFees)}</span>
                </div>
              )}
            </div>
          )}

          {/* Accept button */}
          <div className="px-6 py-5 border-t border-gray-100">
            <p className="text-gray-500 text-sm mb-4 text-center">
              <strong>{clientName || "Client"}</strong> agrees to the selected marketing services as outlined in this proposal.
            </p>
            {onAccept && (
              <Button
                onClick={onAccept}
                disabled={selectedServices.length === 0 || isPending}
                className="w-full h-14 bg-[#061e57] hover:bg-[#3a4856] text-white text-base font-bold rounded-xl disabled:opacity-40"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Accept Proposal <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Strategy / What's Next sections ─────────────────────────────────────────

function AlaCarteStrategySection() {
  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-[#3a4856] mb-3">Your Marketing Strategy</p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          A proven strategy customized for your business goals.
        </h2>
        <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
          <p>
            Thank you for taking the time to share your goals, challenges, and target audiences with us.
            We've created a personalized marketing plan proven to deliver measurable results for your business.
          </p>
          <p className="font-semibold text-gray-800">
            Pick the services that match your goals — or ask us to recommend the right combination for your industry.
          </p>
          <p>
            With decades of combined experience, our team is here to help strengthen your strategy
            through branding and messaging that speaks directly to your target audiences so you can sell with ease.
          </p>
        </div>
      </div>
    </section>
  );
}

function AlaCarteWhatsNextSection() {
  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          What's Next?
        </h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          Upon approval, we'll send over a contract for your marketing partnership. Once we receive
          the signed contract, we'll schedule your onboarding call to kick off your strategy the right way.
        </p>
        <div className="bg-[#eef4f9] rounded-xl p-6 border border-[#b3cee1]/40 mb-8">
          <p className="font-bold text-gray-800 mb-2">Monthly Billing</p>
          <p className="text-gray-600">
            Your selected services are billed monthly. Any one-time setup fees are due upon signing the contract.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-gray-700"><span className="font-semibold">Email:</span> support@mcwilliamsmedia.com</p>
          <p className="text-gray-700"><span className="font-semibold">Phone:</span> 918-286-4995</p>
          <p className="text-gray-700"><span className="font-semibold">Website:</span> mcwilliamsmedia.com</p>
        </div>
      </div>
    </section>
  );
}

// ─── Dividers between categories ──────────────────────────────────────────────

function CategoryDivider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AlaCarteMarketingTemplate({
  data,
  onAccept,
  isPending,
  readOnly,
}: {
  data: ProposalData;
  onAccept?: (selectedServiceIds: string[]) => void;
  isPending?: boolean;
  readOnly?: boolean;
}) {
  const { selected, toggle, totals } = useServiceSelection();
  const proposalDate = data.createdAt ? new Date(data.createdAt) : new Date();
  const dateStr = proposalDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const handleAccept = () => {
    onAccept?.(Array.from(selected));
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <ProposalCover
        clientName={data.clientName}
        businessName={data.businessName}
        projectType="ala-carte"
        date={dateStr}
      />

      <SectionIntro clientName={data.clientName} businessName={data.businessName} />
      <SituationSection content={data.content} />

      <TestimonialSection
        quote="The results are apparent: In under a year, my business has more than tripled! This was by far the best advertising money I have spent... Everything else was a waste comparatively."
        author="Chance Johnson"
      />

      <AlaCarteStrategySection />

      {CATEGORIES.map((cat, i) => (
        <div key={cat.id}>
          {i > 0 && <CategoryDivider />}
          <CategorySection
            category={cat}
            selected={selected}
            onToggle={readOnly ? undefined : toggle}
            readOnly={readOnly}
          />
        </div>
      ))}

      <TeamSection />

      <TestimonialSection
        quote="So impressed by this firm! Couldn't ask for a more professional, communicative and creative team. These are truly local grassroots people who genuinely understand the local market. Their knowledge and advice for growth potential for our company is priceless."
        author="JL Crawford"
        dark={false}
      />

      <AlaCarteWhatsNextSection />

      {data.loomVideoUrl && (
        <section className="bg-gray-50 py-20 px-6 border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Strategy Briefing</h2>
            <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-lg">
              <iframe
                src={
                  data.loomVideoUrl.includes("loom.com/share/")
                    ? data.loomVideoUrl.replace("share/", "embed/")
                    : data.loomVideoUrl
                }
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      <AlaCarteAcceptSection
        clientName={data.clientName}
        selected={selected}
        totals={totals}
        onAccept={onAccept ? handleAccept : undefined}
        isPending={isPending}
      />

      {/* Floating total bar */}
      {!readOnly && (
        <FloatingTotalBar
          monthly={totals.monthly}
          oneTime={totals.oneTime}
          setupFees={totals.setupFees}
          count={selected.size}
        />
      )}
    </div>
  );
}
