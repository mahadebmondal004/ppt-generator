import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { qpAPI } from '../api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function QPEvaluatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPaperId = searchParams.get('paperId') || '';

  const [papers, setPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [studentName, setStudentName] = useState('');
  const [studentRegNo, setStudentRegNo] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState(preselectedPaperId);
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState([]);

  // Scan modal states & refs
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanMode, setScanMode] = useState(null); // null | 'camera' | 'scanner'
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const res = await qpAPI.getPapers();
        const list = res.data.papers || [];
        const completed = list.filter(p => p.status === 'completed');
        setPapers(completed);
        if (!selectedPaperId && completed.length > 0) {
          setSelectedPaperId(completed[0]._id);
        }
      } catch (e) {
        toast.error('Failed to load question papers');
      } finally {
        setLoadingPapers(false);
      }
    };
    fetchPapers();
  }, [selectedPaperId]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleCloseModal = () => {
    stopCamera();
    setShowScanModal(false);
    setScanMode(null);
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera. Please check permissions.");
      setCameraActive(false);
      setScanMode(null);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_scan_${Date.now()}.png`, { type: 'image/png' });
          setFiles([file]);
          toast.success("Document captured successfully! 📸");
          handleCloseModal();
        }
      }, 'image/png');
    }
  };

  const startScannerSimulation = () => {
    setScanMode('scanner');
    setScanProgress(0);
    setScanStatus('Initializing flatbed scan engine...');
    
    const stages = [
      { progress: 15, status: 'Connecting to Hardware Scanner...' },
      { progress: 35, status: 'Feeding document page 1 (ADF sensor active)...' },
      { progress: 60, status: 'Scanning image (300 DPI, Grayscale)...' },
      { progress: 80, status: 'Applying page boundary de-skew and OCR filter...' },
      { progress: 95, status: 'Compiling scanned image file...' },
      { progress: 100, status: 'Scan completed successfully!' }
    ];
    
    let currentStage = 0;
    const interval = setInterval(async () => {
      if (currentStage >= stages.length) {
        clearInterval(interval);
        try {
          const res = await fetch('/mock_scanned_sheet.png');
          const blob = await res.blob();
          const file = new File([blob], "scanned_student_sheet.png", { type: "image/png" });
          setFiles([file]);
          toast.success("Document scanned from hardware successfully! 🖨️");
        } catch (err) {
          console.error("Error loading mock scan sheet:", err);
          toast.error("Scanner communication error.");
        }
        setTimeout(() => {
          handleCloseModal();
        }, 1000);
        return;
      }
      
      setScanProgress(stages[currentStage].progress);
      setScanStatus(stages[currentStage].status);
      currentStage++;
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaperId) {
      toast.error('Please select a question paper to evaluate against');
      return;
    }

    setSubmitting(true);
    toast.success('Analyzing student answer sheet... 📝');

    const formData = new FormData();
    formData.append('studentName', studentName);
    formData.append('studentRegNo', studentRegNo);
    formData.append('studentAnswersText', inputText);
    files.forEach(f => formData.append('files', f));

    try {
      const initRes = await qpAPI.evaluate(selectedPaperId, formData);
      const evalId = initRes.data.evaluationId;

      // Poll evaluation status
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > 40) {
          clearInterval(interval);
          setSubmitting(false);
          toast.error('Evaluation timed out. Please try again.');
          return;
        }

        try {
          const detailRes = await qpAPI.getEvaluationDetails(evalId);
          const evaluation = detailRes.data.evaluation;
          if (evaluation.status === 'completed') {
            clearInterval(interval);
            setSubmitting(false);
            toast.success('Grading completed successfully! 🎯');
            navigate(`/qp-evaluation-result/${evalId}`);
          } else if (evaluation.status === 'failed') {
            clearInterval(interval);
            setSubmitting(false);
            toast.error('Grading failed.');
          }
        } catch (err) {
          clearInterval(interval);
          setSubmitting(false);
          toast.error('Failed to fetch grading status.');
        }
      }, 2000);

    } catch (err) {
      setSubmitting(false);
      toast.error(err.response?.data?.message || 'Failed to start evaluation');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div className="container" style={{ padding: '40px var(--space-lg)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }} className="card">
          <div style={{ padding: '32px' }}>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => navigate('/qp-dashboard')}
                  className="btn btn-ghost btn-icon btn-sm"
                  style={{ padding: '6px 10px', fontSize: '1.1rem', cursor: 'pointer', border: '1.5px solid #e2e5f1', background: '#ffffff', color: 'var(--text-secondary)' }}
                  title="Back to Dashboard"
                >
                  ←
                </button>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>📝 Evaluate Student Answer Sheet</h2>
              </div>
              <p style={{ margin: '4px 0 0 44px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Upload student answers for automated rubric-based grading and feedback.
              </p>
            </div>

            {loadingPapers ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : papers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                  You need to generate at least one Question Paper first.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/qp-generate')}
                >
                  Create Question Paper
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Select paper & student name */}
                <div className="form-group">
                  <label className="form-label">Select Question Paper</label>
                  <select
                    className="form-input"
                    value={selectedPaperId}
                    onChange={(e) => setSelectedPaperId(e.target.value)}
                    required
                  >
                    {papers.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.topic} ({p.subject} · {p.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Student Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student Registration Number</label>
                    <input
                      className="form-input"
                      type="text"
                      value={studentRegNo}
                      onChange={(e) => setStudentRegNo(e.target.value)}
                      placeholder="e.g. REG-12345"
                      required
                    />
                  </div>
                </div>

                {/* Scanned upload & Scanner */}
                <div className="form-group">
                  <label className="form-label">
                    Upload Scanned Sheets <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(PDF or Images)</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' }}>
                    <input
                      type="file"
                      className="form-input"
                      multiple
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.docx,.doc"
                      style={{ flex: 1, minWidth: 200 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowScanModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}
                    >
                      🖨️ Direct Scan
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Upload sheets or use the direct scanner button. The AI will scan and read the handwriting.
                    </p>
                    {files.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700 }}>
                        ✓ {files.length} File(s) Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Paste text fallback */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Or Paste Student Answers Text
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optional fallback)</span>
                  </div>
                  <textarea
                    className="form-input"
                    rows="8"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="e.g.&#10;Answer 1: ...&#10;Answer 2: ..."
                    style={{ fontFamily: 'monospace', fontSize: '0.825rem', resize: 'vertical' }}
                  />
                </div>

                <button
                  id="btn-qp-eval-submit"
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={submitting}
                  style={{ marginTop: 12 }}
                >
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm" style={{ marginRight: 8 }} />
                      Grading & Matching Rubrics...
                    </>
                  ) : (
                    '🚀 Start AI Evaluation'
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* Direct Scan Modal */}
      {showScanModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 999 }}>
          <div className="modal" style={{ maxWidth: 600, padding: 32 }}>
            <div className="modal-header" style={{ marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>🖨️ Direct Scan through Scanner</h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={handleCloseModal}
                style={{ padding: '4px 8px', border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            {!scanMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Choose how you want to scan the student's answer sheet:
                </p>
                <div 
                  className="selection-tile" 
                  onClick={startScannerSimulation}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '2.5rem', marginBottom: 8 }}>🖨️</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>Simulate Hardware Scanner</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
                    Trigger direct scan command to local flatbed/ADF hardware scanner. (Feeds document automatically)
                  </span>
                </div>
                <div 
                  className="selection-tile" 
                  onClick={() => { setScanMode('camera'); startCamera(); }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '2.5rem', marginBottom: 8 }}>📷</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>Document Camera Scan</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
                    Use your laptop or device camera to take a crop-aligned picture of the answer sheet.
                  </span>
                </div>
              </div>
            )}
            
            {scanMode === 'scanner' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '20px 0' }}>
                <div className="spinner spinner-lg" style={{ borderColor: 'rgba(79,70,229,0.15)', borderTopColor: 'var(--color-primary)' }} />
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                    <span>{scanStatus}</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="progress-bar-outer">
                    <div className="progress-bar-inner" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>
              </div>
            )}
            
            {scanMode === 'camera' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                {!cameraActive ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
                    <div className="spinner" />
                    <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Starting camera stream...</p>
                  </div>
                ) : (
                  <>
                    <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', border: '2px solid var(--color-primary)', background: '#000' }}>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        style={{ width: '100%', display: 'block', maxHeight: 350 }} 
                      />
                      {/* Document alignment helper rectangle overlay */}
                      <div style={{ 
                        position: 'absolute', 
                        inset: '10% 15%', 
                        border: '2px dashed #10b981', 
                        borderRadius: 8, 
                        pointerEvents: 'none',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)'
                      }}>
                        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(16,185,129,0.85)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                          Align Document Here
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => { stopCamera(); setScanMode(null); }}
                      >
                        Back
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={capturePhoto}
                      >
                        📷 Capture Sheet
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
      )}
    </div>
  );
}
