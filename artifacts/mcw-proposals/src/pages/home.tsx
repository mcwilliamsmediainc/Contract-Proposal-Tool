import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#061e57" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-[#061e57]/90">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <img src="/mcwilliams-logo.png" alt="McWilliams Media" className="h-7 w-auto object-contain" />
          <a
            href="https://mcwilliamsmedia.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs tracking-wider uppercase text-white/40 hover:text-white/70 transition-colors hidden sm:block"
          >
            mcwilliamsmedia.com
          </a>
        </div>
      </header>

      {/* Diagonal texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(179,206,225,0.03) 40px,
            rgba(179,206,225,0.03) 41px
          )`,
        }}
      />

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-4xl mx-auto w-full">

        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#b3cee1]/70 mb-6">
          McWilliams Media — Strategic Portal
        </p>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 leading-[1.05]">
          Strategic Architecture.
        </h1>
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#b3cee1] mb-8 leading-[1.05]">
          Digital Execution.
        </h2>

        <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto mb-12 leading-relaxed">
          McWilliams Media builds premium, high-converting digital ecosystems for visionary brands.
        </p>

        <Link
          href="/admin"
          className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-semibold text-[#061e57] shadow-lg transition-all hover:bg-[#b3cee1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          Access Portal
        </Link>
      </main>

      {/* Bottom rule */}
      <div className="border-t border-white/10 py-5 text-center">
        <p className="text-xs text-white/25 tracking-wider">© {new Date().getFullYear()} McWilliams Media. All rights reserved.</p>
      </div>
    </div>
  );
}
