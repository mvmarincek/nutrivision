'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Flame, TrendingUp, BarChart3, Gift, Camera } from 'lucide-react';
import BowlLogo from '@/components/BowlLogo';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

interface MealHistory {
  id: number;
  meal_type: string;
  image_url: string;
  created_at: string;
  calorias: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  fibra: number;
}

interface PublicHistory {
  user_name: string;
  referral_code: string | null;
  total_meals: number;
  averages: {
    calorias: number;
    proteina: number;
    carboidrato: number;
    gordura: number;
    fibra: number;
  };
  meals: MealHistory[];
}

export default function PublicHistoryPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<PublicHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nutrivision-api-dcr0.onrender.com';

  useEffect(() => {
    if (!token) return;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`${apiUrl}/profile/public/${token}`);
        if (!response.ok) {
          throw new Error('Histórico não encontrado');
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar histórico');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, apiUrl]);

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'prato': 'Prato',
      'sobremesa': 'Sobremesa',
      'bebida': 'Bebida',
      'lanche': 'Lanche',
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-xl">
            <BowlLogo className="w-10 h-10 text-white" />
          </div>
          <p className="text-emerald-700 font-medium">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Histórico não encontrado</h1>
          <p className="text-gray-500">O link pode estar incorreto ou expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <header className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white p-6 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BowlLogo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">PicNutra</h1>
              <p className="text-emerald-100 text-sm">Histórico Nutricional</p>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-emerald-100 text-sm mb-1">Histórico de</p>
            <p className="text-xl font-bold">{data.user_name}</p>
            <p className="text-emerald-100 text-sm mt-1">{data.total_meals} análises realizadas</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        <div className="bg-white rounded-3xl shadow-xl p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Médias Nutricionais
          </h2>
          
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center p-2 bg-orange-50 rounded-xl">
              <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <p className="font-bold text-gray-900 text-sm">{data.averages.calorias.toFixed(0)}</p>
              <p className="text-[10px] text-gray-500">kcal</p>
            </div>
            <div className="text-center p-2 bg-rose-50 rounded-xl">
              <p className="text-lg mb-1">🥩</p>
              <p className="font-bold text-gray-900 text-sm">{data.averages.proteina.toFixed(1)}g</p>
              <p className="text-[10px] text-gray-500">prot</p>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded-xl">
              <p className="text-lg mb-1">🍞</p>
              <p className="font-bold text-gray-900 text-sm">{data.averages.carboidrato.toFixed(1)}g</p>
              <p className="text-[10px] text-gray-500">carbo</p>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded-xl">
              <p className="text-lg mb-1">🧈</p>
              <p className="font-bold text-gray-900 text-sm">{data.averages.gordura.toFixed(1)}g</p>
              <p className="text-[10px] text-gray-500">gord</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-xl">
              <p className="text-lg mb-1">🥬</p>
              <p className="font-bold text-gray-900 text-sm">{data.averages.fibra.toFixed(1)}g</p>
              <p className="text-[10px] text-gray-500">fibra</p>
            </div>
          </div>
        </div>

        {data.referral_code && (
          <button
            onClick={() => setShowQRModal(true)}
            className="w-full mb-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
          >
            <Camera className="w-6 h-6" />
            <span className="font-bold text-lg">Começar Grátis</span>
            <Gift className="w-5 h-5 text-yellow-300" />
          </button>
        )}

        {showQRModal && data.referral_code && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQRModal(false)}>
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Indicação de {data.user_name.split(' ')[0]}</h3>
                <p className="text-gray-500 text-sm mt-1">Escaneie o QR Code para criar sua conta com bônus!</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 flex justify-center mb-4">
                <QRCodeSVG 
                  value={`https://picnutra.vercel.app/register?ref=${data.referral_code}`}
                  size={180}
                  level="M"
                />
              </div>

              <div className="text-center mb-4">
                <p className="text-emerald-600 font-bold">🎁 Ganhe créditos de bônus!</p>
                <p className="text-gray-500 text-xs mt-1">Ao se cadastrar com esta indicação</p>
              </div>

              <a
                href={`https://picnutra.vercel.app/register?ref=${data.referral_code}`}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                Criar minha conta grátis
              </a>

              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-3 mt-2 text-gray-500 font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          Refeições Recentes
        </h2>

        <div className="space-y-3 pb-8">
          {data.meals.map((meal) => (
            <div key={meal.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="flex">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={meal.image_url?.startsWith('http') ? meal.image_url : `${apiUrl}${meal.image_url}`}
                    alt="Refeição"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{getMealTypeLabel(meal.meal_type)}</p>
                      <p className="text-xs text-gray-500">{formatDate(meal.created_at)}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                      {meal.calorias.toFixed(0)} kcal
                    </span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>P: {meal.proteina.toFixed(0)}g</span>
                    <span>C: {meal.carboidrato.toFixed(0)}g</span>
                    <span>G: {meal.gordura.toFixed(0)}g</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pb-8">
          <p className="text-xs text-gray-400">
            Histórico gerado pelo PicNutra
          </p>
        </div>
      </div>
    </div>
  );
}
