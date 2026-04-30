import { useParams } from "wouter";
import { useGetProposal, useRecordProposalView, useAcceptProposal, getGetProposalQueryKey } from "@workspace/api-client-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SignaturePad } from "@/components/ui/signature-pad";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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
    if (id && !viewedRef.current) {
      viewedRef.current = true;
      recordView.mutate({ id });
    }
  }, [id, recordView]);

  useEffect(() => {
    if (proposal?.status === "accepted") {
      setAccepted(true);
    }
  }, [proposal?.status]);

  const handleAccept = async () => {
    if (!signatureData) return;
    try {
      const data = await acceptProposal.mutateAsync({ id, data: { signatureData } });
      queryClient.setQueryData(getGetProposalQueryKey(id), data);
      setAccepted(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('loom.com/share/')) {
      return url.replace('share/', 'embed/');
    }
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-t-2 border-primary border-r-2 rounded-full animate-spin" />
          <div className="text-zinc-500 font-mono text-xs tracking-widest animate-pulse">DECRYPTING PROTOCOLS...</div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return <div className="min-h-screen bg-black text-white flex justify-center items-center font-mono">PROPOSAL NOT FOUND OR EXPIRED.</div>;
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.1)_0,transparent_50%)]" />
        
        <div className="max-w-md text-center z-10 space-y-6">
          <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(var(--primary),0.3)]">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Strategy Accepted</h1>
          <p className="text-zinc-400">
            Welcome to the ecosystem, {proposal.clientName}. The McWilliams Media team has been notified and activation protocols have commenced.
          </p>
          <div className="pt-8 border-t border-zinc-800">
            <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">TRANSACTION ID: {proposal.id}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 selection:bg-primary/30">
      <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Hero Section */}
      <header className="relative pt-32 pb-24 px-6 md:px-12 lg:px-24 overflow-hidden border-b border-zinc-900">
        <div className="absolute top-0 right-0 p-8 flex justify-end w-full">
           <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-black font-mono font-bold text-2xl shadow-lg">
            M
          </div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="font-mono text-primary text-sm tracking-[0.2em] mb-6 flex items-center gap-4">
            <span className="w-8 h-px bg-primary" />
            STRATEGIC PROPOSAL / FOR {proposal.businessName.toUpperCase()}
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 font-sans uppercase">
            {proposal.clientName}
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-zinc-800/50 mt-12">
            <div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">DATE</div>
              <div className="text-sm text-white font-mono">{new Date(proposal.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '.')}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">PREPARED BY</div>
              <div className="text-sm text-white font-mono">Matt McWilliams</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1">INVESTMENT</div>
              <div className="text-sm text-white font-mono">${proposal.totalAmount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-12 lg:px-24 py-24 space-y-32">
        {proposal.loomVideoUrl && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
            <div className="font-mono text-xs tracking-widest text-zinc-500 mb-6 flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              STRATEGY BRIEFING
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
              <iframe 
                src={getEmbedUrl(proposal.loomVideoUrl)} 
                className="w-full h-full" 
                allowFullScreen 
              />
            </div>
          </section>
        )}

        <section className="prose prose-invert prose-zinc max-w-none prose-headings:font-sans prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-zinc-400 prose-p:leading-relaxed prose-li:text-zinc-400 font-serif text-lg">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {proposal.content || "*No strategy content generated.*"}
          </ReactMarkdown>
        </section>

        {proposal.calendlyUrl && (
          <section className="border-t border-zinc-800 pt-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Strategic Alignment</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">Select a time to review the architecture and initialize the partnership.</p>
            </div>
            <div className="h-[700px] w-full bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800 p-2">
               <iframe 
                  src={`${proposal.calendlyUrl}?embed_domain=${window.location.hostname}&embed_type=Inline`} 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  title="Select a Date & Time - Calendly"
                ></iframe>
            </div>
          </section>
        )}

        <section className="border-t border-zinc-800 pt-24 pb-32">
          <div className="max-w-2xl mx-auto bg-zinc-900/50 border border-zinc-800 p-8 md:p-12 rounded-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            <h2 className="text-3xl font-bold text-white mb-2">Execute Agreement</h2>
            <p className="text-zinc-400 mb-8 text-sm">By signing below, you agree to the strategic roadmap and terms outlined above for the sum of ${proposal.totalAmount.toLocaleString()}.</p>
            
            <div className="mb-8">
              <SignaturePad onEnd={setSignatureData} />
            </div>

            <Button 
              onClick={handleAccept} 
              disabled={!signatureData || acceptProposal.isPending}
              className="w-full h-14 bg-white text-black hover:bg-zinc-200 text-base font-bold tracking-tight rounded-xl group"
            >
              {acceptProposal.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  AUTHORIZE ACTIVATION <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
            <p className="text-center text-zinc-600 text-xs font-mono mt-4 uppercase tracking-wider">
              Legally binding digital signature
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}