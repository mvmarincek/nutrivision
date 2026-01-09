'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type FeedbackType = 'none' | 'error' | 'success' | 'warning' | 'info';

export interface Feedback {
  type: FeedbackType;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface FeedbackContextType {
  feedback: Feedback | null;
  showError: (message: string, title?: string, action?: Feedback['action']) => void;
  showSuccess: (message: string, title?: string, action?: Feedback['action']) => void;
  showWarning: (message: string, title?: string, action?: Feedback['action']) => void;
  showInfo: (message: string, title?: string, action?: Feedback['action']) => void;
  showFeedback: (feedback: Feedback) => void;
  clearFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const showError = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    setFeedback({
      type: 'error',
      title: title || 'Erro',
      message,
      action: action || { label: 'Entendi', onClick: () => setFeedback(null) },
      persistent: true
    });
  }, []);

  const showSuccess = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    setFeedback({
      type: 'success',
      title: title || 'Sucesso',
      message,
      action: action || { label: 'OK', onClick: () => setFeedback(null) },
      persistent: true
    });
  }, []);

  const showWarning = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    setFeedback({
      type: 'warning',
      title: title || 'Atenção',
      message,
      action: action || { label: 'Entendi', onClick: () => setFeedback(null) },
      persistent: true
    });
  }, []);

  const showInfo = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    setFeedback({
      type: 'info',
      title: title || 'Informação',
      message,
      action: action || { label: 'OK', onClick: () => setFeedback(null) },
      persistent: true
    });
  }, []);

  const showFeedback = useCallback((fb: Feedback) => {
    setFeedback({
      ...fb,
      persistent: fb.persistent !== false
    });
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  return (
    <FeedbackContext.Provider value={{
      feedback,
      showError,
      showSuccess,
      showWarning,
      showInfo,
      showFeedback,
      clearFeedback
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
