'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useFeedback } from '@/lib/feedback';
import { billingApi, BillingStatus } from '@/lib/api';
import { CreditCard, Star, Zap, QrCode, Copy, Check, X, Crown, Loader2, ChevronLeft, Sparkles, Ban, Bot } from 'lucide-react';

interface PixPaymentData {
  payment_id: string;
  pix_code: string;
  pix_qr_code_base64: string;
  value: number;
}

interface CardFormData {
  card_holder_name: string;
  card_number: string;
  expiry: string;
  cvv: string;
  holder_cpf: string;
  holder_phone: string;
  postal_code: string;
  address_number: string;
}

const initialCardForm: CardFormData = {
  card_holder_name: '',
  card_number: '',
  expiry: '',
  cvv: '',
  holder_cpf: '',
  holder_phone: '',
  postal_code: '',
  address_number: ''
};

export default function BillingPage() {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixCpf, setPixCpf] = useState('');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [cardForm, setCardForm] = useState<CardFormData>(initialCardForm);
  const [showProModal, setShowProModal] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<'basic' | 'pro' | 'premium'>('pro');
  const [proPaymentMethod, setProPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | null>(null);
  const [proPixData, setProPixData] = useState<PixPaymentData | null>(null);
  const [processingPro, setProcessingPro] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [testingPayment, setTestingPayment] = useState(false);
  const { user, refreshUser } = useAuth();
  const { showError, showSuccess, showWarning, clearFeedback } = useFeedback();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshUser();
        const status = await billingApi.getStatus();
        setBillingStatus(status);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (proPixData) {
      interval = setInterval(async () => {
        try {
          setCheckingPayment(true);
          const status = await billingApi.getPaymentStatus(proPixData.payment_id);
          if (status.confirmed) {
            clearInterval(interval);
            await refreshUser();
            const newStatus = await billingApi.getStatus();
            setBillingStatus(newStatus);
            setProPixData(null);
            setShowProModal(false);
            setProPaymentMethod(null);
            showSuccess(
              'Pagamento confirmado! Sua assinatura foi ativada.',
              'Pagamento confirmado'
            );
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingPayment(false);
        }
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [proPixData, refreshUser]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handleProSubscription = async (billingType: 'PIX' | 'CREDIT_CARD') => {
    const expiryParts = cardForm.expiry.split('/');
    const expiry_month = expiryParts[0] || '';
    const expiry_year = expiryParts[1] ? '20' + expiryParts[1] : '';
    
    if (billingType === 'CREDIT_CARD') {
      if (!cardForm.card_holder_name || !cardForm.card_number || !expiry_month || 
          !expiry_year || !cardForm.cvv || !cardForm.holder_cpf || 
          !cardForm.holder_phone || !cardForm.postal_code || !cardForm.address_number) {
        showWarning(
          'Por favor, preencha todos os campos obrigatorios do cartao.',
          'Campos incompletos',
          { label: 'Entendi', onClick: () => clearFeedback() }
        );
        return;
      }
    }

    setProcessingPro(true);
    try {
      const request: any = { billing_type: billingType, plan_type: selectedPlanType };
      
      if (billingType === 'CREDIT_CARD') {
        Object.assign(request, {
          card_holder_name: cardForm.card_holder_name,
          card_number: cardForm.card_number,
          expiry_month,
          expiry_year,
          cvv: cardForm.cvv,
          holder_cpf: cardForm.holder_cpf,
          holder_phone: cardForm.holder_phone,
          postal_code: cardForm.postal_code,
          address_number: cardForm.address_number
        });
      }

      const result = await billingApi.createProSubscription(request);
      
      if (result.status === 'active') {
        await refreshUser();
        const newStatus = await billingApi.getStatus();
        setBillingStatus(newStatus);
        setShowProModal(false);
        setProPaymentMethod(null);
        setCardForm(initialCardForm);
        showSuccess(
          `Sua assinatura ${selectedPlanType.toUpperCase()} foi ativada com sucesso!`,
          'Assinatura ativada'
        );
      } else if (result.pix_code && result.payment_id && result.pix_qr_code_base64) {
        const prices: Record<string, number> = { basic: 9.90, pro: 19.90, premium: 49.90 };
        setProPixData({
          payment_id: result.payment_id,
          pix_code: result.pix_code,
          pix_qr_code_base64: result.pix_qr_code_base64,
          value: prices[selectedPlanType] || 19.90
        });
      }
    } catch (err: any) {
      console.error(err);
      showError(
        err?.message || 'Nao foi possivel criar a assinatura. Tente novamente.',
        'Erro na assinatura',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
    } finally {
      setProcessingPro(false);
    }
  };

  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const executeCancelSubscription = async () => {
    setCancelingSubscription(true);
    try {
      await billingApi.cancelSubscription();
      await refreshUser();
      const newStatus = await billingApi.getStatus();
      setBillingStatus(newStatus);
      showSuccess(
        'Sua assinatura foi cancelada. Voce ainda tera acesso ate o final do periodo pago.',
        'Assinatura cancelada'
      );
    } catch (err: any) {
      console.error(err);
      showError(
        err?.message || 'Nao foi possivel cancelar a assinatura. Tente novamente.',
        'Erro ao cancelar',
        { label: 'Entendi', onClick: () => clearFeedback() }
      );
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleCancelSubscription = () => {
    showWarning(
      'Ao cancelar sua assinatura, voce perdera acesso aos beneficios ao final do periodo atual. Tem certeza?',
      'Cancelar assinatura?',
      {
        label: 'Sim, cancelar',
        onClick: () => {
          clearFeedback();
          executeCancelSubscription();
        }
      }
    );
  };

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleTestConfirmPayment = async (paymentId: string) => {
    setTestingPayment(true);
    try {
      const result = await billingApi.testConfirmPayment(paymentId);
      await refreshUser();
      const newStatus = await billingApi.getStatus();
      setBillingStatus(newStatus);
      setProPixData(null);
      setShowProModal(false);
      setProPaymentMethod(null);
      showSuccess(result.message, 'Teste de Pagamento');
    } catch (err: any) {
      console.error(err);
      showError(err?.message || 'Erro ao simular pagamento', 'Erro', { label: 'Entendi', onClick: () => clearFeedback() });
    } finally {
      setTestingPayment(false);
    }
  };

  const handleCloseProModal = () => {
    setShowProModal(false);
    setProPaymentMethod(null);
    setProPixData(null);
    setCardForm(initialCardForm);
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 16);
  };

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 8);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-pulse shadow-xl shadow-emerald-200">
            <CreditCard className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce" />
        </div>
        <p className="text-emerald-700 font-medium mt-4">Carregando...</p>
      </div>
    );
  }

  const currentPlan = billingStatus?.plan || 'free';
  const hasPaidPlan = ['basic', 'pro', 'premium'].includes(currentPlan);

  const handleCardInputChange = (field: keyof CardFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    switch (field) {
      case 'card_holder_name':
        value = value.toUpperCase();
        break;
      case 'card_number':
        value = formatCardNumber(value);
        break;
      case 'expiry':
        value = value.replace(/\D/g, '');
        if (value.length >= 2) {
          value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        value = value.slice(0, 5);
        break;
      case 'cvv':
        value = value.replace(/\D/g, '').slice(0, 4);
        break;
      case 'holder_cpf':
        value = formatCPF(value);
        break;
      case 'holder_phone':
        value = formatPhone(value);
        break;
      case 'postal_code':
        value = formatCEP(value);
        break;
    }
    setCardForm(prev => ({ ...prev, [field]: value }));
  };

  const renderCardFormFields = () => (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Nome no cartao"
        value={cardForm.card_holder_name}
        onChange={handleCardInputChange('card_holder_name')}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
      />
      <input
        type="text"
        placeholder="Numero do cartao"
        value={cardForm.card_number}
        onChange={handleCardInputChange('card_number')}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Validade (MM/AA)"
          value={cardForm.expiry}
          onChange={handleCardInputChange('expiry')}
          className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
        />
        <input
          type="text"
          placeholder="CVV"
          value={cardForm.cvv}
          onChange={handleCardInputChange('cvv')}
          className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
        />
      </div>
      <input
        type="text"
        placeholder="CPF (somente numeros)"
        value={cardForm.holder_cpf}
        onChange={handleCardInputChange('holder_cpf')}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
      />
      <input
        type="text"
        placeholder="Telefone (somente numeros)"
        value={cardForm.holder_phone}
        onChange={handleCardInputChange('holder_phone')}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="CEP"
          value={cardForm.postal_code}
          onChange={handleCardInputChange('postal_code')}
          className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
        />
        <input
          type="text"
          placeholder="Numero"
          value={cardForm.address_number}
          onChange={handleCardInputChange('address_number')}
          className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
        />
      </div>
      <button
        onClick={() => handleProSubscription('CREDIT_CARD')}
        disabled={processingPro}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
      >
        {processingPro ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Assinar com Cartao
          </>
        )}
      </button>
    </div>
  );

  const PixDisplay = ({ data, onCopy, checking }: { data: PixPaymentData; onCopy: () => void; checking: boolean }) => (
    <>
      <div className="text-center mb-4">
        <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          {data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-100 shadow-lg shadow-emerald-50">
          <img
            src={`data:image/png;base64,${data.pix_qr_code_base64}`}
            alt="QR Code PIX"
            className="w-48 h-48"
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Ou copie o codigo PIX:</p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={data.pix_code}
            className="flex-1 bg-gray-50 px-3 py-2 rounded-xl border-2 border-gray-100 text-xs truncate"
          />
          <button
            onClick={onCopy}
            className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
              pixCopied
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
        {checking ? (
          <p className="text-sm text-amber-700 flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></span>
            Verificando pagamento...
          </p>
        ) : (
          <p className="text-sm text-amber-700">
            Aguardando pagamento... A pagina atualizara automaticamente.
          </p>
        )}
      </div>
    </>
  );

  const planConfig = {
    basic: {
      name: 'Basico',
      price: 'R$ 9,90',
      color: 'from-blue-500 to-cyan-500',
      colorLight: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      shadow: 'shadow-blue-200',
      text: 'text-blue-600',
      features: [
        { icon: Zap, text: '30 analises simples por mes', included: true },
        { icon: Ban, text: 'Com anuncios', included: true },
        { icon: Star, text: 'Analise completa', included: false },
        { icon: Bot, text: 'IA Nutricionista', included: false },
      ]
    },
    pro: {
      name: 'PRO',
      price: 'R$ 19,90',
      color: 'from-violet-500 to-purple-500',
      colorLight: 'from-violet-50 to-purple-50',
      border: 'border-violet-200',
      shadow: 'shadow-purple-200',
      text: 'text-violet-600',
      features: [
        { icon: Star, text: '30 analises completas por mes', included: true },
        { icon: Zap, text: 'Analises simples ilimitadas', included: true },
        { icon: Ban, text: 'Sem anuncios', included: true },
        { icon: Bot, text: 'IA Nutricionista', included: false },
      ]
    },
    premium: {
      name: 'Premium',
      price: 'R$ 49,90',
      color: 'from-amber-500 to-orange-500',
      colorLight: 'from-amber-50 to-orange-50',
      border: 'border-amber-200',
      shadow: 'shadow-amber-200',
      text: 'text-amber-600',
      features: [
        { icon: Star, text: '60 analises completas por mes', included: true },
        { icon: Zap, text: 'Analises simples ilimitadas', included: true },
        { icon: Ban, text: 'Sem anuncios', included: true },
        { icon: Bot, text: 'IA Nutricionista inclusa', included: true },
      ]
    }
  };

  const getUsageInfo = () => {
    const simple = billingStatus?.simple_analyses_used || 0;
    const full = billingStatus?.full_analyses_used || 0;

    if (currentPlan === 'basic') {
      return { simpleUsed: simple, simpleLimit: 30, fullUsed: 0, fullLimit: 0 };
    }
    if (currentPlan === 'pro') {
      return { simpleUsed: 0, simpleLimit: -1, fullUsed: full, fullLimit: 30 };
    }
    if (currentPlan === 'premium') {
      return { simpleUsed: 0, simpleLimit: -1, fullUsed: full, fullLimit: 60 };
    }
    return { simpleUsed: 0, simpleLimit: 0, fullUsed: 0, fullLimit: 0 };
  };

  const usage = getUsageInfo();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden mb-6">
        <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{hasPaidPlan ? 'Meu Plano' : 'Planos'}</h1>
              <p className="text-emerald-100">Gerencie seu plano e assinatura</p>
            </div>
          </div>
        </div>
      </div>

      {hasPaidPlan && billingStatus?.has_subscription && (
        <div className={`bg-gradient-to-r ${planConfig[currentPlan as keyof typeof planConfig]?.color || 'from-violet-500 to-purple-500'} rounded-2xl shadow-xl ${planConfig[currentPlan as keyof typeof planConfig]?.shadow || 'shadow-purple-200'}/50 p-6 mb-6 text-white`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Plano {planConfig[currentPlan as keyof typeof planConfig]?.name || currentPlan}</h2>
              <p className="text-sm text-white/90">Aproveite todos os beneficios</p>
            </div>
          </div>
          
          {(currentPlan === 'pro' || currentPlan === 'premium') && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Analises completas usadas</span>
                <span className="font-bold text-lg">{usage.fullUsed}/{usage.fullLimit}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all" 
                  style={{ width: `${Math.min((usage.fullUsed / usage.fullLimit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-white/70 mt-2">Renova todo mes automaticamente</p>
            </div>
          )}

          {currentPlan === 'basic' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Analises simples usadas</span>
                <span className="font-bold text-lg">{usage.simpleUsed}/{usage.simpleLimit}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all" 
                  style={{ width: `${Math.min((usage.simpleUsed / usage.simpleLimit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-white/70 mt-2">Renova todo mes automaticamente</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Zap className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs">Analises simples</p>
              <p className="font-bold">{currentPlan === 'basic' ? `${usage.simpleUsed}/30` : 'Ilimitadas'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs">Analises completas</p>
              <p className="font-bold">{currentPlan === 'basic' ? 'N/A' : `${usage.fullUsed}/${usage.fullLimit}`}</p>
            </div>
          </div>

          {currentPlan === 'basic' && (
            <button
              onClick={() => { setSelectedPlanType('pro'); setShowProModal(true); }}
              className="w-full py-3 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-all mb-3"
            >
              Fazer upgrade para PRO (R$ 19,90/mes)
            </button>
          )}

          {(currentPlan === 'basic' || currentPlan === 'pro') && (
            <button
              onClick={() => { setSelectedPlanType('premium'); setShowProModal(true); }}
              className="w-full py-3 rounded-xl bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-all mb-3"
            >
              Fazer upgrade para Premium (R$ 49,90/mes)
            </button>
          )}
          
          <button
            onClick={handleCancelSubscription}
            disabled={cancelingSubscription}
            className="w-full py-3 rounded-xl bg-red-500/80 text-white text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-50"
          >
            {cancelingSubscription ? 'Cancelando...' : 'Cancelar assinatura'}
          </button>
        </div>
      )}

      {hasPaidPlan && (
        <div className={`bg-gradient-to-br ${planConfig[currentPlan as keyof typeof planConfig]?.colorLight || 'from-violet-50 to-purple-50'} rounded-2xl p-6 mb-6 border ${planConfig[currentPlan as keyof typeof planConfig]?.border || 'border-purple-200'} shadow-lg`}>
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${planConfig[currentPlan as keyof typeof planConfig]?.color || 'from-violet-500 to-purple-500'} flex items-center justify-center shadow-lg ${planConfig[currentPlan as keyof typeof planConfig]?.shadow || 'shadow-purple-200'}`}>
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Plano {planConfig[currentPlan as keyof typeof planConfig]?.name || currentPlan}</h3>
              <p className="text-sm text-gray-600">{planConfig[currentPlan as keyof typeof planConfig]?.price || ''}/mes</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {planConfig[currentPlan as keyof typeof planConfig]?.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                {feat.included ? (
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                )}
                <span className={`text-sm ${feat.included ? 'text-gray-700' : 'text-gray-400'}`}>{feat.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasPaidPlan && (
        <>
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 p-6 mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Plano atual</p>
                <p className="text-2xl font-bold text-gray-900">Gratuito</p>
                <p className="text-sm text-gray-500">Trial de {7 + (user?.trial_bonus_days || 0)} dias</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Dias usados</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {user?.trial_days_used || 0}/{7 + (user?.trial_bonus_days || 0)}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-sm text-gray-600 mb-1">Periodo de teste</p>
              <div className="w-full bg-emerald-100 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full h-2 transition-all" 
                  style={{ width: `${Math.min(((user?.trial_days_used || 0) / (7 + (user?.trial_bonus_days || 0))) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Apenas analises simples disponiveis</p>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-violet-600" />
            </div>
            Escolha seu Plano
          </h2>

          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border-2 border-emerald-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Gratuito</h3>
                  <p className="text-sm text-gray-500">7 dias de teste</p>
                </div>
                <span className="ml-auto text-lg font-bold text-emerald-600">Gratis</span>
              </div>
              <ul className="text-sm space-y-1 text-gray-600 mb-3">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Analise simples de alimentos</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 7 dias de uso efetivo</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-gray-300" /> Sem analise completa</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-gray-300" /> Sem IA nutricionista</li>
              </ul>
              <div className="bg-emerald-100 rounded-xl p-2 text-center">
                <p className="text-xs text-emerald-700 font-medium">Plano atual</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200 relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Basico</h3>
                  <p className="text-sm text-gray-500">30 analises simples/mes</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-blue-600">R$ 9,90<span className="text-sm font-normal text-gray-500">/mes</span></p>
                </div>
              </div>
              <ul className="text-sm space-y-1 text-gray-600 mb-3">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> 30 analises simples por mes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Com anuncios</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-gray-300" /> Sem analise completa</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-gray-300" /> Sem IA nutricionista</li>
              </ul>
              <button
                onClick={() => { setSelectedPlanType('basic'); setShowProModal(true); }}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all shadow-lg shadow-blue-200"
              >
                Assinar Basico
              </button>
            </div>

            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl shadow-xl shadow-purple-200/50 p-5 text-white relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                Mais popular
              </span>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Plano PRO</h3>
                  <p className="text-sm opacity-90">30 completas + simples ilimitadas</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold">R$ 19,90<span className="text-sm font-normal opacity-80">/mes</span></p>
                </div>
              </div>
              <ul className="text-sm mb-3 space-y-1 text-white/90">
                <li className="flex items-center gap-2"><Check className="w-4 h-4" /> 30 analises completas por mes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Analises simples ilimitadas</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Sem anuncios</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 opacity-50" /> Sem IA nutricionista</li>
              </ul>
              <button
                onClick={() => { setSelectedPlanType('pro'); setShowProModal(true); }}
                className="w-full bg-white text-purple-600 py-3 rounded-xl font-bold hover:bg-purple-50 hover:scale-[1.02] transition-all shadow-lg"
              >
                Assinar PRO
              </button>
            </div>

            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl shadow-xl shadow-amber-200/50 p-5 text-white relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                Completo
              </span>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Premium</h3>
                  <p className="text-sm opacity-90">60 completas + IA nutricionista</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold">R$ 49,90<span className="text-sm font-normal opacity-80">/mes</span></p>
                </div>
              </div>
              <ul className="text-sm mb-3 space-y-1 text-white/90">
                <li className="flex items-center gap-2"><Check className="w-4 h-4" /> 60 analises completas por mes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Analises simples ilimitadas</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Sem anuncios</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4" /> IA Nutricionista inclusa</li>
              </ul>
              <button
                onClick={() => { setSelectedPlanType('premium'); setShowProModal(true); }}
                className="w-full bg-white text-orange-600 py-3 rounded-xl font-bold hover:bg-orange-50 hover:scale-[1.02] transition-all shadow-lg"
              >
                Assinar Premium
              </button>
            </div>
          </div>
        </>
      )}

      {showProModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${planConfig[selectedPlanType]?.color || 'from-violet-500 to-purple-500'}`}>
                  <Crown className="w-4 h-4 text-white" />
                </div>
                Assinar {planConfig[selectedPlanType]?.name || selectedPlanType}
              </h3>
              <button onClick={handleCloseProModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-center text-2xl font-bold bg-gradient-to-r ${planConfig[selectedPlanType]?.color || 'from-violet-600 to-purple-600'} bg-clip-text text-transparent mb-4`}>
              {planConfig[selectedPlanType]?.price || 'R$ 19,90'}<span className="text-base font-normal text-gray-500">/mes</span>
            </p>

            {!proPaymentMethod && !proPixData && (
              <div className="space-y-3">
                <button
                  onClick={() => setProPaymentMethod('PIX')}
                  disabled={processingPro}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                >
                  <QrCode className="w-5 h-5" />
                  Assinar com PIX
                </button>

                <button
                  onClick={() => setProPaymentMethod('CREDIT_CARD')}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all shadow-lg shadow-purple-200"
                >
                  <CreditCard className="w-5 h-5" />
                  Assinar com Cartao
                </button>

                <p className="text-center text-xs text-gray-400">
                  Cobranca mensal automatica. Cancele quando quiser.
                </p>
              </div>
            )}

            {proPaymentMethod === 'PIX' && !proPixData && (
              <>
                <button
                  onClick={() => setProPaymentMethod(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPF (obrigatorio para PIX)
                    </label>
                    <input
                      type="text"
                      value={pixCpf}
                      onChange={(e) => setPixCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      const cpfDigits = pixCpf.replace(/\D/g, '');
                      if (cpfDigits.length !== 11) {
                        showWarning('Por favor, informe um CPF valido com 11 digitos.', 'CPF obrigatorio', { label: 'Entendi', onClick: () => clearFeedback() });
                        return;
                      }
                      setProcessingPro(true);
                      try {
                        const result = await billingApi.createProSubscription({ billing_type: 'PIX', plan_type: selectedPlanType, holder_cpf: cpfDigits });
                        if (result.pix_code && result.payment_id && result.pix_qr_code_base64) {
                          const prices: Record<string, number> = { basic: 9.90, pro: 19.90, premium: 49.90 };
                          setProPixData({
                            payment_id: result.payment_id,
                            pix_code: result.pix_code,
                            pix_qr_code_base64: result.pix_qr_code_base64,
                            value: prices[selectedPlanType] || 19.90
                          });
                        } else if (result.status === 'pending' && !result.pix_code) {
                          showError('O PIX ainda esta sendo gerado. Aguarde alguns segundos e tente novamente.', 'Aguarde', { label: 'Entendi', onClick: () => clearFeedback() });
                        }
                      } catch (err: any) {
                        console.error(err);
                        showError(err?.message || 'Nao foi possivel gerar o PIX. Tente novamente.', 'Erro', { label: 'Entendi', onClick: () => clearFeedback() });
                      } finally {
                        setProcessingPro(false);
                      }
                    }}
                    disabled={processingPro}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                  >
                    <QrCode className="w-5 h-5" />
                    {processingPro ? 'Gerando PIX...' : 'Gerar PIX'}
                  </button>
                </div>
              </>
            )}

            {proPaymentMethod === 'CREDIT_CARD' && !proPixData && (
              <>
                <button
                  onClick={() => setProPaymentMethod(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                {renderCardFormFields()}
              </>
            )}

            {proPixData && (
              <PixDisplay data={proPixData} onCopy={() => handleCopyPix(proPixData.pix_code)} checking={checkingPayment} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
