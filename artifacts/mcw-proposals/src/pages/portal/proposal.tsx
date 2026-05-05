import { useParams } from "wouter";
import { useGetProposal, useRecordProposalView, useAcceptProposal, getGetProposalQueryKey } from "@workspace/api-client-react";
import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { FullProposalTemplate } from "@/components/proposal/proposal-template";
import { TieredMarketingTemplate } from "@/components/proposal/tiered-marketing-template";
import { AlaCarteMarketingTemplate } from "@/components/proposal/ala-carte-marketing-template";
import type { Tier } from "@/components/proposal/tiered-marketing-template";

export default function ClientPortal() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const queryClient = useQueryClient();
  const { data: proposal, isLoading } = useGetProposal(id, { query: { enabled: !!id, queryKey: getGetProposalQueryKey(id) } });
  const recordView = useRecordProposalView();
  const acceptProposal = useAcceptProposal();
  const viewedRef = useRef(false);
  const [accepted, setAccepted] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  useEffect(() => {
    if (id && !viewedRef.current) { viewedRef.current = true; recordView.mutate({ id }); }
  }, [id, recordView]);

  useEffect(() => {
    if (proposal?.status === "accepted") setAccepted(true);
  }, [proposal?.status]);

  const handleAccept = async () => {
    try {
      const data = await acceptProposal.mutateAsync({
        id,
        data: {
          signatureData: "",
          ...(selectedTier ? { selectedTier } : {}),
        } as { signatureData: string },
      });
      queryClient.setQueryData(getGetProposalQueryKey(id), data);
      setAccepted(true);
    } catch {}
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
        {selectedTier && (
          <p className="text-sm text-blue-600 font-semibold mt-3">
            Selected: {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Plan
          </p>
        )}
        <p className="text-xs text-gray-400 mt-6">Transaction: {proposal.id}</p>
      </div>
    </div>
  );

  const DownloadButton = () => (
    <button
      onClick={() => window.print()}
      className="no-print fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur border border-gray-200 shadow-lg text-gray-800 text-sm font-semibold hover:bg-white transition-colors"
      title="Download as PDF"
    >
      <Download className="w-4 h-4" />
      Download PDF
    </button>
  );

  if (proposal.projectType === "tiered") {
    return (
      <>
        <DownloadButton />
        <TieredMarketingTemplate
          data={{
            clientName: proposal.clientName,
            businessName: proposal.businessName,
            projectType: proposal.projectType,
            content: proposal.content,
            loomVideoUrl: proposal.loomVideoUrl,
            createdAt: proposal.createdAt,
          }}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          onAccept={handleAccept}
          isPending={acceptProposal.isPending}
        />
      </>
    );
  }

  if (proposal.projectType === "ala-carte") {
    return (
      <>
        <DownloadButton />
        <AlaCarteMarketingTemplate
          data={{
            clientName: proposal.clientName,
            businessName: proposal.businessName,
            projectType: proposal.projectType,
            content: proposal.content,
            loomVideoUrl: proposal.loomVideoUrl,
            createdAt: proposal.createdAt,
          }}
          onAccept={async (selectedServiceIds) => {
            try {
              const data = await acceptProposal.mutateAsync({
                id,
                data: {
                  signatureData: "",
                  selectedTier: JSON.stringify(selectedServiceIds),
                } as { signatureData: string },
              });
              queryClient.setQueryData(getGetProposalQueryKey(id), data);
              setAccepted(true);
            } catch {}
          }}
          isPending={acceptProposal.isPending}
        />
      </>
    );
  }

  return (
    <>
      <DownloadButton />
      <FullProposalTemplate
        data={{
          clientName: proposal.clientName,
          businessName: proposal.businessName,
          projectType: proposal.projectType,
          numberOfPages: proposal.numberOfPages,
          pageNames: proposal.pageNames,
          totalAmount: Number(proposal.totalAmount),
          pricingItems: proposal.pricingItems,
          content: proposal.content,
          loomVideoUrl: proposal.loomVideoUrl,
          createdAt: proposal.createdAt,
        }}
        onAccept={handleAccept}
        isPending={acceptProposal.isPending}
      />
    </>
  );
}
