// =============================================================
// McWilliams Media Audit Tool — PDF Report Generator
// Uses pdfkit (pure Node.js — install: npm install pdfkit)
// Returns a Buffer — attach directly to email
// =============================================================

const PDFDocument = require('pdfkit');

// Brand colors
const NAVY        = '#061E57';
const SKY         = '#b3cee1';
const SKYLIGHT    = '#ddeef6';
const SLATE       = '#3a4856';
const WHITE       = '#ffffff';
const MID         = '#ccd8e0';
const GREEN       = '#2d7a4f';
const AMBER       = '#854F0B';
const RED         = '#A32D2D';
const GOLD        = '#C9A959';

function scoreColor(s) {
  if (s >= 70) return GREEN;
  if (s >= 50) return AMBER;
  return RED;
}

function scoreLabel(s) {
  if (s >= 70) return 'Good';
  if (s >= 50) return 'Needs Work';
  return 'Critical';
}

function roundedRect(doc, x, y, w, h, r, fill, stroke) {
  doc.roundedRect(x, y, w, h, r);
  if (fill && stroke) doc.fillAndStroke(fill, stroke);
  else if (fill)   doc.fill(fill);
  else if (stroke) doc.stroke(stroke);
}

function scoreBar(doc, x, y, width, score, color) {
  roundedRect(doc, x, y, width, 5, 2, MID);
  const fillW = Math.max((score / 100) * width, 6);
  roundedRect(doc, x, y, fillW, 5, 2, color);
}

// ─── MAIN EXPORT ─────────────────────────────────────────────

