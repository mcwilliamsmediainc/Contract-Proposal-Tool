import { useParams } from "wouter";
import { useGetProposal, useRecordProposalView, useAcceptProposal, getGetProposalQueryKey } from "@workspace/api-client-react";
import { useEffect, useRef, useState } from "react";
import { SignaturePad } from "@/components/ui/signature-pad";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, ArrowRight, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function ProposalCover({ clientName, businessName, projectType, date }: {
  clientName: string; businessName: string; projectType: string; date: string;
}) {
  const label = projectType === "marketing" ? "Marketing" : projectType === "print" ? "Print" : "Website";
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #0d3494 35%, #1a5bb8 65%, #0d3494 85%, #0a1f5c 100%)" }}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)"
      }} />
      <div className="relative z-10 max-w-3xl mx-auto">
        <img src="/mcwilliams-logo.png" alt="McWilliams Media" className="h-16 md:h-20 mx-auto mb-10 brightness-0 invert" />
        <h1 className="text-5xl md:text-7xl font-bold italic text-white mb-8 leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {label} Proposal
        </h1>
        <p className="text-xl md:text-2xl font-bold text-white mb-2">Prepared for {clientName}</p>
        <p className="text-lg font-bold text-white/80 mb-4">{businessName}</p>
        <p className="text-base italic text-white/60 mb-2">{date}, {new Date().getFullYear()}</p>
        <p className="text-base italic text-white/50">This quote is valid for 30 days</p>
      </div>
    </section>
  );
}

function SectionIntro({ content }: { content?: string | null }) {
  return (
    <section className="bg-white py-20 px-6">
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
        <div className="mt-10 pt-8 border-t border-gray-200">
          <p className="text-gray-500 italic mb-3">Best Wishes,</p>
          <p className="text-gray-800 font-semibold text-lg">Matt McWilliams, Founder &amp; CEO</p>
        </div>
      </div>
    </section>
  );
}

