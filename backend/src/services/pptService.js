/**
 * pptService.js — Premium PPT Builder v3 (Professional Template Design)
 *
 * Design highlights:
 * - Diagonal accent band splitting slide background
 * - AI-generated images (Pollinations.ai) in a bordered right panel
 * - Clean header with colored badge + topic label
 * - Alternating bullet rows with tick accent
 * - Right-side decorative panel with topic text when no image
 * - Progress bar footer with branding
 */

const PptxGenJS = require('pptxgenjs');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Slide is 13.33" wide × 7.5" tall (LAYOUT_WIDE)
const W = 13.33;
const H = 7.5;

// ── Per-slide-type themes ────────────────────────────────────────────────────
const SLIDE_THEMES = {
  intro: {
    bg:      '120F3A', // deep indigo-navy
    panel:   '1E1B4B',
    accent:  'A5B4FC',
    text:    'FFFFFF',
    sub:     'C4B5FD',
    label:   'INTRODUCTION',
  },
  content: {
    bg:      '0A1F3A',
    panel:   '0D2D52',
    accent:  '60A5FA',
    text:    'FFFFFF',
    sub:     '93C5FD',
    label:   'CONTENT',
  },
  example: {
    bg:      '031A0D',
    panel:   '052E16',
    accent:  '34D399',
    text:    'FFFFFF',
    sub:     '6EE7B7',
    label:   'EXAMPLE',
  },
  activity: {
    bg:      '2D0D03',
    panel:   '431407',
    accent:  'FB923C',
    text:    'FFFFFF',
    sub:     'FDBA74',
    label:   'ACTIVITY',
  },
  summary: {
    bg:      '120F3A',
    panel:   '1E1B4B',
    accent:  'C084FC',
    text:    'FFFFFF',
    sub:     'D8B4FE',
    label:   'SUMMARY',
  },
};

// ── Pollinations.ai helpers ──────────────────────────────────────────────────
function buildPrompt(slide) {
  const base = slide.imageQuery || slide.title || 'education';
  const hints = {
    intro:    'vibrant educational banner, academic illustration, bright classroom',
    content:  'educational diagram, infographic, academic textbook style, professional',
    example:  'step by step diagram, solved problem illustration, academic',
    activity: 'students working together, hands-on activity, collaborative learning',
    summary:  'knowledge checklist, summary graphic, colorful recap illustration',
  };
  return `${base}, ${hints[slide.type] || 'educational'}, school, professional, high quality, no text`;
}

function getLoremFlickrUrl(subject, topic, slide, width = 800, height = 500, imagePreference = 'ai') {
  const stopWords = new Set([
    'and', 'the', 'for', 'from', 'with', 'intro', 'introduction', 'summary', 
    'conclusion', 'objectives', 'learning', 'about', 'concept', 'what', 'how',
    'class', 'grade', 'board', 'curriculum', 'lesson', 'teacher', 'student',
    'welcome', 'today', 'slide', 'notes', 'in', 'our', 'surroundings', 'laws', 'of',
    'an', 'a', 'to', 'on', 'is', 'are', 'education', 'educational', 'example', 
    'activity', 'theme', 'topic', 'subject', 'practice', 'exercise', 'question', 
    'answer', 'key', 'paper', 'test', 'exam', 'quiz', 'style', 'illustration', 
    'vector', 'flat', 'photo', 'photograph', 'stock', 'diagram', 'diagrams', 'chart',
    'showing', 'show', 'represent', 'representing', 'design', 'background', 'graphic'
  ]);

  const cleanText = (text) => {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  };

  // Get topic keyword
  const topicWords = cleanText(topic);
  const topicKey = topicWords[0] || cleanText(subject)[0] || 'education';

  // Get keywords from imageQuery if present, otherwise slide.title
  const sourceText = (slide.imageQuery && slide.imageQuery.trim() !== '')
    ? slide.imageQuery
    : slide.title;
  const slideWords = cleanText(sourceText);
  const uniqueSlideWords = slideWords.filter(w => w !== topicKey);
  const keyword = uniqueSlideWords[0] || topicKey;

  // Use the single most specific keyword alone to ensure Flickr always finds matching photos
  // instead of getting 0 results and falling back to the default "Tomboli" cat statue.
  let query = keyword;
  if (imagePreference === 'textbook') {
    query = `${keyword},diagram`;
  }

  const lock = ((slide.index || 0) % 10) + 1;

  return `https://loremflickr.com/${width}/${height}/${encodeURIComponent(query)}?lock=${lock}`;
}

