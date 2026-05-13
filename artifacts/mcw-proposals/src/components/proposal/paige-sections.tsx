import type { PaigeContent } from "./proposal-template";

export function PaigeSections({ paige, clientName }: { paige: PaigeContent; clientName: string }) {
  return (
    <>
      {/* Personal Note from Matt */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-6 pl-3 border-l-2"
            style={{ color: "#3a4856", borderColor: "#b3cee1" }}
          >
            A Personal Note
          </p>
          <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{paige.personalNote}</p>
          <p className="mt-6 text-sm text-gray-500 italic">— Matt McWilliams, Founder &amp; CEO, McWilliams Media</p>
        </div>
      </section>

      {/* What We Found */}
      <section className="py-20 px-6" style={{ backgroundColor: "#f5f0eb" }}>
        <div className="max-w-3xl mx-auto">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-6 pl-3 border-l-2"
            style={{ color: "#7c370c", borderColor: "#d8bfa7" }}
          >
            What We Found
          </p>
          <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-line">{paige.whatWeFound}</p>
        </div>
      </section>

      {/* Recommended Plan callout */}
      <section className="bg-white py-12 px-6">
        <div className="max-w-3xl mx-auto rounded-2xl p-8" style={{ backgroundColor: "#061e57", color: "#f5f0eb" }}>
          <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: "#b3cee1" }}>
            {clientName ? `${clientName}, here's what we recommend` : "Our recommendation"}
          </p>
          <p
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}
          >
            {paige.recommendedTier.toUpperCase()} PLAN — ${paige.recommendedPrice.toLocaleString()}/month
          </p>
          <p className="text-sm leading-relaxed mt-3 whitespace-pre-line" style={{ color: "#b3cee1" }}>
            {paige.tierRationale}
          </p>
        </div>
      </section>

      {/* Optional Website Recommendation */}
      {paige.includeWebsite && paige.websiteRationale && (
        <section className="py-16 px-6" style={{ backgroundColor: "#f5f0eb" }}>
          <div
            className="max-w-3xl mx-auto rounded-xl p-6 border-l-4"
            style={{ borderColor: "#7c370c", backgroundColor: "#ffffff" }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "#7c370c" }}>
              We Also Recommend a Website
            </p>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{paige.websiteRationale}</p>
          </div>
        </section>
      )}
    </>
  );
}
