import { useState, useRef, useEffect } from "react";
import { Check, ArrowRight, Loader2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/ui/signature-pad";

import mattDarkPhoto from "@assets/zj0kyaxW9l74GCgxlzzXkaDxz0Ggj2HMsLjWxg_1777926199475.png";
import evolutionSiteImg from "@assets/NEI3MhrMfmShoMZsOZJruWpd9ira_S9b2agJCw_1777926196317.png";
import pettyFloorsSiteImg from "@assets/Z0auiieOtmw1H7Lb48JDsfz4yiTvsB7zwbyQQw_1777926188109.png";
import hobbsSiteImg from "@assets/VGwy2OPrarRYUvgoS689exgbBia2wMZ3dCVPcg_1777926766032.png";
import processImg from "@assets/n9ACw4Ae1EGYkg9JntHo0idxabtJBKR8hBfvRQ_1777926763423.png";
import lindsayPhoto from "@assets/IdR0Q_YLLfwgxCAZdUawGXKlzULvbUjTBiKdyQ_1777926203020.png";
import tiffanyPhoto from "@assets/hICsrvVhBWveCy-DzcjqEjB6kOHMJHF6KdDJpQ_1777926751626.png";
import rachellePhoto from "@assets/ssMoAw74pdhyxd7r-DQT0dFCZPwoP-UOcOJhbQ_1778154759622.jpeg";
import elisePhoto from "@assets/2lJSuNP-9GC_cdugrSxCkqbLTDWLIG9f7UHeVA_1777926754493.png";
import chloePhoto from "@assets/8qEx0RVlV0ihSnsIyAmQEToz5xBp4QDBGSrBnQ_1778025305362.png";
import ashleaPhoto from "@assets/HacE0LLtzDS7OCF1sXGRoSpS_arILyutApWN-Q_1778025402133.png";
import nataleePhoto from "@assets/6F8LcZ4mEOUe8ZWZUfuiyUFa_FnvPAHdDzjrHQ_1778025455383.png";

export interface PricingLineItem {
  desc: string;
  rate: number;
  qty: string;
  price: number;
}

export interface ProposalData {
  clientName: string;
  businessName: string;
  projectType: string;
  numberOfPages?: number | null;
  pageNames?: string | null;
  totalAmount?: number | null;
  pricingItems?: string | null;
  content?: string | null;
  loomVideoUrl?: string | null;
  createdAt?: string | Date;
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#061e57] flex items-center justify-center">
        <Check className="w-3 h-3 text-white" />
      </div>
      <span className="text-gray-700">{children}</span>
    </li>
  );
}

