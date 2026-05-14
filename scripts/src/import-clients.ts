import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomUUID } from "node:crypto";
// SheetJS's `xlsx` is a CJS package — in Node ESM (`tsx`), a namespace import
// nests its real exports under `.default` and `XLSX.readFile` ends up undefined
// at runtime. Default import gives us the module.exports object directly.
import XLSX from "xlsx";
import { eq } from "drizzle-orm";
import { db, clientsTable } from "@workspace/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, "../../Master Client List as of 2026-3.xlsx");
const APPLY = process.argv.includes("--apply");

// Active Clients sheet column indexes (0-based, after sheet_to_json({header:1})):
// A=0 blank, B=1 Client, C=2 Strategist, D-N=3..13 service flags, O=14 Tier
const SERVICE_FLAG_COLS = [
  { idx: 3, name: "website" },
  { idx: 4, name: "hosting" },
  { idx: 5, name: "seo" },
  { idx: 6, name: "google_ads" },
  { idx: 7, name: "meta_ads" },
  { idx: 8, name: "lsa" },
  { idx: 9, name: "email" },
  { idx: 10, name: "social_media" },
  { idx: 11, name: "blog" },
  // M (Mailbox) intentionally omitted
  { idx: 13, name: "photo_video" },
] as const;

const AMOUNT_SHEETS = [
  { sheet: "SEO",          amountCol: 3, dbCol: "seoAmount" as const },
  { sheet: "Google Ads",   amountCol: 3, dbCol: "googleAdsAmount" as const },
  { sheet: "Social Ads",   amountCol: 2, dbCol: "metaAdsAmount" as const },
  { sheet: "LSA",          amountCol: 2, dbCol: "lsaAmount" as const },
  { sheet: "Social Media", amountCol: 2, dbCol: "socialMediaAmount" as const },
  { sheet: "Email",        amountCol: 1, dbCol: "emailAmount" as const },
  { sheet: "BlogContent",  amountCol: 1, dbCol: "blogAmount" as const },
  { sheet: "Hosting",      amountCol: 2, dbCol: "hostingAmount" as const },
];

const TIER_MAP: Record<string, string> = {
  "Tier 1": "ala_carte",
  "Tier 2": "pro",
  "Tier 3": "plus",
};

const BUSINESS_SUFFIXES = new Set([
  "llc", "inc", "incorporated", "pllc", "corp", "corporation",
  "co", "company", "ltd", "limited", "dds", "law", "pc", "pa",
]);

// Known multi-location franchises whose service-sheet entries use a different
// location suffix than the Active Clients sheet — flag these for manual review.
const FRANCHISE_PREFIXES = [
  { prefix: "kwik dry", label: "Kwik Dry location" },
  { prefix: "buccal up", label: "Buccal Up location" },
  { prefix: "pain management of oklahoma", label: "PMO location" },
];

function normalize(name: unknown): string {
  if (typeof name !== "string") return "";
  return name.trim().toLowerCase().replace(/[*\s]+$/g, "").replace(/\s+/g, " ");
}

