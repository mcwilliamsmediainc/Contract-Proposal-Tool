import { Link } from "wouter";
import { PublicHeader } from "@/components/layout/public-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      <PublicHeader variant="light" subtitle="Premium Digital Agency" />

      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] opacity-5 bg-cover bg-center pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50 pointer-events-none" />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 font-sans">
          Strategic Architecture.<br />
          <span className="text-primary">Digital Execution.</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
          McWilliams Media builds premium, high-converting digital ecosystems for visionary brands. We don't just design websites; we architect growth.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/admin" className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            Access Portal
          </Link>
        </div>
      </main>
    </div>
  );
}