export function ProposalCover({ clientName, businessName, projectType, date }: {
  clientName: string; businessName: string; projectType: string; date: string;
}) {
  const label = projectType === "tiered" ? "Marketing" : projectType === "ala-carte" ? "Ala Carte Marketing" : projectType === "marketing" ? "Marketing" : projectType === "print" ? "Print" : projectType === "project" ? "Project" : "Website";
  return (
    <section id="section-cover" className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
      style={{ background: "#061e57" }}>
      {/* Subtle diagonal texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 48px)"
      }} />
      <div className="relative z-10 max-w-4xl mx-auto">
        <img src="/mcwilliams-logo.png" alt="McWilliams Media" className="h-14 md:h-16 mx-auto mb-10 brightness-0 invert opacity-90" />
        <div className="w-12 h-0.5 bg-[#b3cee1] mx-auto mb-8" />
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b3cee1] mb-5">Prepared for</p>
        <h1 className="text-6xl md:text-8xl text-white mb-3 leading-none uppercase" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, letterSpacing: "0.02em" }}>
          {label}
        </h1>
        <h2 className="text-5xl md:text-7xl leading-none uppercase mb-10" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, letterSpacing: "0.02em", color: "#b3cee1" }}>
          Proposal
        </h2>
        <div className="w-12 h-0.5 bg-[#b3cee1]/40 mx-auto mb-8" />
        <p className="text-2xl md:text-3xl font-bold text-white mb-1">{clientName || "[Client Name]"}</p>
        <p className="text-base font-medium text-white/50 mb-6">{businessName || "[Business Name]"}</p>
        <p className="text-sm text-white/35 uppercase tracking-widest">{date} · Valid 30 days</p>
      </div>
    </section>
  );
}

export function SectionIntro({ clientName, businessName }: { clientName?: string; businessName?: string }) {
  return (
    <section id="section-intro" className="bg-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3a4856] mb-6 pl-3 border-l-2 border-[#b3cee1]">A Personal Note</p>
        <div className="max-w-none text-gray-700 leading-relaxed">
          <p className="text-xl leading-relaxed mb-6" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {clientName ? `Dear ${clientName},` : "Dear [Client Name],"}
          </p>
          <p className="text-xl leading-relaxed mb-6" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Thank you for taking the time to connect with us and share what's happening at {businessName || "your business"}. I genuinely appreciated hearing where you are right now and where you want to go — those conversations are what make this work meaningful.
          </p>
          <p className="text-xl leading-relaxed mb-10" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            This proposal was built around what you told us. Every recommendation you'll find here is rooted in your goals, your audience, and the challenges you're facing — not a generic template. Our team is excited about this project, and we believe we can make a real difference for your business.
          </p>
        </div>
        <div className="mt-10 pt-8 border-t border-gray-200 flex items-center gap-5">
          <img src={mattDarkPhoto} alt="Matt McWilliams" className="w-16 h-16 rounded-full object-cover object-top flex-shrink-0 border-2 border-[#b3cee1]/40 shadow-md" />
          <div>
            <p className="text-gray-500 italic mb-1 text-sm">Warmly,</p>
            <p className="text-gray-800 font-semibold text-lg">Matt McWilliams</p>
            <p className="text-gray-500 text-sm">Founder &amp; CEO, McWilliams Media</p>
          </div>
        </div>
      </div>
    </section>
  );
}


function StarRating() {
  return (
    <div className="flex gap-1 mb-5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function SocialProofSection() {
  const [idx, setIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [slideOffset, setSlideOffset] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      const w = trackRef.current.offsetWidth;
      const gap = 24;
      const cardW = (w - gap) / 2;
      setSlideOffset(cardW + gap);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const testimonials = [
    {
      quote: "I am very pleased with the finished product of my website! Every member of the team was easily accessible and incredibly responsive. They were great to work with. I highly recommend McWilliams Media to anyone wanting to create or improve a website!",
      author: "Greg Sutmiller",
      company: "Evolution Mental Health",
      img: evolutionSiteImg,
      alt: "Evolution Mental Health website",
    },
    {
      quote: "I am just SO VERY OBSESSED with the new logo and website. I cannot tell you how much I love it!!!! Your team put so much time, energy and HEART into capturing our family business and telling our story so well.",
      author: "Sunni Petty",
      company: "Petty Family Floors",
      img: pettyFloorsSiteImg,
      alt: "Petty Family Floors website",
    },
    {
      quote: "They have taken my business to the next level. First impression is everything and with the design of our website they helped us showcase our business better than ever. The team goes above and beyond!",
      author: "Alyssa Hobbs",
      company: "Hobbs Salon + Med Spa",
      img: hobbsSiteImg,
      alt: "Hobbs Salon + Med Spa website",
    },
  ];

  const maxIdx = testimonials.length - 2;
  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
    flexShrink: 0,
    width: slideOffset ? slideOffset - 24 : "calc(50% - 12px)",
  };

  return (
    <section
      id="section-social-proof"
      className="py-24 px-6"
      style={{ background: "#061e57" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#b3cee1] mb-3">Real Results</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            What Our Clients Say
          </h2>
          <div className="mt-4 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-[#b3cee1] text-sm mt-2">Trusted by businesses across the country</p>
        </div>

        {/* Carousel track */}
        <div ref={trackRef} className="overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${idx * slideOffset}px)` }}
          >
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl p-7 flex flex-col" style={cardStyle}>
                <StarRating />
                <div className="text-white/15 text-6xl leading-none font-serif mb-1 -mt-2 select-none">"</div>
                <blockquote
                  className="text-white text-base md:text-lg leading-relaxed font-medium flex-1 -mt-3"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {t.quote}
                </blockquote>
                <div className="mt-auto">
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3">
                    <div className="w-6 h-px bg-[#b3cee1]" />
                    <div>
                      <p className="text-[#b3cee1] font-semibold text-sm">{t.author}</p>
                      <p className="text-[#b3cee1]/60 text-xs">{t.company}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg overflow-hidden border border-white/10">
                    <div className="h-5 flex items-center gap-1 px-2.5" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/80" />
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400/80" />
                    </div>
                    <img src={t.img} alt={t.alt} className="w-full h-44 object-cover object-top" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Dot indicators */}
          <div className="flex gap-2.5 items-center">
            {Array.from({ length: maxIdx + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: idx === i ? 24 : 8,
                  height: 8,
                  background: idx === i ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setIdx(i => Math.min(maxIdx, i + 1))}
            disabled={idx === maxIdx}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function TestimonialSection({ quote, author, websiteImg, websiteAlt, dark = true }: {
  quote: string; author: string; websiteImg?: string; websiteAlt?: string; dark?: boolean;
}) {
  return (
    <section id="section-client-success" className={`py-20 px-6 ${dark ? "bg-[#061e57]" : "bg-[#f8f9fc]"}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`grid gap-8 items-center ${websiteImg ? "grid-cols-1 lg:grid-cols-[5fr_8fr]" : "grid-cols-1"}`}>
          {websiteImg && (
            <div className="rounded-xl overflow-hidden shadow-xl border border-white/10 max-w-[260px] w-full mx-auto lg:mx-0">
              <img src={websiteImg} alt={websiteAlt || "Client website"} className="w-full h-auto object-cover" />
            </div>
          )}
          <div>
            <blockquote className={`text-xl md:text-2xl leading-relaxed font-medium ${dark ? "text-white" : "text-gray-800"}`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              "{quote}"
            </blockquote>
            <p className={`mt-6 text-base font-medium ${dark ? "text-[#b3cee1]/80" : "text-[#061e57]"}`}>— {author}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* TestimonialSection kept for backward-compat with tiered/ala-carte templates */

export function StrategySection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3a4856] mb-4 pl-3 border-l-2 border-[#b3cee1]">Your Solution</p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          What we're building — and why it's right for you.
        </h2>
        <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
          <p>More than 75% of consumers research a business online before making a purchase — making your website your first impression, your best salesperson, and your strongest competitive edge.</p>
          <p>But it has to be built right. With decades of combined experience, we design websites around your goals and your audience, so visitors don't just browse — they buy. Every site we build is tailored specifically to the business behind it — never a cookie-cutter theme applied to your name.</p>
          <p>The result: a professional, conversion-focused digital presence that works as hard as you do.</p>
        </div>
      </div>
    </section>
  );
}

export function CustomWebsiteSection({ numberOfPages, pageNames }: { numberOfPages?: number | null; pageNames?: string | null }) {
  const pageCount = numberOfPages || "XX";
  const pages = pageNames || "Home | About | Services | FAQ/Resources/Blog | Contact";
  return (
    <section id="section-pages" className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Your Custom Website</h2>
        <p className="text-gray-600 mb-10 text-lg">Thank you for taking the time to share your goals, challenges, and target audiences with us.</p>
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Deliverables — What to Expect:</h3>
          <ul className="space-y-3">
            <CheckItem>New website built on WordPress theme</CheckItem>
            <CheckItem>Mobile responsive website that will be visible on any device</CheckItem>
            <CheckItem>New website design with a modern look and feel</CheckItem>
            <CheckItem>Website content proofed and edited by our writing team</CheckItem>
            <CheckItem>Backend access with the ability to add content and edit your own site</CheckItem>
            <CheckItem>Screen-recorded training on how to edit your own site</CheckItem>
          </ul>
        </div>
        <div className="mb-10 bg-[#eef4f9] rounded-xl p-6 border border-[#b3cee1]/40">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Web Pages — {pageCount}</h3>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">Your web pages carry the bulk of who you are as a company. These will be built around your business and customized with care and detail that reflects your brand.</p>
          <p className="font-semibold text-[#061e57] text-sm">{pages}</p>
          <div className="mt-4 pt-4 border-t border-[#b3cee1]/50">
            <p className="text-xs font-bold text-gray-700 mb-1">Required Pages</p>
            <p className="text-sm text-gray-600">Privacy Policy | Term &amp; Conditions | Site Map</p>
          </div>
        </div>
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Integrations</h3>
          <ul className="space-y-3">
            <CheckItem>Social Media links</CheckItem>
            <CheckItem>Call to action items to increase engagement and conversions</CheckItem>
            <CheckItem>Contact Form</CheckItem>
            <CheckItem>"Click to Call" from Mobile Phone</CheckItem>
            <CheckItem>Set up Google Analytics &amp; Search Console (optional)</CheckItem>
          </ul>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Website Training</h3>
          <p className="text-gray-600 text-sm leading-relaxed">This add-on service includes a training session with a member of our team to help you learn how to operate and navigate the backend of your website.</p>
        </div>
      </div>
    </section>
  );
}

export function CustomProjectSection({ projectDetails }: { projectDetails?: string | null }) {
  return (
    <section id="section-project" className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Your Project</h2>
        <p className="text-gray-600 mb-10 text-lg">Thank you for taking the time to share your goals, challenges, and vision with us.</p>
        {projectDetails && (
          <div className="mb-10 bg-[#eef4f9] rounded-xl p-6 border border-[#b3cee1]/40">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Project Details</h3>
            <p className="text-gray-700 leading-relaxed">{projectDetails}</p>
          </div>
        )}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Deliverables — What to Expect:</h3>
          <ul className="space-y-3">
            <CheckItem>Project built to your specifications and brand standards</CheckItem>
            <CheckItem>Mobile responsive and optimized for all devices</CheckItem>
            <CheckItem>Modern design with a polished look and feel</CheckItem>
            <CheckItem>Content proofed and refined by our team</CheckItem>
            <CheckItem>Backend access with training on how to manage your project</CheckItem>
            <CheckItem>Screen-recorded walkthrough of your completed project</CheckItem>
          </ul>
        </div>
        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Integrations</h3>
          <ul className="space-y-3">
            <CheckItem>Social media links and call-to-action elements</CheckItem>
            <CheckItem>Contact form and lead capture setup</CheckItem>
            <CheckItem>Analytics and performance tracking (optional)</CheckItem>
          </ul>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Training & Handoff</h3>
          <p className="text-gray-600 text-sm leading-relaxed">Includes a dedicated handoff session with a member of our team so you feel confident managing and updating your project going forward.</p>
        </div>
      </div>
    </section>
  );
}

export function TimelineSection() {
  return (
    <section className="bg-[#f8f9fc] py-20 px-6 border-t border-gray-100">
      <div className="max-w-2xl mx-auto space-y-14">

        {/* ── Design Process Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10" style={{ boxShadow: "0 2px 24px rgba(6,30,87,.08)" }}>

          {/* Header */}
          <div style={{ marginBottom: 28, paddingBottom: 18, borderBottom: "3px solid #061e57" }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", color: "#3a4856", marginBottom: 6 }}>McWilliams Media</p>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: ".05em", color: "#061e57" }}>Website Design Process</p>
          </div>

          {/* ══ Phase 1 — Discovery ══ */}
          <div className="mcw-phase-label" style={{ background: "#061e57" }}>
            <svg className="mcw-phase-icon" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="#b3cee1" strokeWidth="1.4"/>
              <path d="M6 9l2.5 2.5L12 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Phase 1 — Discovery
          </div>

          {/* Step 1 — Kick-off */}
          <div className="mcw-step" style={{ animationDelay: ".05s" }}>
            <div className="mcw-step-spine">
              <div className="mcw-step-dot">
                <svg className="mcw-shake-svg" width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <path d="M3 16l4-4 3 2 4-4 3 2 4-3 4 4" stroke="#061e57" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M3 16l4 4h4l2-2 2 2h4l4-4" stroke="#061e57" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <circle cx="10" cy="8" r="2.5" stroke="#061e57" strokeWidth="1.4" fill="none"/>
                  <circle cx="18" cy="8" r="2.5" stroke="#061e57" strokeWidth="1.4" fill="none"/>
                  <path d="M7.5 10.5C7.5 10.5 9 12 10 12M20.5 10.5C20.5 10.5 19 12 18 12" stroke="#061e57" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <div className="mcw-connector"/>
            </div>
            <div className="mcw-step-body">
              <p className="mcw-step-label">Kick-off meeting</p>
              <p className="mcw-step-desc">We align on your goals, audience, and timeline — then we get to work.</p>
            </div>
          </div>

          {/* Step 2 — Wireframe */}
          <div className="mcw-step" style={{ animationDelay: ".13s" }}>
            <div className="mcw-step-spine">
              <div className="mcw-step-dot">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <rect x="5" y="4" width="18" height="14" rx="2" stroke="#061e57" strokeWidth="1.6" fill="none"/>
                  <line x1="9" y1="9"  x2="19" y2="9"  stroke="#061e57" strokeWidth="1.3" strokeLinecap="round"/>
                  <line x1="9" y1="12" x2="15" y2="12" stroke="#061e57" strokeWidth="1.3" strokeLinecap="round"/>
                  <rect x="5" y="18" width="18" height="4.5" rx="1.5" stroke="#061e57" strokeWidth="1.3" fill="none"/>
                  <line x1="14" y1="18" x2="14" y2="22.5" stroke="#061e57" strokeWidth="1.3"/>
                </svg>
              </div>
              <div className="mcw-connector-dashed"/>
            </div>
            <div className="mcw-step-body">
              <p className="mcw-step-label">Wireframe</p>
              <p className="mcw-step-desc">A working home page with design elements, header, and footer — sent to you for review before the full build begins.</p>
              <span className="mcw-step-tag mcw-tag-days">Goal: 12 business days</span>
            </div>
          </div>

          {/* Wireframe review loop */}
          <div className="mcw-loop-wrap" style={{ animationDelay: ".20s" }}>
            <div className="mcw-loop-box">
              <div className="mcw-loop-header">
                <span className="mcw-loop-header-text">Review &amp; revise</span>
              </div>
              <div className="mcw-loop-row">
                <div className="mcw-loop-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                    <path d="M6 8h16M6 13h10M6 18h13" stroke="#061e57" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="22" cy="20" r="5" stroke="#061e57" strokeWidth="1.5" fill="none"/>
                    <line x1="22" y1="17.5" x2="22" y2="20.5" stroke="#061e57" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="22" cy="22.5" r=".8" fill="#061e57"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="mcw-loop-row-title">You send feedback</p>
                  <p className="mcw-loop-row-desc">Via MarkUp or written email</p>
                </div>
                <span className="mcw-loop-days client">5 bus. days</span>
              </div>
              <div className="mcw-loop-row">
                <div className="mcw-loop-icon-wrap">
                  <svg className="mcw-plane-svg" width="20" height="20" viewBox="0 0 28 28" fill="none">
                    <polygon points="3,14 25,7 20,14 25,21" stroke="#061e57" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
                    <line x1="20" y1="14" x2="13" y2="18" stroke="#061e57" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="mcw-loop-row-title">We revise &amp; resend</p>
                </div>
                <span className="mcw-loop-days mcw">3 bus. days</span>
              </div>
            </div>
          </div>

          {/* Step 3 — Approve wireframe */}
          <div className="mcw-step" style={{ animationDelay: ".27s" }}>
            <div className="mcw-step-spine">
              <div className="mcw-step-dot filled">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="8" stroke="#b3cee1" strokeWidth="1.4" fill="none"/>
                  <path className="mcw-check-path" d="M9 14L12.5 17.5L19 10.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div className="mcw-connector"/>
            </div>
            <div className="mcw-step-body">
              <p className="mcw-step-label">You approve the wireframe</p>
              <p className="mcw-step-desc">Structure locked in — we move to the full build.</p>
            </div>
          </div>

          {/* ══ Phase 2 — Build ══ */}
          <div className="mcw-phase-label" style={{ background: "#3a4856" }}>
            <svg className="mcw-phase-icon" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="10" rx="2" stroke="#b3cee1" strokeWidth="1.4"/>
              <line x1="2" y1="7" x2="16" y2="7" stroke="#fff" strokeWidth="1.2"/>
              <circle cx="4.5" cy="5.5" r=".8" fill="#b3cee1"/>
              <circle cx="7"   cy="5.5" r=".8" fill="#b3cee1"/>
            </svg>
            Phase 2 — Build
          </div>

          {/* Step 4 — Buildout */}
          <div className="mcw-step" style={{ animationDelay: ".34s" }}>
            <div className="mcw-step-spine">
              <div className="mcw-step-dot">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <rect x="3" y="4" width="22" height="15" rx="2" stroke="#061e57" strokeWidth="1.6" fill="none"/>
                  <line x1="3" y1="9" x2="25" y2="9" stroke="#061e57" strokeWidth="1.3"/>
                  <circle cx="6.5"  cy="6.5" r="1" fill="#b3cee1"/>
                  <circle cx="9.5"  cy="6.5" r="1" fill="#b3cee1"/>
                  <circle cx="12.5" cy="6.5" r="1" fill="#061e57"/>
                  <line x1="7" y1="12.5" x2="15" y2="12.5" stroke="#061e57" strokeWidth="1.3" strokeLinecap="round"/>
                  <line x1="7" y1="15.5" x2="22" y2="15.5" stroke="#b3cee1" strokeWidth="1.3" strokeLinecap="round"/>
                  <rect x="7" y="19" width="14" height="3" rx="1" stroke="#061e57" strokeWidth="1.3" fill="none"/>
                  <line x1="14" y1="19" x2="14" y2="22" stroke="#061e57" strokeWidth="1.3"/>
                </svg>
              </div>
              <div className="mcw-connector-dashed"/>
            </div>
            <div className="mcw-step-body">
              <p className="mcw-step-label">Website buildout</p>
              <p className="mcw-step-desc">Every page designed and built — colors, fonts, images, and content. Drafts sent to you for review.</p>
              <span className="mcw-step-tag mcw-tag-days">Goal: 12 business days</span>
            </div>
          </div>

          {/* Build review loop */}
          <div className="mcw-loop-wrap" style={{ animationDelay: ".41s" }}>
            <div className="mcw-loop-box">
              <div className="mcw-loop-header">
                <span className="mcw-loop-header-text">Review &amp; revise</span>
              </div>
              <div className="mcw-loop-row">
                <div className="mcw-loop-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                    <path d="M6 8h16M6 13h10M6 18h13" stroke="#061e57" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="22" cy="20" r="5" stroke="#061e57" strokeWidth="1.5" fill="none"/>
                    <line x1="22" y1="17.5" x2="22" y2="20.5" stroke="#061e57" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="22" cy="22.5" r=".8" fill="#061e57"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="mcw-loop-row-title">You send feedback</p>
                  <p className="mcw-loop-row-desc">Via MarkUp or written email</p>
                </div>
                <span className="mcw-loop-days client">5 bus. days</span>
              </div>
              <div className="mcw-loop-row">
                <div className="mcw-loop-icon-wrap">
                  <svg className="mcw-plane-svg" width="20" height="20" viewBox="0 0 28 28" fill="none">
                    <polygon points="3,14 25,7 20,14 25,21" stroke="#061e57" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
                    <line x1="20" y1="14" x2="13" y2="18" stroke="#061e57" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p className="mcw-loop-row-title">We revise &amp; resend</p>
                </div>
                <span className="mcw-loop-days mcw">3 bus. days</span>
              </div>
            </div>
          </div>

          {/* ══ Phase 3 — Launch ══ */}
          <div className="mcw-phase-label" style={{ background: "#7c370c" }}>
            <svg className="mcw-phase-icon" viewBox="0 0 18 18" fill="none">
              <path d="M9 2C9 2 14 5 14 11L9 14L4 11C4 5 9 2 9 2Z" stroke="#d8bfa7" strokeWidth="1.3" fill="none"/>
              <circle cx="9" cy="8.5" r="2" stroke="#fff" strokeWidth="1.2" fill="none"/>
            </svg>
            Phase 3 — Launch
          </div>

          {/* Step 5 — Approve & sign off */}
          <div className="mcw-step" style={{ animationDelay: ".48s" }}>
            <div className="mcw-step-spine">
              <div className="mcw-step-dot filled">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="8" stroke="#b3cee1" strokeWidth="1.4" fill="none"/>
                  <path className="mcw-check-path" d="M9 14L12.5 17.5L19 10.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div className="mcw-connector"/>
            </div>
            <div className="mcw-step-body">
              <p className="mcw-step-label">You approve &amp; sign off</p>
              <p className="mcw-step-desc">Nothing goes live without your go-ahead.</p>
            </div>
          </div>

          {/* Step 6 — Site goes live */}
          <div className="mcw-step" style={{ animationDelay: ".55s" }}>
            <div className="mcw-step-spine">
              <div className="mcw-step-dot brown">
                <svg className="mcw-rocket-svg" width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <path d="M14 3C14 3 21 7.5 21 16L14 21L7 16C7 7.5 14 3 14 3Z" stroke="#d8bfa7" strokeWidth="1.6" fill="none"/>
                  <circle cx="14" cy="12" r="2.8" stroke="#d8bfa7" strokeWidth="1.3" fill="none"/>
                  <path d="M9.5 17L6 21.5L11 20.5Z"  stroke="#d8bfa7" strokeWidth="1.1" fill="none"/>
                  <path d="M18.5 17L22 21.5L17 20.5Z" stroke="#d8bfa7" strokeWidth="1.1" fill="none"/>
                  <path d="M11.5 21L10.5 25.5L14 23L17.5 25.5L16.5 21" stroke="#d8bfa7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
            </div>
            <div className="mcw-step-body">
              <p className="mcw-step-label">Site goes live</p>
              <p className="mcw-step-desc">We publish and hand over logins, docs, and next steps.</p>
            </div>
          </div>

        </div>

        {/* Timeline Deposit */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Timeline Deposit</h2>
          <p className="text-gray-600 leading-relaxed">We want your website live as quickly as possible. The timeline deposit keeps your project moving without delays — and it's fully refundable when we hit your 90-day goal together.</p>
        </div>

      </div>
    </section>
  );
}

export function BrandShootSection() {
  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Brand Shoot</h2>
        <p className="text-[#061e57] font-semibold mb-2">$850 one-time for pro photos only</p>
        <p className="text-[#3a4856] text-sm mb-6">+ $150 one-time iPhone Video B-Roll Clip Add-On</p>
        <p className="text-gray-600 leading-relaxed mb-6">While not required, it's often a valuable investment as high-quality, branded images and videos can significantly elevate the look and credibility of your website.</p>
        <ul className="space-y-3 mb-6">
          <CheckItem>1 Location · Up to 2 hours · 50+ edited images</CheckItem>
        </ul>
      </div>
    </section>
  );
}

const HOSTING_PLANS = [
  {
    id: "gold",
    name: "Gold",
    price: "$60/mo",
    recommended: true,
    features: ["Dedicated server", "High speed server", "Software updates", "Free SSL certificate", "Monthly backups", "Advanced security", "Basic site maintenance"],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: "$100/mo",
    recommended: false,
    features: ["Everything in Gold", "1 hour of Monthly Updates"],
  },
];

export function EssentialsSection({ selectedHosting, onSelectHosting }: {
  selectedHosting?: string | null;
  onSelectHosting?: (id: string) => void;
}) {
  const interactive = !!onSelectHosting;
  return (
    <section className="bg-[#f8f9fc] py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Website Essentials</h2>
        <p className="text-gray-600 mb-12">Every website requires two key components to stay online and functional.</p>
        <div className="space-y-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Domain Name (URL)</h3>
            <p className="text-gray-600 leading-relaxed">Your domain name is your website's www address. Visit <span className="text-[#3a4856] font-medium">mcwdomains.com</span> to explore available options.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Website Hosting</h3>
            {interactive && (
              <p className="text-sm text-gray-500 mb-5">Select a hosting plan that fits your needs.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HOSTING_PLANS.map((plan) => {
                const isSelected = selectedHosting === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => interactive && onSelectHosting(plan.id)}
                    className={cn(
                      "rounded-xl border p-5 transition-all",
                      interactive && "cursor-pointer",
                      isSelected
                        ? "border-[#061e57] bg-[#eef4f9] shadow-lg ring-2 ring-[#061e57]"
                        : plan.recommended && !interactive
                        ? "border-[#3a4856] bg-[#eef4f9] shadow-md"
                        : plan.recommended
                        ? "border-[#b3cee1] bg-[#eef4f9]/60 shadow-sm hover:border-[#061e57] hover:shadow-md"
                        : "border-gray-200 bg-white hover:border-[#b3cee1] hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className={cn("font-bold text-lg", isSelected || plan.recommended ? "text-[#061e57]" : "text-gray-900")}>
                        {plan.name}
                      </p>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#3a4856] flex-shrink-0" />}
                    </div>
                    <p className={cn("text-2xl font-bold mb-4", isSelected || plan.recommended ? "text-[#3a4856]" : "text-gray-700")}>
                      {plan.price}
                    </p>
                    <ul className="space-y-1.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-3.5 h-3.5 text-[#3a4856] mt-0.5 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingSection({ numberOfPages, totalAmount, pricingItems }: {
  numberOfPages?: number | null;
  totalAmount?: number | null;
  pricingItems?: string | null;
}) {
  const pages = numberOfPages || 5;
  const defaultItems: PricingLineItem[] = [
    { desc: "Website Setup & Required Pages", rate: 110, qty: "10 Hours", price: 1100 },
    { desc: "Revisions & Launch", rate: 350, qty: "1 Unit", price: 350 },
    { desc: "Google Analytics & Search Console Setup", rate: 110, qty: "1 Unit", price: 110 },
    { desc: `Web Pages (${pages})`, rate: 350, qty: `${pages} Pages`, price: 350 * pages },
    { desc: "Website Theme", rate: 75, qty: "1 Unit", price: 75 },
    { desc: "Timeline Deposit (eligible for refund)", rate: 500, qty: "1 Unit", price: 500 },
  ];

  let customItems: PricingLineItem[] | null = null;
  if (pricingItems) {
    try { customItems = JSON.parse(pricingItems) as PricingLineItem[]; } catch { customItems = null; }
  }
  const items = customItems && customItems.length > 0 ? customItems : defaultItems;
  const calcTotal = items.reduce((s, i) => s + i.price, 0);
  const displayTotal = (totalAmount && totalAmount > 0) ? totalAmount : calcTotal;

  return (
    <section id="section-pricing" className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Project Quote</h2>
        <div className="mt-8 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-[#061e57] px-6 py-4 flex justify-between items-center">
            <p className="text-white font-bold text-lg">Website Design</p>
            <p className="text-white font-bold text-xl">${displayTotal.toLocaleString()}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-gray-600 font-semibold">Description</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Rate</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Qty</th>
                <th className="text-right px-6 py-3 text-gray-600 font-semibold">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.desc} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-800">{item.desc}</td>
                  <td className="px-4 py-3 text-right text-gray-600">${item.rate.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{item.qty}</td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-900">${item.price.toLocaleString()}.00</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 text-right font-bold text-[#061e57] text-lg">${displayTotal.toLocaleString()}.00</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-5 flex items-center justify-between px-6 py-4 rounded-xl bg-[#061e57] text-white">
          <p className="text-sm font-bold uppercase tracking-widest opacity-80">Total Pricing</p>
          <p className="text-2xl font-black">
            ${displayTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">Prices in USD · This quote is valid for 30 days</p>
      </div>
    </section>
  );
}

export function TeamSection() {
  const team = [
    { name: "Matt McWilliams", title: "Owner & CEO", photo: mattDarkPhoto, bio: "We've been helping businesses like yours succeed through thoughtful web design since 2011." },
    { name: "Lindsay McWilliams", title: "Owner & CFO", photo: lindsayPhoto, bio: "I help create a strong foundation that allows our team to focus on delivering exceptional design solutions tailored to your needs." },
    { name: "Tiffany King", title: "Owner & COO", photo: rachellePhoto, bio: "My passion for marketing and design continues to earn the trust of business leaders." },
    { name: "Rachelle Hoover", title: "Marketing Director", photo: tiffanyPhoto, bio: "My goal is to help your business stand out online with strategy-driven content that connects and converts." },
    { name: "Elise Johnson", title: "Client Strategist", photo: elisePhoto, bio: "With a collaborative approach, I work closely with you to guide strategy and keep initiatives moving forward." },
    { name: "Ashlea Calhoon", title: "Social Media Director", photo: ashleaPhoto, bio: "I craft compelling content and grow online communities that turn followers into loyal customers." },
    { name: "Natalee Groves", title: "Designer", photo: nataleePhoto, bio: "I create functional, beautifully designed websites that stay true to your brand and help your business stand out." },
    { name: "Chloe Brunner", title: "Designer", photo: chloePhoto, bio: "I design websites that are both beautiful and built to perform — staying true to your brand every step of the way." },
  ];
  return (
    <section className="bg-[#061e57] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="w-10 h-0.5 bg-[#b3cee1] mb-6" />
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>Meet Our</h2>
        <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-6" style={{ fontFamily: "'Montserrat', sans-serif", color: "#b3cee1" }}>Team</h3>
        <p className="text-white/50 text-sm uppercase tracking-widest mb-4">Professional · Knowledgeable · Collaborative · Passionate</p>
        <p className="text-white/70 mb-12 leading-relaxed max-w-2xl">At the heart of our success is a talented team committed to helping you achieve your business goals. Together, we're dedicated to delivering results that make a difference for your business.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {team.map((member) => (
            <div key={member.name} className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10 flex gap-4">
              <img src={member.photo} alt={member.name} className="w-14 h-14 rounded-full object-cover object-top flex-shrink-0 border-2 border-[#b3cee1]/30" />
              <div>
                <p className="text-white font-bold">{member.name}</p>
                <p className="text-[#b3cee1] text-xs mb-2 font-medium">{member.title}</p>
                <p className="text-white/85 text-sm leading-relaxed">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhatsNextSection() {
  const steps = [
    {
      number: "01",
      title: "Accept this proposal",
      desc: "Click the button below to accept. Your spot on our project calendar is secured the moment you do.",
    },
    {
      number: "02",
      title: "A contract is emailed to you",
      desc: "We'll send your contract right away. Review and sign it digitally — no printing required.",
    },
    {
      number: "03",
      title: "Onboarding documents",
      desc: "You'll receive our onboarding documents to gather the details we need to hit the ground running.",
    },
    {
      number: "04",
      title: "Kick-off meeting",
      desc: "Once everything is in place, we'll schedule your kick-off meeting to align on goals, timeline, and next steps.",
    },
  ];

  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3a4856] mb-4 pl-3 border-l-2 border-[#b3cee1]">One Clear Next Step</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>What happens when you say yes.</h2>
        <p className="text-gray-500 mb-12 text-lg">Here's exactly what to expect — no ambiguity, no chasing people down.</p>
        <div className="space-y-8 mb-14">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#061e57] flex items-center justify-center">
                <span className="text-white text-xs font-bold">{step.number}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg mb-1">{step.title}</p>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[#eef4f9] rounded-xl p-6 border border-[#b3cee1]/40 mb-8">
          <p className="font-bold text-gray-800 mb-2">Payment Schedule</p>
          <p className="text-gray-600">Half is due upon signing and the remaining balance is divided equally over the following three months.</p>
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

export function AcceptSection({ clientName, totalAmount, onAccept, isPending, disabled, selectedHosting }: {
  clientName: string; totalAmount: number; onAccept?: () => void;
  isPending?: boolean; disabled?: boolean; selectedHosting?: string | null;
}) {
  const hostingLabel = selectedHosting === "gold" ? "Gold Hosting — $60/mo"
    : selectedHosting === "platinum" ? "Platinum Hosting — $100/mo"
    : null;

  return (
    <section className="py-20 px-6" style={{ background: "#061e57" }}>
      <div className="max-w-xl mx-auto text-center">
        <div className="w-10 h-0.5 bg-[#b3cee1] mx-auto mb-6" />
        <h2 className="text-4xl md:text-5xl font-black text-white mb-1 uppercase tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>Ready to work</h2>
        <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "'Montserrat', sans-serif", color: "#b3cee1" }}>together?</h3>
        <p className="text-white/60 mb-2 text-sm">Click below to accept this proposal and secure your spot on our project calendar.</p>
        <p className="text-[#b3cee1]/70 text-sm mb-10">Our team will follow up with a contract.</p>
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          {hostingLabel && (
            <div className="mb-6 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#eef4f9] border border-[#b3cee1]/50 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-[#3a4856] flex-shrink-0" />
              <p className="text-sm font-semibold text-[#061e57]">{hostingLabel} selected</p>
            </div>
          )}
          {totalAmount > 0 && (
            <p className="text-gray-600 text-sm mb-8">
              Investment of <strong>${totalAmount.toLocaleString()}</strong>.
            </p>
          )}
          {onAccept && !selectedHosting && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-amber-500 text-base leading-none">↑</span>
              <p className="text-sm text-amber-700 font-medium">Please select a hosting plan above before accepting.</p>
            </div>
          )}
          {onAccept && (
            <div className="no-print">
              <Button
                onClick={onAccept}
                disabled={disabled || isPending}
                className="w-full h-14 bg-[#061e57] hover:bg-[#3a4856] text-white text-base font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">Accept Proposal <ArrowRight className="w-4 h-4" /></span>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function FullProposalTemplate({ data, onAccept, isPending }: {
  data: ProposalData;
  onAccept?: (selectedHosting?: string) => void;
  isPending?: boolean;
}) {
  const [selectedHosting, setSelectedHosting] = useState<string | null>(null);
  const proposalDate = data.createdAt ? new Date(data.createdAt) : new Date();
  const dateStr = proposalDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* 1. Cover */}
      <ProposalCover
        clientName={data.clientName}
        businessName={data.businessName}
        projectType={data.projectType}
        date={dateStr}
      />
      {/* 2. Personal intro letter — signed by Matt */}
      <SectionIntro clientName={data.clientName} businessName={data.businessName} />
      {/* 3. Social proof — all testimonials in one section, before pricing */}
      <SocialProofSection />
      {/* 5. Your solution */}
      <StrategySection />
      {/* 6. Deliverables */}
      {data.projectType === "project" ? (
        <CustomProjectSection projectDetails={data.pageNames} />
      ) : (
        <>
          <CustomWebsiteSection numberOfPages={data.numberOfPages} pageNames={data.pageNames} />
          {/* 7. Process / Timeline */}
          <TimelineSection />
          <BrandShootSection />
          <EssentialsSection
            selectedHosting={onAccept ? selectedHosting : null}
            onSelectHosting={onAccept ? setSelectedHosting : undefined}
          />
        </>
      )}
      {/* 8. Investment — pricing after value is established */}
      <PricingSection numberOfPages={data.numberOfPages} totalAmount={data.totalAmount} pricingItems={data.pricingItems} />
      {/* 9. Team */}
      <TeamSection />
      {/* 10. What's Next */}
      <WhatsNextSection />
      {data.loomVideoUrl && (
        <section className="bg-gray-50 py-20 px-6 border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Strategy Briefing</h2>
            <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-lg">
              <iframe src={data.loomVideoUrl.includes("loom.com/share/") ? data.loomVideoUrl.replace("share/", "embed/") : data.loomVideoUrl} className="w-full h-full" allowFullScreen />
            </div>
          </div>
        </section>
      )}
      <AcceptSection
        clientName={data.clientName}
        totalAmount={Number(data.totalAmount) || 0}
        onAccept={onAccept ? () => onAccept(selectedHosting ?? undefined) : undefined}
        isPending={isPending}
        disabled={!selectedHosting}
        selectedHosting={selectedHosting}
      />
    </div>
  );
}
