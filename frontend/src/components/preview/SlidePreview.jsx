import { useState, useEffect } from 'react';

// ── Slide design themes (PPT-quality) ───────────────────────────────────────
const SLIDE_THEMES = {
  intro: {
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
    accentColor: '#a5b4fc',
    titleColor: '#ffffff',
    textColor: 'rgba(255,255,255,0.85)',
    badgeBg: 'rgba(165,180,252,0.20)',
    badgeColor: '#c4b5fd',
    label: 'INTRODUCTION',
    decorShape: 'circle',
    icon: '🎓',
  },
  content: {
    gradient: 'linear-gradient(135deg, #0f2744 0%, #1a3a5c 50%, #0d3b5e 100%)',
    accentColor: '#60a5fa',
    titleColor: '#ffffff',
    textColor: 'rgba(255,255,255,0.80)',
    badgeBg: 'rgba(96,165,250,0.20)',
    badgeColor: '#93c5fd',
    label: 'CONTENT',
    decorShape: 'rect',
    icon: '📖',
  },
  example: {
    gradient: 'linear-gradient(135deg, #052e16 0%, #064e3b 50%, #065f46 100%)',
    accentColor: '#34d399',
    titleColor: '#ffffff',
    textColor: 'rgba(255,255,255,0.82)',
    badgeBg: 'rgba(52,211,153,0.20)',
    badgeColor: '#6ee7b7',
    label: 'EXAMPLE',
    decorShape: 'triangle',
    icon: '💡',
  },
  activity: {
    gradient: 'linear-gradient(135deg, #431407 0%, #7c2d12 50%, #9a3412 100%)',
    accentColor: '#fb923c',
    titleColor: '#ffffff',
    textColor: 'rgba(255,255,255,0.82)',
    badgeBg: 'rgba(251,146,60,0.20)',
    badgeColor: '#fdba74',
    label: 'ACTIVITY',
    decorShape: 'diamond',
    icon: '🎯',
  },
  summary: {
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #3b0764 100%)',
    accentColor: '#c084fc',
    titleColor: '#ffffff',
    textColor: 'rgba(255,255,255,0.82)',
    badgeBg: 'rgba(192,132,252,0.20)',
    badgeColor: '#d8b4fe',
    label: 'SUMMARY',
    decorShape: 'circle',
    icon: '✅',
  },
};

// ── AI Image Search via Lorem Flickr (free, no API key needed, stable results) 
const imageCache = {};

function getAIImageUrl(subject, topic, slide, imagePreference = 'ai') {
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
  const cacheKey = `${query}-${lock}-${imagePreference}`;

  if (imageCache[cacheKey]) return imageCache[cacheKey];

  const url = `https://loremflickr.com/800/450/${encodeURIComponent(query)}?lock=${lock}`;
  imageCache[cacheKey] = url;
  return url;
}

// ── Decorative SVG shapes (PPT-style geometric accents) ──────────────────────
function DecorShapes({ theme }) {
  const { accentColor } = theme;
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}
      viewBox="0 0 400 225"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Large decorative circle — top right */}
      <circle cx="370" cy="-20" r="80" fill={accentColor} fillOpacity="0.08" />
      <circle cx="370" cy="-20" r="55" fill={accentColor} fillOpacity="0.06" />
      {/* Bottom left accent */}
      <circle cx="-10" cy="240" r="70" fill={accentColor} fillOpacity="0.07" />
      {/* Thin diagonal lines */}
      <line x1="300" y1="0" x2="400" y2="100" stroke={accentColor} strokeWidth="0.5" strokeOpacity="0.25" />
      <line x1="320" y1="0" x2="400" y2="80" stroke={accentColor} strokeWidth="0.5" strokeOpacity="0.20" />
      {/* Small accent dots */}
      <circle cx="15" cy="15" r="3" fill={accentColor} fillOpacity="0.35" />
      <circle cx="25" cy="15" r="2" fill={accentColor} fillOpacity="0.25" />
      <circle cx="33" cy="15" r="1.5" fill={accentColor} fillOpacity="0.18" />
    </svg>
  );
}

