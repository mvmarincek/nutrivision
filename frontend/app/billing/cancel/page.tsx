'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="bg-white rounded-xl shadow-md p-8">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pagamento Cancelado</h1>
          <p className="text-gray-600 mb-6">
            O pagamento foi cancelado. Nenhuma cobrança foi realizada.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/billing')}
              className="w-full bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => router.push('/home')}
              className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
