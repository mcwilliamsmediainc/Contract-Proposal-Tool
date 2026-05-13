import {
  generateProposalContent,
  type ProposalContext,
} from "@workspace/integrations-claude";

const context: ProposalContext = {
  business_name: "Tulsa Kwik Dry",
  contact_name: "Matt McWilliams",
  city: "Tulsa, Oklahoma",
  industry: "Carpet and floor cleaning",
  stated_goal: "Generate more leads from local customers",
  budget_range: "mid",
  audit_scores: { ux: 62, seo: 44, social: 38, ai_visibility: 29 },
  current_services: ["google_ads"],
  notes:
    "Owner-operated franchise. Fast dry time is main differentiator. Wants to compete with larger cleaning companies in Tulsa market.",
};

const REQUIRED_FIELDS = [
  "personal_note",
  "what_we_found",
  "recommended_tier",
  "recommended_price",
  "tier_rationale",
  "testimonial_name",
  "testimonial_business",
  "testimonial_quote",
  "next_steps",
  "include_website",
] as const;

async function main() {
  console.log("→ Calling Paige for:", context.business_name);
  const start = Date.now();

  const result = await generateProposalContent(context);
  const ms = Date.now() - start;

  console.log("\n=== Paige output ===");
  console.log(JSON.stringify(result, null, 2));
  console.log(`\n(generated in ${ms}ms)`);

  const missing = REQUIRED_FIELDS.filter(
    (f) => (result as Record<string, unknown>)[f] === undefined,
  );
  const tierOk = ["pro", "plus", "platinum"].includes(result.recommended_tier);
  const priceOk = typeof result.recommended_price === "number";

  if (missing.length === 0 && tierOk && priceOk) {
    console.log("\n✓ Output is valid JSON matching Paige's contract.");
  } else {
    console.error("\n✗ Output failed validation:");
    if (missing.length) console.error("  missing fields:", missing);
    if (!tierOk) console.error("  bad recommended_tier:", result.recommended_tier);
    if (!priceOk) console.error("  bad recommended_price:", result.recommended_price);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Paige test failed:", err);
  process.exit(1);
});
