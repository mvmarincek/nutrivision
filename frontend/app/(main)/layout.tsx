'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Home, History, CreditCard, User, LogOut } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/home" className="text-xl font-bold text-primary-600">Nutri-Vision</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.credit_balance} créditos
            </span>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-3">
            <Link href="/home" className="flex flex-col items-center text-gray-600 hover:text-primary-600">
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Início</span>
            </Link>
            <Link href="/history" className="flex flex-col items-center text-gray-600 hover:text-primary-600">
              <History className="w-6 h-6" />
              <span className="text-xs mt-1">Histórico</span>
            </Link>
            <Link href="/billing" className="flex flex-col items-center text-gray-600 hover:text-primary-600">
              <CreditCard className="w-6 h-6" />
              <span className="text-xs mt-1">Créditos</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center text-gray-600 hover:text-primary-600">
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Perfil</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
