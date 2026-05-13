import { claude, CLAUDE_MODEL, CLAUDE_MAX_TOKENS } from "./client";
import { PAIGE_SYSTEM_PROMPT } from "./prompts/paige";

export { claude } from "./client";
export { PAIGE_SYSTEM_PROMPT } from "./prompts/paige";

export type BudgetSignal = "lean" | "mid" | "high";
export type RecommendedTier = "pro" | "plus" | "platinum";

export interface AuditScores {
  ux: number;
  seo: number;
  social: number;
  ai_visibility: number;
}

export interface ProposalContext {
  business_name: string;
  contact_name: string;
  city?: string;
  industry?: string;
  stated_goal?: "traffic" | "leads" | "brand" | "all" | string;
  budget_range?: BudgetSignal;
  audit_scores?: Partial<AuditScores>;
  current_services?: string[];
  notes?: string;
}

export interface ProposalContent {
  personal_note: string;
  what_we_found: string;
  recommended_tier: RecommendedTier;
  recommended_price: number;
  tier_rationale: string;
  testimonial_name: string;
  testimonial_business: string;
  testimonial_quote: string;
  next_steps: string;
  include_website: boolean;
  website_rationale?: string;
}

export class ClaudeGenerationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ClaudeGenerationError";
  }
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) return fenced[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

export async function generateProposalContent(
  context: ProposalContext,
): Promise<ProposalContent> {
  try {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      system: PAIGE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Generate a proposal for the following prospect. Return JSON only.\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new ClaudeGenerationError("Claude returned no text content");
    }

    const raw = extractJson(textBlock.text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new ClaudeGenerationError(
        "Claude response was not valid JSON",
        err,
      );
    }

    return parsed as ProposalContent;
  } catch (err) {
    if (err instanceof ClaudeGenerationError) throw err;
    throw new ClaudeGenerationError(
      err instanceof Error ? err.message : "Claude generation failed",
      err,
    );
  }
}
