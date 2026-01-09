'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useFeedback } from '@/lib/feedback';
import { Salad, ArrowLeft, Mail, UserPlus } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { showError, showSuccess, clearFeedback } = useFeedback();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setNotFound(false);
    setLoading(true);

    try {
      const result = await authApi.forgotPassword(email);
      if (result.exists === false) {
        setNotFound(true);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || 'Erro ao enviar email';
      
      if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('conexão') || errorMessage.toLowerCase().includes('fetch')) {
        showError(
          'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
          'Erro de conexão',
          {
            label: 'Tentar novamente',
            onClick: () => clearFeedback()
          }
        );
      } else {
        showError(
          errorMessage,
          'Erro ao enviar email',
          {
            label: 'Tentar novamente',
            onClick: () => clearFeedback()
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center shadow-lg">
                <Salad className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                Nutri-Vision
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email nao encontrado</h2>
            <p className="text-gray-600 mb-6">
              O email <strong>{email}</strong> nao esta cadastrado. Que tal criar uma conta?
            </p>
            <button
              onClick={() => router.push('/register')}
              className="w-full gradient-fresh text-white py-3 rounded-lg font-semibold hover:shadow-lg mb-3"
            >
              Criar conta gratis
            </button>
            <button
              onClick={() => { setNotFound(false); setEmail(''); }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Tentar outro email
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center shadow-lg">
                <Salad className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
                Nutri-Vision
              </span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email enviado!</h2>
            <p className="text-gray-600 mb-6">
              Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <Link 
              href="/login" 
              className="inline-block w-full gradient-fresh text-white py-3 rounded-lg font-semibold hover:shadow-lg text-center"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl gradient-fresh flex items-center justify-center shadow-lg">
              <Salad className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
              Nutri-Vision
            </span>
          </Link>
          <p className="text-gray-600 mt-2">Recuperar senha</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <Link href="/login" className="flex items-center text-gray-500 mb-6 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Link>

          <p className="text-gray-600 mb-4">
            Digite seu email e enviaremos instruções para redefinir sua senha.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-fresh text-white py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar email de recuperação'}
          </button>
        </form>
      </div>
    </div>
  );
}
