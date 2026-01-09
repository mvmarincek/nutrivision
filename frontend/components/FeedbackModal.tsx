'use client';

import { useFeedback } from '@/lib/feedback';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const iconMap = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
  none: Info
};

const colorMap = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    text: 'text-red-700',
    button: 'bg-red-600 hover:bg-red-700 text-white',
    secondaryButton: 'bg-red-100 hover:bg-red-200 text-red-700'
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    title: 'text-green-800',
    text: 'text-green-700',
    button: 'bg-green-600 hover:bg-green-700 text-white',
    secondaryButton: 'bg-green-100 hover:bg-green-200 text-green-700'
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    title: 'text-amber-800',
    text: 'text-amber-700',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
    secondaryButton: 'bg-amber-100 hover:bg-amber-200 text-amber-700'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    text: 'text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondaryButton: 'bg-blue-100 hover:bg-blue-200 text-blue-700'
  },
  none: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: 'text-gray-500',
    title: 'text-gray-800',
    text: 'text-gray-700',
    button: 'bg-gray-600 hover:bg-gray-700 text-white',
    secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  }
};

export default function FeedbackModal() {
  const { feedback, clearFeedback } = useFeedback();

  if (!feedback || feedback.type === 'none') {
    return null;
  }

  const Icon = iconMap[feedback.type];
  const colors = colorMap[feedback.type];

  const handleAction = () => {
    if (feedback.action?.onClick) {
      feedback.action.onClick();
    } else {
      clearFeedback();
    }
  };

  const handleSecondaryAction = () => {
    if (feedback.secondaryAction?.onClick) {
      feedback.secondaryAction.onClick();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div 
        className={`
          w-full max-w-md rounded-2xl shadow-2xl overflow-hidden
          ${colors.bg} ${colors.border} border-2
          animate-in fade-in zoom-in-95 duration-200
        `}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        aria-describedby="feedback-message"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 p-2 rounded-full ${colors.bg}`}>
              <Icon className={`w-6 h-6 ${colors.icon}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              {feedback.title && (
                <h3 
                  id="feedback-title"
                  className={`text-lg font-semibold ${colors.title} mb-1`}
                >
                  {feedback.title}
                </h3>
              )}
              
              <p 
                id="feedback-message"
                className={`text-sm ${colors.text} leading-relaxed`}
              >
                {feedback.message}
              </p>
            </div>

            {!feedback.persistent && (
              <button
                onClick={clearFeedback}
                className={`flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors`}
                aria-label="Fechar"
              >
                <X className={`w-5 h-5 ${colors.icon}`} />
              </button>
            )}
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            {feedback.secondaryAction && (
              <button
                onClick={handleSecondaryAction}
                className={`
                  px-4 py-2 rounded-xl font-medium text-sm
                  transition-colors duration-200
                  ${colors.secondaryButton}
                `}
              >
                {feedback.secondaryAction.label}
              </button>
            )}
            
            <button
              onClick={handleAction}
              className={`
                px-6 py-2 rounded-xl font-medium text-sm
                transition-colors duration-200
                ${colors.button}
              `}
              autoFocus
            >
              {feedback.action?.label || 'OK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