// ── Main SlidePreview Component ───────────────────────────────────────────────
export default function SlidePreview({ slide, index, subject = '', topic = '', imagePreference = 'ai', presentMode = false, isThumbnail = false, onRegenerate }) {
  const theme = SLIDE_THEMES[slide.type] || SLIDE_THEMES.content;

  const isIntroOrSummary = slide.type === 'intro' || slide.type === 'summary';
  const isNone = imagePreference === 'none';
  const hasImage = !!slide.imageUrl || (!isIntroOrSummary && !isNone && slide.imageQuery && slide.imageQuery.trim() !== '');

  // Derived, subject-relevant locked Flickr image URL (or AI-generated local path)
  const imgUrl = slide.imageUrl || (hasImage ? getAIImageUrl(subject, topic, slide, imagePreference) : null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset states when image URL changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [imgUrl]);

  const bullets = (slide.bullets || []).slice(0, 5);

  return (
    <div
      id={`slide-card-${index}`}
      style={{
        position: 'relative',
        borderRadius: 10,
        overflow: 'hidden',
        aspectRatio: '16/9',
        cursor: (presentMode || isThumbnail) ? 'default' : 'pointer',
        border: '2px solid transparent',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        background: theme.gradient,
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
      className="slide-card-pro"
      onMouseEnter={(presentMode || isThumbnail) ? undefined : e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
        e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)';
        e.currentTarget.style.border = `2px solid ${theme.accentColor}66`;
        const overlay = e.currentTarget.querySelector('.slide-regen-overlay');
        if (overlay) overlay.style.opacity = '1';
      }}
      onMouseLeave={(presentMode || isThumbnail) ? undefined : e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)';
        e.currentTarget.style.border = '2px solid transparent';
        const overlay = e.currentTarget.querySelector('.slide-regen-overlay');
        if (overlay) overlay.style.opacity = '0';
      }}
    >
      {/* ── Background Image (with gradient overlay) ── */}
      {imgUrl && !imgError && (
        <>
          <img
            src={imgUrl}
            alt=""
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: imgLoaded ? (isIntroOrSummary ? 0.18 : 0.22) : 0,
              transition: 'opacity 0.5s ease',
            }}
          />
          {/* Strong gradient overlay so text stays readable */}
          <div style={{
            position: 'absolute', inset: 0,
            background: isIntroOrSummary
              ? `${theme.gradient}`
              : `linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.30) 100%)`,
            opacity: imgLoaded ? 0.92 : 1,
            transition: 'opacity 0.5s ease',
          }} />
        </>
      )}

      {/* ── Decorative geometric shapes ── */}
      <DecorShapes theme={theme} />

      {/* ── Left accent bar ── */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, 
        width: presentMode ? 10 : 4,
        background: `linear-gradient(180deg, ${theme.accentColor}, ${theme.accentColor}44)`,
      }} />

      {/* ── Top bar: slide number + badge ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: presentMode ? '20px 32px 12px 36px' : '8px 12px 6px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 100%)',
      }}>
        <div style={{
          fontSize: presentMode ? '1.35rem' : '0.58rem', 
          fontWeight: 700,
          color: theme.accentColor,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          opacity: 0.85,
        }}>
          {theme.icon} SLIDE {index + 1}
        </div>
        <div style={{
          padding: presentMode ? '6px 18px' : '2px 8px',
          borderRadius: 20,
          background: theme.badgeBg,
          color: theme.badgeColor,
          fontSize: presentMode ? '1.25rem' : '0.56rem', 
          fontWeight: 700,
          letterSpacing: '0.10em', textTransform: 'uppercase',
          border: `1px solid ${theme.accentColor}33`,
          backdropFilter: 'blur(4px)',
        }}>
          {theme.label}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        height: '100%',
        padding: presentMode
          ? '64px 48px 40px'
          : (isIntroOrSummary ? '28px 20px 16px' : '22px 16px 14px'),
        display: 'flex',
        flexDirection: isIntroOrSummary ? 'column' : 'row',
        gap: presentMode ? 24 : (isIntroOrSummary ? 0 : 10),
        alignItems: isIntroOrSummary ? 'center' : 'flex-start',
        justifyContent: isIntroOrSummary ? 'center' : 'flex-start',
        boxSizing: 'border-box',
      }}>

        {/* ── INTRO / SUMMARY layout: centered ── */}
        {isIntroOrSummary ? (
          <div style={{ textAlign: 'center', maxWidth: '85%' }}>
            {/* Accent line */}
            <div style={{
              width: presentMode ? 100 : 40, 
              height: presentMode ? 8 : 3,
              background: theme.accentColor,
              borderRadius: 2, 
              margin: presentMode ? '0 auto 24px' : '0 auto 10px',
            }} />
            {/* Title */}
            <div style={{
              fontSize: presentMode ? '2.8rem' : '1.05rem', 
              fontWeight: 800,
              color: theme.titleColor,
              lineHeight: 1.25, 
              marginBottom: presentMode ? 24 : 10,
              letterSpacing: '-0.02em',
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}>
              {slide.title}
            </div>
            {/* Bullets as pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: presentMode ? 12 : 5, justifyContent: 'center' }}>
              {bullets.slice(0, 3).map((b, i) => (
                <div key={i} style={{
                  padding: presentMode ? '8px 24px' : '3px 10px',
                  background: `${theme.accentColor}22`,
                  border: `1px solid ${theme.accentColor}44`,
                  borderRadius: 20,
                  color: theme.textColor,
                  fontSize: presentMode ? '1.4rem' : '0.62rem', 
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                }}>
                  {b.length > 40 && !presentMode ? b.slice(0, 38) + '…' : b}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── CONTENT layout: left text + right image ── */}
            {/* Left: Text content */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: presentMode ? 24 : 10 }}>
              {/* Accent line + title */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: presentMode ? 14 : 6, marginBottom: presentMode ? 16 : 8,
              }}>
                <div style={{
                  width: presentMode ? 8 : 3, 
                  height: presentMode ? 44 : 18,
                  background: theme.accentColor,
                  borderRadius: 2, flexShrink: 0,
                }} />
                <div style={{
                  fontSize: presentMode ? '2.4rem' : '0.82rem', 
                  fontWeight: 800,
                  color: theme.titleColor,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                }}>
                  {slide.title}
                </div>
              </div>

              {/* Thin accent separator */}
              <div style={{
                height: presentMode ? 3 : 1.5, 
                width: '60%',
                background: `linear-gradient(90deg, ${theme.accentColor}, transparent)`,
                marginBottom: presentMode ? 20 : 8, 
                borderRadius: 1,
              }} />

              {/* Bullet points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: presentMode ? 14 : 4 }}>
                {bullets.map((b, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: presentMode ? 12 : 5, alignItems: 'flex-start',
                    fontSize: presentMode ? '1.45rem' : '0.60rem', 
                    lineHeight: 1.5,
                    color: theme.textColor,
                  }}>
                    <span style={{
                      color: theme.accentColor, flexShrink: 0,
                      fontSize: presentMode ? '1.3rem' : '0.55rem', 
                      marginTop: presentMode ? 4 : 1,
                    }}>▸</span>
                    <span>{b.length > 70 && !presentMode ? b.slice(0, 68) + '…' : b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Image panel */}
            {imgUrl && !imgError && (
              <div style={{
                width: '35%', flexShrink: 0,
                height: '75%',
                borderRadius: 6,
                overflow: 'hidden',
                marginTop: 10,
                border: `1.5px solid ${theme.accentColor}33`,
                boxShadow: `0 2px 10px rgba(0,0,0,0.30)`,
                position: 'relative',
              }}>
                <img
                  src={imgUrl}
                  alt={slide.title}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    opacity: imgLoaded ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                  }}
                />
                {/* Subtle vignette */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(135deg, rgba(0,0,0,0.10) 0%, transparent 60%)`,
                }} />
                {/* Loading skeleton */}
                {!imgLoaded && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(135deg, ${theme.accentColor}18, ${theme.accentColor}08)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 20, height: 20,
                      border: `2px solid ${theme.accentColor}44`,
                      borderTopColor: theme.accentColor,
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                  </div>
                )}
              </div>
            )}

            {/* Fallback placeholder if no image */}
            {hasImage && (!imgUrl || imgError) && (
              <div style={{
                width: '33%', flexShrink: 0,
                height: '70%', marginTop: 10,
                borderRadius: 6,
                border: `1.5px dashed ${theme.accentColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
                background: `${theme.accentColor}0A`,
              }}>
                {theme.icon}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: presentMode ? '12px 36px' : '4px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.35) 0%, transparent 100%)',
      }}>
        <div style={{
          display: 'flex', gap: presentMode ? 8 : 3,
        }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              width: presentMode ? 40 : 16, 
              height: presentMode ? 6 : 2.5, 
              borderRadius: 2,
              background: i === 0 ? theme.accentColor : `${theme.accentColor}40`,
            }} />
          ))}
        </div>
        <div style={{
          fontSize: presentMode ? '1.2rem' : '0.52rem', 
          color: `${theme.accentColor}99`,
          letterSpacing: '0.08em', fontWeight: 600,
        }}>
          AI TEACHER PPT
        </div>
      </div>

      {/* ── Hover: Regenerate overlay ── */}
      {!presentMode && !isThumbnail && (
        <div
          className="slide-regen-overlay"
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s ease',
            backdropFilter: 'blur(2px)',
            zIndex: 10,
          }}
          onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
        >
          <button
            id={`btn-regen-slide-${index}`}
            style={{
              padding: '8px 18px',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.45)',
              borderRadius: 8,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              letterSpacing: '0.02em',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = '';
            }}
          >
            🔄 Regenerate Slide
          </button>
        </div>
      )}
    </div>
  );
}
