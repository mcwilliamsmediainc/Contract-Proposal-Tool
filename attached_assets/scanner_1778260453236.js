// =============================================================
// McWilliams Media Audit Tool — Website Scanner
//
// Pipeline:
//   1. Fetch HTML from the target URL
//   2. Call Google PageSpeed Insights API (real speed data)
//   3. Call Google Places API (GBP health + review signals)
//   4. Parse HTML for SEO, trust, content, and lead capture signals
//   5. Pass ALL real data to Claude API for friendly interpretation
//   6. Return structured scores + observations for all 9 pillars
// =============================================================

const fetch    = require('node-fetch');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── MAIN ENTRY ──────────────────────────────────────────────

async function scanWebsite(url, city) {
  console.log(`[Scanner] Starting 9-pillar scan for: ${url}`);

  const [pageSpeedData, htmlData, placesData] = await Promise.allSettled([
    fetchPageSpeed(url),
    fetchHTML(url),
    fetchGooglePlaces(url, city),
  ]);

  const speed  = pageSpeedData.status === 'fulfilled' ? pageSpeedData.value : null;
  const html   = htmlData.status === 'fulfilled'      ? htmlData.value      : null;
  const places = placesData.status === 'fulfilled'    ? placesData.value    : null;

  const rawData = buildRawData(url, city, speed, html, places);
  const aiResult = await interpretWithClaude(rawData, city);

  return {
    scores:       aiResult.scores,
    observations: aiResult.observations,
    businessType: aiResult.businessType,
    rawData,
  };
}

// ─── RAW DATA BUILDER ────────────────────────────────────────

function buildRawData(url, city, speed, html, places) {
  return {
    url,
    city,
    scannedAt: new Date().toISOString(),

    // Pillar 1: UX
    ux: speed ? {
      mobileScore:       Math.round((speed.mobile?.categories?.performance?.score || 0) * 100),
      desktopScore:      Math.round((speed.desktop?.categories?.performance?.score || 0) * 100),
      fcp:               speed.mobile?.audits?.['first-contentful-paint']?.displayValue,
      lcp:               speed.mobile?.audits?.['largest-contentful-paint']?.displayValue,
      cls:               speed.mobile?.audits?.['cumulative-layout-shift']?.displayValue,
      hasMobileViewport: speed.mobile?.audits?.viewport?.score === 1,
      hasSSL:            url.startsWith('https'),
    } : { hasSSL: url.startsWith('https'), hasMobileViewport: html?.hasMobileViewport || false },

    // Pillar 2: SEO
    seo: html ? {
      title:            html.title,
      metaDescription:  html.metaDescription,
      h1Count:          html.h1s.length,
      h1Text:           html.h1s[0] || null,
      hasSchema:        html.hasSchema,
      hasSitemap:       html.hasSitemap,
      imageCount:       html.imageCount,
      imagesWithAlt:    html.imagesWithAlt,
      internalLinks:    html.internalLinks,
      hasOpenGraph:     html.hasOpenGraph,
      hasTwitterCard:   html.hasTwitterCard,
    } : null,

    // Pillar 3: Google Business Profile
    gbp: places ? {
      isVerified:      places.isVerified,
      hasPhotos:       places.photoCount > 0,
      photoCount:      places.photoCount,
      hasRecentPosts:  places.hasRecentPosts,
      hasHours:        places.hasHours,
      hasAnsweredQA:   places.hasAnsweredQA,
      rating:          places.rating,
      reviewCount:     places.reviewCount,
    } : null,

    // Pillar 4: Review Signals
    reviews: places ? {
      rating:           places.rating,
      reviewCount:      places.reviewCount,
      hasRecentReview:  places.hasRecentReview,
      ownerResponds:    places.ownerResponds,
      hasReviewSchema:  html?.hasReviewSchema || false,
    } : null,

    // Pillar 5: Trust Signals
    trust: html ? {
      hasSSL:            url.startsWith('https'),
      hasPrivacyPolicy:  html.hasPrivacyPolicy,
      hasTerms:          html.hasTerms,
      hasAddress:        html.hasAddress,
      hasPhone:          html.hasPhone,
      hasPhoneInHeader:  html.hasPhoneInHeader,
      hasContactPage:    html.hasContactPage,
      hasLiveChat:       html.hasLiveChat,
    } : null,

    // Pillar 6: Content Health
    content: html ? {
      hasBlog:           html.hasBlog,
      blogPostCount:     html.blogPostCount,
      avgWordCount:      html.avgWordCount,
      hasServicePages:   html.hasServicePages,
      hasFAQ:            html.hasFAQ,
      hasVideoContent:   html.hasVideoContent,
      pageCount:         html.pageCount,
    } : null,

    // Pillar 7: Lead Capture
    leadCapture: html ? {
      hasAboveFoldCTA:   html.hasAboveFoldCTA,
      hasContactForm:    html.hasContactForm,
      hasPhoneInHeader:  html.hasPhoneInHeader,
      hasLeadMagnet:     html.hasLeadMagnet,
      hasExitIntent:     html.hasExitIntent,
      hasChatWidget:     html.hasLiveChat,
      hasNewsletterForm: html.hasNewsletterForm,
    } : null,

    // Social signals (estimated from meta)
    social: html ? {
      hasOpenGraph:     html.hasOpenGraph,
      hasTwitterCard:   html.hasTwitterCard,
      linkedSocials:    html.linkedSocials,
      socialCount:      html.linkedSocials?.length || 0,
    } : null,
  };
}