function TestimonialSection({ quote, author, dark = true }: { quote: string; author: string; dark?: boolean }) {
  return (
    <section className={`py-20 px-6 ${dark ? "bg-[#0a1f5c]" : "bg-[#f8f9fc]"}`}>
      <div className="max-w-3xl mx-auto">
        <p className={`text-sm font-bold tracking-widest uppercase mb-8 ${dark ? "text-blue-300" : "text-blue-600"}`}>Client Success</p>
        <blockquote className={`text-xl md:text-2xl leading-relaxed font-medium ${dark ? "text-white" : "text-gray-800"}`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          "{quote}"
        </blockquote>
        <p className={`mt-6 text-base font-medium ${dark ? "text-blue-200" : "text-blue-700"}`}>— {author}</p>
      </div>
    </section>
  );
}

function StrategySection() {
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

function CustomWebsiteSection({ numberOfPages, pageNames }: { numberOfPages?: number | null; pageNames?: string | null }) {
  const pageCount = numberOfPages || "XX";
  const pages = pageNames || "Home | About | Services | FAQ/Resources/Blog | Contact";
  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
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
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">Your web pages carry the bulk of who you are as a company. These will be built around your business and customized with care and detail that reflects your brand. We will create unique content and/or add to your existing content. The web pages we suggest for your project is:</p>
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
            <CheckItem>Set up Google Analytics &amp; Search Console to view traffic to your site (optional)</CheckItem>
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

function TimelineSection() {
  return (
    <section className="bg-[#f8f9fc] py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Timeline Deposit</h2>
          <p className="text-gray-600 leading-relaxed">To ensure your project gets completed in a timely manner, we have implemented a timeline deposit. This deposit is fully refundable if we receive adequate communication to complete the project within the allotted 90 days. Our website design turnaround is typically 45 days. If the buildout lasts longer than 90 days, the deposit is no longer refundable.</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Add-On: SEO Google Business Profile Set-Up + Optimization</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[["$547", "Set-Up + Optimization"], ["$347", "Set-Up Only"], ["$247", "Optimization Only"]].map(([price, label]) => (
              <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{price}</p>
                <p className="text-sm text-gray-600 mt-1">one-time · {label}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-600 leading-relaxed text-sm">The first step in building your local SEO strategy is creating or claiming your Google Business Profile (GBP) listing and verifying your business. An optimized GBP is essential for appearing in Google's Local Finder, Google Maps, and organic search results.</p>
          <ul className="mt-4 space-y-2">
            <CheckItem>Clean up outdated or incorrect listings</CheckItem>
            <CheckItem>Add photos that represent your business</CheckItem>
            <CheckItem>Update services, location, and other key details</CheckItem>
          </ul>
        </div>
      </div>
    </section>
  );
}

function BrandShootSection() {
  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Brand Shoot</h2>
        <p className="text-blue-700 font-semibold mb-2">$850 one-time for pro photos only</p>
        <p className="text-blue-600 text-sm mb-6">+ $150 one-time iPhone Video B-Roll Clip Add-On</p>
        <p className="text-gray-600 leading-relaxed mb-6">While not required, it's often a valuable investment as high-quality, branded images and videos can significantly elevate the look and credibility of your website. We partner with our preferred Professional Photographer who gives our clients a special, discounted rate and turnaround time.</p>
        <ul className="space-y-3 mb-6">
          <CheckItem>1 Location</CheckItem>
          <CheckItem>Up to 2 hours</CheckItem>
          <CheckItem>50+ edited images</CheckItem>
        </ul>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-xs text-gray-500 space-y-2">
          <p>* The Brand Shoot pricing is for Tulsa-area locations. Any locations outside a 30-mile radius of central Tulsa will include travel fees.</p>
          <p>* All photos and video clips are the client's intellectual property.</p>
          <p>* You will coordinate directly with our Photographer for scheduling and payment.</p>
        </div>
      </div>
    </section>
  );
}

function EssentialsSection() {
  return (
    <section className="bg-[#f8f9fc] py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Website Essentials</h2>
        <p className="text-gray-600 mb-12">Every website requires two key components to stay online and functional.</p>
        <div className="space-y-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Domain Name (URL)</h3>
            <p className="text-gray-600 leading-relaxed">Your domain name is your website's www address. You may already have one — and if so, we'll connect it to your new website seamlessly. If not, visit <span className="text-blue-600 font-medium">mcwdomains.com</span> to explore available options and purchase your domain.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Website Hosting</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Silver", price: "$40/mo", features: ["Dedicated server", "High speed server", "Software updates", "Free SSL certificate"] },
                { name: "Gold", price: "$65/mo", features: ["Everything in Silver", "Monthly backups", "Advanced security monitoring", "Basic site maintenance"], highlight: true },
                { name: "Platinum", price: "$90/mo", features: ["Everything in Gold", "Up to 1hr/month of content updates", "Hourly rate $110 after"] },
              ].map((plan) => (
                <div key={plan.name} className={`rounded-xl border p-5 ${plan.highlight ? "border-blue-400 bg-blue-50 shadow-md" : "border-gray-200 bg-white"}`}>
                  <p className={`font-bold text-lg mb-1 ${plan.highlight ? "text-blue-700" : "text-gray-900"}`}>{plan.name} Hosting</p>
                  <p className={`text-2xl font-bold mb-4 ${plan.highlight ? "text-blue-600" : "text-gray-700"}`}>{plan.price}</p>
                  <ul className="space-y-2">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                        {f}
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

function PricingSection({ numberOfPages, totalAmount }: { numberOfPages?: number | null; totalAmount: number }) {
  const pages = numberOfPages || 5;
  const items = [
    { desc: "Website Setup & Required Pages", rate: 110, qty: "10 Hours", price: 1100 },
    { desc: "Revisions & Launch", rate: 350, qty: "1 Unit", price: 350 },
    { desc: "Google Analytics & Search Console Setup", rate: 110, qty: "1 Unit", price: 110 },
    { desc: `Web Pages`, rate: 450, qty: `${pages} Pages`, price: 450 * pages },
    { desc: "Website Theme", rate: 75, qty: "1 Unit", price: 75 },
    { desc: "Timeline Deposit (eligible for refund)", rate: 500, qty: "1 Unit", price: 500 },
  ];
  const displayTotal = totalAmount > 0 ? totalAmount : items.reduce((s, i) => s + i.price, 0);

  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
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
        <p className="text-center text-xs text-gray-400 mt-4">Prices in USD · This quote is valid for 30 days from date of issue</p>
      </div>
    </section>
  );
}

function TeamSection() {
  const team = [
    { name: "Matt McWilliams", title: "Owner & CEO", bio: "We've been helping businesses like yours succeed through thoughtful web design since 2011. With a deep commitment to our clients, I'm here to ensure that our team not only delivers results, but also becomes a trusted partner in your business journey." },
    { name: "Lindsay McWilliams", title: "Owner & CFO", bio: "I help create a strong foundation that allows our team to focus on delivering exceptional design solutions tailored to your needs. Building relationships with our team and clients, my goal is to create a supportive environment where success thrives." },
    { name: "Tiffany King", title: "Owner & COO", bio: "My passion for marketing and design, personable approach and creative ideas continue to earn the trust of business leaders. My goal is to bring a hands-on, collaborative approach to each project, ensuring that every detail aligns with your vision." },
    { name: "Rachelle Hoover", title: "Marketing Director", bio: "My goal is to help your business stand out online with strategy-driven content that connects and converts. I focus on crafting messages that reflect your brand and support SEO research." },
    { name: "Elise Johnson", title: "Client Strategist", bio: "With a collaborative approach, I work closely with you to guide strategy and keep initiatives moving forward. My goal is to ensure your brand shows up online with purpose." },
    { name: "Christel Moser", title: "Billing Manager", bio: "My goal is to make every step of your experience with us simple, smooth, and stress-free. From onboarding paperwork to billing, I'm here to keep things organized and running efficiently." },
  ];
  return (
    <section className="bg-[#0a1f5c] py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Meet Our Team</h2>
        <p className="text-blue-200 mb-12 italic">Professional, Knowledgeable, Collaborative, Passionate</p>
        <p className="text-blue-100 mb-12 leading-relaxed">At the heart of our success is a talented team committed to helping you achieve your business goals. We have weekly all-team meetings where we go through each project, client-by-client to create a collaborative environment that ensures a comprehensive and effective approach to your project success.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {team.map((member) => (
            <div key={member.name} className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-blue-400/30 flex items-center justify-center mb-3">
                <span className="text-white font-bold text-sm">{member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
              </div>
              <p className="text-white font-bold">{member.name}</p>
              <p className="text-blue-300 text-xs mb-3 font-medium">{member.title}</p>
              <p className="text-blue-100 text-sm leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatsNextSection() {
  return (
    <section className="bg-white py-20 px-6 border-t border-gray-100">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>What's Next?</h2>
        <p className="text-gray-600 leading-relaxed mb-6">Upon approval, we'll send over a contract for the project. We'll include our First Steps to help us get started in the right direction. Once we receive the contract with your completed First Steps, your Kick-Off meeting will be scheduled.</p>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 mb-8">
          <p className="font-bold text-gray-800 mb-2">Payment Schedule</p>
          <p className="text-gray-600">Half is due upon signing and the remaining balance is broken up over the next three subsequent months.</p>
        </div>
        <p className="text-gray-600 mb-6">Should you have any thoughts, questions or feedback, please feel free to get in touch with our team in the meantime.</p>
        <div className="space-y-2 text-sm">
          <p className="text-gray-700"><span className="font-semibold">Email:</span> support@mcwilliamsmedia.com</p>
          <p className="text-gray-700"><span className="font-semibold">Phone:</span> 918-286-4995</p>
          <p className="text-gray-700"><span className="font-semibold">Website:</span> mcwilliamsmedia.com</p>
        </div>
      </div>
    </section>
  );
}

function AcceptSection({ clientName, totalAmount, onAccept, isPending, signatureData, onSign, disabled }: {
  clientName: string; totalAmount: number; onAccept: () => void;
  isPending: boolean; signatureData: string; onSign: (data: string) => void; disabled: boolean;
}) {
  return (
    <section className="py-20 px-6" style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #0d3494 50%, #1a5bb8 100%)" }}>
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Ready to work together?</h2>
        <p className="text-blue-200 mb-2">Click Below to Accept the Proposal</p>
        <p className="text-blue-300 text-sm mb-10">Our team will follow up with a contract.</p>
        <div className="bg-white rounded-2xl p-8 text-left shadow-2xl">
          <p className="text-gray-600 text-sm mb-6">By signing below, <strong>{clientName}</strong> agrees to the strategic roadmap and investment of <strong>${totalAmount.toLocaleString()}</strong>.</p>
          <SignaturePad onEnd={onSign} />
          <Button
            onClick={onAccept}
            disabled={disabled || !signatureData || isPending}
            className="w-full h-14 mt-6 bg-[#0a1f5c] hover:bg-[#0d3494] text-white text-base font-bold rounded-xl"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <span className="flex items-center gap-2">Accept Proposal <ArrowRight className="w-4 h-4" /></span>
            )}
          </Button>
          <p className="text-center text-gray-400 text-xs mt-3">Legally binding digital signature</p>
        </div>
      </div>
    </section>
  );
}

export default function ClientPortal() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const queryClient = useQueryClient();
  const { data: proposal, isLoading } = useGetProposal(id, { query: { enabled: !!id, queryKey: getGetProposalQueryKey(id) } });
  const recordView = useRecordProposalView();
  const acceptProposal = useAcceptProposal();
  const viewedRef = useRef(false);
  const [signatureData, setSignatureData] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (id && !viewedRef.current) { viewedRef.current = true; recordView.mutate({ id }); }
  }, [id, recordView]);

  useEffect(() => {
    if (proposal?.status === "accepted") setAccepted(true);
  }, [proposal?.status]);

  const handleAccept = async () => {
    if (!signatureData) return;
    try {
      const data = await acceptProposal.mutateAsync({ id, data: { signatureData } });
      queryClient.setQueryData(getGetProposalQueryKey(id), data);
      setAccepted(true);
    } catch (err) { /* handled below */ }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #1a5bb8 100%)" }}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
        <p className="text-blue-200 text-sm tracking-widest font-mono">Loading...</p>
      </div>
    </div>
  );

  if (!proposal) return (
    <div className="min-h-screen flex justify-center items-center" style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #1a5bb8 100%)" }}>
      <p className="text-white text-xl">Proposal not found or expired.</p>
    </div>
  );

  if (accepted) return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6" style={{ background: "linear-gradient(160deg, #0a1f5c 0%, #1a5bb8 100%)" }}>
      <div className="bg-white rounded-2xl p-10 max-w-md text-center shadow-2xl">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Proposal Accepted!</h1>
        <p className="text-gray-600 mb-1">Welcome, {proposal.clientName}. The McWilliams Media team has been notified and will be in touch shortly.</p>
        <p className="text-xs text-gray-400 mt-6">Transaction: {proposal.id}</p>
      </div>
    </div>
  );

  const proposalDate = new Date(proposal.createdAt);
  const dateStr = proposalDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-white font-sans">
      <ProposalCover
        clientName={proposal.clientName}
        businessName={proposal.businessName}
        projectType={proposal.projectType}
        date={dateStr}
      />

      <SectionIntro content={proposal.content} />

      <TestimonialSection
        quote="I am very pleased with the finished product of my website! Every member of the team was easily accessible and incredibly responsive. They were great to work with. I highly recommend McWilliams Media to anyone wanting to create or improve a website!"
        author="Greg Sutmiller, Evolution Mental Health"
      />

      <StrategySection />

      <TestimonialSection
        quote="I am just SO VERY OBSESSED with the new logo and website. I cannot tell you how much I love it!!!! Your team put so much time, energy and HEART into capturing our family business and telling our story so well."
        author="Sunni Petty, Petty Family Floors"
      />

      <CustomWebsiteSection numberOfPages={proposal.numberOfPages} pageNames={proposal.pageNames} />

      <TimelineSection />

      <BrandShootSection />

      <EssentialsSection />

      <PricingSection numberOfPages={proposal.numberOfPages} totalAmount={Number(proposal.totalAmount)} />

      <TeamSection />

      <WhatsNextSection />

      {proposal.loomVideoUrl && (
        <section className="bg-gray-50 py-20 px-6 border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Strategy Briefing</h2>
            <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-lg">
              <iframe src={proposal.loomVideoUrl.includes("loom.com/share/") ? proposal.loomVideoUrl.replace("share/", "embed/") : proposal.loomVideoUrl} className="w-full h-full" allowFullScreen />
            </div>
          </div>
        </section>
      )}

      <AcceptSection
        clientName={proposal.clientName}
        totalAmount={Number(proposal.totalAmount)}
        onAccept={handleAccept}
        isPending={acceptProposal.isPending}
        signatureData={signatureData}
        onSign={setSignatureData}
        disabled={proposal.status === "accepted"}
      />
    </div>
  );
}
