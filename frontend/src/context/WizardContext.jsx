import { createContext, useContext, useState } from 'react';

const WizardContext = createContext(null);

const INITIAL_STATE = {
  board: '',
  grade: '',
  subject: '',
  topic: '',
  subTopics: [],
  slideCount: 15,
  classDuration: 45,
  imagePreference: 'ai',
  difficultyLevel: 'intermediate',
  files: []
};

export const WizardProvider = ({ children }) => {
  const [state, setState] = useState(INITIAL_STATE);
  const [currentStep, setCurrentStep] = useState(1);

  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => setCurrentStep(s => Math.min(s + 1, 8));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));
  const goToStep = (step) => setCurrentStep(step);
  const resetWizard = () => { setState(INITIAL_STATE); setCurrentStep(1); };

  return (
    <WizardContext.Provider value={{
      state, updateState, currentStep, nextStep, prevStep, goToStep, resetWizard
    }}>
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
};
