import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useWizard } from '../../context/WizardContext';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FILE_ICONS = {
  'application/pdf': '📄',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'text/plain': '📃'
};

export default function Step7_Upload({ onBack, onGenerate }) {
  const { state, updateState } = useWizard();

  const onDrop = useCallback(accepted => {
    const newFiles = [...(state.files || [])];
    accepted.forEach(f => {
      if (!newFiles.find(existing => existing.name === f.name)) {
        newFiles.push(f);
      }
    });
    updateState({ files: newFiles });
  }, [state.files, updateState]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt']
    },
    maxSize: MAX_SIZE,
    maxFiles: 5
  });

  const removeFile = (name) => {
    updateState({ files: state.files.filter(f => f.name !== name) });
  };

  return (
    <div className="wizard-content">
      <h2>Upload Reference Material</h2>
      <p className="step-description">
        Optionally upload your own notes, textbook pages, or slides. The AI will use them as primary context.
      </p>

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} id="file-upload-input" />
        <span className="dropzone-icon">📂</span>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 8px' }}>
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          or click to browse
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['PDF', 'DOCX', 'PPTX', 'JPG', 'PNG'].map(t => (
            <span key={t} className="badge" style={{ background: 'var(--color-surface-3)', color: 'var(--text-muted)' }}>
              {t}
            </span>
          ))}
          <span className="badge" style={{ background: 'var(--color-surface-3)', color: 'var(--text-muted)' }}>
            Max 20MB each
          </span>
        </div>
      </div>

      {state.files && state.files.length > 0 && (
        <div className="uploaded-files">
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Uploaded ({state.files.length} file{state.files.length > 1 ? 's' : ''})
          </p>
          {state.files.map(f => (
            <div key={f.name} className="uploaded-file-item">
              <span style={{ fontSize: '1.2rem' }}>{FILE_ICONS[f.type] || '📎'}</span>
              <span className="uploaded-file-name">{f.name}</span>
              <span className="uploaded-file-size">{formatBytes(f.size)}</span>
              <button
                className="btn btn-danger btn-icon btn-sm"
                onClick={() => removeFile(f.name)}
                title="Remove file"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          ✅ Configuration Summary
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <div>📌 Board: <strong>{state.board}</strong></div>
          <div>📚 Grade: <strong>{state.grade}</strong></div>
          <div>📐 Subject: <strong>{state.subject}</strong></div>
          <div>📑 Topic: <strong>{state.topic}</strong></div>
          <div>⏱️ Duration: <strong>{state.classDuration} min</strong></div>
          <div>🗂️ Slides: <strong>{state.slideCount}</strong></div>
          <div>📊 Difficulty: <strong>{state.difficultyLevel}</strong></div>
          <div>🖼️ Images: <strong>{state.imagePreference}</strong></div>
        </div>
      </div>

      <div className="wizard-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          id="btn-generate-now"
          className="btn btn-primary btn-lg"
          onClick={onGenerate}
          style={{ gap: 10 }}
        >
          🤖 Generate Now
        </button>
      </div>
    </div>
  );
}
