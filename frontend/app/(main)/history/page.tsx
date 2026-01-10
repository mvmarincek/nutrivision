'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { mealsApi, MealListItem } from '@/lib/api';
import Image from 'next/image';
import { Calendar, Trash2, Camera, TrendingUp, Award } from 'lucide-react';
import PageAds from '@/components/PageAds';

export default function HistoryPage() {
  const [meals, setMeals] = useState<MealListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const result = await mealsApi.list();
        setMeals(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, []);

  const handleDelete = async (mealId: number) => {
    if (!confirm('Excluir esta análise?')) return;

    try {
      await mealsApi.delete(mealId);
      setMeals(meals.filter(m => m.id !== mealId));
    } catch (err) {
      console.error(err);
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case 'prato': return 'Prato';
      case 'sobremesa': return 'Sobremesa';
      case 'bebida': return 'Bebida';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'Concluído', color: 'bg-green-100 text-green-700' };
      case 'analyzing': return { label: 'Analisando', color: 'bg-yellow-100 text-yellow-700' };
      case 'failed': return { label: 'Erro', color: 'bg-red-100 text-red-700' };
      default: return { label: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Historico de Analises</h1>

      {meals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
            <Camera className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Comece sua jornada nutricional</h2>
          <p className="text-gray-600 mb-6">Voce ainda nao tem analises. Tire uma foto da sua refeicao e descubra informacoes nutricionais detalhadas!</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-left">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <Camera className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Fotografe</h3>
              <p className="text-xs text-gray-600">Tire uma foto do seu prato</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Analise</h3>
              <p className="text-xs text-gray-600">IA identifica nutrientes</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Melhore</h3>
              <p className="text-xs text-gray-600">Receba dicas personalizadas</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/home')}
            className="gradient-fresh text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
          >
            Fazer primeira analise
          </button>
        </div>
      ) : (
        <>
          <PageAds position="top" />
          <div className="space-y-4">
            {meals.map((meal, index) => {
              const status = getStatusLabel(meal.status);
              return (
                <div key={meal.id}>
                  {index > 0 && index % 3 === 0 && (
                    <div className="mb-4">
                      <PageAds position="inline" />
                    </div>
                  )}
                  <div
                    className="bg-white rounded-xl shadow-md overflow-hidden flex"
                  >
                    <div
                      className="relative w-24 h-24 flex-shrink-0 cursor-pointer"
                      onClick={() => meal.status === 'completed' && router.push(`/result?mealId=${meal.id}`)}
                    >
                      <Image
                        src={`${apiUrl}${meal.image_url}`}
                        alt="Refeição"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{getMealTypeLabel(meal.meal_type)}</p>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(meal.created_at)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {meal.calorias_central && (
                          <p className="text-sm text-primary-600 font-medium">
                            {meal.calorias_central.toFixed(0)} kcal
                          </p>
                        )}
                        <div className="flex gap-2">
                          {meal.status === 'completed' && (
                            <button
                              onClick={() => router.push(`/result?mealId=${meal.id}`)}
                              className="text-sm text-primary-600 hover:underline"
                            >
                              Ver detalhes
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(meal.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <PageAds position="bottom" />
        </>
      )}
    </div>
  );
}
