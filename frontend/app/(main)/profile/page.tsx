'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { profileApi, Profile } from '@/lib/api';
import { Save, User } from 'lucide-react';

const objetivos = [
  { id: 'emagrecer', label: 'Emagrecer' },
  { id: 'manter', label: 'Manter peso' },
  { id: 'ganhar_massa', label: 'Ganhar massa muscular' },
  { id: 'saude_geral', label: 'Saúde geral' }
];

const restricoesOptions = [
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'vegano', label: 'Vegano' },
  { id: 'sem_lactose', label: 'Sem lactose' },
  { id: 'sem_gluten', label: 'Sem glúten' },
  { id: 'low_carb', label: 'Low carb' },
  { id: 'sem_acucar', label: 'Sem açúcar' }
];

export default function ProfilePage() {
  const [objetivo, setObjetivo] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [alergias, setAlergias] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const profile = await profileApi.get(token);
        setObjetivo(profile.objetivo || '');
        setRestricoes(profile.restricoes || []);
        setAlergias((profile.alergias || []).join(', '));
      } catch (err) {
        // Profile might not exist yet
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleToggleRestricao = (id: string) => {
    if (restricoes.includes(id)) {
      setRestricoes(restricoes.filter(r => r !== id));
    } else {
      setRestricoes([...restricoes, id]);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      await profileApi.update(token, {
        objetivo,
        restricoes,
        alergias: alergias.split(',').map(a => a.trim()).filter(Boolean)
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
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
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div className="ml-4">
            <p className="font-semibold">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">Plano {user?.plan}</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Objetivo Nutricional
          </label>
          <div className="grid grid-cols-2 gap-3">
            {objetivos.map((obj) => (
              <button
                key={obj.id}
                onClick={() => setObjetivo(obj.id)}
                className={`p-3 rounded-lg border-2 text-sm transition ${
                  objetivo === obj.id
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {obj.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Restrições Alimentares
          </label>
          <div className="flex flex-wrap gap-2">
            {restricoesOptions.map((rest) => (
              <button
                key={rest.id}
                onClick={() => handleToggleRestricao(rest.id)}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  restricoes.includes(rest.id)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rest.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alergias (separadas por vírgula)
          </label>
          <input
            type="text"
            value={alergias}
            onChange={(e) => setAlergias(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Ex: amendoim, camarão, leite"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
            Perfil atualizado com sucesso!
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Perfil'}
        </button>
      </div>

      <p className="text-sm text-gray-500 text-center">
        Essas informações ajudam a personalizar suas análises nutricionais.
      </p>
    </div>
  );
}
