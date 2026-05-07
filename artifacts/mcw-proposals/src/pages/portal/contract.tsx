import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useGetContract, useSignContract, getGetContractQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, FileSignature, Lock, CreditCard, ShieldCheck, Eye, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import SignatureCanvas from "react-signature-canvas";
import { PublicHeader } from "@/components/layout/public-header";

function hostingLabel(opt: string) {
  if (opt === "basic") return "Gold Hosting — $60/month";
  if (opt === "platinum") return "Platinum Hosting — $100/month";
  return "No Hosting";
}

function contractTypeLabel(type: string) {
  if (type === "website") return "Website Development";
  if (type === "marketing") return "Marketing Services";
  if (type === "print") return "Print & Brand";
  return type;
}

type View = "agreement" | "ach" | "done" | "other-arrangements";

export default function ContractPortal() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contract, isLoading } = useGetContract(id, {
    query: { enabled: !!id, queryKey: getGetContractQueryKey(id) },
  });

  const signContract = useSignContract();
  const sigPadRef = useRef<SignatureCanvas | null>(null);

  const [view, setView] = useState<View>("agreement");
  const [sigError, setSigError] = useState(false);
  const [selectedHosting, setSelectedHosting] = useState<"none" | "basic" | "platinum" | null>(null);
  const [hostingError, setHostingError] = useState(false);

  // ACH form state
  const [achLoading, setAchLoading] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [achErrors, setAchErrors] = useState<Record<string, string>>({});
  const [achAuthorized, setAchAuthorized] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Not Found</h1>
          <p className="text-gray-500">This contract link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (contract.status === "signed" && view === "agreement") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agreement Signed</h1>
          <p className="text-gray-500 mb-1">This contract has already been signed.</p>
          <p className="text-sm text-gray-400">Thank you, {contract.clientName}. We'll be in touch soon.</p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const dateStr = `${today.getDate()}th day of ${today.toLocaleString("default", { month: "long" })}, ${today.getFullYear()}`;

  const handleSign = async () => {
    let hasError = false;
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      setSigError(true);
      hasError = true;
    } else {
      setSigError(false);
    }
    if (!selectedHosting) {
      setHostingError(true);
      hasError = true;
      document.getElementById("hosting-selection")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setHostingError(false);
    }
    if (hasError) return;

    const signatureData = sigPadRef.current!.getTrimmedCanvas().toDataURL("image/png");
    try {
      const updated = await signContract.mutateAsync({ id, data: { signatureData, hostingOption: selectedHosting ?? undefined } });
      queryClient.setQueryData(getGetContractQueryKey(id), updated);
      setView("ach");
    } catch {
      toast({ title: "Error", description: "Failed to submit signature. Please try again.", variant: "destructive" });
    }
  };

  const validateAch = () => {
    const errs: Record<string, string> = {};
    if (!accountHolderName.trim()) errs.accountHolderName = "Account holder name is required";
    if (!bankName.trim()) errs.bankName = "Bank name is required";
    if (!/^\d{9}$/.test(routingNumber.trim())) errs.routingNumber = "Routing number must be 9 digits";
    if (!/^\d{4,17}$/.test(accountNumber.trim())) errs.accountNumber = "Account number must be 4–17 digits";
    if (!achAuthorized) errs.achAuthorized = "You must authorize the ACH debit to continue";
    return errs;
  };

  const handleAchSubmit = async () => {
    const errs = validateAch();
    if (Object.keys(errs).length > 0) {
      setAchErrors(errs);
      return;
    }
    setAchErrors({});
    setAchLoading(true);
    try {
      const res = await fetch(`/api/contracts/${id}/ach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountHolderName, bankName, routingNumber, accountNumber, accountType }),
      });
      if (!res.ok) throw new Error("Server error");
      setView("done");
    } catch {
      toast({ title: "Error", description: "Failed to submit payment info. Please try again or contact us.", variant: "destructive" });
    } finally {
      setAchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader variant="light" subtitle={`${contractTypeLabel(contract.contractType)} Agreement`} />

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Agreement & Signature ── */}
        {view === "agreement" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#061e57] px-8 py-5 text-white">
              <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                Development Agreement
              </h2>
              <p className="text-blue-200 text-sm mt-1">Please read and sign below</p>
            </div>

            <div className="px-8 py-6 prose prose-sm max-w-none text-gray-700 leading-relaxed">
              <p className="text-sm text-gray-500 mb-4 font-medium">
                This Agreement is entered into between <strong>MCWILLIAMS MEDIA INC.</strong> ("Developer") and <strong>{contract.clientName}</strong> ("Client"), dated {dateStr}.
              </p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">1. Services</h3>
              <p className="mb-3">Developer will design, build, and deliver a website ("Site") as described in Schedule A. All work will be tested before delivery.</p>
              <p className="mb-3"><strong>1.1. Revisions.</strong> Two rounds of revisions are included per project phase. Additional rounds are billed at Developer's hourly rate. Major revisions (scope changes) require a revised quote and written approval before work begins. All revision requests must be submitted through Developer's project management tool.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">2. Fees &amp; Payment</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Fee</div>
                    <div className="text-lg font-bold text-gray-900">${Number(contract.totalCost).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deposit (Non-Refundable)</div>
                    <div className="text-lg font-bold text-[#061e57]">${Number(contract.depositAmount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining Balance</div>
                    <div className="text-lg font-bold text-gray-900">${Number(contract.remainingBalance).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <p className="mb-3">The non-refundable Deposit is due before work begins. Preferred payment is ACH transfer; check or credit card accepted at Developer's discretion. Invoices are due within 15 days. Late payments are subject to a $75/month fee. Accounts 90+ days past due may have services, including hosting, suspended until current.</p>
              <p className="mb-3"><strong>Expenses.</strong> Client will be invoiced at cost for any required third-party software, plugins, or licenses. Developer will obtain written approval before any such purchase.</p>

              {/* ── Hosting Selection ── */}
              <div id="hosting-selection" className={`rounded-xl border-2 p-5 mb-4 transition-colors ${hostingError ? "border-red-400 bg-red-50" : selectedHosting ? "border-[#061e57] bg-[#eef4f9]" : "border-amber-300 bg-amber-50"}`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${hostingError ? "bg-red-500 text-white" : selectedHosting ? "bg-[#061e57] text-white" : "bg-amber-400 text-amber-900"}`}>
                    {selectedHosting ? "✓" : "!"}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${hostingError ? "text-red-700" : selectedHosting ? "text-[#061e57]" : "text-amber-800"}`}>
                      {selectedHosting ? "Hosting plan selected" : "Action required: Select a hosting plan"}
                    </p>
                    <p className={`text-xs mt-0.5 ${hostingError ? "text-red-600" : selectedHosting ? "text-[#3a4856]" : "text-amber-700"}`}>
                      {hostingError
                        ? "Please select a hosting plan before submitting your agreement."
                        : selectedHosting
                          ? "Your selection is included in this agreement. You can change it below."
                          : "Your website needs a hosting plan to stay live after launch. Please choose one below before signing."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value: "none",     label: "No Hosting",    price: "",           desc: "I'll manage hosting myself" },
                    { value: "basic",    label: "Gold",          price: "$60/month",   desc: "Managed hosting & support" },
                    { value: "platinum", label: "Platinum",      price: "$100/month",  desc: "Priority hosting & updates" },
                  ] as const).map(({ value, label, price, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setSelectedHosting(value); setHostingError(false); }}
                      className={`text-left rounded-lg border-2 p-4 transition-all ${
                        selectedHosting === value
                          ? "border-[#061e57] bg-white shadow-md"
                          : "border-gray-200 bg-white hover:border-[#b3cee1] hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold text-sm ${selectedHosting === value ? "text-[#061e57]" : "text-gray-800"}`}>{label}</span>
                        {selectedHosting === value && (
                          <span className="w-4 h-4 rounded-full bg-[#061e57] flex items-center justify-center shrink-0">
                            <svg className="w-2.5 h-2.5 text-white fill-white" viewBox="0 0 12 12"><path d="M1 6l4 4 6-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                        )}
                      </div>
                      {price && <p className={`text-base font-extrabold mb-1 ${selectedHosting === value ? "text-[#061e57]" : "text-gray-700"}`}>{price}</p>}
                      <p className="text-xs text-gray-500">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">3. Schedule</h3>
              <p className="mb-3">Developer will make reasonable efforts to meet agreed deadlines. Timelines may be extended by written notice. Delays caused by events outside Developer's control (natural disasters, power failures, acts of government, etc.) are not a breach of this Agreement.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">4. Client Approval</h3>
              <p className="mb-3">Developer will present the Site for Client review at each major milestone. Client has 7 business days to respond with approval or revision requests. No response within that window is considered approval. Final written approval authorizes launch and constitutes acceptance of the delivered work.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">5. Post-Launch Support</h3>
              <p className="mb-3">Developer provides 30 days of post-launch support for bugs or errors caused by Developer's work at no charge. This does not cover new requests, client-made changes, plugin updates, or content edits. Work outside this scope is billed at Developer's hourly rate.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">6. Copyright &amp; License</h3>
              <p className="mb-3">Client owns the copyright to all content it provides. Upon payment in full, Client receives a non-exclusive license to use Developer's tools solely to operate the Site. Developer retains all rights to its tools and development resources. Developer may display the Site in its portfolio and marketing materials and tag Client on social media at launch. No confidential business information will be disclosed without Client's consent. Client consents to Developer recording video meetings for design and training purposes.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">7. Domain Name</h3>
              <p className="mb-3">Client is responsible for obtaining and maintaining its own domain name at its own expense. Developer has no interest in Client's domain.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">8. Client Content</h3>
              <p className="mb-3">Client is responsible for all content provided for the Site. Client warrants that it owns or has rights to all such content and that it does not infringe any third-party rights or violate any laws. Developer is not liable for claims arising from Client-supplied content.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">9. Third-Party Assets</h3>
              <p className="mb-3">The Site may use licensed third-party assets (fonts, stock photos, plugins, etc.). Developer will disclose these to Client. Client is responsible for maintaining required licenses after delivery. Developer is not liable for claims arising from Client's failure to do so.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">10. Hosting</h3>
              <p className="mb-3">If Developer provides hosting, it will make reasonable efforts to maintain Site availability but does not guarantee uninterrupted service. Client is responsible for maintaining its own backups. Hosting accounts in Developer's name remain under Developer's control until all fees are paid and the account is transferred. Hosting may be suspended for accounts 90+ days past due.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">11. Disclaimers &amp; Warranties</h3>
              <p className="mb-3">ALL WORK IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. DEVELOPER DOES NOT WARRANT THAT THE SITE WILL OPERATE ERROR-FREE OR WITHOUT INTERRUPTION.</p>
              <p className="mb-3"><strong>AI Tools.</strong> Developer may use AI-assisted tools during the project. Developer does not warrant the originality, accuracy, or legal clearance of AI-assisted outputs. Developer reviews all AI-assisted work before delivery, but this is not a guarantee against defects or third-party claims. Client is responsible for any AI-generated content it provides.</p>
              <p className="mb-3"><strong>SEO.</strong> Developer makes no guarantee of search engine rankings, traffic, or business outcomes. Any SEO configuration is technical setup only.</p>
              <p className="mb-3"><strong>Browsers.</strong> The Site will be compatible with current stable versions of Chrome, Firefox, Safari, and Edge on standard mobile and desktop devices. Legacy browsers and non-standard devices are not covered.</p>
              <p className="mb-3"><strong>Privacy &amp; Compliance.</strong> Client is solely responsible for the Site's compliance with applicable laws, including GDPR, CCPA, and CAN-SPAM. Any privacy tools Developer configures are not legal compliance advice.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">12. Liability</h3>
              <p className="mb-3">Developer is not liable for lost profits or consequential damages. Client agrees to indemnify Developer against third-party claims arising from Client's use of the Site or Client-supplied content.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">13. Termination</h3>
              <p className="mb-3">Either party may terminate for material breach with 30 days' written notice if the breach is not cured. If Client cancels for any reason, Developer retains the Deposit and all payments made to date. If Client goes 30 days without responding to a written request, Developer may stop work and retain all payments, then either deliver unfinished files and close the project, or negotiate a new schedule.</p>
              <p className="mb-3"><strong>Abandonment.</strong> If the project is inactive for 90+ days due to Client, it is considered abandoned. A 25% restart fee applies to resume work.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">14. File Retention</h3>
              <p className="mb-3">After termination, Developer will retain Client's project files for 6 months. Client may request file delivery at any time during this period. After 6 months, files may be permanently deleted without notice. Developer is not liable for file loss after this period. Developer may retain copies for portfolio or legal purposes.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">15. Confidentiality</h3>
              <p className="mb-3">Both parties agree not to disclose the terms of this Agreement without the other's written consent, except as required by law.</p>

              <h3 className="font-bold text-gray-900 mt-4 mb-2">16. Governing Law</h3>
              <p className="mb-3">This Agreement is governed by Oklahoma law, with jurisdiction in Tulsa County. Disputes will first go to mediation under the American Arbitration &amp; Mediation Association. The prevailing party in any legal action is entitled to recover attorney's fees and costs.</p>

              {contract.scheduleA && (
                <div className="mt-4">
                  <h3 className="font-bold text-gray-900 mb-2">Schedule A — Scope of Work</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 whitespace-pre-wrap text-sm">{contract.scheduleA}</div>
                </div>
              )}

              <div className="border-t border-gray-200 mt-6 pt-6">
                <p className="font-semibold text-gray-900 mb-1">IN WITNESS WHEREOF, the Parties hereto have executed this Agreement:</p>
                <p className="text-sm text-gray-500 mb-4">By signing below, <strong>{contract.clientName}</strong> agrees to all terms of this Development Agreement.</p>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">Client Signature <span className="text-red-500">*</span></Label>
                  <button
                    type="button"
                    onClick={() => { sigPadRef.current?.clear(); setSigError(false); }}
                    className="text-xs text-[#061e57] hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className={`border-2 rounded-lg overflow-hidden ${sigError ? "border-red-400" : "border-gray-300"} bg-gray-50`}>
                  <SignatureCanvas
                    ref={sigPadRef}
                    penColor="#1e3a5f"
                    canvasProps={{ width: 600, height: 160, className: "w-full touch-none" }}
                  />
                </div>
                {sigError && <p className="text-red-500 text-xs mt-1">Please sign above before submitting.</p>}
              </div>
            </div>

            <div className="px-8 py-5 border-t border-gray-100 flex justify-end">
              <Button
                onClick={handleSign}
                disabled={signContract.isPending}
                className="bg-[#061e57] hover:bg-[#0a2a6e] text-white px-8"
              >
                {signContract.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit Agreement</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── ACH Payment Form ── */}
        {view === "ach" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#061e57] px-8 py-5 text-white">
              <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                ACH Payment Authorization
              </h2>
              <p className="text-blue-200 text-sm mt-1">Your contract is signed — authorize your deposit to get started</p>
            </div>

            <div className="px-8 py-6 space-y-6">

              {/* Signed success banner */}
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 text-sm">Agreement signed successfully!</p>
                  <p className="text-green-700 text-sm mt-0.5">Please provide your ACH bank details below to authorize your deposit of <strong>${Number(contract.depositAmount).toLocaleString()}</strong> and get your project underway.</p>
                </div>
              </div>

              {/* Security & Compliance Disclosure */}
              <div className="border border-[#b3cee1] rounded-xl overflow-hidden">
                <div className="bg-[#eef4f9] px-5 py-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#061e57]" />
                  <span className="text-sm font-semibold text-[#061e57] uppercase tracking-wide">Security &amp; Compliance</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Lock className="w-4 h-4 text-[#3a4856] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Encrypted Transmission (SSL/TLS)</p>
                      <p className="text-xs text-gray-500 mt-0.5">This page is served over HTTPS. All data you enter is encrypted in transit between your browser and our server — it cannot be intercepted in plain text.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-4 h-4 text-[#3a4856] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Never Stored — Deleted After Processing</p>
                      <p className="text-xs text-gray-500 mt-0.5">Your banking details are <strong>not saved</strong> to our database. They are securely transmitted to our accounting team for a one-time ACH entry and then permanently deleted per our data retention policy.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-[#3a4856] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">NACHA Rules &amp; Limited Access</p>
                      <p className="text-xs text-gray-500 mt-0.5">McWilliams Media handles ACH information in accordance with NACHA's Reasonable Security requirements. Access to your banking details is strictly limited to authorized personnel responsible for payment processing.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details Form */}
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Account Holder Name <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Full name on account"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className={achErrors.accountHolderName ? "border-red-400" : ""}
                    />
                    {achErrors.accountHolderName && <p className="text-red-500 text-xs mt-1">{achErrors.accountHolderName}</p>}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Bank Name <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="e.g. Bank of America"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className={achErrors.bankName ? "border-red-400" : ""}
                    />
                    {achErrors.bankName && <p className="text-red-500 text-xs mt-1">{achErrors.bankName}</p>}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Account Type <span className="text-red-500">*</span></Label>
                  <div className="flex gap-3">
                    {["checking", "savings"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${
                          accountType === type
                            ? "border-[#061e57] bg-[#061e57] text-white"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Routing Number <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="9-digit routing number"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    inputMode="numeric"
                    className={`font-mono ${achErrors.routingNumber ? "border-red-400" : ""}`}
                  />
                  {achErrors.routingNumber && <p className="text-red-500 text-xs mt-1">{achErrors.routingNumber}</p>}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Account Number <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 17))}
                    inputMode="numeric"
                    className={`font-mono ${achErrors.accountNumber ? "border-red-400" : ""}`}
                  />
                  {achErrors.accountNumber && <p className="text-red-500 text-xs mt-1">{achErrors.accountNumber}</p>}
                </div>
              </div>

              {/* ACH Authorization (NACHA-required) */}
              <div className={`border-2 rounded-xl p-5 transition-colors ${achErrors.achAuthorized ? "border-red-400 bg-red-50" : achAuthorized ? "border-[#061e57] bg-[#eef4f9]" : "border-gray-200 bg-gray-50"}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={achAuthorized}
                    onChange={(e) => {
                      setAchAuthorized(e.target.checked);
                      if (e.target.checked && achErrors.achAuthorized) {
                        setAchErrors((prev) => { const n = {...prev}; delete n.achAuthorized; return n; });
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#061e57] shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">ACH Debit Authorization</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      By checking this box, I, <strong>{contract.clientName}</strong>, authorize <strong>McWilliams Media Inc.</strong> to initiate a one-time ACH debit of <strong>${Number(contract.depositAmount).toLocaleString()}</strong> from the bank account provided above. I understand this deposit is non-refundable per the signed Development Agreement. I may revoke this authorization at any time by contacting{" "}
                      <a href="mailto:info@mcwilliamsmedia.com" className="text-[#061e57] underline">info@mcwilliamsmedia.com</a>{" "}
                      before the transaction is processed.
                    </p>
                  </div>
                </label>
                {achErrors.achAuthorized && <p className="text-red-600 text-xs mt-2 ml-7">{achErrors.achAuthorized}</p>}
              </div>

            </div>

            <div className="px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setView("other-arrangements")}
                className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 order-2 sm:order-1"
              >
                I need to make other payment arrangements
              </button>
              <Button
                onClick={handleAchSubmit}
                disabled={achLoading}
                className="bg-[#061e57] hover:bg-[#0a2a6e] text-white px-8 order-1 sm:order-2 w-full sm:w-auto"
              >
                {achLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" /> Authorize &amp; Submit</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {view === "done" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-16 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                Your contract is signed and your payment information has been securely received. We'll process your deposit and reach out to schedule your kickoff call shortly.
              </p>
              <div className="bg-[#eef4f9] border border-[#b3cee1] rounded-lg p-5 max-w-sm mx-auto text-left">
                <p className="text-sm text-[#3a4856] leading-relaxed">
                  <strong>What's next:</strong> Your strategist will confirm your deposit has been collected and schedule your project kickoff within 1–2 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Other Payment Arrangements ── */}
        {view === "other-arrangements" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-16 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract signed!</h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                No problem — your contract is on file. Someone from our team will be in touch to coordinate your deposit payment.
              </p>
              <div className="bg-[#eef4f9] border border-[#b3cee1] rounded-lg p-5 max-w-sm mx-auto text-left">
                <p className="text-sm text-[#3a4856] leading-relaxed">
                  Questions in the meantime? Reach us at{" "}
                  <a href="mailto:info@mcwilliamsmedia.com" className="text-[#061e57] font-semibold hover:underline">
                    info@mcwilliamsmedia.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          McWilliams Media Inc. · Tulsa, Oklahoma · All rights reserved
        </p>
      </div>
    </div>
  );
}
