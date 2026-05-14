const API_KEY = process.env.MAXWELL_API_KEY;
const APP_URL = process.env.REPLIT_APP_URL;

if (!API_KEY) {
  console.error("✗ MAXWELL_API_KEY is not set. Add it to Replit Secrets first.");
  process.exit(1);
}
if (!APP_URL) {
  console.error(
    "✗ REPLIT_APP_URL is not set. Set it to your live Replit URL (e.g. https://your-app.replit.app).",
  );
  process.exit(1);
}

const url = `${APP_URL.replace(/\/$/, "")}/api/agents/maxwell/briefing`;
console.log(`→ POST ${url}`);

async function main() {
  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-api-key": API_KEY!, "content-type": "application/json" },
  });
  const ms = Date.now() - start;
  const text = await res.text();

  console.log(`\n← HTTP ${res.status} (${ms}ms)`);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  console.log("Response body:");
  console.log(typeof body === "string" ? body : JSON.stringify(body, null, 2));

  if (res.status !== 200) {
    console.error(`\n✗ Expected 200 OK, got ${res.status}.`);
    process.exit(1);
  }

  if (typeof body !== "object" || body === null) {
    console.error("\n✗ Response body is not a JSON object.");
    process.exit(1);
  }

  const obj = body as Record<string, unknown>;
  const success = obj["success"];
  const briefing = obj["briefing"];
  const postedAt = obj["postedAt"];

  if (success !== true) {
    console.error(`\n✗ Expected success: true, got: ${JSON.stringify(success)}`);
    process.exit(1);
  }
  if (typeof briefing !== "string" || briefing.length === 0) {
    console.error("\n✗ Briefing string is missing or empty.");
    process.exit(1);
  }

  console.log(`\n✓ Endpoint live, returned success: true with a ${briefing.length}-char briefing.`);
  if (typeof postedAt === "string") console.log(`  postedAt: ${postedAt}`);
}

main().catch((err) => {
  console.error("Request failed:", err);
  process.exit(1);
});