function stripPunctuation(s: string): string {
  return s.replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function stripSuffixes(s: string): string {
  let result = s;
  for (let i = 0; i < 4; i++) {
    const words = result.split(" ").filter(Boolean);
    if (words.length <= 1) break;
    if (!BUSINESS_SUFFIXES.has(words[words.length - 1])) break;
    result = words.slice(0, -1).join(" ");
  }
  return result;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

type ResolveResult =
  | { kind: "exact"; key: string }
  | { kind: "fuzzy"; key: string; matchedOriginal: string; method: string }
  | { kind: "ambiguous"; candidates: string[] }
  | { kind: "franchise"; franchiseLabel: string }
  | { kind: "unmatched" };

function resolveName(
  needleNorm: string,
  activeNorms: Map<string, string>,
): ResolveResult {
  // 1. Exact
  if (activeNorms.has(needleNorm)) return { kind: "exact", key: needleNorm };

  // 2. Punctuation-strip on both sides
  const np = stripPunctuation(needleNorm);
  for (const [norm, original] of activeNorms) {
    if (stripPunctuation(norm) === np) {
      return { kind: "fuzzy", key: norm, matchedOriginal: original, method: "punctuation-strip" };
    }
  }

  // 3. Suffix-strip on both sides (after punctuation removal)
  const ns = stripSuffixes(np);
  if (ns && ns !== np) {
    for (const [norm, original] of activeNorms) {
      const ss = stripSuffixes(stripPunctuation(norm));
      if (ss && ss === ns) {
        return { kind: "fuzzy", key: norm, matchedOriginal: original, method: "suffix-strip" };
      }
    }
  }

  // 4. Prefix match on multi-location qualifiers (`:`, ` - `, ` – `, `,`)
  const prefix = needleNorm.split(/[:,\-–]+/)[0].trim();
  if (prefix && prefix !== needleNorm && prefix.length >= 4) {
    const candidates: Array<[string, string]> = [];
    for (const [norm, original] of activeNorms) {
      if (norm === prefix || norm.startsWith(prefix + " ")) {
        candidates.push([norm, original]);
      }
    }
    if (candidates.length === 1) {
      const [norm, original] = candidates[0];
      return { kind: "fuzzy", key: norm, matchedOriginal: original, method: "prefix-match" };
    }
    if (candidates.length > 1) {
      return { kind: "ambiguous", candidates: candidates.map(([, o]) => o) };
    }
  }

  // 5. Levenshtein ≤ 2 on the post-punctuation-strip form
  let best: { norm: string; original: string; dist: number } | null = null;
  for (const [norm, original] of activeNorms) {
    const d = levenshtein(np, stripPunctuation(norm));
    if (d <= 2 && (best === null || d < best.dist)) {
      best = { norm, original, dist: d };
    }
  }
  if (best) {
    return { kind: "fuzzy", key: best.norm, matchedOriginal: best.original, method: `levenshtein-${best.dist}` };
  }

  // Post-failure classification: known franchise prefix?
  for (const { prefix, label } of FRANCHISE_PREFIXES) {
    if (needleNorm === prefix || needleNorm.startsWith(prefix + " ")) {
      return { kind: "franchise", franchiseLabel: label };
    }
  }

  return { kind: "unmatched" };
}

interface ClientRecord {
  uuid: string;
  businessName: string;
  planTier: string;
  status: "active";
  services: string;
  monthlyValue: string | null;
  seoAmount: string | null;
  googleAdsAmount: string | null;
  metaAdsAmount: string | null;
  socialMediaAmount: string | null;
  emailAmount: string | null;
  blogAmount: string | null;
  hostingAmount: string | null;
  lsaAmount: string | null;
  hostingPackage: string | null;
  clientStrategist: string | null;
}

interface SumEntry {
  sheet: string;
  targetOriginal: string;
  contributors: Array<{ from: string; amount: number }>;
}

async function main() {
  console.log(`→ Reading ${XLSX_PATH}`);
  const wb = XLSX.readFile(XLSX_PATH);

  // ── STEP 1: Index Active Clients first ─────────────────────────────────
  const acWs = wb.Sheets["Active Clients"];
  if (!acWs) throw new Error("Active Clients sheet not found");
  const acRows = XLSX.utils.sheet_to_json<unknown[]>(acWs, { header: 1, defval: null });

  // normalized → original — canonical client name index
  const activeClientNames = new Map<string, string>();
  for (const row of acRows.slice(1)) {
    const businessName = row[1];
    if (typeof businessName !== "string" || !businessName.trim()) continue;
    activeClientNames.set(normalize(businessName), businessName.trim());
  }
  console.log(`→ Indexed ${activeClientNames.size} canonical client names from "Active Clients"`);

  // ── STEP 2: Platinum set from Tiers sheet ──────────────────────────────
  const platinumNames = new Set<string>();
  const tiersWs = wb.Sheets["Tiers"];
  if (tiersWs) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(tiersWs, { header: 1, defval: null });
    for (const r of rows) {
      const name = r[0];
      if (typeof name === "string" && name.trim()) platinumNames.add(normalize(name));
    }
  }
  console.log(`→ Platinum (from Tiers sheet): ${platinumNames.size} clients`);

  // ── STEP 3: Resolve per-service sheet names against Active Clients ────
  const fuzzyLog: Array<{ sheet: string; from: string; to: string; method: string }> = [];
  const ambiguousLog: Array<{ sheet: string; from: string; candidates: string[] }> = [];
  const franchiseLog: Array<{ sheet: string; from: string; label: string; amount: number }> = [];
  const unmatchedLog: Array<{ sheet: string; from: string; amount: number }> = [];
  // Track which source rows fed each (sheet, target-client) cell so we can
  // emit a [sum] warning when two or more rows merge onto the same client.
  const sumTracker = new Map<string, SumEntry>();

  const amountMaps: Record<string, Map<string, number>> = {};
  for (const { sheet, amountCol, dbCol } of AMOUNT_SHEETS) {
    const ws = wb.Sheets[sheet];
    const map = new Map<string, number>();
    if (ws) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
      for (const r of rows.slice(1)) {
        const rawName = r[0];
        const amount = numOrNull(r[amountCol]);
        if (typeof rawName !== "string" || !rawName.trim() || amount === null) continue;

        const norm = normalize(rawName);
        const result = resolveName(norm, activeClientNames);

        switch (result.kind) {
          case "exact":
          case "fuzzy": {
            const existing = map.get(result.key) ?? 0;
            map.set(result.key, existing + amount);

            // Track contributors for the sum-warning log
            const trackerKey = `${sheet}::${result.key}`;
            const targetOriginal =
              result.kind === "fuzzy"
                ? result.matchedOriginal
                : activeClientNames.get(result.key) ?? result.key;
            const entry =
              sumTracker.get(trackerKey) ??
              ({ sheet, targetOriginal, contributors: [] } as SumEntry);
            entry.contributors.push({ from: norm, amount });
            sumTracker.set(trackerKey, entry);

            if (result.kind === "fuzzy") {
              fuzzyLog.push({ sheet, from: norm, to: result.matchedOriginal, method: result.method });
            }
            break;
          }
          case "ambiguous":
            ambiguousLog.push({ sheet, from: norm, candidates: result.candidates });
            break;
          case "franchise":
            franchiseLog.push({ sheet, from: norm, label: result.franchiseLabel, amount });
            break;
          case "unmatched":
            unmatchedLog.push({ sheet, from: norm, amount });
            break;
        }
      }
    }
    amountMaps[dbCol] = map;
  }

  // Sum-warning log: any (sheet, client) cell with >1 contributors
  const sumLog: SumEntry[] = [];
  for (const entry of sumTracker.values()) {
    if (entry.contributors.length > 1) sumLog.push(entry);
  }

  // Hosting package map — same resolution pipeline, no separate logging
  const hostingPackageMap = new Map<string, string>();
  const hostingWs = wb.Sheets["Hosting"];
  if (hostingWs) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(hostingWs, { header: 1, defval: null });
    for (const r of rows.slice(1)) {
      const rawName = r[0];
      const pkg = r[1];
      if (typeof rawName !== "string" || !rawName.trim() || typeof pkg !== "string" || !pkg.trim()) continue;
      const norm = normalize(rawName);
      const result = resolveName(norm, activeClientNames);
      if (result.kind === "exact" || result.kind === "fuzzy") {
        hostingPackageMap.set(result.key, pkg.trim());
      }
    }
  }

  // ── STEP 4: Build ClientRecord[] from Active Clients ──────────────────
  const records: ClientRecord[] = [];
  let totalMrr = 0;

  for (const row of acRows.slice(1)) {
    const businessName = row[1];
    if (typeof businessName !== "string" || !businessName.trim()) continue;

    const trimmedName = businessName.trim();
    const norm = normalize(trimmedName);
    const strategist = typeof row[2] === "string" ? row[2].trim() : null;
    const tierRaw = typeof row[14] === "string" ? row[14].trim() : null;

    let planTier: string;
    if (platinumNames.has(norm)) planTier = "platinum";
    else if (tierRaw && TIER_MAP[tierRaw]) planTier = TIER_MAP[tierRaw];
    else planTier = "custom";

    const services: string[] = [];
    for (const { idx, name } of SERVICE_FLAG_COLS) {
      if (row[idx] === true) services.push(name);
    }

    const amounts: Record<string, number | null> = {};
    let monthly = 0;
    for (const { dbCol } of AMOUNT_SHEETS) {
      const v = amountMaps[dbCol].get(norm) ?? null;
      amounts[dbCol] = v;
      if (v !== null) monthly += v;
    }

    records.push({
      uuid: randomUUID(),
      businessName: trimmedName,
      planTier,
      status: "active",
      services: JSON.stringify(services),
      monthlyValue: monthly > 0 ? monthly.toFixed(2) : null,
      seoAmount: amounts["seoAmount"] != null ? amounts["seoAmount"]!.toFixed(2) : null,
      googleAdsAmount: amounts["googleAdsAmount"] != null ? amounts["googleAdsAmount"]!.toFixed(2) : null,
      metaAdsAmount: amounts["metaAdsAmount"] != null ? amounts["metaAdsAmount"]!.toFixed(2) : null,
      socialMediaAmount: amounts["socialMediaAmount"] != null ? amounts["socialMediaAmount"]!.toFixed(2) : null,
      emailAmount: amounts["emailAmount"] != null ? amounts["emailAmount"]!.toFixed(2) : null,
      blogAmount: amounts["blogAmount"] != null ? amounts["blogAmount"]!.toFixed(2) : null,
      hostingAmount: amounts["hostingAmount"] != null ? amounts["hostingAmount"]!.toFixed(2) : null,
      lsaAmount: amounts["lsaAmount"] != null ? amounts["lsaAmount"]!.toFixed(2) : null,
      hostingPackage: hostingPackageMap.get(norm) ?? null,
      clientStrategist: strategist,
    });
    totalMrr += monthly;
  }

  // ── STEP 5: Report ────────────────────────────────────────────────────
  const byTier = records.reduce<Record<string, number>>((a, r) => ({ ...a, [r.planTier]: (a[r.planTier] ?? 0) + 1 }), {});
  const byStrat = records.reduce<Record<string, number>>((a, r) => {
    const key = r.clientStrategist ?? "(none)";
    return { ...a, [key]: (a[key] ?? 0) + 1 };
  }, {});

  console.log(`\n→ Parsed ${records.length} clients from "Active Clients"`);
  console.log(`→ Total computed MRR: $${totalMrr.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  console.log(`→ Tier distribution:`, byTier);
  console.log(`→ Strategist distribution:`, byStrat);

  if (fuzzyLog.length > 0) {
    console.log(`\n--- Fuzzy matches (${fuzzyLog.length}) ---`);
    for (const f of fuzzyLog) {
      console.log(`[fuzzy:${f.sheet}] "${f.from}" → "${f.to}" (method: ${f.method})`);
    }
  }

  if (sumLog.length > 0) {
    console.log(`\n--- Summed rows (${sumLog.length}) — multiple sheet entries combined onto the same client ---`);
    for (const s of sumLog) {
      const verb = s.contributors.length === 2 ? "both resolved to" : "all resolved to";
      const namesText = s.contributors.map((c) => `"${c.from}"`).join(" + ");
      const amountsText = s.contributors.map((c) => `$${c.amount.toFixed(2)}`).join(" + ");
      const total = s.contributors.reduce((sum, c) => sum + c.amount, 0);
      console.log(
        `[sum:${s.sheet}] ${namesText} ${verb} "${s.targetOriginal}" — amounts summed: ${amountsText} = $${total.toFixed(2)}/mo`,
      );
    }
  }

  if (ambiguousLog.length > 0) {
    console.log(`\n--- Ambiguous matches (${ambiguousLog.length}) — manual resolution required ---`);
    for (const a of ambiguousLog) {
      console.log(`[ambiguous:${a.sheet}] "${a.from}" matched multiple clients:`);
      for (const c of a.candidates) console.log(`  - "${c}"`);
      console.log(`  → skipped, manual resolution required`);
    }
  }

  if (franchiseLog.length > 0) {
    const totalFranchise = franchiseLog.reduce((s, f) => s + f.amount, 0);
    console.log(`\n--- Franchise-prefix unmatched (${franchiseLog.length}) — $${totalFranchise.toFixed(2)}/mo unattributed, manual review ---`);
    for (const f of franchiseLog) {
      console.log(`[franchise:${f.sheet}] "${f.from}" — ${f.label}, $${f.amount.toFixed(2)}/mo`);
    }
  }

  if (unmatchedLog.length > 0) {
    const totalLost = unmatchedLog.reduce((s, u) => s + u.amount, 0);
    console.log(`\n--- Still-unmatched names (${unmatchedLog.length}) — $${totalLost.toFixed(2)}/mo unattributed ---`);
    for (const u of unmatchedLog) {
      console.log(`[unmatched:${u.sheet}] "${u.from}" — $${u.amount.toFixed(2)}/mo`);
    }
  }

  console.log(`\n--- First 5 mapped records ---`);
  for (const r of records.slice(0, 5)) console.log(JSON.stringify(r, null, 2));

  if (!APPLY) {
    console.log(`\n[dry-run] Nothing written. Re-run with --apply to UPSERT ${records.length} clients keyed on business_name.`);
    return;
  }

  // ── STEP 6: Apply — UPSERT keyed on business_name ─────────────────────
  console.log(`\n→ Applying ${records.length} UPSERTs to clients table...`);
  let inserted = 0;
  let updated = 0;
  for (const r of records) {
    const existing = await db
      .select({ id: clientsTable.id })
      .from(clientsTable)
      .where(eq(clientsTable.businessName, r.businessName))
      .limit(1);

    if (existing[0]) {
      await db
        .update(clientsTable)
        .set({
          planTier: r.planTier,
          status: r.status,
          services: r.services,
          monthlyValue: r.monthlyValue,
          seoAmount: r.seoAmount,
          googleAdsAmount: r.googleAdsAmount,
          metaAdsAmount: r.metaAdsAmount,
          socialMediaAmount: r.socialMediaAmount,
          emailAmount: r.emailAmount,
          blogAmount: r.blogAmount,
          hostingAmount: r.hostingAmount,
          lsaAmount: r.lsaAmount,
          hostingPackage: r.hostingPackage,
          clientStrategist: r.clientStrategist,
          updatedAt: new Date(),
        })
        .where(eq(clientsTable.businessName, r.businessName));
      console.log(`  ↻ updated  ${r.businessName} ($${r.monthlyValue ?? 0}/mo, ${r.planTier})`);
      updated++;
    } else {
      await db.insert(clientsTable).values({
        uuid: r.uuid,
        businessName: r.businessName,
        planTier: r.planTier,
        status: r.status,
        services: r.services,
        monthlyValue: r.monthlyValue,
        seoAmount: r.seoAmount,
        googleAdsAmount: r.googleAdsAmount,
        metaAdsAmount: r.metaAdsAmount,
        socialMediaAmount: r.socialMediaAmount,
        emailAmount: r.emailAmount,
        blogAmount: r.blogAmount,
        hostingAmount: r.hostingAmount,
        lsaAmount: r.lsaAmount,
        hostingPackage: r.hostingPackage,
        clientStrategist: r.clientStrategist,
      });
      console.log(`  + inserted ${r.businessName} ($${r.monthlyValue ?? 0}/mo, ${r.planTier})`);
      inserted++;
    }
  }

  console.log(`\n✓ Done. Inserted ${inserted}, updated ${updated}. Total MRR imported: $${totalMrr.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
