import { anthropic } from "@workspace/integrations-anthropic-ai";
import { lookup } from "node:dns/promises";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AuditScores {
  ux: number;
  seo: number;
  gbp: number;
  reviews: number;
  trust: number;
  content: number;
  leadCapture: number;
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
  gbp: PillarObservation;
  reviews: PillarObservation;
  trust: PillarObservation;
  content: PillarObservation;
  leadCapture: PillarObservation;
  social: PillarObservation;
  aiVisibility: PillarObservation & { aiQuote: string };
}

export interface ScanResult {
  scores: AuditScores;
  observations: AuditObservations;
  businessType: string;
  rawData: Record<string, unknown>;
}

// ── SSRF protection ────────────────────────────────────────────────────────

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
]);

async function validateUrl(raw: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL format.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) throw new Error("URL hostname is not allowed.");

  try {
    const result = await lookup(hostname, { all: true });
    const addrs = Array.isArray(result) ? result : [result];
    for (const addr of addrs) {
      if (PRIVATE_IP_RANGES.some((re) => re.test(addr.address))) {
        throw new Error("URL resolves to a private or internal address.");
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("private or internal")) throw err;
  }

  return parsed;
}

async function fetchWithSafeRedirects(initialUrl: string, maxHops = 5): Promise<string> {
  let currentUrl = initialUrl;
  for (let hop = 0; hop < maxHops; hop++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let res: Response;
    try {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; McWilliamsMediaAudit/1.0)" },
        redirect: "manual",
      });
    } catch {
      return "";
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return "";
      const nextUrl = new URL(location, currentUrl).toString();
      await validateUrl(nextUrl);
      currentUrl = nextUrl;
      continue;
    }
    if (!res.ok) return "";
    const text = await res.text();
    return text.slice(0, 20000);
  }
  return "";
}

// ── Optional: Google PageSpeed ─────────────────────────────────────────────

