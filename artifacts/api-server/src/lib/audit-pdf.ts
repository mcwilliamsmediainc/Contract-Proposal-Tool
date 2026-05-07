import PDFDocument from "pdfkit";
import type { AuditLead } from "@workspace/db";

const NAVY = "#061E57";
const GOLD = "#C9A959";
const SLATE = "#3a4856";
const LIGHT_GRAY = "#f5f0e8";
const MID_GRAY = "#d0cfc8";
const WHITE = "#ffffff";
const RUST = "#7c370c";
const RED_SCORE = "#c0392b";
const GREEN_SCORE = "#2d7a4f";

function scoreColor(s: number): string {
  if (s >= 70) return GREEN_SCORE;
  if (s >= 50) return RUST;
  return RED_SCORE;
}

function scoreLabel(s: number): string {
  if (s >= 70) return "Good";
  if (s >= 50) return "Needs Work";
  return "Critical";
}

type Doc = InstanceType<typeof PDFDocument>;

function rRect(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string,
  stroke?: string
) {
  doc.roundedRect(x, y, w, h, r);
  if (fill && stroke) doc.fillAndStroke(fill, stroke);
  else if (fill) doc.fill(fill);
  else if (stroke) doc.stroke(stroke);
}

function scoreBar(doc: Doc, x: number, y: number, width: number, score: number, color: string) {
  const h = 6;
  const r = 3;
  rRect(doc, x, y, width, h, r, MID_GRAY);
  const fillWidth = Math.max((score / 100) * width, r * 2);
  rRect(doc, x, y, fillWidth, h, r, color);
}

