'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/billing');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-white rounded-xl shadow-md p-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h1>
          <p className="text-gray-600 mb-6">
            Seus créditos foram adicionados à sua conta.
          </p>
          <button
            onClick={() => router.push('/home')}
            className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Fazer uma Análise
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Redirecionando em 5 segundos...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto"></div>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
