import { ai } from "@workspace/integrations-gemini-ai";

export interface AuditScores {
  ux: number;
  seo: number;
  social: number;
  aiVisibility: number;
}

export interface PillarObservation {
  summary: string;
  friendlyTranslation: string;
  cliffhanger: string;
  aiQuote?: string;
}

export interface AuditObservations {
  ux: PillarObservation;
  seo: PillarObservation;
  social: PillarObservation;
  aiVisibility: PillarObservation;
}

export interface ScanResult {
  scores: AuditScores;
  observations: AuditObservations;
  businessType: string;
  rawData: Record<string, unknown>;
}

async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; McWilliamsMediaAudit/1.0; +https://mcwilliamsmedia.com)",
      },
    });
    const text = await res.text();
    return text.slice(0, 15000);
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function scanWebsite(url: string, city: string): Promise<ScanResult> {
  const html = await fetchPageHtml(url);
  const domain = url.replace(/^https?:\/\//, "").split("/")[0];

  const prompt = `You are a digital marketing analyst at McWilliams Media. Analyze this business website and return a detailed audit as JSON.

Website: ${url}
Business City: ${city}
Domain: ${domain}

HTML content (may be truncated):
${html ? html : "(Could not fetch page content — analyze domain name and URL structure only)"}

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "businessType": "brief description of business type, e.g. 'Local HVAC Company' or 'Restaurant'",
  "scores": {
    "ux": <integer 0-100>,
    "seo": <integer 0-100>,
    "social": <integer 0-100>,
    "aiVisibility": <integer 0-100>
  },
  "observations": {
    "ux": {
      "summary": "2-3 sentence technical summary of UX issues or strengths found",
      "friendlyTranslation": "1-2 sentence plain English explanation of what this means for their business",
      "cliffhanger": "1 provocative sentence hinting at the biggest opportunity they're missing"
    },
    "seo": {
      "summary": "2-3 sentence technical summary of SEO state",
      "friendlyTranslation": "1-2 sentence plain English explanation",
      "cliffhanger": "1 provocative sentence about what they're losing"
    },
    "social": {
      "summary": "2-3 sentence assessment of social media presence signals from the website",
      "friendlyTranslation": "1-2 sentence plain English explanation",
      "cliffhanger": "1 provocative sentence"
    },
    "aiVisibility": {
      "summary": "2-3 sentence assessment of how well this business would appear in AI search results",
      "friendlyTranslation": "1-2 sentence plain English explanation",
      "cliffhanger": "1 provocative sentence",
      "aiQuote": "A realistic example of what an AI assistant might say if asked about this type of business in ${city} — make it slightly vague/generic to show the problem"
    }
  }
}

Scoring guidance:
- UX: evaluate page load signals, mobile-friendliness clues in HTML, navigation structure, CTA presence, readability
- SEO: evaluate meta tags, title, headings, structured data, keyword usage, local SEO signals for ${city}
- Social: evaluate social links in HTML, Open Graph tags, social proof signals
- AI Visibility: evaluate structured data, business NAP (name/address/phone), FAQ content, clear business description, schema markup
- Be honest and realistic. Most small business websites score 40-70. Only score 80+ if there is strong evidence.
- For social, if no HTML was fetched, default to 35-55 range`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { maxOutputTokens: 2048 },
  });

  const raw = response.text ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini returned no valid JSON");

  const parsed = JSON.parse(jsonMatch[0]) as {
    businessType: string;
    scores: AuditScores;
    observations: AuditObservations;
  };

  return {
    scores: parsed.scores,
    observations: parsed.observations,
    businessType: parsed.businessType,
    rawData: { observations: parsed.observations, html: html.slice(0, 500) },
  };
}
