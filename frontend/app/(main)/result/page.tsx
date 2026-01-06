'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { mealsApi, MealDetail } from '@/lib/api';
import { CheckCircle, AlertTriangle, Lightbulb, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

function ResultContent() {
  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealId = searchParams.get('mealId');

  useEffect(() => {
    if (!token || !mealId) return;

    const fetchMeal = async () => {
      try {
        const result = await mealsApi.get(token, parseInt(mealId));
        setMeal(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();
  }, [token, mealId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Refeição não encontrada'}</p>
        <button onClick={() => router.push('/home')} className="mt-4 text-primary-600">
          Voltar
        </button>
      </div>
    );
  }

  const analysis = meal.analysis;
  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Análise não disponível</p>
        <button onClick={() => router.push('/home')} className="mt-4 text-primary-600">
          Voltar
        </button>
      </div>
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const getConfiancaColor = (confianca: string) => {
    switch (confianca) {
      case 'alto': return 'text-green-600 bg-green-100';
      case 'medio': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <button
        onClick={() => router.push('/home')}
        className="flex items-center text-gray-600 mb-4 hover:text-primary-600"
      >
        <ArrowLeft className="w-5 h-5 mr-1" /> Nova análise
      </button>

      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="relative h-48">
          <Image
            src={`${apiUrl}${meal.image_url}`}
            alt="Refeição"
            fill
            className="object-cover"
          />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Resultado da Análise</h2>
            <span className={`px-3 py-1 rounded-full text-sm ${getConfiancaColor(analysis.confianca)}`}>
              Confiança: {analysis.confianca}
            </span>
          </div>

          <div className="bg-primary-50 rounded-xl p-4 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">
                {analysis.calorias.central.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">kcal (estimativa)</p>
              <p className="text-xs text-gray-500 mt-1">
                Faixa: {analysis.calorias.min.toFixed(0)} - {analysis.calorias.max.toFixed(0)} kcal
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <p className="font-bold text-lg">{analysis.macros.proteina_g.toFixed(1)}g</p>
                <p className="text-xs text-gray-600">Proteína</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{analysis.macros.carbo_g.toFixed(1)}g</p>
                <p className="text-xs text-gray-600">Carboidratos</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{analysis.macros.gordura_g.toFixed(1)}g</p>
                <p className="text-xs text-gray-600">Gordura</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{(analysis.macros.fibra_g || 0).toFixed(1)}g</p>
                <p className="text-xs text-gray-600">Fibra</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Alimentos Identificados</h3>
            <div className="space-y-2">
              {analysis.itens_identificados.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{item.nome}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getConfiancaColor(item.confianca)}`}>
                    {item.confianca}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Porções Estimadas</h3>
            <div className="space-y-2">
              {analysis.porcoes_estimadas.map((porcao, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{porcao.item}</span>
                  <span className="text-sm text-gray-600">
                    {porcao.peso_g_ml_central.toFixed(0)}g ({porcao.faixa_min.toFixed(0)}-{porcao.faixa_max.toFixed(0)}g)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {analysis.beneficios.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> Benefícios
              </h3>
              <ul className="space-y-2">
                {analysis.beneficios.map((b, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-500 mr-2">+</span>
                    <span className="text-gray-700">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.pontos_de_atencao.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" /> Pontos de Atenção
              </h3>
              <ul className="space-y-2">
                {analysis.pontos_de_atencao.map((p, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-yellow-500 mr-2">!</span>
                    <span className="text-gray-700">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recomendacoes_praticas.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <Lightbulb className="w-5 h-5 text-blue-500 mr-2" /> Recomendações
              </h3>
              <ul className="space-y-2">
                {analysis.recomendacoes_praticas.map((r, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-500 mr-2">{idx + 1}.</span>
                    <span className="text-gray-700">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.incertezas.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-gray-600">Fontes de Incerteza</h3>
              <ul className="text-sm text-gray-500">
                {analysis.incertezas.map((i, idx) => (
                  <li key={idx}>- {i}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {analysis.sugestao_melhorada_texto && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Sugestão Melhorada</h3>
          <p className="text-gray-700 mb-4">{analysis.sugestao_melhorada_texto}</p>

          {analysis.mudancas_sugeridas && analysis.mudancas_sugeridas.length > 0 && (
            <div className="mb-4">
              <p className="font-medium mb-2">Mudanças sugeridas:</p>
              <ul className="list-disc list-inside text-gray-600">
                {analysis.mudancas_sugeridas.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.calorias_nova_versao && (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-green-700 mb-2">Valores da versão melhorada:</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Calorias: </span>
                  <span className="font-medium">{analysis.calorias_nova_versao.central.toFixed(0)} kcal</span>
                </div>
                {analysis.macros_nova_versao && (
                  <>
                    <div>
                      <span className="text-gray-600">Proteína: </span>
                      <span className="font-medium">{analysis.macros_nova_versao.proteina_g.toFixed(1)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Carboidratos: </span>
                      <span className="font-medium">{analysis.macros_nova_versao.carbo_g.toFixed(1)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Gordura: </span>
                      <span className="font-medium">{analysis.macros_nova_versao.gordura_g.toFixed(1)}g</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {analysis.sugestao_melhorada_imagem_url && (
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src={analysis.sugestao_melhorada_imagem_url}
                alt="Versão melhorada"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        Esta análise é informativa e não substitui orientação de nutricionista ou médico.
      </p>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
