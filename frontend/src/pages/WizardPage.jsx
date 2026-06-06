import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWizard, WizardProvider } from '../context/WizardContext';
import { generateAPI } from '../api';
import toast from 'react-hot-toast';

import Step1_Board from '../components/wizard/Step1_Board';
import Step2_Grade from '../components/wizard/Step2_Grade';
import Step3_Subject from '../components/wizard/Step3_Subject';
import Step4_Topics from '../components/wizard/Step4_Topics';
import Step5_ClassConfig from '../components/wizard/Step5_ClassConfig';
import Step6_Images from '../components/wizard/Step6_Images';
import Step7_Upload from '../components/wizard/Step7_Upload';
import Step8_Generate from '../components/wizard/Step8_Generate';

const STEPS = [
  { number: 1, label: 'Board', icon: '🏫' },
  { number: 2, label: 'Grade', icon: '📚' },
  { number: 3, label: 'Subject', icon: '📐' },
  { number: 4, label: 'Topics', icon: '📑' },
  { number: 5, label: 'Class Config', icon: '⏱️' },
  { number: 6, label: 'Images', icon: '🖼️' },
  { number: 7, label: 'Upload', icon: '📂' },
  { number: 8, label: 'Generate', icon: '🤖' },
];

function WizardInner() {
  const { currentStep, state, nextStep, prevStep } = useWizard();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [generationId, setGenerationId] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('board', state.board);
      formData.append('grade', state.grade);
      formData.append('subject', state.subject);
      formData.append('topic', state.topic);
      state.subTopics.forEach(st => formData.append('subTopics', st));
      formData.append('slideCount', state.slideCount);
      formData.append('classDuration', state.classDuration);
      formData.append('imagePreference', state.imagePreference);
      formData.append('difficultyLevel', state.difficultyLevel);
      state.files.forEach(f => formData.append('files', f));

      const res = await generateAPI.generate(formData);
      setGenerationId(res.data.generationId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start generation');
      setGenerating(false);
    }
  };

  const handleGenerationComplete = (id) => {
    navigate(`/preview/${id}`);
  };

  const stepProps = { onNext: nextStep, onBack: prevStep };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1_Board {...stepProps} />;
      case 2: return <Step2_Grade {...stepProps} />;
      case 3: return <Step3_Subject {...stepProps} />;
      case 4: return <Step4_Topics {...stepProps} />;
      case 5: return <Step5_ClassConfig {...stepProps} />;
      case 6: return <Step6_Images {...stepProps} />;
      case 7: return <Step7_Upload {...stepProps} onGenerate={() => { nextStep(); handleGenerate(); }} />;
      case 8: return (
        <Step8_Generate
          generationId={generationId}
          onComplete={handleGenerationComplete}
          isStarted={generating || !!generationId}
          onStart={handleGenerate}
        />
      );
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="logo-icon">🎓</div>
          AI Teacher Suite
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Step {currentStep} of 8
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            ✕ Exit
          </button>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="progress-bar-outer" style={{ borderRadius: 0, height: 3 }}>
        <div
          className="progress-bar-inner"
          style={{ width: `${(currentStep / 8) * 100}%` }}
        />
      </div>

      <div className="wizard-layout">
        {/* Sidebar */}
        <aside className="wizard-sidebar">
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
            Progress
          </p>
          {STEPS.map(step => {
            const status = currentStep === step.number ? 'active' : currentStep > step.number ? 'completed' : 'upcoming';
            return (
              <div key={step.number} className={`wizard-step-item ${status}`}>
                <div className="wizard-step-number">
                  {status === 'completed' ? '✓' : step.icon}
                </div>
                <span className="wizard-step-label">{step.label}</span>
              </div>
            );
          })}

          {/* Summary */}
          {(state.board || state.grade || state.subject) && (
            <div style={{ marginTop: 'auto', padding: '16px 12px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.78rem' }}>
              <p style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Selected
              </p>
              {state.board && <p style={{ color: 'var(--text-secondary)', margin: '4px 0' }}>📌 {state.board}</p>}
              {state.grade && <p style={{ color: 'var(--text-secondary)', margin: '4px 0' }}>📚 {state.grade}</p>}
              {state.subject && <p style={{ color: 'var(--text-secondary)', margin: '4px 0' }}>📐 {state.subject}</p>}
              {state.topic && <p style={{ color: 'var(--text-secondary)', margin: '4px 0', fontWeight: 600 }}>📑 {state.topic}</p>}
            </div>
          )}
        </aside>

        {/* Content */}
        <main style={{ overflow: 'auto' }}>
          {renderStep()}
        </main>
      </div>
    </div>
  );
}

export default function WizardPage() {
  return (
    <WizardProvider>
      <WizardInner />
    </WizardProvider>
  );
}