// ─── GOOGLE PAGESPEED ────────────────────────────────────────

async function fetchPageSpeed(url) {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;

  const base = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

  const [mobileRes, desktopRes] = await Promise.all([
    fetch(`${base}?url=${encodeURIComponent(url)}&strategy=mobile&key=${apiKey}`),
    fetch(`${base}?url=${encodeURIComponent(url)}&strategy=desktop&key=${apiKey}`),
  ]);

  const [mobile, desktop] = await Promise.all([
    mobileRes.json(),
    desktopRes.json(),
  ]);

  return {
    mobile:  mobile.lighthouseResult  || null,
    desktop: desktop.lighthouseResult || null,
  };
}

// ─── GOOGLE PLACES ───────────────────────────────────────────

async function fetchGooglePlaces(url, city) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;

  try {
    const domain      = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const searchQuery = `${domain} ${city}`;
    const searchUrl   = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total,business_status&key=${apiKey}`;

    const searchRes  = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.candidates?.length) return null;

    const placeId      = searchData.candidates[0].place_id;
    const detailFields = 'place_id,name,rating,user_ratings_total,photos,opening_hours,reviews,editorial_summary';
    const detailUrl    = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${detailFields}&key=${apiKey}`;

    const detailRes  = await fetch(detailUrl);
    const detailData = await detailRes.json();
    const place      = detailData.result;

    if (!place) return null;

    const reviews       = place.reviews || [];
    const mostRecent    = reviews[0]?.time ? new Date(reviews[0].time * 1000) : null;
    const daysSince     = mostRecent ? (Date.now() - mostRecent) / (1000 * 60 * 60 * 24) : 999;
    const ownerResponds = reviews.some(r => r.author_url?.includes('google.com') === false);

    return {
      isVerified:     place.business_status === 'OPERATIONAL',
      photoCount:     place.photos?.length || 0,
      hasRecentPosts: false,
      hasHours:       !!place.opening_hours,
      hasAnsweredQA:  false,
      rating:         place.rating || 0,
      reviewCount:    place.user_ratings_total || 0,
      hasRecentReview: daysSince < 30,
      ownerResponds,
    };
  } catch (err) {
    console.warn('[Scanner] Places API failed:', err.message);
    return null;
  }
}

// ─── HTML FETCHER + PARSER ───────────────────────────────────

async function fetchHTML(url) {
  try {
    const res = await fetch(url, {
      timeout: 12000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; McWilliamsMediaAudit/1.0)' },
    });
    const html = await res.text();
    return parseHTML(html);
  } catch (err) {
    console.warn(`[Scanner] HTML fetch failed for ${url}:`, err.message);
    return null;
  }
}

