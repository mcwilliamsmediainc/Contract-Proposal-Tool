import { Check, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ProposalCover,
  SectionIntro,
  TeamSection,
  TestimonialSection,
} from "./proposal-template";
import type { ProposalData } from "./proposal-template";
import { PaigeSections } from "./paige-sections";

export type Tier = "pro" | "plus" | "platinum";

interface FeatureGroup {
  category: string;
  items: string[];
}

const PRO_FEATURES: FeatureGroup[] = [
  {
    category: "Search Engine Optimization",
    items: [
      "20 Keywords",
      "10 SEO Backlinks",
      "10+ DA Backlinks",
      "13 In-Content Backlinks",
      "1 Backend Blog / Month",
    ],
  },
  {
    category: "Google Business Profile",
    items: [
      "1 Post / Week",
      "1 Image Optimization / Week",
      "1 Q&A / Month",
      "AI Data-Driven Training",
      "AI Custom Tuning & Review Replies",
      "Human Content Verification",
      "Custom Requests",
      "Weekly Work Logs",
    ],
  },
  {
    category: "Digital Ads — Google PPC or META",
    items: [
      "Campaign Build-Out",
      "Multi-Channel Ad Formats",
      "Pixel Installation & Configuration",
      "Audience Targeting",
      "Weekly Performance Enhancements & Insights",
      "Ad Creative",
      "+ $500/mo Ad Spend (paid to Google or META)",
    ],
  },
  {
    category: "Email Marketing",
    items: [
      "Signup Form Embedded on Website",
      "Master Email List Management",
      "\"Thank You for Signing Up\" Page",
      "Custom Email Template",
      "1 Email / Month",
    ],
  },
  {
    category: "Social Media — FB + IG",
    items: [
      "1 Custom Organic Post / Week",
      "2 Channels (Facebook + Instagram)",
    ],
  },
  {
    category: "Monthly Performance Report",
    items: [
      "Track reach, engagement, traffic & leads",
      "Monthly insights & recommended next steps",
    ],
  },
];

const PLUS_ADDITIONS: FeatureGroup[] = [
  {
    category: "SEO — Everything in Pro, plus:",
    items: [
      "+20 SEO Backlinks",
      "+50 DA Backlinks",
      "+41 In-Content Backlinks",
      "SEO Press Release (1,000 Words) + Submission",
      "5 SEO Services Pages",
      "10 SEO Location Pages",
    ],
  },
  {
    category: "Google Business Profile — plus:",
    items: [
      "+2 Posts / Week",
      "+2 Image Optimizations / Week",
      "+1 Q&A / Month",
    ],
  },
  {
    category: "Digital Ads",
    items: [
      "Both Google PPC + META Ads",
      "+ $1,000/mo Ad Spend (paid to Google or META)",
    ],
  },
  {
    category: "Email Marketing",
    items: [
      "Custom Email Design & Copy",
      "1 Email / Month",
    ],
  },
  {
    category: "Social Media",
    items: ["2 Custom Organic Posts / Week", "2 Channels (Facebook + Instagram)"],
  },
  {
    category: "Monthly Performance Report",
    items: ["Full metrics & campaign reporting"],
  },
];

const PLATINUM_ADDITIONS: FeatureGroup[] = [
  {
    category: "SEO — Everything in Plus, plus:",
    items: [
      "+20 Additional Keywords",
      "+5 SEO Backlinks",
      "+20 DA Backlinks",
      "+10 In-Content Backlinks",
      "SEO Press Release + Submission",
      "+5 Services Pages",
      "+5 Location Pages",
    ],
  },
  {
    category: "Google Business Profile — plus:",
    items: [
      "+28 Posts / Week",
      "+28 Image Optimizations / Week",
      "+2 Q&A / Month",
    ],
  },
  {
    category: "Digital Ads",
    items: [
      "Both Google PPC + META Ads",
      "+ $1,000/mo Ad Spend (paid to Google or META)",
    ],
  },
  {
    category: "Email Marketing",
    items: ["2 Custom Emails / Month"],
  },
  {
    category: "Social Media",
    items: ["3 Custom Organic Posts / Week", "2 Channels (Facebook + Instagram)"],
  },
  {
    category: "Monthly Performance Report",
    items: ["Full metrics & campaign reporting"],
  },
];

const TIER_PRICES: Record<Tier, number> = { pro: 1500, plus: 2500, platinum: 4000 };
const TIER_LABELS: Record<Tier, string> = { pro: "Pro", plus: "Plus", platinum: "Platinum" };


