'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Salad, AlertCircle } from 'lucide-react';

let globalErrorModal = {
  open: false,
  title: '',
  message: '',
  listeners: new Set<() => void>()
};

function setGlobalError(title: string, message: string) {
  globalErrorModal.open = true;
  globalErrorModal.title = title;
  globalErrorModal.message = message;
  globalErrorModal.listeners.forEach(fn => fn());
}

function clearGlobalError() {
  globalErrorModal.open = false;
  globalErrorModal.title = '';
  globalErrorModal.message = '';
  globalErrorModal.listeners.forEach(fn => fn());
}

function subscribeToGlobalError(fn: () => void) {
  globalErrorModal.listeners.add(fn);
  return () => globalErrorModal.listeners.delete(fn);
}

function useGlobalErrorModal() {
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    return subscribeToGlobalError(() => forceUpdate(n => n + 1));
  }, []);
  
  return {
    open: globalErrorModal.open,
    title: globalErrorModal.title,
    message: globalErrorModal.message
  };
}

function ErrorModal() {
  const { open, title, message } = useGlobalErrorModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-red-50 border-red-200 border-2"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 rounded-full bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-red-800 mb-1">
                {title}
              </h3>
              <p className="text-sm text-red-700 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => clearGlobalError()}
              className="px-6 py-2 rounded-xl font-medium text-sm bg-red-600 hover:bg-red-700 text-white"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const errorState = useGlobalErrorModal();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (globalErrorModal.open) {
      return;
    }
    
    setLoading(true);

    try {
      await login(email, password);
      router.push('/home');
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || 'Erro ao fazer login';
      
      let title = 'Erro ao fazer login';
      let message = errorMessage;
      
      if (errorMessage.toLowerCase().includes('senha') || errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('incorrect') || errorMessage.toLowerCase().includes('invalid')) {
        title = 'Senha incorreta';
        message = 'A senha informada está incorreta. Verifique e tente novamente.';
      } else if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('user') || errorMessage.toLowerCase().includes('not found')) {
        title = 'Email não encontrado';
        message = 'Não encontramos uma conta com este email. Verifique o email ou crie uma nova conta.';
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('conexão') || errorMessage.toLowerCase().includes('fetch')) {
        title = 'Erro de conexão';
        message = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
      } else if (errorMessage.toLowerCase().includes('expirada') || errorMessage.toLowerCase().includes('expired')) {
        title = 'Sessão expirada';
        message = 'Sua sessão expirou. Faça login novamente.';
      }
      
      setGlobalError(title, message);
    }
  }, [email, password, login, router]);

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
          <p className="text-gray-600 mt-2">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
              disabled={loading || errorState.open}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Sua senha"
              required
              disabled={loading || errorState.open}
            />
            <div className="text-right mt-1">
              <Link href="/forgot-password" className="text-sm text-green-600 hover:underline">
                Esqueci minha senha
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || errorState.open}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center mt-4 text-gray-600">
            Não tem conta?{' '}
            <Link href="/register" className="text-primary-600 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>

      <ErrorModal />
    </div>
  );
}
