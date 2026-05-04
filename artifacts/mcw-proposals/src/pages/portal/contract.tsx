import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useGetContract, useSignContract, getGetContractQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, FileSignature } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import SignatureCanvas from "react-signature-canvas";
import { PublicHeader } from "@/components/layout/public-header";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois",
  "Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts",
  "Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota",
  "Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

const REFERRAL_SOURCES = ["Google","Social Media","Word of Mouth","BNI","The Office Tulsa","HBA","Other Networking Group","Other Referral"];
const TEAM_MEMBERS = ["Matt","Tiffany","Christel","Rachelle","Other Team Member"];

function hostingLabel(opt: string) {
  if (opt === "basic") return "Basic Hosting — $50/month";
  if (opt === "platinum") return "Platinum Hosting — $100/month";
  return "No Hosting";
}

function contractTypeLabel(type: string) {
  if (type === "website") return "Website Development";
  if (type === "marketing") return "Marketing Services";
  if (type === "print") return "Print & Brand";
  return type;
}

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

  const [step, setStep] = useState(1);
  const [sigError, setSigError] = useState(false);
  const [referralSource, setReferralSource] = useState("");
  const [teamMember, setTeamMember] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyAddressLine2, setCompanyAddressLine2] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyZip, setCompanyZip] = useState("");

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

  if (contract.status === "signed") {
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
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      setSigError(true);
      return;
    }
    setSigError(false);
    const signatureData = sigPadRef.current.getTrimmedCanvas().toDataURL("image/png");

    try {
      const updated = await signContract.mutateAsync({
        id,
        data: {
          signatureData,
          referralSource: referralSource || null,
          teamMember: teamMember || null,
          companyAddress: companyAddress || null,
          companyAddressLine2: companyAddressLine2 || null,
          companyCity: companyCity || null,
          companyState: companyState || null,
          companyZip: companyZip || null,
        },
      });
      queryClient.setQueryData(getGetContractQueryKey(id), updated);
      toast({ title: "Agreement Signed!", description: "Thank you. Your contract has been submitted." });
    } catch {
      toast({ title: "Error", description: "Failed to submit signature. Please try again.", variant: "destructive" });
    }
  };

  const stepLabels = ["Agreement", "Referral Details", "Business Information"];

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader variant="light" subtitle={`${contractTypeLabel(contract.contractType)} Agreement`} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-2 ${i + 1 === step ? "text-blue-600" : i + 1 < step ? "text-green-600" : "text-gray-400"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i + 1 < step ? "bg-green-600 border-green-600 text-white" :
                  i + 1 === step ? "border-blue-600 text-blue-600" :
                  "border-gray-300 text-gray-400"
                }`}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-2 ${i + 1 < step ? "bg-green-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {step === 1 && (
            <div>
              <div className="bg-blue-600 px-8 py-5 text-white">
                <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                  <FileSignature className="w-5 h-5" />
                  Development Agreement
                </h2>
                <p className="text-blue-200 text-sm mt-1">Step 1 of 3 — Please read and sign below</p>
              </div>

              <div className="px-8 py-6 prose prose-sm max-w-none text-gray-700 leading-relaxed">
                <p className="text-sm text-gray-500 mb-4 font-medium">
                  THIS DEVELOPMENT AGREEMENT, ("Agreement") dated this {dateStr} is entered into between <strong>MCWILLIAMS MEDIA INC.</strong>, an Oklahoma Corporation, ("Developer") and <strong>{contract.clientName}</strong> ("Client").
                </p>

                <p className="mb-4">WHEREAS Developer is in the business of custom professional {contractTypeLabel(contract.contractType).toLowerCase()} services. WHEREAS Client desires to retain Developer to create and provide services per the Deliverables detailed herein. NOW THEREFORE, in consideration of the mutual promises, conditions, covenants and warranties contained herein and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties hereto agree as follows:</p>

                <h3 className="font-bold text-gray-900 mt-4 mb-2">1.0. Developer Services</h3>
                <p className="mb-3">Developer will perform the Services described herein for Client. Before delivering work to Client, Developer will test its components to ensure everything works correctly.</p>
                <p className="mb-3"><strong>1.2. Buildout.</strong> Developer shall complete the requirements and host/deliver it in a manner that Client can view and approve. Edits will be done in accordance with the specific outlined in the proposal.</p>
                <p className="mb-3"><strong>1.3. Major Revisions.</strong> If Client desires to implement major revisions, Client shall submit all edit requests through our 3rd party tool. Developer shall provide a revised cost and time frame, and upon approval, shall proceed to implement changes within the new schedule.</p>

                <h3 className="font-bold text-gray-900 mt-4 mb-2">Fees and Schedule</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Fee</div>
                      <div className="text-lg font-bold text-gray-900">${contract.totalCost.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deposit</div>
                      <div className="text-lg font-bold text-blue-600">${contract.depositAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</div>
                      <div className="text-lg font-bold text-gray-900">${contract.remainingBalance.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <p className="mb-3"><strong>2.1. Deposit.</strong> Client shall pay a non-refundable Deposit prior to the commencement of any work by Developer.</p>
                <p className="mb-3"><strong>2.2. Expenses.</strong> Client shall reimburse Developer for any and all out of pocket expenses incurred by Developer pursuant to this Agreement.</p>
                <p className="mb-3"><strong>2.3. Payments.</strong> Client agrees that all payments shall be made via ACH transfer, which is the preferred method of payment for all services. Alternative payment methods, including check or credit card, may be accepted at Developer's discretion.</p>
                <p className="mb-3"><strong>2.4. Late Fees.</strong> Late Payments shall be subject to a late fee of $75.00 per month. If Client's account becomes ninety (90) days past due, Developer shall have the right to suspend all Services, including hosting.</p>

                {contract.hostingOption !== "none" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-1">Selected Hosting</h4>
                    <p className="text-blue-800 text-sm">{hostingLabel(contract.hostingOption)}</p>
                  </div>
                )}

                <h3 className="font-bold text-gray-900 mt-4 mb-2">3.0. Schedules</h3>
                <p className="mb-3">Developer shall use all reasonable efforts to meet the delivery schedules set herein. Any delay or non-performance caused by conditions beyond the reasonable control of Developer shall not constitute a breach of this Agreement.</p>

                <h3 className="font-bold text-gray-900 mt-4 mb-2">4.0. Copyright</h3>
                <p className="mb-3">Client owns copyright to the content of the work. Client gives us permission to record any video meetings for design purposes.</p>

                <h3 className="font-bold text-gray-900 mt-4 mb-2">9.0. Termination</h3>
                <p className="mb-3">Each Party may terminate this Agreement by written notice for material breach, provided such breach remains uncured within thirty (30) days. If Client cancels for any reason, Developer shall retain the non-refundable Deposit and all payments made to date.</p>

                <h3 className="font-bold text-gray-900 mt-4 mb-2">11.0. Applicable Law</h3>
                <p className="mb-3">This Agreement shall be governed by the laws of the State of Oklahoma with jurisdiction and venue in Tulsa County, Oklahoma.</p>

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
                      className="text-xs text-blue-600 hover:underline"
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
                  {sigError && <p className="text-red-500 text-xs mt-1">Please sign above before continuing.</p>}
                </div>
              </div>

              <div className="px-8 py-5 border-t border-gray-100 flex justify-end">
                <Button
                  onClick={() => {
                    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
                      setSigError(true);
                      return;
                    }
                    setSigError(false);
                    setStep(2);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="bg-blue-600 px-8 py-5 text-white">
                <h2 className="text-lg font-bold uppercase tracking-wide">Referral Details</h2>
                <p className="text-blue-200 text-sm mt-1">Step 2 of 3</p>
              </div>
              <div className="px-8 py-8 space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">How Did We Meet? <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <select
                    value={referralSource}
                    onChange={(e) => setReferralSource(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select Choice —</option>
                    {REFERRAL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Who Have You Been Working With? <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <select
                    value={teamMember}
                    onChange={(e) => setTeamMember(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select Choice —</option>
                    {TEAM_MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="px-8 py-5 border-t border-gray-100 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="bg-blue-600 px-8 py-5 text-white">
                <h2 className="text-lg font-bold uppercase tracking-wide">Business Information</h2>
                <p className="text-blue-200 text-sm mt-1">Step 3 of 3 — Final submission</p>
              </div>
              <div className="px-8 py-8 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Company Name <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Input value={contract.businessName} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Business Address <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Input placeholder="Address Line 1" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="mb-2" />
                  <Input placeholder="Address Line 2" value={companyAddressLine2} onChange={(e) => setCompanyAddressLine2(e.target.value)} className="mb-2" />
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="City" value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} />
                    <select
                      value={companyState}
                      onChange={(e) => setCompanyState(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">State</option>
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Input placeholder="ZIP" value={companyZip} onChange={(e) => setCompanyZip(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="px-8 py-5 border-t border-gray-100 flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={signContract.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
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
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          McWilliams Media Inc. · Tulsa, Oklahoma · All rights reserved
        </p>
      </div>
    </div>
  );
}
