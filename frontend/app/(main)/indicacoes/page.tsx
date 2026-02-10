'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { authApi, MyReferralsResponse } from '@/lib/api';
import { Users, TrendingUp, Gift, Copy, Check, Building2, User, Crown } from 'lucide-react';

export default function IndicacoesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<MyReferralsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const isPJ = user?.user_type === 'pj';
  const referralLink = user?.referral_code
    ? `https://picnutra.vercel.app/register?ref=${user.referral_code}`
    : '';

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const result = await authApi.getMyReferrals();
      setData(result);
    } catch (err) {
      console.error('Erro ao carregar indicacoes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
          isPJ
            ? 'bg-gradient-to-br from-violet-500 to-purple-500 shadow-violet-200'
            : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-200'
        }`}>
          {isPJ ? <Building2 className="w-6 h-6 text-white" /> : <Users className="w-6 h-6 text-white" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isPJ ? 'Painel do Parceiro' : 'Minhas Indicacoes'}
          </h1>
          <p className="text-sm text-gray-500">
            {isPJ ? 'Acompanhe seus indicados e comissoes' : 'Indique amigos e ganhe creditos'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <Users className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-2xl font-bold text-gray-900">{data?.total_referred || 0}</p>
          <p className="text-xs text-gray-500">Indicados</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <Gift className="w-6 h-6 mx-auto mb-2 text-violet-500" />
          <p className="text-2xl font-bold text-gray-900">{data?.total_credits_earned || 0}</p>
          <p className="text-xs text-gray-500">Creditos ganhos</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-amber-500" />
          <p className="text-2xl font-bold text-gray-900">{((data?.commission_rate || 0) * 100).toFixed(0)}%</p>
          <p className="text-xs text-gray-500">Comissao</p>
        </div>
      </div>

      <div className={`rounded-2xl p-5 border shadow-sm ${
        isPJ
          ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200'
          : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
      }`}>
        <h3 className="font-semibold text-gray-800 mb-3">Seu link de indicacao</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-white px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 truncate"
          />
          <button
            onClick={handleCopyLink}
            className={`px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
              linkCopiado
                ? 'bg-emerald-500 text-white'
                : isPJ
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-200'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-200'
            }`}
          >
            {linkCopiado ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar</>}
          </button>
        </div>
        <div className="mt-3 flex justify-center">
          <div className="bg-white p-3 rounded-xl border border-gray-200 inline-block">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(referralLink)}`}
              alt="QR Code"
              className="w-28 h-28"
            />
          </div>
        </div>
        {isPJ && (
          <p className="text-xs text-violet-600 mt-3 text-center">
            Codigo de parceiro: <span className="font-bold">{user?.referral_code}</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Pessoas indicadas</h3>
        </div>
        {data?.referred_users && data.referred_users.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {data.referred_users.map((ref) => (
              <div key={ref.id} className="px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{ref.name || 'Sem nome'}</p>
                  <p className="text-sm text-gray-500 truncate">{ref.email}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {ref.plan === 'pro' ? (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 text-xs font-medium px-2 py-1 rounded-full">
                        <Crown className="w-3 h-3" /> PRO
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Free</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ref.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">Nenhum indicado ainda</p>
            <p className="text-sm text-gray-400 mt-1">Compartilhe seu link para comecar a indicar</p>
          </div>
        )}
      </div>
    </div>
  );
}
