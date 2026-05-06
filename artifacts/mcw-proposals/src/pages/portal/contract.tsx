import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useGetContract, useSignContract, getGetContractQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, FileSignature, Lock, CreditCard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import SignatureCanvas from "react-signature-canvas";
import { PublicHeader } from "@/components/layout/public-header";

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

  // ACH form state
  const [achLoading, setAchLoading] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [achErrors, setAchErrors] = useState<Record<string, string>>({});

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
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      setSigError(true);
      return;
    }
    setSigError(false);
    const signatureData = sigPadRef.current.getTrimmedCanvas().toDataURL("image/png");

    try {
      const updated = await signContract.mutateAsync({ id, data: { signatureData } });
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
                    <div className="text-lg font-bold text-gray-900">${Number(contract.totalCost).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deposit</div>
                    <div className="text-lg font-bold text-[#061e57]">${Number(contract.depositAmount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</div>
                    <div className="text-lg font-bold text-gray-900">${Number(contract.remainingBalance).toLocaleString()}</div>
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
                Payment Information
              </h2>
              <p className="text-blue-200 text-sm mt-1">Your contract is signed — submit ACH details to get started</p>
            </div>

            <div className="px-8 py-6">
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 text-sm">Agreement signed successfully!</p>
                  <p className="text-green-700 text-sm mt-0.5">Please provide your ACH bank details below so we can collect your deposit of <strong>${Number(contract.depositAmount).toLocaleString()}</strong> and get your project started.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Your banking information is transmitted securely and is never stored on our servers. It is sent directly to our team for one-time ACH processing.</span>
              </div>

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
                  <><Lock className="w-4 h-4 mr-2" /> Submit Payment Info</>
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