function parseHTML(html) {
  const lower = html.toLowerCase();

  const extract = (regex, flags = 'i') => {
    const match = html.match(new RegExp(regex, flags));
    return match ? match[1]?.trim() : null;
  };

  const extractAll = (regex, flags = 'gi') =>
    [...html.matchAll(new RegExp(regex, flags))].map(m => m[1]?.trim()).filter(Boolean);

  const contains = (str) => lower.includes(str.toLowerCase());

  const images         = [...html.matchAll(/<img[^>]+>/gi)];
  const imagesWithAlt  = images.filter(m => /alt=["'][^"']+["']/i.test(m[0]));
  const internalLinks  = extractAll('<a[^>]+href=["\'](/[^"\']*)["\']');

  const linkedSocials = [
    contains('facebook.com')   && 'Facebook',
    contains('instagram.com')  && 'Instagram',
    contains('linkedin.com')   && 'LinkedIn',
    contains('twitter.com') || contains('x.com') ? 'Twitter/X' : false,
    contains('youtube.com')    && 'YouTube',
    contains('pinterest.com')  && 'Pinterest',
    contains('tiktok.com')     && 'TikTok',
    contains('yelp.com')       && 'Yelp',
  ].filter(Boolean);

  return {
    // SEO
    title:            extract('<title[^>]*>([^<]+)</title>'),
    metaDescription:  extract('<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)'),
    h1s:              extractAll('<h1[^>]*>([^<]+)</h1>'),
    hasSchema:        /<script[^>]+type=["']application\/ld\+json/i.test(html),
    hasReviewSchema:  html.includes('"Review"') || html.includes('@Review'),
    hasSitemap:       /sitemap\.xml/i.test(html),
    hasOpenGraph:     /<meta[^>]+property=["']og:/i.test(html),
    hasTwitterCard:   /<meta[^>]+name=["']twitter:/i.test(html),
    imageCount:       images.length,
    imagesWithAlt:    imagesWithAlt.length,
    internalLinks:    internalLinks.length,
    hasMobileViewport: /<meta[^>]+name=["']viewport["']/i.test(html),

    // Trust
    hasPrivacyPolicy:  contains('privacy-policy') || contains('privacy policy'),
    hasTerms:          contains('terms') || contains('terms-of-service'),
    hasAddress:        /\d{3,5}\s+\w+.*(?:st|ave|blvd|rd|dr|ln|way|ct)/i.test(html),
    hasPhone:          /\(?\d{3}\)?[\s\-]\d{3}[\s\-]\d{4}/.test(html),
    hasPhoneInHeader:  /<header[^>]*>[\s\S]{0,2000}\(?\d{3}\)?[\s\-]\d{3}[\s\-]\d{4}/i.test(html),
    hasContactPage:    contains('/contact'),
    hasLiveChat:       contains('livechat') || contains('intercom') || contains('drift') ||
                       contains('tawk') || contains('crisp') || contains('zendesk'),

    // Content
    hasBlog:           contains('/blog') || contains('/news') || contains('/articles'),
    blogPostCount:     (html.match(/<article/gi) || []).length,
    avgWordCount:      Math.round(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length / 10),
    hasServicePages:   contains('/service') || contains('/services'),
    hasFAQ:            contains('frequently asked') || contains('faq') || contains('question'),
    hasVideoContent:   contains('youtube.com/embed') || contains('vimeo') || contains('<video'),
    pageCount:         internalLinks.length,

    // Lead Capture
    hasAboveFoldCTA:   /<(button|a)[^>]*>(get started|contact us|free|schedule|book|call now|learn more)/i.test(html),
    hasContactForm:    /<form/i.test(html),
    hasLeadMagnet:     contains('free guide') || contains('free download') || contains('free report') || contains('checklist'),
    hasExitIntent:     contains('exit') || contains('optinmonster') || contains('sumo'),
    hasNewsletterForm: contains('newsletter') || contains('subscribe') || contains('mailchimp') || contains('klaviyo'),

    // Social
    linkedSocials,
  };
}

// ─── CLAUDE AI INTERPRETATION ────────────────────────────────

async function interpretWithClaude(rawData, city) {
  const systemPrompt = `You are a "Trusted Friend" who is a savvy digital marketing expert at McWilliams Media.
You give honest, warm, plain-English feedback about businesses' online presence — wherever they are in the US.
You NEVER use jargon without a friendly translation. You speak like a knowledgeable friend, not a salesperson.
You always find something genuinely positive AND something specific and actionable to improve.
You reference the business's actual city naturally — as if you know their community.
CRITICAL: Respond ONLY with valid JSON. No preamble, no markdown, no backticks.`;

  const userPrompt = `Analyze this 9-pillar website audit data and return scores + observations.
The business is located in: ${city}

Use ${city} naturally in your observations where it fits.

AUDIT DATA:
${JSON.stringify(rawData, null, 2)}

Return this EXACT JSON structure — all fields required:
{
  "businessType": "short description of what this business does",
  "scores": {
    "ux":          <0-100 based on mobile score, speed, structure>,
    "seo":         <0-100 based on title, meta, h1s, schema, alt text>,
    "gbp":         <0-100 based on GBP data — if null, estimate 50>,
    "reviews":     <0-100 based on rating, count, recency, responses>,
    "trust":       <0-100 based on SSL, privacy, address, phone, contact>,
    "content":     <0-100 based on blog, word count, FAQ, service pages>,
    "leadCapture": <0-100 based on CTA, form, phone header, lead magnet>,
    "social":      <0-100 based on platform count, OG tags, linked socials>,
    "aiVisibility": <0-100 based on schema, structured data, review signals, content depth — how likely an AI assistant would recommend this business in ${city}>
  },
  "observations": {
    "ux": {
      "summary": "<1 sentence plain English — what this means for their customers>",
      "cliffhanger": "<1 sentence creating curiosity — what the full report reveals>",
      "friendlyTranslation": "<translate any technical issue warmly>"
    },
    "seo": {
      "summary": "<reference ${city} naturally if it fits>",
      "cliffhanger": "<1 sentence creating curiosity>",
      "friendlyTranslation": "<warm plain-English translation>"
    },
    "gbp": {
      "summary": "<what their GBP health means for local visibility>",
      "cliffhanger": "<1 sentence creating curiosity>",
      "friendlyTranslation": "<warm plain-English translation>"
    },
    "reviews": {
      "summary": "<what their review profile means for AI recommendations>",
      "cliffhanger": "<1 sentence creating curiosity>",
      "friendlyTranslation": "<warm plain-English translation>"
    },
    "trust": {
      "summary": "<what trust signals mean for conversion>",
      "cliffhanger": "<1 sentence creating curiosity>",
      "friendlyTranslation": "<warm plain-English translation>"
    },
    "content": {
      "summary": "<what content health means for SEO and AI visibility>",
      "cliffhanger": "<1 sentence creating curiosity>",
      "friendlyTranslation": "<warm plain-English translation>"
    },
    "leadCapture": {
      "summary": "<what lead capture readiness means for conversions>",
      "cliffhanger": "<1 sentence creating curiosity>",
      "friendlyTranslation": "<warm plain-English translation>"
    },
    "social": {
      "summary": "<what social presence means for brand trust>",
      "cliffhanger": "<1 sentence creating curiosity>",
      "friendlyTranslation": "<warm plain-English translation>"
    },
    "aiVisibility": {
      "summary": "<what happens when someone in ${city} asks AI for this business type>",
      "cliffhanger": "<1 sentence creating curiosity>",
      "aiQuote": "<simulate what AI would say if asked for best [businessType] in ${city}>",
      "friendlyTranslation": "<warm plain-English explanation of AI visibility>"
    }
  }
}`;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].text.trim();

  try {
    return JSON.parse(text);
  } catch {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }
}

module.exports = { scanWebsite };
