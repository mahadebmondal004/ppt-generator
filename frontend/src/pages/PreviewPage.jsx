import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateAPI } from '../api';
import toast from 'react-hot-toast';
import SlidePreview from '../components/preview/SlidePreview';
import LessonPlanPanel from '../components/preview/LessonPlanPanel';
import RegenerateModal from '../components/preview/RegenerateModal';
import SlideRegeneratePanel from '../components/preview/SlideRegeneratePanel';

export default function PreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [generation, setGeneration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('slides'); // 'slides' | 'lesson'
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenSlide, setRegenSlide] = useState(null); // { index, slide }
  const [regenerating, setRegenerating] = useState(false);
  const [presentMode, setPresentMode] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Keyboard navigation for presentation mode
  const handleKeyDown = useCallback((e) => {
    if (!presentMode) return;
    if (e.key === 'Escape') setPresentMode(false);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      setPresentIndex(i => Math.min(i + 1, (generation?.slides?.length || 1) - 1));
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      setPresentIndex(i => Math.max(i - 1, 0));
    }
  }, [presentMode, generation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const fetchGeneration = async () => {
      try {
        const res = await generateAPI.getGeneration(id);
        setGeneration(res.data.generation);
      } catch (err) {
        toast.error('Could not load generation');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchGeneration();
  }, [id]);

  const handleDownload = (type) => {
    const token = localStorage.getItem('token');
    const urls = {
      ppt: generateAPI.downloadPPT(id),
      lesson: generateAPI.downloadLesson(id),
      zip: generateAPI.downloadZip(id)
    };
    // Use anchor with Authorization header trick via blob
    fetch(urls[type], { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const ext = type === 'ppt' ? 'pptx' : type === 'lesson' ? 'docx' : 'zip';
        const fileName = `${generation.board}_${generation.grade}_${generation.topic}.${ext}`.replace(/[^a-zA-Z0-9_.]/g, '_');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Downloading ${type.toUpperCase()}...`);
      })
      .catch(() => toast.error('Download failed'));
  };

  const handleRegenerateAll = async (instructions) => {
    setRegenerating(true);
    try {
      await generateAPI.regenerateAll(id, instructions);
      toast.loading('Regenerating all slides...', { duration: 4000 });

      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const statusRes = await generateAPI.getGeneration(id);
          const gen = statusRes.data.generation;
          if (gen.status === 'completed') {
            clearInterval(poll);
            setGeneration(gen);
            setRegenerating(false);
            setShowRegenModal(false);
            toast.success('All slides regenerated! ✨');
          }
        } catch {
          clearInterval(poll);
          setRegenerating(false);
        }
      }, 2500);
    } catch (err) {
      toast.error('Regeneration failed');
      setRegenerating(false);
    }
  };

  const handleRegenerateSlide = async (slideIndex, instructions) => {
    try {
      const res = await generateAPI.regenerateSlide(id, slideIndex, { instructions });
      const updatedSlides = [...generation.slides];
      updatedSlides[slideIndex] = res.data.slide;
      setGeneration(prev => ({ ...prev, slides: updatedSlides }));
      setRegenSlide(null);
      toast.success(`Slide ${slideIndex + 1} regenerated!`);
    } catch (err) {
      toast.error('Slide regeneration failed');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your presentation...</p>
        </div>
      </div>
    );
  }

  if (!generation) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div className="preview-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{generation.topic}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {generation.board} · {generation.grade} · {generation.subject} · {generation.slides?.length || 0} slides
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            id="btn-regen-all"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowRegenModal(true)}
            disabled={regenerating}
          >
            {regenerating ? <><div className="spinner spinner-sm" /> Regenerating...</> : '🔄 Regenerate All'}
          </button>
          <button
            id="btn-download-ppt"
            className="btn btn-primary btn-sm"
            onClick={() => handleDownload('ppt')}
          >⬇️ Download PPT</button>
          <button
            id="btn-download-lesson"
            className="btn btn-secondary btn-sm"
            onClick={() => handleDownload('lesson')}
          >📄 Lesson Plan</button>
          <button
            id="btn-download-zip"
            className="btn btn-ghost btn-sm"
            onClick={() => handleDownload('zip')}
          >📦 ZIP Both</button>
        </div>
      </div>

      {/* Content area */}
      <div className={`preview-layout${sidebarOpen ? '' : ' sidebar-collapsed'}`} style={{ flex: 1, minHeight: 0 }}>
        {/* Slides area — position:relative so the presentation panel is bounded here */}
        <div 
          className="preview-main" 
          style={{ 
            position: 'relative', 
            overflow: presentMode ? 'hidden' : 'auto',
            padding: presentMode ? '0px' : undefined
          }}
        >

          {/* Tab switch row + fullscreen icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`btn ${activeTab === 'slides' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                onClick={() => setActiveTab('slides')}
              >
                🗂️ Slides ({generation.slides?.length || 0})
              </button>
              <button
                className={`btn ${activeTab === 'lesson' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                onClick={() => setActiveTab('lesson')}
              >
                📋 Lesson Plan
              </button>
            </div>
            {/* ⛶ Fullscreen icon — top-right of slides area */}
            {activeTab === 'slides' && (
              <button
                id="btn-present-mode"
                title="Presentation Mode (full area)"
                onClick={() => { setPresentIndex(0); setPresentMode(true); }}
                style={{
                  background: 'rgba(79,70,229,0.10)',
                  border: '1.5px solid rgba(79,70,229,0.25)',
                  borderRadius: 8,
                  color: '#6366f1',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontWeight: 600,
                  fontSize: '0.78rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.20)'; e.currentTarget.style.borderColor = '#6366f1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.10)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.25)'; }}
              >⛶ Present</button>
            )}
          </div>

          {activeTab === 'slides' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
            }}>
              {(generation.slides || []).map((slide, idx) => (
                <SlidePreview
                  key={`${slide.index}-${idx}`}
                  slide={slide}
                  index={idx}
                  subject={generation.subject}
                  topic={generation.topic}
                  imagePreference={generation.imagePreference}
                  onRegenerate={() => setRegenSlide({ index: idx, slide })}
                />
              ))}
            </div>
          ) : (
            <LessonPlanPanel lessonPlan={generation.lessonPlan} config={generation} inline />
          )}

          {/* ── Presentation Mode — lives INSIDE the slides panel ── */}
          {presentMode && generation?.slides && (
            <div
              style={{
                position: 'absolute', inset: 0, zIndex: 100,
                background: '#080812',
                display: 'flex', flexDirection: 'column',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* Top control bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0,
              }}>
                <div style={{ color: 'rgba(255,255,255,0.50)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.01em' }}>
                  {generation.topic}
                  <span style={{ color: 'rgba(255,255,255,0.28)', margin: '0 6px' }}>·</span>
                  <span style={{ color: 'rgba(255,255,255,0.30)' }}>Slide {presentIndex + 1} of {generation.slides.length}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    id="btn-present-prev"
                    onClick={() => setPresentIndex(i => Math.max(i - 1, 0))}
                    disabled={presentIndex === 0}
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: presentIndex === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                      borderRadius: 7, padding: '4px 13px',
                      cursor: presentIndex === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.78rem', fontWeight: 600,
                    }}
                  >← Prev</button>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', minWidth: 48, textAlign: 'center' }}>
                    {presentIndex + 1} / {generation.slides.length}
                  </span>
                  <button
                    id="btn-present-next"
                    onClick={() => setPresentIndex(i => Math.min(i + 1, generation.slides.length - 1))}
                    disabled={presentIndex === generation.slides.length - 1}
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: presentIndex === generation.slides.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                      borderRadius: 7, padding: '4px 13px',
                      cursor: presentIndex === generation.slides.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.78rem', fontWeight: 600,
                    }}
                  >Next →</button>
                  <button
                    id="btn-present-close"
                    onClick={() => setPresentMode(false)}
                    title="Exit (Esc)"
                    style={{
                      background: 'rgba(220,38,38,0.12)',
                      border: '1px solid rgba(220,38,38,0.30)',
                      color: '#f87171',
                      borderRadius: 7, padding: '4px 10px',
                      cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                      marginLeft: 4,
                    }}
                  >✕ Exit</button>
                </div>
              </div>

              {/* Large slide viewer */}
              <div style={{
                flex: 1, minHeight: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px 20px 10px',
              }}>
                <div style={{
                  width: '100%',
                  maxWidth: 'min(100%, calc((100vh - 220px) * 16 / 9))',
                  aspectRatio: '16/9',
                  borderRadius: 10,
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.5)',
                  border: '1.5px solid rgba(255,255,255,0.09)',
                }}>
                  <SlidePreview
                    key={presentIndex}
                    slide={generation.slides[presentIndex]}
                    index={presentIndex}
                    subject={generation.subject}
                    topic={generation.topic}
                    imagePreference={generation.imagePreference}
                    presentMode={true}
                    onRegenerate={() => {
                      setPresentMode(false);
                      setRegenSlide({ index: presentIndex, slide: generation.slides[presentIndex] });
                    }}
                  />
                </div>
              </div>

              {/* Thumbnail strip */}
              <div 
                className="no-scrollbar"
                style={{
                  flexShrink: 0,
                  padding: '0 16px 12px',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                }}
              >
                <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
                  {generation.slides.map((slide, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPresentIndex(idx)}
                      style={{
                        width: 110,
                        aspectRatio: '16/9',
                        borderRadius: 6,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        flexShrink: 0,
                        border: idx === presentIndex
                          ? '2px solid #818cf8'
                          : '2px solid rgba(255,255,255,0.10)',
                        boxShadow: idx === presentIndex
                          ? '0 0 0 2px rgba(129,140,248,0.35)'
                          : '0 1px 6px rgba(0,0,0,0.4)',
                        transform: idx === presentIndex ? 'scale(1.07)' : 'scale(1)',
                        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                        position: 'relative',
                      }}
                    >
                      <SlidePreview
                        slide={slide}
                        index={idx}
                        subject={generation.subject}
                        topic={generation.topic}
                        imagePreference={generation.imagePreference}
                        isThumbnail={true}
                        onRegenerate={() => {}}
                      />
                      <div style={{
                        position: 'absolute', bottom: 2, left: 0, right: 0,
                        textAlign: 'center', fontSize: '0.50rem', fontWeight: 700,
                        color: 'rgba(255,255,255,0.70)',
                        letterSpacing: '0.06em',
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        pointerEvents: 'none',
                      }}>{idx + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — with collapse/expand toggle */}
        <div className="preview-sidebar">
          {/* Toggle tab — floats on left edge of sidebar */}
          <button
            id="btn-sidebar-toggle"
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              position: 'absolute',
              top: '50%',
              left: sidebarOpen ? -14 : -14,
              transform: 'translateY(-50%)',
              zIndex: 50,
              width: 28,
              height: 56,
              borderRadius: '8px 0 0 8px',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border-solid)',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              boxShadow: '-3px 0 8px rgba(15,23,42,0.08)',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {sidebarOpen ? '›' : '‹'}
          </button>
          {/* Sidebar content — only rendered when open (avoids layout flash) */}
          <div style={{
            width: 380,
            height: '100%',
            overflowY: 'auto',
            opacity: sidebarOpen ? 1 : 0,
            transition: 'opacity 0.18s ease',
            pointerEvents: sidebarOpen ? 'auto' : 'none',
          }}>
            <LessonPlanPanel lessonPlan={generation.lessonPlan} config={generation} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRegenModal && (
        <RegenerateModal
          onClose={() => setShowRegenModal(false)}
          onRegenerate={handleRegenerateAll}
          loading={regenerating}
        />
      )}

      {regenSlide && (
        <SlideRegeneratePanel
          slide={regenSlide.slide}
          index={regenSlide.index}
          onClose={() => setRegenSlide(null)}
          onRegenerate={(instructions) => handleRegenerateSlide(regenSlide.index, instructions)}
        />
      )}
    </div>
  );
}
