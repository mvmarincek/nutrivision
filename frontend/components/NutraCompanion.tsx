'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import NutraAvatar from './NutraAvatar';

const TIPS_BY_ROUTE: Record<string, string[]> = {
  '/home': [
    'Tire uma foto do seu prato agora e descubra os nutrientes em segundos!',
    'Dica: fotos com boa iluminacao deixam a analise ainda mais precisa.',
    'Ja analisou seu almoco hoje? Eu to curiosa pra ver!',
    'Quanto mais pratos voce analisa, melhor eu entendo seus habitos.',
  ],
  '/history': [
    'Olha so seu historico! Da pra ver a evolucao, ne?',
    'Revise suas refeicoes anteriores e descubra padroes na sua alimentacao.',
    'Compare seus pratos e veja como voce tem melhorado!',
  ],
  '/motivacional': [
    'Cada pequena escolha saudavel conta. Voce ta no caminho certo!',
    'Leia a mensagem do dia com carinho, preparei especialmente pra voce.',
    'A consistencia importa mais que a perfeicao. Bora junto!',
  ],
  '/nutricionista': [
    'Me pergunte qualquer duvida sobre nutricao, to aqui pra ajudar!',
    'Pode me perguntar sobre substituicoes, dicas e receitas tambem.',
    'Sem vergonha de perguntar, viu? Toda duvida e valida!',
  ],
  '/billing': [
    'Com o plano Pro voce tem analises ilimitadas e acesso a tudo!',
    'Investir na sua saude e o melhor investimento que existe.',
  ],
  '/profile': [
    'Mantenha seu perfil atualizado para receber dicas mais personalizadas!',
    'Seus objetivos mudaram? Atualize aqui que eu me adapto.',
  ],
};

const DISMISS_KEY = 'nutra_companion_dismissed';
const LAST_TIP_KEY = 'nutra_companion_last_tip';

export default function NutraCompanion() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [tip, setTip] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [animating, setAnimating] = useState(false);

  const pickTip = useCallback((route: string) => {
    const tips = TIPS_BY_ROUTE[route];
    if (!tips || tips.length === 0) return '';
    const lastIndex = parseInt(sessionStorage.getItem(`${LAST_TIP_KEY}_${route}`) || '-1');
    let idx = Math.floor(Math.random() * tips.length);
    if (idx === lastIndex && tips.length > 1) {
      idx = (idx + 1) % tips.length;
    }
    sessionStorage.setItem(`${LAST_TIP_KEY}_${route}`, String(idx));
    return tips[idx];
  }, []);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem(DISMISS_KEY);
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;

    setVisible(false);
    setAnimating(false);

    const timer = setTimeout(() => {
      const newTip = pickTip(pathname);
      if (newTip) {
        setTip(newTip);
        setAnimating(true);
        setTimeout(() => setVisible(true), 50);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [pathname, dismissed, pickTip]);

  useEffect(() => {
    if (!visible) return;

    const autoHide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setAnimating(false), 300);
    }, 8000);

    return () => clearTimeout(autoHide);
  }, [visible, tip]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setAnimating(false);
      setDismissed(true);
      sessionStorage.setItem(DISMISS_KEY, 'true');
    }, 300);
  };

  const handleAvatarClick = () => {
    if (dismissed) {
      setDismissed(false);
      sessionStorage.removeItem(DISMISS_KEY);
      const newTip = pickTip(pathname);
      if (newTip) {
        setTip(newTip);
        setAnimating(true);
        setTimeout(() => setVisible(true), 50);
      }
      return;
    }
    if (!animating) {
      const newTip = pickTip(pathname);
      if (newTip) {
        setTip(newTip);
        setAnimating(true);
        setTimeout(() => setVisible(true), 50);
      }
    }
  };

  if (pathname === '/admin') return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      {animating && (
        <div
          className={`bg-white rounded-2xl rounded-br-md shadow-lg border border-emerald-100 px-4 py-3 max-w-[260px] transition-all duration-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="flex items-start gap-2">
            <p className="text-sm text-gray-700 leading-relaxed flex-1">{tip}</p>
            <button
              onClick={handleDismiss}
              className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-emerald-100 rotate-45" />
        </div>
      )}

      <button
        onClick={handleAvatarClick}
        className="group relative"
        title="Dica da Nutra"
      >
        <NutraAvatar className="w-12 h-12 drop-shadow-md group-hover:scale-110 transition-transform" />
        {dismissed && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  );
}
