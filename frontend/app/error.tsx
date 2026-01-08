'use client';

import { useEffect } from 'react';
import { logClientError } from '@/lib/api';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError(error, {});
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-teal-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Algo deu errado</h2>
        <p className="text-gray-600 mb-6">
          Ocorreu um erro inesperado. Por favor, tente novamente.
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
