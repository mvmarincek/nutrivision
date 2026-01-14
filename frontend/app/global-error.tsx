'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nutrivision-api-dcr0.onrender.com';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
    
    try {
      fetch(`${API_URL}/log-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_message: error.message,
          error_stack: error.stack,
          error_type: 'global_error',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          extra_data: { digest: error.digest },
          timestamp: new Date().toISOString()
        })
      });
    } catch {}
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h2>
            <p className="text-gray-500 mb-6">
              Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => reset()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