async function toBase64(url) {
  try {
    const timeout = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 20000));
    const req     = fetch(url).then(async r => {
      if (!r.ok) return null;
      return (await r.buffer()).toString('base64');
    });
    return await Promise.race([req, timeout]);
  } catch { return null; }
}

// ── Helper: limit promise concurrency ─────────────────────────────────────────
async function limitConcurrency(tasks, limit) {
  const results = [];
  const executing = [];
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

// ── Helper: draw a rounded badge (shape + text) ──────────────────────────────
function addBadge(pSlide, pptx, { x, y, w, h, bg, bgTransp, borderColor, text, textColor, fontSize, bold, align, charSpacing }) {
  pSlide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: bg, transparency: bgTransp ?? 0 },
    line: { color: borderColor ?? bg, width: 0.75 },
    rectRadius: 0.12,
  });
  pSlide.addText(text, {
    x, y, w, h,
    color: textColor,
    fontSize: fontSize ?? 10,
    bold: bold ?? true,
    fontFace: 'Calibri',
    align: align ?? 'center',
    valign: 'middle',
    charSpacing: charSpacing ?? 0,
  });
}

// ── Main buildPPT ─────────────────────────────────────────────────────────────
const buildPPT = async (config, slides) => {
  const pptx = new PptxGenJS();
  pptx.layout  = 'LAYOUT_WIDE';
  pptx.title   = `${config.board} ${config.grade} ${config.subject} — ${config.topic}`;
  pptx.subject = config.subject;
  pptx.author  = 'AI Teacher PPT Generator';

  const isNone = config.imagePreference === 'none';
  // Pre-fetch images with a concurrency limit (max 3 at a time) to avoid socket exhaustion/timeouts
  let imgs = [];
  if (!isNone) {
    console.log('🖼️  Loading slide images (Local DALL-E or Flickr fallback)…');
    imgs = await limitConcurrency(
      slides.map(s => async () => {
        if (s.type === 'intro' || s.type === 'summary') return null;
        if ((!s.imageQuery || s.imageQuery.trim() === '') && !s.imageUrl) return null;
        
        // Prioritize locally generated image file if it exists
        if (s.imageUrl && s.imageUrl.startsWith('/uploads/')) {
          try {
            const localPath = path.join(__dirname, '../..', s.imageUrl);
            if (fs.existsSync(localPath)) {
              console.log(`📖 [pptService] Loading local DALL-E image for Slide ${s.index + 1} from ${localPath}`);
              return fs.readFileSync(localPath).toString('base64');
            }
          } catch (err) {
            console.error(`⚠️  [pptService] Failed to read local image for Slide ${s.index + 1}: ${err.message}`);
          }
        }
        
        // Otherwise, fall back to downloading from Flickr
        console.log(`🌐 [pptService] Fetching Flickr fallback image for Slide ${s.index + 1}`);
        return toBase64(getLoremFlickrUrl(config.subject, config.topic, s, 800, 500, config.imagePreference));
      }),
      3
    );
    console.log(`✅ ${imgs.filter(Boolean).length} / ${slides.length} images loaded`);
  } else {
    console.log('🖼️  [pptService] Skipping image fetching (imagePreference === "none")');
  }

  for (let i = 0; i < slides.length; i++) {
    const slide    = slides[i];
    const t        = SLIDE_THEMES[slide.type] || SLIDE_THEMES.content;
    const imgB64   = imgs[i];
    const centered = slide.type === 'intro' || slide.type === 'summary';
    const slideWantsImage = !centered && !isNone && slide.imageQuery && slide.imageQuery.trim() !== '';
    const hasImage = slideWantsImage && imgB64;

    const pSlide = pptx.addSlide();

    // ═══════════════════════════════════════════════════════════
    // 1. BACKGROUND
    // ═══════════════════════════════════════════════════════════
    pSlide.background = { color: t.bg };

    // Right panel — slightly lighter shade (hide for centered/text-only)
    if (slideWantsImage) {
      pSlide.addShape(pptx.ShapeType.rect, {
        x: W * 0.55, y: 0, w: W * 0.45, h: H,
        fill: { color: t.panel, transparency: 0 },
        line: { color: t.panel, width: 0 },
      });
    }



    // Full-slide dark overlay for depth
    pSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: W, h: H,
      fill: { color: '000000', transparency: 68 },
      line: { color: '000000', width: 0 },
    });

    // ═══════════════════════════════════════════════════════════
    // 2. LEFT ACCENT BAR
    // ═══════════════════════════════════════════════════════════
    pSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 0.18, h: H,
      fill: { color: t.accent, transparency: 0 },
      line: { color: t.accent, width: 0 },
    });

    // ═══════════════════════════════════════════════════════════
    // 3. TOP HEADER BAR (subtle)
    // ═══════════════════════════════════════════════════════════
    pSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: W, h: 0.72,
      fill: { color: '000000', transparency: 60 },
      line: { color: '000000', width: 0 },
    });
    // Accent bottom line on header
    pSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0.72, w: (!slideWantsImage) ? W : W * 0.55, h: 0.03,
      fill: { color: t.accent, transparency: 20 },
      line: { color: t.accent, width: 0 },
    });

    // ═══════════════════════════════════════════════════════════
    // 4. SLIDE TYPE BADGE (top-left header)
    // ═══════════════════════════════════════════════════════════
    addBadge(pSlide, pptx, {
      x: 0.42, y: 0.16, w: 2.0, h: 0.4,
      bg: t.accent, bgTransp: 75,
      borderColor: t.accent,
      text: t.label,
      textColor: t.text,
      fontSize: 9,
      bold: true,
      charSpacing: 1.8,
    });

    // Topic label (center of header)
    pSlide.addText(config.topic, {
      x: 2.8, y: 0.16, w: 7.5, h: 0.4,
      color: t.sub,
      fontSize: 9.5,
      fontFace: 'Calibri',
      italic: true,
      valign: 'middle',
      align: 'center',
    });

    // Slide number badge (top right)
    addBadge(pSlide, pptx, {
      x: W - 0.9, y: 0.16, w: 0.72, h: 0.4,
      bg: t.accent, bgTransp: 50,
      borderColor: t.accent,
      text: `${i + 1}`,
      textColor: t.text,
      fontSize: 12,
      bold: true,
    });

    // ═══════════════════════════════════════════════════════════
    // 5. RIGHT PANEL — IMAGE or DECORATIVE TOPIC BLOCK
    // ═══════════════════════════════════════════════════════════
    const imgX = W * 0.56;
    const imgY = 0.85;
    const imgW = W * 0.41;
    const imgH = H - 1.3;

    if (slideWantsImage) {
      if (imgB64) {
        // AI image
        pSlide.addImage({ data: `image/jpeg;base64,${imgB64}`, x: imgX, y: imgY, w: imgW, h: imgH });
        // Blend overlay
        pSlide.addShape(pptx.ShapeType.rect, {
          x: imgX, y: imgY, w: imgW, h: imgH,
          fill: { color: t.bg, transparency: 38 },
          line: { color: t.accent, transparency: 45, width: 1.5 },
        });
      } else {
        // Decorative right panel (when no image available)
        pSlide.addShape(pptx.ShapeType.roundRect, {
          x: imgX, y: imgY, w: imgW, h: imgH,
          fill: { color: t.accent, transparency: 88 },
          line: { color: t.accent, transparency: 60, width: 1 },
          rectRadius: 0.12,
        });
        // Subject icon text
        pSlide.addText(config.subject || '📖', {
          x: imgX, y: imgY + imgH * 0.2, w: imgW, h: imgH * 0.3,
          color: t.accent,
          fontSize: 52,
          fontFace: 'Calibri',
          align: 'center',
          valign: 'middle',
          transparency: 40,
        });
        pSlide.addText(config.topic, {
          x: imgX + 0.15, y: imgY + imgH * 0.52, w: imgW - 0.3, h: imgH * 0.35,
          color: t.sub,
          fontSize: 13,
          fontFace: 'Calibri',
          align: 'center',
          valign: 'top',
          italic: true,
          wrap: true,
          transparency: 10,
        });
      }

      // Corner dot decoration on image panel
      pSlide.addShape(pptx.ShapeType.ellipse, {
        x: imgX + imgW - 0.55, y: imgY + 0.1, w: 0.42, h: 0.42,
        fill: { color: t.accent, transparency: 55 },
        line: { color: t.accent, width: 0 },
      });
    }

    // ═══════════════════════════════════════════════════════════
    // 6. CORNER DECORATIVE RINGS (strictly inside slide)
    // ═══════════════════════════════════════════════════════════
    // Bottom-left rings
    pSlide.addShape(pptx.ShapeType.ellipse, {
      x: 0.18, y: H - 1.7, w: 1.55, h: 1.55,
      fill: { color: t.accent, transparency: 84 },
      line: { color: t.accent, transparency: 65, width: 0.75 },
    });
    pSlide.addShape(pptx.ShapeType.ellipse, {
      x: 0.38, y: H - 1.5, w: 0.9, h: 0.9,
      fill: { color: t.bg, transparency: 30 },
      line: { color: t.bg, width: 0 },
    });
    // Small dots row (subtle visual texture, bottom area)
    [0.3, 0.5, 0.7].forEach((off, di) => {
      pSlide.addShape(pptx.ShapeType.ellipse, {
        x: 2.2 + di * 0.22, y: H - 0.52, w: 0.07, h: 0.07,
        fill: { color: t.accent, transparency: 55 },
        line: { color: t.accent, width: 0 },
      });
    });

    // ═══════════════════════════════════════════════════════════
    // 7. MAIN CONTENT AREA
    // ═══════════════════════════════════════════════════════════
    const textX = 0.45;
    const textW = slideWantsImage ? W * 0.52 - 0.35 : W - 0.90;
    const titleY = centered ? 1.4 : 0.88;
    const titleH = centered ? 1.9 : 1.3;
    const titleSize = centered ? 42 : 30;

    if (centered) {
      // Accent horizontal line above title (centered)
      pSlide.addShape(pptx.ShapeType.rect, {
        x: W / 2 - 0.75, y: 1.25, w: 1.5, h: 0.06,
        fill: { color: t.accent, transparency: 0 },
        line: { color: t.accent, width: 0 },
      });
    }

    // Title
    pSlide.addText(slide.title, {
      x: textX, y: titleY, w: textW, h: titleH,
      color: t.text,
      fontSize: titleSize,
      bold: true,
      fontFace: 'Calibri',
      valign: 'middle',
      align: centered ? 'center' : 'left',
      wrap: true,
    });

    // ═══════════════════════════════════════════════════════════
    // 8. BULLET POINTS / PILL CHIPS
    // ═══════════════════════════════════════════════════════════
    if (slide.bullets && slide.bullets.length > 0) {
      if (centered) {
        // ── Pill chips for intro/summary ───────────────────────
        const pills = slide.bullets.slice(0, 4);
        const pillW = (textW - 0.4) / pills.length - 0.15;
        const startX = (W - (pillW * pills.length + 0.15 * (pills.length - 1))) / 2;

        pills.forEach((b, idx) => {
          const px = startX + idx * (pillW + 0.15);
          pSlide.addShape(pptx.ShapeType.roundRect, {
            x: px, y: 3.6, w: pillW, h: 0.65,
            fill: { color: t.accent, transparency: 74 },
            line: { color: t.accent, transparency: 50, width: 0.75 },
            rectRadius: 0.3,
          });
          pSlide.addText(b.length > 32 ? b.slice(0, 30) + '…' : b, {
            x: px, y: 3.6, w: pillW, h: 0.65,
            color: t.text, fontSize: 11.5, fontFace: 'Calibri',
            align: 'center', valign: 'middle', wrap: true,
          });
        });

        if (slide.bullets.length > 4) {
          pSlide.addText(slide.bullets.slice(4).join('  •  '), {
            x: 1.0, y: 4.4, w: W - 2.0, h: 0.7,
            color: t.sub, fontSize: 12, fontFace: 'Calibri',
            align: 'center', valign: 'middle', wrap: true,
          });
        }

        // Thin accent separator below pills
        pSlide.addShape(pptx.ShapeType.rect, {
          x: W / 2 - 1.5, y: 5.3, w: 3.0, h: 0.04,
          fill: { color: t.accent, transparency: 50 },
          line: { color: t.accent, width: 0 },
        });

      } else {
        // ── Row bullets for content/example/activity ───────────
        const maxB = Math.min(slide.bullets.length, 6);
        const rowH = maxB <= 4 ? 0.82 : 0.68;
        const startY = 2.3;

        for (let b = 0; b < maxB; b++) {
          const bullet = slide.bullets[b];
          const yPos   = startY + b * rowH;

          // Alternating band
          if (b % 2 === 0) {
            pSlide.addShape(pptx.ShapeType.roundRect, {
              x: textX - 0.08, y: yPos - 0.05, w: textW + 0.16, h: rowH - 0.04,
              fill: { color: t.accent, transparency: 87 },
              line: { color: t.accent, transparency: 80, width: 0.5 },
              rectRadius: 0.05,
            });
          }

          // Left tick accent
          pSlide.addShape(pptx.ShapeType.rect, {
            x: textX - 0.08, y: yPos - 0.05, w: 0.07, h: rowH - 0.04,
            fill: { color: t.accent, transparency: 0 },
            line: { color: t.accent, width: 0 },
          });

          // Bullet marker
          pSlide.addText('▸', {
            x: textX + 0.08, y: yPos + 0.04, w: 0.3, h: rowH - 0.2,
            color: t.accent, fontSize: 12, fontFace: 'Calibri', valign: 'middle',
          });

          // Bullet text
          pSlide.addText(bullet, {
            x: textX + 0.42, y: yPos + 0.04, w: textW - 0.52, h: rowH - 0.15,
            color: t.text, fontSize: maxB <= 4 ? 15 : 13.5,
            fontFace: 'Calibri', valign: 'middle', wrap: true,
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 9. FOOTER
    // ═══════════════════════════════════════════════════════════
    // Footer dark band
    pSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: H - 0.36, w: W, h: 0.36,
      fill: { color: '000000', transparency: 48 },
      line: { color: '000000', width: 0 },
    });
    // Progress bar
    const progW = Math.max(0.06, (W / slides.length) * (i + 1));
    pSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: H - 0.36, w: progW, h: 0.05,
      fill: { color: t.accent, transparency: 0 },
      line: { color: t.accent, width: 0 },
    });
    // Footer left — meta info
    pSlide.addText(`${config.board}  |  ${config.grade}  |  ${config.subject}  |  ${config.topic}`, {
      x: 0.28, y: H - 0.33, w: 8.5, h: 0.28,
      color: 'AAAAAA', fontSize: 7.5, fontFace: 'Calibri', valign: 'middle',
    });
    // Footer right — branding
    pSlide.addText(`AI Teacher PPT   •   ${i + 1} / ${slides.length}`, {
      x: 8.8, y: H - 0.33, w: 4.3, h: 0.28,
      color: t.accent, fontSize: 7.5, fontFace: 'Calibri',
      align: 'right', valign: 'middle', bold: true,
    });

    // ── Speaker notes ─────────────────────────────────────────
    if (slide.speakerNotes) pSlide.addNotes(slide.speakerNotes);
  }

  return await pptx.write({ outputType: 'nodebuffer' });
};

module.exports = { buildPPT };
