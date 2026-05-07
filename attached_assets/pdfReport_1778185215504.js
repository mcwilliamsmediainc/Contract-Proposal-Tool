// =============================================================
// McWilliams Media Audit Tool — PDF Report Generator
//
// Uses pdfkit (pure Node.js, no Python needed)
// Install: npm install pdfkit
//
// Generates a branded, on-spec audit report as a Buffer that
// can be attached to any email or saved to disk/DB.
// =============================================================

const PDFDocument = require('pdfkit');

// Brand colors
const NAVY       = '#061E57';
const GOLD       = '#C9A959';
const SLATE      = '#3a4856';
const LIGHT_GRAY = '#f5f0e8';
const MID_GRAY   = '#d0cfc8';
const WHITE      = '#ffffff';
const RUST       = '#7c370c';
const RED_SCORE  = '#c0392b';
const GREEN_SCORE= '#2d7a4f';

// Score color helper
function scoreColor(s) {
  if (s >= 70) return GREEN_SCORE;
  if (s >= 50) return RUST;
  return RED_SCORE;
}

function scoreLabel(s) {
  if (s >= 70) return 'Good';
  if (s >= 50) return 'Needs Work';
  return 'Critical';
}

// Draw a filled rounded rectangle
function roundedRect(doc, x, y, w, h, r, fill, stroke) {
  doc.roundedRect(x, y, w, h, r);
  if (fill && stroke) doc.fillAndStroke(fill, stroke);
  else if (fill) doc.fill(fill);
  else if (stroke) doc.stroke(stroke);
}

// Draw a score gauge bar
function scoreBar(doc, x, y, width, score, color) {
  const h = 6;
  const r = 3;
  // Background track
  roundedRect(doc, x, y, width, h, r, MID_GRAY);
  // Fill
  const fillWidth = Math.max((score / 100) * width, r * 2);
  roundedRect(doc, x, y, fillWidth, h, r, color);
}

// ─── MAIN EXPORT ─────────────────────────────────────────────

/**
 * Generate a branded PDF audit report.
 * Returns a Promise<Buffer> — attach directly to email.
 *
 * @param {Object} lead - Full lead object from Replit DB
 * @returns {Promise<Buffer>}
 */