function TierCard({
  name,
  price,
  recommended,
  selected,
  onSelect,
  inheritLabel,
  features,
}: {
  name: string;
  price: number;
  recommended?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  inheritLabel?: string;
  features: FeatureGroup[];
}) {
  return (
    <div
      className={cn(
        "rounded-2xl flex flex-col transition-all duration-300 overflow-hidden",
        selected
          ? "ring-4 ring-amber-400 shadow-2xl shadow-amber-400/20 scale-[1.01]"
          : "ring-1 ring-white/20 hover:ring-white/40"
      )}
    >
      <div className={cn("px-6 pt-6 pb-5", recommended ? "bg-white/20" : "bg-white/10")}>
        {recommended && (
          <span className="inline-block px-3 py-1 text-xs font-bold tracking-widest uppercase bg-amber-400 text-amber-900 rounded-full mb-3">
            ★ Recommended
          </span>
        )}
        <h3 className="text-xl font-black text-white tracking-widest uppercase mb-1">{name} Plan</h3>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-bold text-white">${price.toLocaleString()}</span>
          <span className="text-white/50 text-base ml-1">/ month</span>
        </div>
        {selected ? (
          <div className="w-full py-2.5 px-4 rounded-xl bg-amber-400 text-amber-900 font-bold text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Selected
          </div>
        ) : (
          <button
            onClick={onSelect}
            className="w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-colors border border-white/30 hover:border-white/50"
          >
            Select This Plan
          </button>
        )}
      </div>

      <div className="px-6 py-5 flex-1 bg-white/5 space-y-5">
        {inheritLabel && (
          <p className="text-amber-200/80 text-xs font-bold italic pb-3 border-b border-white/20">
            {inheritLabel}
          </p>
        )}
        {features.map((group) => (
          <div key={group.category}>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
              {group.category}
            </p>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/80 leading-snug">
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="pt-3 border-t border-white/20">
          <p className="text-xs text-white/40 font-medium italic">
            * $500 one-time setup fee applies to all plans
          </p>
        </div>
      </div>
    </div>
  );
}

function TierSection({
  selectedTier,
  onSelectTier,
}: {
  selectedTier?: Tier | null;
  onSelectTier?: (t: Tier) => void;
}) {
  return (
    <section
      className="py-24 px-6"
      style={{
        background: "#061e57",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b3cee1] mb-4 pl-3 border-l-2 border-[#b3cee1] text-left inline-block">Your Marketing Strategy</p>
          <h2
            className="text-4xl md:text-5xl font-black text-white mb-5 uppercase tracking-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Diverse Strategy Plans
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto leading-relaxed text-lg">
            We've created a personalized marketing plan proven to deliver measurable results for
            your business. Select the tier that works best based on how aggressive you want your
            marketing approach to be.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TierCard
            name="PRO"
            price={1500}
            recommended
            selected={selectedTier === "pro"}
            onSelect={() => onSelectTier?.("pro")}
            features={PRO_FEATURES}
          />
          <TierCard
            name="PLUS"
            price={2500}
            selected={selectedTier === "plus"}
            onSelect={() => onSelectTier?.("plus")}
            inheritLabel="Everything in Pro, plus:"
            features={PLUS_ADDITIONS}
          />
          <TierCard
            name="PLATINUM"
            price={4000}
            selected={selectedTier === "platinum"}
            onSelect={() => onSelectTier?.("platinum")}
            inheritLabel="Everything in Plus, plus:"
            features={PLATINUM_ADDITIONS}
          />
        </div>

        {!selectedTier && onSelectTier && (
          <p className="text-center text-white/40 text-sm mt-10 italic">
            Select a plan above to proceed with accepting this proposal.
          </p>
        )}
      </div>
    </section>
  );
}

const BRAND_SHOOT_ADDON_DEFAULT_TEXT =
  "While not required, high-quality branded images and videos can significantly elevate the effectiveness of your marketing. We partner with our preferred professional photographer who gives McWilliams Media clients a special discounted rate and fast turnaround.";

function BrandShootAddon({ text }: { text?: string | null }) {
  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#eef4f9] rounded-2xl p-8 border border-[#b3cee1]/40">
          <p className="text-xs font-bold uppercase tracking-widest text-[#3a4856] mb-2">
            Optional Add-On
          </p>
          <h3
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Your Brand Shoot
          </h3>
          <p className="text-[#061e57] font-semibold mb-5 text-sm">
            $850 one-time for professional photos &nbsp;·&nbsp; +$150 for iPhone Video B-Roll add-on
          </p>
          <p className="text-gray-600 leading-relaxed mb-5">
            {text || BRAND_SHOOT_ADDON_DEFAULT_TEXT}
          </p>
          <ul className="space-y-2.5 text-sm text-gray-700 mb-5">
            {[
              "1 Location · Up to 2 hours",
              "50+ professionally edited images",
              "All files are your intellectual property",
              "Coordinate directly with the photographer for scheduling & payment",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#3a4856] flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 italic">
            *Tulsa-area pricing. Travel fees apply for locations 30+ miles from central Tulsa.
          </p>
        </div>
      </div>
    </section>
  );
}

function MarketingStrategySection() {
  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          A proven strategy customized for your business goals.
        </h2>
        <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
          <p>
            With over 75% of consumers reporting they go online to research a business before
            choosing whether to make a purchase, the modern business owner needs a powerful online
            presence.
          </p>
          <p className="font-semibold text-gray-800">
            You want a marketing strategy focused on building consistent, qualified leads.
          </p>
          <p className="font-semibold text-gray-800">
            You want a brand that speaks directly to your target audience — and converts.
          </p>
          <p>
            With decades of combined experience, our team is here to help strengthen your strategy
            through branding and messaging that speaks directly to your target audiences so you can
            sell with ease!
          </p>
        </div>
      </div>
    </section>
  );
}

function MarketingWhatsNextSection() {
  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-3xl font-bold text-gray-900 mb-6"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          What's Next?
        </h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          Upon approval, we'll send over a contract for your marketing partnership. Once we receive
          the signed contract, we'll schedule your onboarding call to kick off your strategy the
          right way.
        </p>
        <div className="bg-[#eef4f9] rounded-xl p-6 border border-[#b3cee1]/40 mb-8">
          <p className="font-bold text-gray-800 mb-2">Monthly Billing</p>
          <p className="text-gray-600">
            Your selected plan is billed monthly. The one-time $500 setup fee is due upon signing
            the contract.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-gray-700">
            <span className="font-semibold">Email:</span> support@mcwilliamsmedia.com
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Phone:</span> 918-286-4995
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Website:</span> mcwilliamsmedia.com
          </p>
        </div>
      </div>
    </section>
  );
}

function TieredAcceptSection({
  clientName,
  selectedTier,
  onAccept,
  isPending,
}: {
  clientName: string;
  selectedTier?: Tier | null;
  onAccept?: () => void;
  isPending?: boolean;
}) {
  const tierPrice = selectedTier ? TIER_PRICES[selectedTier] : null;
  const tierLabel = selectedTier ? TIER_LABELS[selectedTier] : null;

  return (
    <section
      className="py-20 px-6"
      style={{ background: "#061e57" }}
    >
      <div className="max-w-xl mx-auto text-center">
        <div className="w-10 h-0.5 bg-[#b3cee1] mx-auto mb-6" />
        <h2 className="text-4xl md:text-5xl font-black text-white mb-1 uppercase tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>Ready to work</h2>
        <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "'Montserrat', sans-serif", color: "#b3cee1" }}>together?</h3>
        <p className="text-white/60 text-sm mb-2">Click below to accept this proposal.</p>
        <p className="text-[#b3cee1]/70 text-sm mb-10">Our team will follow up with a contract.</p>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {selectedTier ? (
            <div className="mb-6 p-4 bg-[#eef4f9] rounded-xl border border-[#b3cee1]/40">
              <p className="text-xs font-bold text-[#3a4856] uppercase tracking-widest mb-1">
                Selected Plan
              </p>
              <p className="text-xl font-bold text-[#061e57]">{tierLabel} Plan</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${tierPrice?.toLocaleString()}
                <span className="text-gray-400 text-base font-normal"> / month</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">+ $500 one-time setup fee</p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-amber-700 font-semibold text-sm">
                ↑ Please select a plan above to continue.
              </p>
            </div>
          )}

          <p className="text-gray-600 text-sm mb-6">
            <strong>{clientName || "the client"}</strong> agrees to the strategic marketing
            partnership as outlined in this proposal.
          </p>

          {onAccept && (
            <Button
              onClick={onAccept}
              disabled={!selectedTier || isPending}
              className="w-full h-14 bg-[#061e57] hover:bg-[#3a4856] text-white text-base font-bold rounded-xl disabled:opacity-40"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Accept Proposal <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export function TieredMarketingTemplate({
  data,
  selectedTier,
  onSelectTier,
  onAccept,
  isPending,
}: {
  data: ProposalData;
  selectedTier?: Tier | null;
  onSelectTier?: (tier: Tier) => void;
  onAccept?: () => void;
  isPending?: boolean;
}) {
  const proposalDate = data.createdAt ? new Date(data.createdAt) : new Date();
  const dateStr = proposalDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-white font-sans">
      <ProposalCover
        clientName={data.clientName}
        businessName={data.businessName}
        projectType="tiered"
        date={dateStr}
      />
      {data.paigeContent ? (
        <>
          <PaigeSections paige={data.paigeContent} clientName={data.clientName} />
          <TestimonialSection
            quote={data.paigeContent.testimonialQuote}
            author={`${data.paigeContent.testimonialName}, ${data.paigeContent.testimonialBusiness}`}
          />
        </>
      ) : (
        <>
          <SectionIntro clientName={data.clientName} businessName={data.businessName} />
          <TestimonialSection
            quote="The results are apparent: In under a year, my business has more than tripled! This was by far the best advertising money I have spent... Everything else was a waste comparatively."
            author="Chance Johnson"
          />
        </>
      )}
      <TierSection selectedTier={selectedTier} onSelectTier={onSelectTier} />
      {data.brandShootEnabled !== false && (
        <BrandShootAddon text={data.brandShootText} />
      )}
      <MarketingStrategySection />
      <TeamSection />
      <TestimonialSection
        quote="They have taken my business to the next level. First impression is everything and with the design of our website they helped us showcase our business better than ever. The team goes above and beyond!"
        author="Alyssa Hobbs, Hobbs Salon + Med Spa"
        dark={false}
      />
      <MarketingWhatsNextSection />
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
      <TieredAcceptSection
        clientName={data.clientName}
        selectedTier={selectedTier}
        onAccept={onAccept}
        isPending={isPending}
      />
    </div>
  );
}
