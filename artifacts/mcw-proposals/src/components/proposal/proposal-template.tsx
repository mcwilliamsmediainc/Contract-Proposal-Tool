import { useState } from "react";
import { Check, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
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
import rachellePhoto from "@assets/ssMoAw74pdhyxd7r-DQT0dFCZPwoP-UOcOJhbQ_1777926746603.jpeg";
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
      <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
        <Check className="w-3 h-3 text-white" />
      </div>
      <span className="text-gray-700">{children}</span>
    </li>
  );
}

export function ProposalCover({ clientName, businessName, projectType, date }: {
  clientName: string; businessName: string; projectType: string; date: string;
}) {
  const label = projectType === "tiered" ? "Marketing" : projectType === "ala-carte" ? "Ala Carte Marketing" : projectType === "marketing" ? "Marketing" : projectType === "print" ? "Print" : "Website";
  return (
    <section id="section-cover" className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #0d3494 35%, #1a5bb8 65%, #0d3494 85%, #0a1f5c 100%)" }}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)"
      }} />
      <div className="relative z-10 max-w-3xl mx-auto">
        <img src="/mcwilliams-logo.png" alt="McWilliams Media" className="h-16 md:h-20 mx-auto mb-10 brightness-0 invert" />
        <h1 className="text-5xl md:text-7xl text-white mb-8 leading-tight tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontStyle: "normal" }}>
          {label} Proposal
        </h1>
        <p className="text-xl md:text-2xl font-bold text-white mb-2">Prepared for {clientName || "[Client Name]"}</p>
        <p className="text-lg font-bold text-white/80 mb-4">{businessName || "[Business Name]"}</p>
        <p className="text-base italic text-white/60 mb-2">{date}, {new Date().getFullYear()}</p>
        <p className="text-base italic text-white/50">This quote is valid for 30 days</p>
      </div>
    </section>
  );
}