function generateAuditPDF(lead) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: 'McWilliams Media — Digital Health Check',
        Author: 'McWilliams Media',
        Subject: `Audit Report for ${lead.url}`,
      },
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PW = 612; // letter width in points
    const PH = 792; // letter height in points
    const MARGIN = 48;
    const CONTENT_W = PW - MARGIN * 2;

    const scores = lead.scores || {};
    const obs    = lead.scanData?.observations || {};
    const date   = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    // ── PAGE 1 ──────────────────────────────────────────────

    // Navy header band
    doc.rect(0, 0, PW, 140).fill(NAVY);

    // Gold accent bar
    doc.rect(0, 140, PW, 4).fill(GOLD);

    // Logo area — "McWilliams Media" wordmark
    doc.font('Helvetica-Bold')
       .fontSize(28)
       .fillColor(WHITE)
       .text('McWilliams', MARGIN, 36, { continued: true })
       .fillColor(GOLD)
       .text(' Media');

    doc.font('Helvetica')
       .fontSize(11)
       .fillColor('#b3cee1')
       .text('DIGITAL HEALTH CHECK REPORT', MARGIN, 72, { characterSpacing: 2 });

    doc.fontSize(10)
       .fillColor(GOLD)
       .text(date, MARGIN, 92);

    // Website and city on right side of header
    const urlDisplay = (lead.url || '').replace(/^https?:\/\//, '');
    doc.font('Helvetica-Bold')
       .fontSize(11)
       .fillColor(WHITE)
       .text(urlDisplay, 0, 56, { align: 'right', width: PW - MARGIN });
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#b3cee1')
       .text(lead.city || '', 0, 74, { align: 'right', width: PW - MARGIN });

    // ── OVERALL SUMMARY ─────────────────────────────────────

    let y = 168;

    // Section label
    doc.font('Helvetica-Bold')
       .fontSize(9)
       .fillColor(GOLD)
       .text('YOUR SCORECARD', MARGIN, y, { characterSpacing: 1.5 });

    y += 20;

    // 4-column score cards
    const cardW = (CONTENT_W - 18) / 4;
    const pillars = [
      { key: 'ux',           label: 'Website UX' },
      { key: 'seo',          label: 'SEO Presence' },
      { key: 'social',       label: 'Social Media' },
      { key: 'aiVisibility', label: 'AI Visibility' },
    ];

    pillars.forEach((p, i) => {
      const cx = MARGIN + i * (cardW + 6);
      const score = scores[p.key] || 0;
      const color = scoreColor(score);

      // Card background
      roundedRect(doc, cx, y, cardW, 90, 6, LIGHT_GRAY);

      // Score number
      doc.font('Helvetica-Bold')
         .fontSize(36)
         .fillColor(color)
         .text(score.toString(), cx, y + 12, { width: cardW, align: 'center' });

      // /100
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(SLATE)
         .text('/100', cx, y + 50, { width: cardW, align: 'center' });

      // Score bar
      scoreBar(doc, cx + 12, y + 66, cardW - 24, score, color);

      // Label
      doc.font('Helvetica-Bold')
         .fontSize(8)
         .fillColor(NAVY)
         .text(p.label.toUpperCase(), cx, y + 76, {
           width: cardW, align: 'center', characterSpacing: 0.5,
         });
    });

    y += 108;

    // Industry average note
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor(SLATE)
       .text(
         'Industry average across small business websites: UX 61  ·  SEO 48  ·  Social 55  ·  AI Visibility 38',
         MARGIN, y, { width: CONTENT_W, align: 'center' }
       );

    y += 24;

    // Divider
    doc.moveTo(MARGIN, y).lineTo(PW - MARGIN, y).strokeColor(MID_GRAY).lineWidth(0.5).stroke();
    y += 20;

    // ── PILLAR OBSERVATIONS ──────────────────────────────────

    doc.font('Helvetica-Bold')
       .fontSize(9)
       .fillColor(GOLD)
       .text('DETAILED FINDINGS', MARGIN, y, { characterSpacing: 1.5 });

    y += 18;

    const pillarMeta = [
      { key: 'ux',           label: 'Website UX',    icon: '◈' },
      { key: 'seo',          label: 'SEO Presence',  icon: '◎' },
      { key: 'social',       label: 'Social Media',  icon: '◉' },
      { key: 'aiVisibility', label: 'AI Visibility', icon: '◆' },
    ];

    pillarMeta.forEach(p => {
      const score = scores[p.key] || 0;
      const color = scoreColor(score);
      const o = obs[p.key] || {};

      // Check if we need a new page
      if (y > PH - 160) {
        doc.addPage();
        // Minimal header on continuation pages
        doc.rect(0, 0, PW, 40).fill(NAVY);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE)
           .text('McWilliams Media  ·  Digital Health Check', MARGIN, 14);
        doc.rect(0, 40, PW, 2).fill(GOLD);
        y = 60;
      }

      // Pillar header row
      roundedRect(doc, MARGIN, y, CONTENT_W, 28, 4, NAVY);

      // Icon + label
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(WHITE)
         .text(`${p.icon}  ${p.label}`, MARGIN + 12, y + 9);

      // Score badge on right
      const badgeX = PW - MARGIN - 72;
      roundedRect(doc, badgeX, y + 5, 66, 18, 4, color);
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(WHITE)
         .text(`${score}/100  ${scoreLabel(score)}`, badgeX, y + 9, {
           width: 66, align: 'center',
         });

      y += 36;

      // Summary
      if (o.summary) {
        doc.font('Helvetica-Bold')
           .fontSize(9)
           .fillColor(NAVY)
           .text('What this means:', MARGIN, y);
        y += 14;
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(SLATE)
           .text(o.summary, MARGIN, y, { width: CONTENT_W, lineGap: 2 });
        y += doc.heightOfString(o.summary, { width: CONTENT_W }) + 10;
      }

      // Friendly Translation
      if (o.friendlyTranslation) {
        // Indented quote box
        roundedRect(doc, MARGIN, y, CONTENT_W, 
          doc.heightOfString(o.friendlyTranslation, { width: CONTENT_W - 32 }) + 18,
          4, LIGHT_GRAY);
        doc.font('Helvetica-Oblique')
           .fontSize(9.5)
           .fillColor(SLATE)
           .text(o.friendlyTranslation, MARGIN + 16, y + 9, {
             width: CONTENT_W - 32, lineGap: 3,
           });
        y += doc.heightOfString(o.friendlyTranslation, { width: CONTENT_W - 32 }) + 26;
      }

      // AI Quote (for AI Visibility pillar only)
      if (p.key === 'aiVisibility' && o.aiQuote) {
        doc.font('Helvetica-Bold')
           .fontSize(9)
           .fillColor(NAVY)
           .text('When someone asks AI about your business:', MARGIN, y);
        y += 14;

        const quoteH = doc.heightOfString(`"${o.aiQuote}"`, { width: CONTENT_W - 32 }) + 18;
        roundedRect(doc, MARGIN, y, CONTENT_W, quoteH, 4, NAVY);
        doc.font('Helvetica-Oblique')
           .fontSize(10)
           .fillColor('#b3cee1')
           .text(`"${o.aiQuote}"`, MARGIN + 16, y + 9, {
             width: CONTENT_W - 32, lineGap: 3,
           });
        y += quoteH + 10;
      }

      // Cliffhanger teaser
      if (o.cliffhanger) {
        doc.font('Helvetica-Bold')
           .fontSize(9.5)
           .fillColor(color)
           .text(`→  ${o.cliffhanger}`, MARGIN, y, { width: CONTENT_W });
        y += doc.heightOfString(o.cliffhanger, { width: CONTENT_W }) + 18;
      }

      // Section divider
      doc.moveTo(MARGIN, y - 8).lineTo(PW - MARGIN, y - 8)
         .strokeColor(MID_GRAY).lineWidth(0.5).stroke();
    });

    // ── RECOMMENDED SERVICES ─────────────────────────────────

    if (y > PH - 220) {
      doc.addPage();
      doc.rect(0, 0, PW, 40).fill(NAVY);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE)
         .text('McWilliams Media  ·  Digital Health Check', MARGIN, 14);
      doc.rect(0, 40, PW, 2).fill(GOLD);
      y = 60;
    } else {
      y += 8;
    }

    doc.font('Helvetica-Bold')
       .fontSize(9)
       .fillColor(GOLD)
       .text('RECOMMENDED NEXT STEPS', MARGIN, y, { characterSpacing: 1.5 });

    y += 18;

    const services = [
      scores.ux < 60    && { name: 'Website Design',       reason: 'Your site needs structural improvements to convert more visitors into leads.' },
      scores.seo < 60   && { name: 'SEO',                  reason: `People searching for your service in ${lead.city} are having difficulty finding you.` },
      scores.social < 60 && { name: 'Social Media Management', reason: 'Inconsistent social presence is costing you brand credibility.' },
      scores.aiVisibility < 50 && { name: 'AI Search Optimization', reason: 'You\'re not showing up when customers use AI to find local businesses.' },
    ].filter(Boolean);

    if (services.length === 0) {
      services.push({ name: 'Marketing Consulting', reason: 'Let\'s build on your solid foundation with a strategy for the next level.' });
    }

    services.forEach((s, i) => {
      const sx = MARGIN;
      const sw = CONTENT_W;
      const textH = doc.heightOfString(s.reason, { width: sw - 100 });
      const rowH = Math.max(textH + 24, 44);

      roundedRect(doc, sx, y, sw, rowH, 4, i % 2 === 0 ? LIGHT_GRAY : WHITE);

      // Priority badge
      roundedRect(doc, sx + 8, y + (rowH - 20) / 2, 16, 20, 3, GOLD);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
         .text((i + 1).toString(), sx + 8, y + (rowH - 14) / 2, { width: 16, align: 'center' });

      // Service name
      doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY)
         .text(s.name, sx + 32, y + 10);

      // Reason
      doc.font('Helvetica').fontSize(9.5).fillColor(SLATE)
         .text(s.reason, sx + 32, y + 24, { width: sw - 100, lineGap: 2 });

      y += rowH + 6;
    });

    // ── CTA PAGE ─────────────────────────────────────────────

    y += 16;

    if (y > PH - 180) {
      doc.addPage();
      doc.rect(0, 0, PW, 40).fill(NAVY);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE)
         .text('McWilliams Media  ·  Digital Health Check', MARGIN, 14);
      doc.rect(0, 40, PW, 2).fill(GOLD);
      y = 60;
    }

    // CTA box
    const ctaH = 160;
    roundedRect(doc, MARGIN, y, CONTENT_W, ctaH, 8, NAVY);

    doc.font('Helvetica-Bold')
       .fontSize(9)
       .fillColor(GOLD)
       .text('READY TO TAKE THE NEXT STEP?', MARGIN, y + 20, {
         width: CONTENT_W, align: 'center', characterSpacing: 1.5,
       });

    doc.font('Helvetica-Bold')
       .fontSize(18)
       .fillColor(WHITE)
       .text("Let's Talk Through This Together", MARGIN, y + 38, {
         width: CONTENT_W, align: 'center',
       });

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#b3cee1')
       .text(
         "Request a free proposal and we'll build a custom plan around your goals and budget.",
         MARGIN, y + 68, { width: CONTENT_W, align: 'center', lineGap: 2 }
       );

    // Request Proposal button (visual only in PDF — URL in email)
    const btnW = 220;
    const btnX = (PW - btnW) / 2;
    roundedRect(doc, btnX, y + 100, btnW, 36, 6, GOLD);
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(NAVY)
       .text('REQUEST A FREE PROPOSAL', btnX, y + 113, {
         width: btnW, align: 'center', characterSpacing: 0.5,
       });

    y += ctaH + 20;

    // Contact info
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor(SLATE)
       .text('info@mcwilliamsmedia.com  ·  (918) 286-4995  ·  2430 W. New Orleans St., Broken Arrow, OK 74011',
         MARGIN, y, { width: CONTENT_W, align: 'center' });

    // ── FOOTER ON LAST PAGE ───────────────────────────────────

    doc.rect(0, PH - 32, PW, 32).fill(NAVY);
    doc.font('Helvetica')
       .fontSize(8)
       .fillColor('#b3cee1')
       .text(
         `McWilliams Media  ·  Digital Health Check  ·  Generated ${date}  ·  mcwilliamsmedia.com`,
         MARGIN, PH - 20, { width: CONTENT_W, align: 'center' }
       );

    doc.end();
  });
}

module.exports = { generateAuditPDF };
