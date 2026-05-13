import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "ANTHROPIC_API_KEY must be set to use the Claude (Paige) integration.",
  );
}

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
export const CLAUDE_MAX_TOKENS = 4000;