async function fetchPageSpeed(url: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env["PAGESPEED_API_KEY"];
  if (!apiKey) return null;
  try {
    const base = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
    const res = await fetch(`${base}?url=${encodeURIComponent(url)}&strategy=mobile&key=${apiKey}`);
    const data = await res.json() as Record<string, unknown>;
    return (data["lighthouseResult"] as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}

// ── Optional: Google Places ────────────────────────────────────────────────

interface PlacesData {
  rating: number;
  reviewCount: number;
  hasPhotos: boolean;
  hasHours: boolean;
  hasRecentReview: boolean;
}

async function fetchPlaces(url: string, city: string): Promise<PlacesData | null> {
  const apiKey = process.env["PAGESPEED_API_KEY"];
  if (!apiKey) return null;
  try {
    const domain = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(`${domain} ${city}`)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    const searchRes  = await fetch(searchUrl);
    const searchData = await searchRes.json() as { candidates?: Array<{ place_id: string }> };
    if (!searchData.candidates?.length) return null;

    const placeId = searchData.candidates[0].place_id;
    const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,photos,opening_hours,reviews&key=${apiKey}`;
    const detailRes  = await fetch(detailUrl);
    const detailData = await detailRes.json() as {
      result?: {
        rating?: number;
        user_ratings_total?: number;
        photos?: unknown[];
        opening_hours?: unknown;
        reviews?: Array<{ time?: number }>;
      }
    };
    const p = detailData.result;
    if (!p) return null;

    const mostRecent = p.reviews?.[0]?.time ? new Date((p.reviews[0].time) * 1000) : null;
    const daysSince  = mostRecent ? (Date.now() - mostRecent.getTime()) / 86400000 : 999;

    return {
      rating:          p.rating ?? 0,
      reviewCount:     p.user_ratings_total ?? 0,
      hasPhotos:       (p.photos?.length ?? 0) > 0,
      hasHours:        !!p.opening_hours,
      hasRecentReview: daysSince < 30,
    };
  } catch {
    return null;
  }
}

// ── Parse HTML signals ─────────────────────────────────────────────────────

function parseHtmlSignals(html: string, url: string): Record<string, unknown> {
  const lower = html.toLowerCase();
  const has = (s: string) => lower.includes(s);

  const images        = [...html.matchAll(/<img[^>]+>/gi)];
  const imagesWithAlt = images.filter(m => /alt=["'][^"']+["']/i.test(m[0]));
  const h1s           = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)].map(m => m[1]?.trim());
  const socialLinks   = [
    has("facebook.com") && "Facebook",
    has("instagram.com") && "Instagram",
    has("linkedin.com") && "LinkedIn",
    (has("twitter.com") || has("x.com")) && "Twitter/X",
    has("youtube.com") && "YouTube",
    has("tiktok.com") && "TikTok",
    has("yelp.com") && "Yelp",
  ].filter(Boolean);

  const titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const metaM  = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)
              ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);

  return {
    hasSSL:            url.startsWith("https"),
    title:             titleM?.[1]?.trim() ?? null,
    metaDescription:   metaM?.[1]?.trim() ?? null,
    h1Count:           h1s.length,
    h1Text:            h1s[0] ?? null,
    hasSchema:         /<script[^>]+type=["']application\/ld\+json/i.test(html),
    hasReviewSchema:   html.includes('"Review"'),
    hasSitemap:        /sitemap\.xml/i.test(html),
    hasOpenGraph:      /<meta[^>]+property=["']og:/i.test(html),
    hasTwitterCard:    /<meta[^>]+name=["']twitter:/i.test(html),
    hasMobileViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    imageCount:        images.length,
    imagesWithAlt:     imagesWithAlt.length,
    hasPhone:          /\(?\d{3}\)?[\s\-]\d{3}[\s\-]\d{4}/.test(html),
    hasPhoneInHeader:  /<header[^>]*>[\s\S]{0,2000}\(?\d{3}\)?[\s\-]\d{3}[\s\-]\d{4}/i.test(html),
    hasAddress:        /\d{3,5}\s+\w+.*(?:st|ave|blvd|rd|dr|ln|way|ct)/i.test(html),
    hasPrivacyPolicy:  has("privacy-policy") || has("privacy policy"),
    hasTerms:          has("terms") || has("terms-of-service"),
    hasContactPage:    has("/contact"),
    hasLiveChat:       has("livechat") || has("intercom") || has("drift") || has("tawk") || has("crisp"),
    hasBlog:           has("/blog") || has("/news") || has("/articles"),
    blogPostCount:     (html.match(/<article/gi) ?? []).length,
    hasServicePages:   has("/service") || has("/services"),
    hasFAQ:            has("frequently asked") || has("faq"),
    hasVideoContent:   has("youtube.com/embed") || has("vimeo") || has("<video"),
    hasAboveFoldCTA:   /<(button|a)[^>]*>(get started|contact us|free|schedule|book|call now)/i.test(html),
    hasContactForm:    /<form/i.test(html),
    hasLeadMagnet:     has("free guide") || has("free download") || has("free report"),
    hasNewsletterForm: has("newsletter") || has("subscribe"),
    socialPlatforms:   socialLinks,
    socialCount:       socialLinks.length,
    wordCount:         Math.round(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").length / 10),
  };
}

// ── Main scanner entry ─────────────────────────────────────────────────────

export async function scanWebsite(url: string, city: string): Promise<ScanResult> {
  await validateUrl(url);

  const [htmlContent, pageSpeed, places] = await Promise.allSettled([
    fetchWithSafeRedirects(url),
    fetchPageSpeed(url),
    fetchPlaces(url, city),
  ]);

  const html      = htmlContent.status  === "fulfilled" ? htmlContent.value  : "";
  const speedData = pageSpeed.status    === "fulfilled" ? pageSpeed.value    : null;
  const placesData = places.status      === "fulfilled" ? places.value       : null;

  const signals = html ? parseHtmlSignals(html, url) : {};

  const mobilePerf = speedData
    ? Math.round(((speedData["categories"] as Record<string, { score?: number }>)?.["performance"]?.score ?? 0) * 100)
    : null;

  const contextData: Record<string, unknown> = {
    url,
    city,
    hasSSL: url.startsWith("https"),
    pagespeed: mobilePerf !== null ? { mobileScore: mobilePerf } : null,
    gbp: placesData ?? null,
    ...signals,
  };

  const prompt = `You are a friendly, honest digital marketing analyst at McWilliams Media. Analyze this business website for a client in ${city}.

Website: ${url}
Raw signals collected:
${JSON.stringify(contextData, null, 2)}

HTML snippet (first 3000 chars):
${html ? html.slice(0, 3000) : "(Could not fetch — use domain signals only)"}

Return ONLY valid JSON with this exact structure. Score 0-100 for all 9 pillars. Most small businesses score 35-70. Only score 80+ with strong evidence:

{
  "businessType": "short plain-English description of what this business does",
  "scores": {
    "ux": <0-100>,
    "seo": <0-100>,
    "gbp": <0-100, default 45 if gbp data is null>,
    "reviews": <0-100, default 40 if no review data>,
    "trust": <0-100>,
    "content": <0-100>,
    "leadCapture": <0-100>,
    "social": <0-100>,
    "aiVisibility": <0-100>
  },
  "observations": {
    "ux": {
      "summary": "2 sentences about page experience, speed, mobile.",
      "friendlyTranslation": "1 sentence — plain English what this means for customers.",
      "cliffhanger": "1 sentence creating curiosity about the full report."
    },
    "seo": {
      "summary": "2 sentences about local SEO in ${city}, meta tags, structure.",
      "friendlyTranslation": "1 sentence plain English.",
      "cliffhanger": "1 sentence about what they're missing."
    },
    "gbp": {
      "summary": "2 sentences about Google Business Profile health.",
      "friendlyTranslation": "1 sentence plain English.",
      "cliffhanger": "1 sentence."
    },
    "reviews": {
      "summary": "2 sentences about review signals and reputation.",
      "friendlyTranslation": "1 sentence plain English.",
      "cliffhanger": "1 sentence."
    },
    "trust": {
      "summary": "2 sentences about trust signals — SSL, privacy, contact info.",
      "friendlyTranslation": "1 sentence plain English.",
      "cliffhanger": "1 sentence."
    },
    "content": {
      "summary": "2 sentences about content strategy, blog, service pages.",
      "friendlyTranslation": "1 sentence plain English.",
      "cliffhanger": "1 sentence."
    },
    "leadCapture": {
      "summary": "2 sentences about CTAs, forms, phone in header.",
      "friendlyTranslation": "1 sentence plain English.",
      "cliffhanger": "1 sentence."
    },
    "social": {
      "summary": "2 sentences about social presence and sharing signals.",
      "friendlyTranslation": "1 sentence plain English.",
      "cliffhanger": "1 sentence."
    },
    "aiVisibility": {
      "summary": "2 sentences about how AI tools would recommend this business in ${city}.",
      "friendlyTranslation": "1 sentence plain English.",
      "cliffhanger": "1 sentence.",
      "aiQuote": "A realistic (slightly vague/generic) example of what ChatGPT or Google AI would say if asked for the best [businessType] in ${city}."
    }
  }
}`;

  const message = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 3000,
    messages:   [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  const raw   = block.type === "text" ? block.text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude returned no valid JSON");

  const parsed = JSON.parse(match[0]) as {
    businessType: string;
    scores: AuditScores;
    observations: AuditObservations;
  };

  const rawData: Record<string, unknown> = {
    observations: parsed.observations,
    context: contextData,
  };

  return {
    scores:       parsed.scores,
    observations: parsed.observations,
    businessType: parsed.businessType,
    rawData,
  };
}