export function SectionIntro({ clientName, businessName }: { clientName?: string; businessName?: string }) {
  return (
    <section id="section-intro" className="bg-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-6">A Personal Note</p>
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
          <img src={mattDarkPhoto} alt="Matt McWilliams" className="w-16 h-16 rounded-full object-cover object-top flex-shrink-0 border-2 border-blue-100 shadow-md" />
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

export function SituationSection({ content }: { content?: string | null }) {
  if (!content) return null;
  return (
    <section id="section-situation" className="bg-[#f8f9fc] py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-4">Where You Are Right Now</p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          The Problem / Your Situation
        </h2>
        <p className="text-xl leading-relaxed text-gray-700 whitespace-pre-wrap" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {content}
        </p>
      </div>
    </section>
  );
}

export function SocialProofSection() {
  const testimonials = [
    {
      quote: "I am very pleased with the finished product of my website! Every member of the team was easily accessible and incredibly responsive. They were great to work with. I highly recommend McWilliams Media to anyone wanting to create or improve a website!",
      author: "Greg Sutmiller, Evolution Mental Health",
      websiteImg: evolutionSiteImg,
      websiteAlt: "Evolution Mental Health website",
    },
    {
      quote: "I am just SO VERY OBSESSED with the new logo and website. I cannot tell you how much I love it!!!! Your team put so much time, energy and HEART into capturing our family business and telling our story so well.",
      author: "Sunni Petty, Petty Family Floors",
      websiteImg: pettyFloorsSiteImg,
      websiteAlt: "Petty Family Floors website",
    },
    {
      quote: "They have taken my business to the next level. First impression is everything and with the design of our website they helped us showcase our business better than ever. The team goes above and beyond!",
      author: "Alyssa Hobbs, Hobbs Salon + Med Spa",
      websiteImg: hobbsSiteImg,
      websiteAlt: "Hobbs Salon + Med Spa website",
    },
  ];

  return (
    <section id="section-social-proof" className="bg-[#0a1f5c] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-300 mb-4">Real Results</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-14 leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          What Our Clients Say
        </h2>
        <div className="space-y-14">
          {testimonials.map((t, i) => (
            <div key={t.author} className={`grid gap-8 items-center ${t.websiteImg ? "grid-cols-1 lg:grid-cols-[4fr_7fr]" : "grid-cols-1"} ${i < testimonials.length - 1 ? "pb-14 border-b border-white/10" : ""}`}>
              {t.websiteImg && (
                <div className="rounded-xl overflow-hidden shadow-xl border border-white/10 max-w-[220px] w-full mx-auto lg:mx-0">
                  <img src={t.websiteImg} alt={t.websiteAlt || "Client website"} className="w-full h-auto object-cover" />
                </div>
              )}
              <div>
                <blockquote className="text-xl md:text-2xl leading-relaxed font-medium text-white" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  "{t.quote}"
                </blockquote>
                <p className="mt-6 text-base font-medium text-blue-300">— {t.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialSection({ quote, author, websiteImg, websiteAlt, dark = true }: {
  quote: string; author: string; websiteImg?: string; websiteAlt?: string; dark?: boolean;
}) {
  return (
    <section id="section-client-success" className={`py-20 px-6 ${dark ? "bg-[#0a1f5c]" : "bg-[#f8f9fc]"}`}>
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
            <p className={`mt-6 text-base font-medium ${dark ? "text-blue-200" : "text-blue-700"}`}>— {author}</p>
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
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-4">Your Solution</p>
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
        <div className="mb-10 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Web Pages — {pageCount}</h3>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">Your web pages carry the bulk of who you are as a company. These will be built around your business and customized with care and detail that reflects your brand.</p>
          <p className="font-semibold text-blue-700 text-sm">{pages}</p>
          <div className="mt-4 pt-4 border-t border-blue-200">
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

export function TimelineSection() {
  return (
    <section className="bg-[#f8f9fc] py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto space-y-14">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Website Design Process</h2>
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white p-4">
            <img src={processImg} alt="Website Design Process" className="w-full h-auto" />
          </div>
        </div>
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
        <p className="text-blue-700 font-semibold mb-2">$850 one-time for pro photos only</p>
        <p className="text-blue-600 text-sm mb-6">+ $150 one-time iPhone Video B-Roll Clip Add-On</p>
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
            <p className="text-gray-600 leading-relaxed">Your domain name is your website's www address. Visit <span className="text-blue-600 font-medium">mcwdomains.com</span> to explore available options.</p>
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
                        ? "border-blue-600 bg-blue-50 shadow-lg ring-2 ring-blue-500"
                        : plan.recommended && !interactive
                        ? "border-blue-400 bg-blue-50 shadow-md"
                        : plan.recommended
                        ? "border-blue-300 bg-blue-50/60 shadow-sm hover:border-blue-500 hover:shadow-md"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className={cn("font-bold text-lg", isSelected || plan.recommended ? "text-blue-700" : "text-gray-900")}>
                        {plan.name}
                      </p>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                    </div>
                    <p className={cn("text-2xl font-bold mb-4", isSelected || plan.recommended ? "text-blue-600" : "text-gray-700")}>
                      {plan.price}
                    </p>
                    <ul className="space-y-1.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />{f}
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
          <div className="bg-[#0a1f5c] px-6 py-4 flex justify-between items-center">
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
                <td className="px-6 py-4 text-right font-bold text-blue-700 text-lg">${displayTotal.toLocaleString()}.00</td>
              </tr>
            </tfoot>
          </table>
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
    <section className="bg-[#0a1f5c] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Meet Our Team</h2>
        <p className="text-blue-200 mb-6 italic">Professional, Knowledgeable, Collaborative, Passionate</p>
        <p className="text-blue-100 mb-12 leading-relaxed max-w-2xl">At the heart of our success is a talented team committed to helping you achieve your business goals. Together, we're dedicated to delivering results that make a difference for your business.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {team.map((member) => (
            <div key={member.name} className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10 flex gap-4">
              <img src={member.photo} alt={member.name} className="w-14 h-14 rounded-full object-cover object-top flex-shrink-0 border-2 border-blue-300/30" />
              <div>
                <p className="text-white font-bold">{member.name}</p>
                <p className="text-blue-300 text-xs mb-2 font-medium">{member.title}</p>
                <p className="text-blue-100 text-sm leading-relaxed">{member.bio}</p>
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
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-4">One Clear Next Step</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>What happens when you say yes.</h2>
        <p className="text-gray-500 mb-12 text-lg">Here's exactly what to expect — no ambiguity, no chasing people down.</p>
        <div className="space-y-8 mb-14">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#0a1f5c] flex items-center justify-center">
                <span className="text-white text-xs font-bold">{step.number}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg mb-1">{step.title}</p>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 mb-8">
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
    <section className="py-20 px-6" style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #0d3494 50%, #1a5bb8 100%)" }}>
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Ready to work together?</h2>
        <p className="text-blue-200 mb-2">Click below to accept this proposal and secure your spot on our project calendar.</p>
        <p className="text-blue-300 text-sm mb-10">Our team will follow up with a contract.</p>
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          {hostingLabel && (
            <div className="mb-6 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-blue-800">{hostingLabel} selected</p>
            </div>
          )}
          {totalAmount > 0 && (
            <p className="text-gray-600 text-sm mb-8">
              Investment of <strong>${totalAmount.toLocaleString()}</strong>.
            </p>
          )}
          {onAccept && (
            <div className="no-print">
              <Button
                onClick={onAccept}
                disabled={disabled || isPending}
                className="w-full h-14 bg-[#0a1f5c] hover:bg-[#0d3494] text-white text-base font-bold rounded-xl"
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
      {/* 3. The Problem / Their Situation */}
      <SituationSection content={data.content} />
      {/* 4. Social proof — all testimonials in one section, before pricing */}
      <SocialProofSection />
      {/* 5. Your solution */}
      <StrategySection />
      {/* 6. Deliverables */}
      <CustomWebsiteSection numberOfPages={data.numberOfPages} pageNames={data.pageNames} />
      {/* 7. Process / Timeline */}
      <TimelineSection />
      <BrandShootSection />
      <EssentialsSection
        selectedHosting={onAccept ? selectedHosting : null}
        onSelectHosting={onAccept ? setSelectedHosting : undefined}
      />
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
        disabled={false}
        selectedHosting={selectedHosting}
      />
    </div>
  );
}
