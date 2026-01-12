'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { mealsApi, MealListItem, MealStats } from '@/lib/api';
import Image from 'next/image';
import { Calendar, Trash2, Camera, TrendingUp, Award, Flame, Target, Zap, Trophy, Star, ChevronRight } from 'lucide-react';
import PageAds from '@/components/PageAds';

export default function HistoryPage() {
  const [meals, setMeals] = useState<MealListItem[]>([]);
  const [stats, setStats] = useState<MealStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mealsResult, statsResult] = await Promise.all([
          mealsApi.list(),
          mealsApi.getStats()
        ]);
        setMeals(mealsResult);
        setStats(statsResult);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

      {stats && stats.total_meals > 0 && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-green-500 via-teal-500 to-emerald-600 rounded-2xl p-5 text-white mb-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Seu nivel</p>
                  <p className="text-xl font-bold">{stats.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.total_meals}</p>
                <p className="text-sm opacity-90">analises</p>
              </div>
            </div>
            <div className="bg-white/20 rounded-full h-2 mb-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500" 
                style={{ width: `${stats.progress_to_next}%` }}
              />
            </div>
            <p className="text-xs opacity-80">
              {stats.level < 5 ? `${stats.next_level_at - stats.total_meals} analises para o proximo nivel` : 'Nivel maximo alcancado!'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 shadow-sm border text-center">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.streak}</p>
              <p className="text-xs text-gray-500">dias seguidos</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.meals_this_week}</p>
              <p className="text-xs text-gray-500">esta semana</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border text-center">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                <Target className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.week_avg_calorias}</p>
              <p className="text-xs text-gray-500">kcal media</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border text-center">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2">
                <Star className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.week_avg_proteina}g</p>
              <p className="text-xs text-gray-500">proteina</p>
            </div>
          </div>

          {stats.best_day && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Seu melhor dia</p>
                  <p className="text-sm text-gray-600">{stats.best_day} e o dia que voce mais usa o app!</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      )}

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
