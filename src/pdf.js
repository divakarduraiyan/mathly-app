/* ===============================================================
   Worksheet PDF export.

   Generates a real PDF client-side (text-based, not a screenshot),
   so it stays crisp and small. jsPDF is loaded lazily — most visits
   never click "Download PDF", so it shouldn't cost everyone else
   the extra bundle weight.
================================================================*/

import mathlyLogo from "./assets/mathly-logo.png";
import { CATEGORIES } from "./generators.js";

const MARGIN = 36; // 0.5in, matches the print @page rule
const PAGE_W = 612; // 8.5in
const PAGE_H = 792; // 11in
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = [22, 32, 43];
const INK_SOFT = [90, 107, 124];
const RULE = [211, 227, 242];
const HAIRLINE = [241, 245, 249];
const MINT = [16, 185, 129];

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/* jsPDF's standard fonts only support the WinAnsi (Windows-1252) charset.
   Most of the Unicode symbols generators.js uses (¢ ° ² ³ × ÷ —) are in
   that charset and render fine, but − (U+2212 minus sign), π, ≈ and √ are
   not — jsPDF silently falls back to a broken glyph for them. Swap in
   ASCII-safe equivalents for the PDF only; on-screen HTML keeps the real
   symbols. */
function sanitizeForPdf(str) {
  return String(str)
    .replace(/−/g, "-")
    .replace(/π/g, "pi")
    .replace(/≈/g, "~")
    .replace(/√(\d+)/g, "sqrt($1)");
}

let logoDataPromise = null;
function loadLogoData() {
  if (!logoDataPromise) {
    logoDataPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          aspect: img.naturalWidth / img.naturalHeight,
        });
      };
      img.onerror = reject;
      img.src = mathlyLogo;
    });
  }
  return logoDataPromise;
}

async function buildWorksheetPdf({ title, gradeText, sheet, showAnswers, workspace }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const logo = await loadLogoData();

  let y = MARGIN;
  const logoH = 42;
  doc.addImage(logo.dataUrl, "PNG", MARGIN, y, logoH * logo.aspect, logoH);
  y += logoH + 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...INK_SOFT);
  doc.text(sanitizeForPdf(title), MARGIN, y);
  doc.text(sanitizeForPdf(gradeText), PAGE_W - MARGIN, y, { align: "right" });
  y += 8;
  doc.setDrawColor(...RULE);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 22;

  const lineHeight = 16;

  sheet.forEach((q, i) => {
    const promptLines = doc.splitTextToSize(sanitizeForPdf(q.prompt), CONTENT_W - 34);
    let blockHeight = promptLines.length * lineHeight;
    if (showAnswers) blockHeight += lineHeight;
    if (workspace && !showAnswers) blockHeight += 26;
    blockHeight += 16;

    if (y + blockHeight > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }

    const tone = hexToRgb(CATEGORIES[q.cat]?.tone ?? "#2563EB");
    doc.setFillColor(...tone);
    doc.circle(MARGIN + 3, y - 3, 2.5, "F");

    doc.setTextColor(...INK_SOFT);
    doc.setFontSize(10);
    doc.text(`${i + 1}.`, MARGIN + 12, y);

    doc.setTextColor(...INK);
    doc.setFontSize(13);
    doc.text(promptLines, MARGIN + 34, y);
    y += promptLines.length * lineHeight;

    if (showAnswers) {
      doc.setTextColor(...MINT);
      doc.setFontSize(12);
      doc.text(sanitizeForPdf(`Answer: ${q.answer}`), MARGIN + 34, y);
      y += lineHeight;
    } else if (workspace) {
      y += 26;
    }

    y += 10;
    doc.setDrawColor(...HAIRLINE);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;
  });

  return doc;
}

/* iOS Safari is the one browser where a plain <a download> blob link is
   unreliable — that's the only reason to route through the native share
   sheet at all. Desktop browsers (including desktop Chrome/Safari, which
   also implement navigator.share for files) should just download the file
   directly, the way a "Download" button is expected to behave. */
function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  // iPadOS reports as "Mac" in the UA but exposes touch, unlike a real Mac.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

/* A worksheet PDF is built entirely in the browser and never touches the
   network, so there's no request to count. This fires one afterwards, to
   a path that isn't a real object — CloudFront logs the attempt (as a
   403/404, which is fine, only the fact that it was asked for matters).
   Best-effort: never let a blocked/failed beacon affect the download. */
function trackDownload() {
  try {
    fetch("/e/pdf-download", { mode: "no-cors", keepalive: true }).catch(() => {});
  } catch {
    // ignore — this is a nice-to-have, not part of the download itself
  }
}

const slugify = (str) =>
  String(str)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

function buildFilename({ title, gradeText, showAnswers }) {
  const gradePart = slugify(gradeText.replace(/\s*—\s*answer key$/i, ""));
  const titlePart = slugify(title);
  const suffix = showAnswers ? "-Answer-Key" : "";
  return `Mathly-Worksheet-${titlePart}-${gradePart}${suffix}.pdf`;
}

/* A plain, explicit download — deliberately not jsPDF's own doc.save(),
   which carries a legacy FileSaver-style fallback for browsers that don't
   support the `download` attribute. That fallback is where mobile
   browsers have been seen producing a stray second file; this bypasses
   it entirely with the same underlying blob-URL + anchor mechanism used
   everywhere else on the web. */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadWorksheetPdf(opts) {
  const doc = await buildWorksheetPdf(opts);
  const blob = doc.output("blob");
  const filename = buildFilename(opts);

  if (isIos()) {
    const file = new File([blob], filename, { type: "application/pdf" });
    // Sharing `files` alongside `title`/`text` is a known footgun — some
    // share targets (Files, Notes) save the text as its own separate
    // snippet next to the file. Share the file alone.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        trackDownload();
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
        // Share failed for a reason other than the user cancelling — fall
        // through to a plain download instead of leaving the click dead.
      }
    }
  }

  downloadBlob(blob, filename);
  trackDownload();
}