function generateAuditPDF(lead) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size:    'LETTER',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title:   'McWilliams Media — Digital Health Check',
        Author:  'McWilliams Media',
        Subject: `9-Pillar Audit for ${lead.url}`,
      },
    });

    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PW     = 612;
    const PH     = 792;
    const MARGIN = 44;
    const CW     = PW - MARGIN * 2;

    const scores = lead.scores || {};
    const obs    = lead.scanData?.observations || {};
    const date   = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const pillars = [
      { key: 'ux',          label: 'Website UX',              icon: '■' },
      { key: 'seo',         label: 'SEO Presence',            icon: '■' },
      { key: 'gbp',         label: 'Google Business Profile', icon: '■' },
      { key: 'reviews',     label: 'Review Signals',          icon: '■' },
      { key: 'trust',       label: 'Trust Signals',           icon: '■' },
      { key: 'content',     label: 'Content Health',          icon: '■' },
      { key: 'leadCapture', label: 'Lead Capture',            icon: '■' },
      { key: 'social',      label: 'Social Media',            icon: '■' },
      { key: 'aiVisibility',label: 'AI Visibility',           icon: '■' },
    ];

    // ── PAGE 1: HEADER ───────────────────────────────────────

    doc.rect(0, 0, PW, 130).fill(NAVY);
    doc.rect(0, 130, PW, 3).fill(SKY);

    doc.font('Helvetica-Bold').fontSize(26).fillColor(WHITE)
       .text('McWilliams', MARGIN, 32, { continued: true })
       .fillColor(SKY).text(' Media');

    doc.font('Helvetica').fontSize(10).fillColor(SKY)
       .text('DIGITAL HEALTH CHECK — 9 PILLAR AUDIT', MARGIN, 66, { characterSpacing: 1.5 });

    doc.fontSize(9).fillColor(GOLD).text(date, MARGIN, 84);

    const urlDisplay = (lead.url || '').replace(/^https?:\/\//, '');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE)
       .text(urlDisplay, 0, 52, { align: 'right', width: PW - MARGIN });
    doc.font('Helvetica').fontSize(9).fillColor(SKY)
       .text(lead.city || '', 0, 68, { align: 'right', width: PW - MARGIN });

    // ── SCORECARD ────────────────────────────────────────────

    let y = 155;

    doc.font('Helvetica-Bold').fontSize(8).fillColor(SKY)
       .text('YOUR SCORECARD', MARGIN, y, { characterSpacing: 1.5 });
    y += 16;

    const cardW  = (CW - 24) / 9;
    pillars.forEach((p, i) => {
      const cx    = MARGIN + i * (cardW + 3);
      const score = scores[p.key] || 0;
      const color = scoreColor(score);

      roundedRect(doc, cx, y, cardW, 76, 5, SKYLIGHT);

      doc.font('Helvetica-Bold').fontSize(28).fillColor(color)
         .text(score.toString(), cx, y + 8, { width: cardW, align: 'center' });

      scoreBar(doc, cx + 6, y + 44, cardW - 12, score, color);

      doc.font('Helvetica-Bold').fontSize(6.5).fillColor(SLATE)
         .text(p.label.toUpperCase(), cx, y + 54, { width: cardW, align: 'center', characterSpacing: 0.3 });

      doc.font('Helvetica').fontSize(7).fillColor(color)
         .text(scoreLabel(score), cx, y + 64, { width: cardW, align: 'center' });
    });

    y += 92;

    doc.moveTo(MARGIN, y).lineTo(PW - MARGIN, y).strokeColor(MID).lineWidth(0.5).stroke();
    y += 14;

    // ── PILLAR FINDINGS ──────────────────────────────────────

    doc.font('Helvetica-Bold').fontSize(8).fillColor(SKY)
       .text('DETAILED FINDINGS', MARGIN, y, { characterSpacing: 1.5 });
    y += 16;

    pillars.forEach(p => {
      const score = scores[p.key] || 0;
      const color = scoreColor(score);
      const o     = obs[p.key] || {};

      // New page check
      if (y > PH - 140) {
        doc.addPage();
        doc.rect(0, 0, PW, 36).fill(NAVY);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE)
           .text('McWilliams Media  ·  Digital Health Check', MARGIN, 13);
        doc.rect(0, 36, PW, 2).fill(SKY);
        y = 52;
      }

      // Pillar header
      roundedRect(doc, MARGIN, y, CW, 24, 4, NAVY);

      doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE)
         .text(p.label, MARGIN + 10, y + 8);

      const badgeX = PW - MARGIN - 80;
      roundedRect(doc, badgeX, y + 4, 74, 16, 3, color);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE)
         .text(`${score}/100  ${scoreLabel(score)}`, badgeX, y + 8, { width: 74, align: 'center' });

      y += 30;

      if (o.summary) {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(SLATE).text('What this means:', MARGIN, y);
        y += 11;
        doc.font('Helvetica').fontSize(9).fillColor(SLATE)
           .text(o.summary, MARGIN, y, { width: CW, lineGap: 2 });
        y += doc.heightOfString(o.summary, { width: CW }) + 8;
      }

      if (o.friendlyTranslation) {
        const boxH = doc.heightOfString(o.friendlyTranslation, { width: CW - 28 }) + 16;
        roundedRect(doc, MARGIN, y, CW, boxH, 4, SKYLIGHT);
        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(SLATE)
           .text(o.friendlyTranslation, MARGIN + 14, y + 8, { width: CW - 28, lineGap: 2 });
        y += boxH + 8;
      }

      if (p.key === 'aiVisibility' && o.aiQuote) {
        const qH = doc.heightOfString(`"${o.aiQuote}"`, { width: CW - 28 }) + 16;
        roundedRect(doc, MARGIN, y, CW, qH, 4, NAVY);
        doc.font('Helvetica-Oblique').fontSize(9).fillColor(SKY)
           .text(`"${o.aiQuote}"`, MARGIN + 14, y + 8, { width: CW - 28, lineGap: 2 });
        y += qH + 8;
      }

      if (o.cliffhanger) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(color)
           .text(`→  ${o.cliffhanger}`, MARGIN, y, { width: CW });
        y += doc.heightOfString(o.cliffhanger, { width: CW }) + 14;
      }

      doc.moveTo(MARGIN, y - 6).lineTo(PW - MARGIN, y - 6).strokeColor(MID).lineWidth(0.5).stroke();
    });

    // ── CTA PAGE ─────────────────────────────────────────────

    if (y > PH - 180) {
      doc.addPage();
      doc.rect(0, 0, PW, 36).fill(NAVY);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE)
         .text('McWilliams Media  ·  Digital Health Check', MARGIN, 13);
      doc.rect(0, 36, PW, 2).fill(SKY);
      y = 52;
    } else {
      y += 8;
    }

    roundedRect(doc, MARGIN, y, CW, 148, 8, NAVY);

    doc.font('Helvetica-Bold').fontSize(8).fillColor(SKY)
       .text('READY TO TAKE THE NEXT STEP?', MARGIN, y + 18, { width: CW, align: 'center', characterSpacing: 1.5 });

    doc.font('Helvetica-Bold').fontSize(17).fillColor(WHITE)
       .text("Let's Talk Through This Together", MARGIN, y + 34, { width: CW, align: 'center' });

    doc.font('Helvetica').fontSize(10).fillColor(rgba(255,255,255,0.6))
       .text("Request a free proposal and we'll build a custom plan for your goals and budget.", MARGIN, y + 62, { width: CW, align: 'center', lineGap: 2 });

    const btnX = (PW - 200) / 2;
    roundedRect(doc, btnX, y + 96, 200, 30, 5, SKY);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY)
       .text('REQUEST A FREE PROPOSAL', btnX, y + 106, { width: 200, align: 'center', characterSpacing: 0.5 });

    y += 160;

    doc.font('Helvetica').fontSize(9).fillColor(SLATE)
       .text(`info@mcwilliamsmedia.com  ·  (918) 286-4995  ·  2430 W. New Orleans St., Broken Arrow, OK 74011`,
         MARGIN, y, { width: CW, align: 'center' });

    // Footer
    doc.rect(0, PH - 28, PW, 28).fill(NAVY);
    doc.font('Helvetica').fontSize(7.5).fillColor(SKY)
       .text(`McWilliams Media  ·  Digital Health Check  ·  ${date}  ·  mcwilliamsmedia.com`,
         MARGIN, PH - 18, { width: CW, align: 'center' });

    doc.end();
  });
}

// Helper for rgba-style transparency (pdfkit uses hex only, so we approximate)
function rgba(r, g, b, a) {
  const hex = (v) => Math.round(v).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

module.exports = { generateAuditPDF };
