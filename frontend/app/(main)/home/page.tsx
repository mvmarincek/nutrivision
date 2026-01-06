'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { mealsApi } from '@/lib/api';
import { Camera, Upload, UtensilsCrossed, Cake, Coffee } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const mealTypes = [
  { id: 'prato', label: 'Prato', icon: UtensilsCrossed },
  { id: 'sobremesa', label: 'Sobremesa', icon: Cake },
  { id: 'bebida', label: 'Bebida', icon: Coffee }
];

export default function HomePage() {
  const [mealType, setMealType] = useState('prato');
  const [mode, setMode] = useState<'simple' | 'full'>('simple');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { user, token } = useAuth();
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(selectedFile, options);
      setFile(compressedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      setError('Erro ao processar imagem');
    }
  };

  const handleAnalyze = async () => {
    if (!file || !token) return;

    const cost = mode === 'full' ? 12 : 5;
    if (user && user.credit_balance < cost && user.pro_analyses_remaining <= 0) {
      setError(`Créditos insuficientes. Necessário: ${cost}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const uploadResult = await mealsApi.upload(token, file, mealType);
      const analyzeResult = await mealsApi.analyze(token, uploadResult.meal_id, mode);
      
      router.push(`/processing?jobId=${analyzeResult.job_id}&mealId=${uploadResult.meal_id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar análise');
      setLoading(false);
    }
  };

  const cost = mode === 'full' ? 12 : 5;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">Nova Análise</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Refeição</label>
          <div className="grid grid-cols-3 gap-3">
            {mealTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setMealType(type.id)}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${
                  mealType === type.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <type.icon className={`w-6 h-6 ${mealType === type.id ? 'text-primary-600' : 'text-gray-400'}`} />
                <span className={`text-sm ${mealType === type.id ? 'text-primary-600 font-medium' : 'text-gray-600'}`}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Modo de Análise</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('simple')}
              className={`p-4 rounded-lg border-2 text-left transition ${
                mode === 'simple'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className={`font-medium ${mode === 'simple' ? 'text-primary-600' : 'text-gray-700'}`}>
                Simples
              </p>
              <p className="text-xs text-gray-500 mt-1">5 créditos</p>
            </button>
            <button
              onClick={() => setMode('full')}
              className={`p-4 rounded-lg border-2 text-left transition ${
                mode === 'full'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className={`font-medium ${mode === 'full' ? 'text-primary-600' : 'text-gray-700'}`}>
                Completa
              </p>
              <p className="text-xs text-gray-500 mt-1">12 créditos + imagem sugerida</p>
            </button>
          </div>
        </div>

        {preview ? (
          <div className="mb-6">
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full rounded-lg" />
              <button
                onClick={() => { setPreview(null); setFile(null); }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
              >
                X
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-primary-50 transition"
              >
                <Camera className="w-10 h-10 text-gray-400" />
                <span className="text-sm text-gray-600">Tirar Foto</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-primary-50 transition"
              >
                <Upload className="w-10 h-10 text-gray-400" />
                <span className="text-sm text-gray-600">Enviar Imagem</span>
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="w-full bg-primary-500 text-white py-4 rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : `Analisar (${cost} créditos)`}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Saldo atual: {user?.credit_balance} créditos
          {user?.pro_analyses_remaining ? ` | ${user.pro_analyses_remaining} análises Pro` : ''}
        </p>
      </div>
    </div>
  );
}
