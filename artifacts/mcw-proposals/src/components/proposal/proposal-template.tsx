import { Check, ArrowRight, Loader2 } from "lucide-react";
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
import christelPhoto from "@assets/8qEx0RVlV0ihSnsIyAmQEToz5xBp4QDBGSrBnQ_1777926757399.png";
import chloePhoto from "@assets/6F8LcZ4mEOUe8ZWZUfuiyUFa_FnvPAHdDzjrHQ_1777926760382.png";

export interface ProposalData {
  clientName: string;
  businessName: string;
  projectType: string;
  numberOfPages?: number | null;
  pageNames?: string | null;
  totalAmount?: number | null;
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
  const label = projectType === "marketing" ? "Marketing" : projectType === "print" ? "Print" : "Website";
  return (
    <section id="section-cover" className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #0d3494 35%, #1a5bb8 65%, #0d3494 85%, #0a1f5c 100%)" }}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)"
      }} />
      <div className="relative z-10 max-w-3xl mx-auto">
        <img src="/mcwilliams-logo.png" alt="McWilliams Media" className="h-16 md:h-20 mx-auto mb-10 brightness-0 invert" />
        <h1 className="text-5xl md:text-7xl font-bold italic text-white mb-8 leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
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

export function SectionIntro({ content }: { content?: string | null }) {
  return (
    <section id="section-intro" className="bg-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          {content ? (
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <>
              <p className="text-lg leading-relaxed mb-6">
                Thank you for considering McWilliams Media as your partner in achieving your new website goals! We're excited for the opportunity to work with you and bring your vision to life with a professional, unique and conversion-focused design.
              </p>
              <p className="text-lg leading-relaxed mb-10">
                In this proposal, we'll outline our recommendations for your new website so that your business makes a strong first impression and helps you achieve your goals. Our team brings a blend of creativity, technical expertise, and strategic insight to every project, ensuring that your investment in your online presence delivers maximum impact.
              </p>
            </>
          )}
        </div>
        <div className="mt-10 pt-8 border-t border-gray-200 flex items-center gap-5">
          <img src={mattDarkPhoto} alt="Matt McWilliams" className="w-16 h-16 rounded-full object-cover object-top flex-shrink-0 border-2 border-blue-100 shadow-md" />
          <div>
            <p className="text-gray-500 italic mb-1 text-sm">Best Wishes,</p>
            <p className="text-gray-800 font-semibold text-lg">Matt McWilliams</p>
            <p className="text-gray-500 text-sm">Founder &amp; CEO, McWilliams Media</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TestimonialSection({ quote, author, websiteImg, websiteAlt, dark = true }: {
  quote: string; author: string; websiteImg?: string; websiteAlt?: string; dark?: boolean;
}) {
  return (
    <section className={`py-20 px-6 ${dark ? "bg-[#0a1f5c]" : "bg-[#f8f9fc]"}`}>
      <div className="max-w-4xl mx-auto">
        <p className={`text-sm font-bold tracking-widest uppercase mb-8 ${dark ? "text-blue-300" : "text-blue-600"}`}>Client Success</p>
        <div className={`grid gap-12 items-center ${websiteImg ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          <div>
            <blockquote className={`text-xl md:text-2xl leading-relaxed font-medium ${dark ? "text-white" : "text-gray-800"}`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              "{quote}"
            </blockquote>
            <p className={`mt-6 text-base font-medium ${dark ? "text-blue-200" : "text-blue-700"}`}>— {author}</p>
          </div>
          {websiteImg && (
            <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <img src={websiteImg} alt={websiteAlt || "Client website"} className="w-full h-auto object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function StrategySection() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          A proven strategy customized for your business goals.
        </h2>
        <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
          <p>With over 75% of consumers reporting they go online to research a business before choosing whether to make a purchase, the modern business owner needs an online presence. But you don't want an online presence just for the sake of it.</p>
          <p className="font-semibold text-gray-800">You want a branded website focused on setting you apart from the competition.</p>
          <p className="font-semibold text-gray-800">You want a marketing strategy focused on building consistent qualified leads.</p>
          <p>With decades of combined experience, our team is here to help strengthen your strategy through a website designed to speak directly to your target audiences so you can sell with ease!</p>
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
          <p className="text-gray-600 leading-relaxed">To ensure your project gets completed in a timely manner, we have implemented a timeline deposit. This deposit is fully refundable if we receive adequate communication to complete the project within the allotted 90 days.</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add-On: SEO Google Business Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[["$547", "Set-Up + Optimization"], ["$347", "Set-Up Only"], ["$247", "Optimization Only"]].map(([price, label]) => (
              <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-blue-700">{price}</p>
                <p className="text-sm text-gray-600 mt-1">one-time · {label}</p>
              </div>
            ))}
          </div>
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

export function EssentialsSection() {
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
            <h3 className="text-xl font-bold text-gray-900 mb-6">Website Hosting</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Silver", price: "$40/mo", features: ["Dedicated server", "High speed server", "Software updates", "Free SSL certificate"] },
                { name: "Gold", price: "$65/mo", features: ["Everything in Silver", "Monthly backups", "Advanced security", "Basic site maintenance"], highlight: true },
                { name: "Platinum", price: "$90/mo", features: ["Everything in Gold", "Up to 1hr/month updates", "Hourly rate $110 after"] },
              ].map((plan) => (
                <div key={plan.name} className={`rounded-xl border p-5 ${plan.highlight ? "border-blue-400 bg-blue-50 shadow-md" : "border-gray-200 bg-white"}`}>
                  <p className={`font-bold text-lg mb-1 ${plan.highlight ? "text-blue-700" : "text-gray-900"}`}>{plan.name}</p>
                  <p className={`text-2xl font-bold mb-4 ${plan.highlight ? "text-blue-600" : "text-gray-700"}`}>{plan.price}</p>
                  <ul className="space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingSection({ numberOfPages, totalAmount }: { numberOfPages?: number | null; totalAmount?: number | null }) {
  const pages = numberOfPages || 5;
  const items = [
    { desc: "Website Setup & Required Pages", rate: 110, qty: "10 Hours", price: 1100 },
    { desc: "Revisions & Launch", rate: 350, qty: "1 Unit", price: 350 },
    { desc: "Google Analytics & Search Console Setup", rate: 110, qty: "1 Unit", price: 110 },
    { desc: `Web Pages (${pages})`, rate: 450, qty: `${pages} Pages`, price: 450 * pages },
    { desc: "Website Theme", rate: 75, qty: "1 Unit", price: 75 },
    { desc: "Timeline Deposit (eligible for refund)", rate: 500, qty: "1 Unit", price: 500 },
  ];
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
    { name: "Tiffany King", title: "Owner & COO", photo: tiffanyPhoto, bio: "My passion for marketing and design continues to earn the trust of business leaders." },
    { name: "Rachelle Hoover", title: "Marketing Director", photo: rachellePhoto, bio: "My goal is to help your business stand out online with strategy-driven content that connects and converts." },
    { name: "Elise Johnson", title: "Client Strategist", photo: elisePhoto, bio: "With a collaborative approach, I work closely with you to guide strategy and keep initiatives moving forward." },
    { name: "Christel Moser", title: "Billing Manager", photo: christelPhoto, bio: "My goal is to make every step of your experience with us simple, smooth, and stress-free." },
    { name: "Chloe Brunner", title: "Designer", photo: chloePhoto, bio: "I care about creating a website that not only looks great, but also feels aligned with your brand." },
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
  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>What's Next?</h2>
        <p className="text-gray-600 leading-relaxed mb-6">Upon approval, we'll send over a contract for the project. We'll include our First Steps to help us get started in the right direction. Once we receive the contract with your completed First Steps, your Kick-Off meeting will be scheduled.</p>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 mb-8">
          <p className="font-bold text-gray-800 mb-2">Payment Schedule</p>
          <p className="text-gray-600">Half is due upon signing and the remaining balance is broken up over the next three subsequent months.</p>
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

export function AcceptSection({ clientName, totalAmount, onAccept, isPending, signatureData, onSign, disabled }: {
  clientName: string; totalAmount: number; onAccept?: () => void;
  isPending?: boolean; signatureData?: string; onSign?: (data: string) => void; disabled?: boolean;
}) {
  return (
    <section className="py-20 px-6" style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #0d3494 50%, #1a5bb8 100%)" }}>
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Ready to work together?</h2>
        <p className="text-blue-200 mb-2">Click Below to Accept the Proposal</p>
        <p className="text-blue-300 text-sm mb-10">Our team will follow up with a contract.</p>
        <div className="bg-white rounded-2xl p-8 text-left shadow-2xl">
          <p className="text-gray-600 text-sm mb-6">By signing below, <strong>{clientName || "the client"}</strong> agrees to the strategic roadmap and investment of <strong>${(totalAmount || 0).toLocaleString()}</strong>.</p>
          {onSign && <SignaturePad onEnd={onSign} />}
          {onAccept && (
            <Button
              onClick={onAccept}
              disabled={disabled || !signatureData || isPending}
              className="w-full h-14 mt-6 bg-[#0a1f5c] hover:bg-[#0d3494] text-white text-base font-bold rounded-xl"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <span className="flex items-center gap-2">Accept Proposal <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          )}
          <p className="text-center text-gray-400 text-xs mt-3">Legally binding digital signature</p>
        </div>
      </div>
    </section>
  );
}

export function FullProposalTemplate({ data, onAccept, isPending, signatureData, onSign }: {
  data: ProposalData;
  onAccept?: () => void;
  isPending?: boolean;
  signatureData?: string;
  onSign?: (d: string) => void;
}) {
  const proposalDate = data.createdAt ? new Date(data.createdAt) : new Date();
  const dateStr = proposalDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-white font-sans">
      <ProposalCover
        clientName={data.clientName}
        businessName={data.businessName}
        projectType={data.projectType}
        date={dateStr}
      />
      <SectionIntro content={data.content} />
      <TestimonialSection
        quote="I am very pleased with the finished product of my website! Every member of the team was easily accessible and incredibly responsive. They were great to work with. I highly recommend McWilliams Media to anyone wanting to create or improve a website!"
        author="Greg Sutmiller, Evolution Mental Health"
        websiteImg={evolutionSiteImg}
        websiteAlt="Evolution Mental Health website"
      />
      <StrategySection />
      <TestimonialSection
        quote="I am just SO VERY OBSESSED with the new logo and website. I cannot tell you how much I love it!!!! Your team put so much time, energy and HEART into capturing our family business and telling our story so well."
        author="Sunni Petty, Petty Family Floors"
        websiteImg={pettyFloorsSiteImg}
        websiteAlt="Petty Family Floors website"
        dark={false}
      />
      <CustomWebsiteSection numberOfPages={data.numberOfPages} pageNames={data.pageNames} />
      <TimelineSection />
      <BrandShootSection />
      <EssentialsSection />
      <PricingSection numberOfPages={data.numberOfPages} totalAmount={data.totalAmount} />
      <TeamSection />
      <TestimonialSection
        quote="They have taken my business to the next level. First impression is everything and with the design of our website they helped us showcase our business better than ever. The team goes above and beyond!"
        author="Alyssa Hobbs, Hobbs Salon + Med Spa"
        websiteImg={hobbsSiteImg}
        websiteAlt="Hobbs Salon + Med Spa website"
      />
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
        onAccept={onAccept}
        isPending={isPending}
        signatureData={signatureData}
        onSign={onSign}
        disabled={false}
      />
    </div>
  );
}
