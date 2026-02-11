'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { authApi, partnerApi, MyReferralsResponse, PartnerDashboard, CommissionItem } from '@/lib/api';
import { Users, TrendingUp, Copy, Check, Building2, User, Crown, DollarSign, Wallet, ArrowDownToLine, KeyRound, AlertTriangle, CalendarDays, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function IndicacoesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<MyReferralsResponse | null>(null);
  const [dashboard, setDashboard] = useState<PartnerDashboard | null>(null);
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [savedPixKey, setSavedPixKey] = useState('');
  const [showPixInput, setShowPixInput] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [savingPix, setSavingPix] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'indicados' | 'comissoes'>('indicados');

  const isPJ = user?.user_type === 'pj';
  const referralLink = user?.referral_code
    ? `https://picnutra.vercel.app/register?ref=${user.referral_code}`
    : '';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [referrals, dashboardData, commissionsResult] = await Promise.all([
        authApi.getMyReferrals(),
        partnerApi.getDashboard(),
        partnerApi.getCommissions()
      ]);
      setData(referrals);
      setDashboard(dashboardData);
      setCommissions(commissionsResult.commissions);
      setPixKey(dashboardData.pix_key || '');
      setSavedPixKey(dashboardData.pix_key || '');
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
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

  const handleSavePixKey = async () => {
    if (!pixKey.trim()) return;
    setSavingPix(true);
    try {
      await partnerApi.updatePixKey(pixKey.trim());
      setSavedPixKey(pixKey.trim());
      setMessage('Chave PIX salva com sucesso!');
      setShowPixInput(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Erro ao salvar chave PIX');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSavingPix(false);
    }
  };

  const handleWithdraw = async () => {
    if (!pixKey.trim()) {
      setShowPixInput(true);
      return;
    }
    setWithdrawing(true);
    try {
      const result = await partnerApi.withdraw(pixKey.trim());
      setMessage(result.message);
      await loadData();
      setTimeout(() => setMessage(''), 5000);
    } catch (err: any) {
      setMessage(err?.message || 'Erro ao solicitar saque');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const accentFrom = isPJ ? 'from-violet-500' : 'from-emerald-500';
  const accentTo = isPJ ? 'to-purple-500' : 'to-teal-500';
  const accentBg = isPJ ? 'shadow-violet-200' : 'shadow-emerald-200';
  const accentText = isPJ ? 'text-violet-500' : 'text-emerald-500';
  const accentBorder = isPJ ? 'border-violet-200' : 'border-emerald-200';
  const accentBgLight = isPJ ? 'from-violet-50 to-purple-50' : 'from-emerald-50 to-teal-50';
  const commissionPct = dashboard ? (dashboard.commission_rate * 100).toFixed(0) : (isPJ ? '30' : '10');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br ${accentFrom} ${accentTo} ${accentBg}`}>
          {isPJ ? <Building2 className="w-6 h-6 text-white" /> : <Users className="w-6 h-6 text-white" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isPJ ? 'Painel do Parceiro' : 'Minhas Indicações'}
          </h1>
          <p className="text-sm text-gray-500">
            {isPJ
              ? 'Acompanhe seus indicados e comissões (30%)'
              : 'Indique amigos e ganhe comissão de 10%'}
          </p>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl p-3 text-sm font-medium text-center ${
          message.includes('Erro') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <Users className={`w-5 h-5 mx-auto mb-1.5 ${accentText}`} />
          <p className="text-2xl font-bold text-gray-900">{dashboard?.total_referred || data?.total_referred || 0}</p>
          <p className="text-xs text-gray-500">Indicados</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-1.5 text-emerald-500" />
          <p className="text-2xl font-bold text-gray-900">R${(dashboard?.total_revenue_generated || 0).toFixed(2)}</p>
          <p className="text-xs text-gray-500">Receita gerada</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
          <p className="text-2xl font-bold text-gray-900">R${(dashboard?.total_commission_earned || 0).toFixed(2)}</p>
          <p className="text-xs text-gray-500">Comissão total ({commissionPct}%)</p>
        </div>
        <div className={`bg-gradient-to-br ${accentFrom} ${isPJ ? 'to-purple-600' : 'to-teal-600'} rounded-2xl p-4 shadow-sm text-center text-white`}>
          <Wallet className="w-5 h-5 mx-auto mb-1.5 text-white/80" />
          <p className="text-2xl font-bold">R${(dashboard?.commission_balance || 0).toFixed(2)}</p>
          <p className="text-xs text-white/70">Saldo disponível</p>
        </div>
      </div>



      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <KeyRound className={`w-4 h-4 ${accentText}`} />
            Chave PIX para saque
          </h3>
          {!showPixInput && savedPixKey && (
            <button
              onClick={() => setShowPixInput(true)}
              className={`text-xs ${isPJ ? 'text-violet-600' : 'text-emerald-600'} hover:underline`}
            >
              Alterar
            </button>
          )}
        </div>
        
        {showPixInput || !savedPixKey ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, CNPJ, email ou telefone"
              className="flex-1 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
            <button
              onClick={handleSavePixKey}
              disabled={savingPix || !pixKey.trim()}
              className={`px-4 py-2.5 ${isPJ ? 'bg-violet-500 hover:bg-violet-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-xl text-sm font-medium disabled:opacity-50`}
            >
              {savingPix ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600 bg-gray-50 px-4 py-2.5 rounded-xl">{savedPixKey}</p>
        )}
      </div>

      <div className={`rounded-2xl p-5 border shadow-sm bg-gradient-to-r ${accentBgLight} ${accentBorder}`}>
        <h3 className="font-semibold text-gray-800 mb-3">Seu link de indicação</h3>
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
                : `bg-gradient-to-r ${accentFrom} ${accentTo} text-white hover:shadow-lg ${accentBg}`
            }`}
          >
            {linkCopiado ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar</>}
          </button>
        </div>
        <div className="mt-3 flex justify-center">
          <div className="bg-white p-3 rounded-xl border border-gray-200 inline-block">
            {referralLink ? (
              <QRCodeSVG key={referralLink} value={referralLink} size={112} level="M" />
            ) : (
              <div className="w-[112px] h-[112px] flex items-center justify-center text-xs text-gray-400">Carregando...</div>
            )}
          </div>
        </div>
        <p className={`text-xs ${isPJ ? 'text-violet-600' : 'text-emerald-600'} mt-3 text-center`}>
          Seu código: <span className="font-bold">{user?.referral_code}</span>
        </p>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Campanha de lançamento por tempo limitado!</p>
            <p className="text-xs text-amber-700 mt-1">As comissões de indicação são uma promoção especial de lançamento e podem ser encerradas a qualquer momento.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CalendarDays className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Os bônus acumulados são pagos no <strong>último dia útil de cada mês</strong> via PIX.</p>
        </div>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Comissões só são geradas quando o indicado <strong>assina um plano pago</strong>. Indicados no plano Free não geram bônus.</p>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('indicados')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'indicados'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Indicados
        </button>
        <button
          onClick={() => setActiveTab('comissoes')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'comissoes'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Comissões ({commissions.length})
        </button>
      </div>

      {activeTab === 'indicados' && (
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
                    <div className="flex items-center gap-2 mt-1">
                      {ref.has_active_subscription ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          Assinatura ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
                          Sem assinatura
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {ref.plan === 'basic' || ref.plan === 'pro' || ref.plan === 'premium' ? (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 text-xs font-medium px-2 py-1 rounded-full">
                          <Crown className="w-3 h-3" /> {ref.plan.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Free</span>
                      )}
                    </div>
                    {ref.commission_generated > 0 && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">Bônus: R${ref.commission_generated.toFixed(2)}</p>
                    )}
                    {ref.total_paid > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">Pagou: R${ref.total_paid.toFixed(2)}</p>
                    )}
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
              <p className="text-sm text-gray-400 mt-1">Compartilhe seu link para começar a indicar</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'comissoes' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Histórico de comissões</h3>
          </div>
          {commissions.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {commissions.map((c) => (
                <div key={c.id} className="px-5 py-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${isPJ ? 'from-violet-100 to-purple-100' : 'from-emerald-100 to-teal-100'} flex items-center justify-center`}>
                    <DollarSign className={`w-5 h-5 ${isPJ ? 'text-violet-600' : 'text-emerald-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{c.referred_user_name || c.referred_user_email}</p>
                    <p className="text-sm text-gray-500">Pagamento: R${c.payment_amount.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">+R${c.commission_amount.toFixed(2)}</p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                      c.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : c.status === 'withdrawal_requested'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {c.status === 'paid' ? 'Pago' : c.status === 'withdrawal_requested' ? 'Saque solicitado' : 'Pendente'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">Nenhuma comissão ainda</p>
              <p className="text-sm text-gray-400 mt-1">Comissões aparecerão quando seus indicados fizerem pagamentos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
