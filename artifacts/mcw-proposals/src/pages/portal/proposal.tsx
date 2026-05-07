import { useParams, useLocation } from "wouter";
import { useGetProposal, useRecordProposalView, useAcceptProposal, getGetProposalQueryKey } from "@workspace/api-client-react";
import { useEffect, useRef, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { FullProposalTemplate } from "@/components/proposal/proposal-template";
import { TieredMarketingTemplate } from "@/components/proposal/tiered-marketing-template";
import { AlaCarteMarketingTemplate } from "@/components/proposal/ala-carte-marketing-template";
import type { Tier } from "@/components/proposal/tiered-marketing-template";
import { Download } from "lucide-react";

export default function ClientPortal() {
  const params = useParams<{ id: string }>();
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: proposal, isLoading } = useGetProposal(id, { query: { enabled: !!id, queryKey: getGetProposalQueryKey(id) } });
  const recordView = useRecordProposalView();
  const acceptProposal = useAcceptProposal();
  const viewedRef = useRef(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  useEffect(() => {
    if (id && !viewedRef.current) { viewedRef.current = true; recordView.mutate({ id }); }
  }, [id, recordView]);

  // If proposal is already accepted and has a linked contract, offer the contract link
  useEffect(() => {
    if (proposal?.status === "accepted" && proposal.contractUuid) {
      setLocation(`/contract/${proposal.contractUuid}`);
    }
  }, [proposal?.status, proposal?.contractUuid, setLocation]);

  const goToContract = async (selectedTierValue?: string) => {
    try {
      const data = await acceptProposal.mutateAsync({
        id,
        data: { signatureData: "", ...(selectedTierValue ? { selectedTier: selectedTierValue } : {}) } as { signatureData: string },
      });
      queryClient.setQueryData(getGetProposalQueryKey(id), data);
      if (proposal?.contractUuid) {
        setLocation(`/contract/${proposal.contractUuid}`);
      }
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
          onAccept={(tier) => goToContract(tier)}
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
            await goToContract(JSON.stringify(selectedServiceIds));
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
        onAccept={() => goToContract()}
        isPending={acceptProposal.isPending}
      />
    </>
  );
}
