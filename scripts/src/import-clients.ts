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
  { idx: 3, name: "website" },          // D — Website/1x project
  { idx: 4, name: "hosting" },          // E — Hosting
  { idx: 5, name: "seo" },              // F — SEO
  { idx: 6, name: "google_ads" },       // G — Google Adwords
  { idx: 7, name: "meta_ads" },         // H — Facebook Ads
  { idx: 8, name: "lsa" },              // I — LSA
  { idx: 9, name: "email" },            // J — Email/Newsletter
  { idx: 10, name: "social_media" },    // K — Social Media
  { idx: 11, name: "blog" },            // L — Blog
  // M (Mailbox) intentionally omitted per Sprint 4 brief
  { idx: 13, name: "photo_video" },     // N — Photo/Video
] as const;

// Per-service amount sheets — column where the dollar amount lives + the schema column it feeds.
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

function normalize(name: unknown): string {
  if (typeof name !== "string") return "";
  return name.trim().toLowerCase().replace(/[*\s]+$/g, "").replace(/\s+/g, " ");
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
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

async function main() {
  console.log(`→ Reading ${XLSX_PATH}`);
  const wb = XLSX.readFile(XLSX_PATH);

  // 1. Build platinum set from the Tiers sheet
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

  // 2. Build amount lookup maps per service
  const amountMaps: Record<string, Map<string, number>> = {};
  for (const { sheet, amountCol, dbCol } of AMOUNT_SHEETS) {
    const ws = wb.Sheets[sheet];
    const map = new Map<string, number>();
    if (ws) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
      for (const r of rows.slice(1)) {
        const name = r[0];
        const amount = numOrNull(r[amountCol]);
        if (typeof name === "string" && name.trim() && amount !== null) {
          map.set(normalize(name), amount);
        }
      }
    }
    amountMaps[dbCol] = map;
  }

  // 3. Hosting package map (col B of Hosting sheet)
  const hostingPackageMap = new Map<string, string>();
  const hostingWs = wb.Sheets["Hosting"];
  if (hostingWs) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(hostingWs, { header: 1, defval: null });
    for (const r of rows.slice(1)) {
      const name = r[0];
      const pkg = r[1];
      if (typeof name === "string" && name.trim() && typeof pkg === "string" && pkg.trim()) {
        hostingPackageMap.set(normalize(name), pkg.trim());
      }
    }
  }

  // 4. Walk Active Clients sheet
  const acWs = wb.Sheets["Active Clients"];
  if (!acWs) throw new Error("Active Clients sheet not found");
  const acRows = XLSX.utils.sheet_to_json<unknown[]>(acWs, { header: 1, defval: null });

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

  // 5. Report
  const byTier = records.reduce<Record<string, number>>((a, r) => ({ ...a, [r.planTier]: (a[r.planTier] ?? 0) + 1 }), {});
  const byStrat = records.reduce<Record<string, number>>((a, r) => {
    const key = r.clientStrategist ?? "(none)";
    return { ...a, [key]: (a[key] ?? 0) + 1 };
  }, {});

  console.log(`\n→ Parsed ${records.length} clients from "Active Clients"`);
  console.log(`→ Total computed MRR: $${totalMrr.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
  console.log(`→ Tier distribution:`, byTier);
  console.log(`→ Strategist distribution:`, byStrat);

  const importedSet = new Set(records.map((r) => normalize(r.businessName)));
  console.log(`\n--- Unmatched per-service names (in service sheet but not in Active Clients) ---`);
  let anyUnmatched = false;
  for (const { dbCol } of AMOUNT_SHEETS) {
    const map = amountMaps[dbCol];
    const unmatched = Array.from(map.keys()).filter((n) => !importedSet.has(n));
    if (unmatched.length === 0) continue;
    anyUnmatched = true;
    console.log(`${dbCol}: ${unmatched.length} unmatched`);
    for (const n of unmatched.slice(0, 8)) console.log(`  - "${n}"`);
    if (unmatched.length > 8) console.log(`  ...and ${unmatched.length - 8} more`);
  }
  if (!anyUnmatched) console.log("  (none — every service-sheet name matched an Active Clients row)");

  console.log(`\n--- First 5 mapped records ---`);
  for (const r of records.slice(0, 5)) console.log(JSON.stringify(r, null, 2));

  if (!APPLY) {
    console.log(`\n[dry-run] Nothing written. Re-run with --apply to UPSERT ${records.length} clients keyed on business_name.`);
    return;
  }

  // 6. Apply — select-then-write (no unique constraint on business_name)
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
