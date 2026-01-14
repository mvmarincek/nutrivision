'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import BowlLogo from '@/components/BowlLogo';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
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
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
          >
            <Home className="w-4 h-4" />
            Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