export function generateAuditPDF(lead: AuditLead): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: "McWilliams Media — Digital Health Check",
        Author: "McWilliams Media",
        Subject: `Audit Report for ${lead.url}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PW = 612;
    const PH = 792;
    const MARGIN = 48;
    const CONTENT_W = PW - MARGIN * 2;

    const scores: Record<string, number> = lead.scores
      ? (typeof lead.scores === "object" ? (lead.scores as Record<string, number>) : JSON.parse(lead.scores as string))
      : {};
    const scanDataRaw = lead.scanData
      ? (typeof lead.scanData === "object" ? (lead.scanData as { observations?: Record<string, Record<string, string>> }) : JSON.parse(lead.scanData as string) as { observations?: Record<string, Record<string, string>> })
      : {};
    const obs = scanDataRaw.observations ?? {};
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.rect(0, 0, PW, 140).fill(NAVY);
    doc.rect(0, 140, PW, 4).fill(GOLD);

    doc.font("Helvetica-Bold").fontSize(28).fillColor(WHITE).text("McWilliams", MARGIN, 36, {
      continued: true,
    });
    doc.fillColor(GOLD).text(" Media");

    doc.font("Helvetica")
      .fontSize(11)
      .fillColor("#b3cee1")
      .text("DIGITAL HEALTH CHECK REPORT", MARGIN, 72, { characterSpacing: 2 });

    doc.fontSize(10).fillColor(GOLD).text(date, MARGIN, 92);

    const urlDisplay = (lead.url ?? "").replace(/^https?:\/\//, "");
    doc.font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(WHITE)
      .text(urlDisplay, 0, 56, { align: "right", width: PW - MARGIN });
    doc.font("Helvetica")
      .fontSize(10)
      .fillColor("#b3cee1")
      .text(lead.city ?? "", 0, 74, { align: "right", width: PW - MARGIN });

    let y = 168;

    doc.font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(GOLD)
      .text("YOUR SCORECARD", MARGIN, y, { characterSpacing: 1.5 });

    y += 20;

    const pillars = [
      { key: "ux", label: "Website UX" },
      { key: "seo", label: "SEO Presence" },
      { key: "social", label: "Social Media" },
      { key: "aiVisibility", label: "AI Visibility" },
    ];

    const cardW = (CONTENT_W - 18) / 4;

    pillars.forEach((p, i) => {
      const cx = MARGIN + i * (cardW + 6);
      const score = scores[p.key] ?? 0;
      const color = scoreColor(score);

      rRect(doc, cx, y, cardW, 90, 6, LIGHT_GRAY);

      doc.font("Helvetica-Bold")
        .fontSize(36)
        .fillColor(color)
        .text(score.toString(), cx, y + 12, { width: cardW, align: "center" });

      doc.font("Helvetica")
        .fontSize(10)
        .fillColor(SLATE)
        .text("/100", cx, y + 50, { width: cardW, align: "center" });

      scoreBar(doc, cx + 12, y + 66, cardW - 24, score, color);

      doc.font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(NAVY)
        .text(p.label.toUpperCase(), cx, y + 76, {
          width: cardW,
          align: "center",
          characterSpacing: 0.5,
        });
    });

    y += 108;

    doc.font("Helvetica")
      .fontSize(9)
      .fillColor(SLATE)
      .text(
        "Industry average across small business websites: UX 61  ·  SEO 48  ·  Social 55  ·  AI Visibility 38",
        MARGIN,
        y,
        { width: CONTENT_W, align: "center" }
      );

    y += 24;
    doc.moveTo(MARGIN, y).lineTo(PW - MARGIN, y).strokeColor(MID_GRAY).lineWidth(0.5).stroke();
    y += 20;

    doc.font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(GOLD)
      .text("DETAILED FINDINGS", MARGIN, y, { characterSpacing: 1.5 });

    y += 18;

    const pillarMeta = [
      { key: "ux", label: "Website UX", icon: "◈" },
      { key: "seo", label: "SEO Presence", icon: "◎" },
      { key: "social", label: "Social Media", icon: "◉" },
      { key: "aiVisibility", label: "AI Visibility", icon: "◆" },
    ];

    pillarMeta.forEach((p) => {
      const score = scores[p.key] ?? 0;
      const color = scoreColor(score);
      const o = (obs[p.key] ?? {}) as Record<string, string>;

      if (y > PH - 160) {
        doc.addPage();
        doc.rect(0, 0, PW, 40).fill(NAVY);
        doc.font("Helvetica-Bold")
          .fontSize(10)
          .fillColor(WHITE)
          .text("McWilliams Media  ·  Digital Health Check", MARGIN, 14);
        doc.rect(0, 40, PW, 2).fill(GOLD);
        y = 60;
      }

      rRect(doc, MARGIN, y, CONTENT_W, 28, 4, NAVY);

      doc.font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(WHITE)
        .text(`${p.icon}  ${p.label}`, MARGIN + 12, y + 9);

      const badgeX = PW - MARGIN - 72;
      rRect(doc, badgeX, y + 5, 66, 18, 4, color);
      doc.font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(WHITE)
        .text(`${score}/100  ${scoreLabel(score)}`, badgeX, y + 9, {
          width: 66,
          align: "center",
        });

      y += 36;

      if (o["summary"]) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(NAVY).text("What this means:", MARGIN, y);
        y += 14;
        const summaryText = o["summary"];
        doc.font("Helvetica")
          .fontSize(10)
          .fillColor(SLATE)
          .text(summaryText, MARGIN, y, { width: CONTENT_W, lineGap: 2 });
        y += doc.heightOfString(summaryText, { width: CONTENT_W }) + 10;
      }

      if (o["friendlyTranslation"]) {
        const ft = o["friendlyTranslation"];
        const ftH = doc.heightOfString(ft, { width: CONTENT_W - 32 }) + 18;
        rRect(doc, MARGIN, y, CONTENT_W, ftH, 4, LIGHT_GRAY);
        doc.font("Helvetica-Oblique")
          .fontSize(9.5)
          .fillColor(SLATE)
          .text(ft, MARGIN + 16, y + 9, { width: CONTENT_W - 32, lineGap: 3 });
        y += ftH + 8;
      }

      if (p.key === "aiVisibility" && o["aiQuote"]) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(NAVY).text("When someone asks AI about your business:", MARGIN, y);
        y += 14;
        const quote = `"${o["aiQuote"]}"`;
        const quoteH = doc.heightOfString(quote, { width: CONTENT_W - 32 }) + 18;
        rRect(doc, MARGIN, y, CONTENT_W, quoteH, 4, NAVY);
        doc.font("Helvetica-Oblique")
          .fontSize(10)
          .fillColor("#b3cee1")
          .text(quote, MARGIN + 16, y + 9, { width: CONTENT_W - 32, lineGap: 3 });
        y += quoteH + 10;
      }

      if (o["cliffhanger"]) {
        doc.font("Helvetica-Bold")
          .fontSize(9.5)
          .fillColor(color)
          .text(`→  ${o["cliffhanger"]}`, MARGIN, y, { width: CONTENT_W });
        y += doc.heightOfString(o["cliffhanger"], { width: CONTENT_W }) + 18;
      }

      doc.moveTo(MARGIN, y - 8).lineTo(PW - MARGIN, y - 8).strokeColor(MID_GRAY).lineWidth(0.5).stroke();
    });

    if (y > PH - 220) {
      doc.addPage();
      doc.rect(0, 0, PW, 40).fill(NAVY);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE).text("McWilliams Media  ·  Digital Health Check", MARGIN, 14);
      doc.rect(0, 40, PW, 2).fill(GOLD);
      y = 60;
    } else {
      y += 8;
    }

    doc.font("Helvetica-Bold").fontSize(9).fillColor(GOLD).text("RECOMMENDED NEXT STEPS", MARGIN, y, { characterSpacing: 1.5 });
    y += 18;

    const services: { name: string; reason: string }[] = [
      (scores["ux"] ?? 100) < 60 && { name: "Website Design", reason: "Your site needs structural improvements to convert more visitors into leads." },
      (scores["seo"] ?? 100) < 60 && { name: "SEO", reason: `People searching for your service in ${lead.city} are having difficulty finding you.` },
      (scores["social"] ?? 100) < 60 && { name: "Social Media Management", reason: "Inconsistent social presence is costing you brand credibility." },
      (scores["aiVisibility"] ?? 100) < 50 && { name: "AI Search Optimization", reason: "You're not showing up when customers use AI to find local businesses." },
    ].filter(Boolean) as { name: string; reason: string }[];

    if (services.length === 0) {
      services.push({ name: "Marketing Consulting", reason: "Let's build on your solid foundation with a strategy for the next level." });
    }

    services.forEach((s, i) => {
      const sw = CONTENT_W;
      const textH = doc.heightOfString(s.reason, { width: sw - 100 });
      const rowH = Math.max(textH + 24, 44);

      rRect(doc, MARGIN, y, sw, rowH, 4, i % 2 === 0 ? LIGHT_GRAY : WHITE);

      rRect(doc, MARGIN + 8, y + (rowH - 20) / 2, 16, 20, 3, GOLD);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY).text((i + 1).toString(), MARGIN + 8, y + (rowH - 14) / 2, { width: 16, align: "center" });

      doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY).text(s.name, MARGIN + 32, y + 10);
      doc.font("Helvetica").fontSize(9.5).fillColor(SLATE).text(s.reason, MARGIN + 32, y + 24, { width: sw - 100, lineGap: 2 });

      y += rowH + 6;
    });

    y += 16;

    if (y > PH - 180) {
      doc.addPage();
      doc.rect(0, 0, PW, 40).fill(NAVY);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE).text("McWilliams Media  ·  Digital Health Check", MARGIN, 14);
      doc.rect(0, 40, PW, 2).fill(GOLD);
      y = 60;
    }

    const ctaH = 160;
    rRect(doc, MARGIN, y, CONTENT_W, ctaH, 8, NAVY);

    doc.font("Helvetica-Bold").fontSize(9).fillColor(GOLD).text("READY TO TAKE THE NEXT STEP?", MARGIN, y + 20, { width: CONTENT_W, align: "center", characterSpacing: 1.5 });
    doc.font("Helvetica-Bold").fontSize(18).fillColor(WHITE).text("Let's Talk Through This Together", MARGIN, y + 38, { width: CONTENT_W, align: "center" });
    doc.font("Helvetica").fontSize(10).fillColor("#b3cee1").text("Request a free proposal and we'll build a custom plan around your goals and budget.", MARGIN, y + 68, { width: CONTENT_W, align: "center", lineGap: 2 });

    const btnW = 220;
    const btnX = (PW - btnW) / 2;
    rRect(doc, btnX, y + 100, btnW, 36, 6, GOLD);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(NAVY).text("REQUEST A FREE PROPOSAL", btnX, y + 113, { width: btnW, align: "center", characterSpacing: 0.5 });

    y += ctaH + 20;

    doc.font("Helvetica").fontSize(10).fillColor(SLATE).text("info@mcwilliamsmedia.com  ·  (918) 286-4995  ·  2430 W. New Orleans St., Broken Arrow, OK 74011", MARGIN, y, { width: CONTENT_W, align: "center" });

    doc.rect(0, PH - 32, PW, 32).fill(NAVY);
    doc.font("Helvetica").fontSize(8).fillColor("#b3cee1").text(`McWilliams Media  ·  Digital Health Check  ·  Generated ${date}  ·  mcwilliamsmedia.com`, MARGIN, PH - 20, { width: CONTENT_W, align: "center" });

    doc.end();
  });
}
