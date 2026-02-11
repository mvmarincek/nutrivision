'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, ChevronRight } from 'lucide-react';
import NutraAvatar from './NutraAvatar';

type NutraMood = 'idle' | 'happy' | 'waving' | 'thinking' | 'excited';
type BubbleAction = { label: string; href?: string; onClick?: () => void };

interface NutraLine {
  text: string;
  mood: NutraMood;
  action?: BubbleAction;
}

const LINES_BY_ROUTE: Record<string, NutraLine[]> = {
  '/home': [
    { text: 'Psst! Bora tirar uma foto do prato? Tô morrendo de curiosidade!', mood: 'excited', action: { label: 'Analisar agora' } },
    { text: 'Dica de mestre: quanto melhor a luz, mais precisa fica a análise!', mood: 'thinking' },
    { text: 'Já comeu hoje? Me mostra o que tem no prato!', mood: 'waving' },
    { text: 'Sabia que cada análise me ajuda a te conhecer melhor?', mood: 'happy' },
    { text: 'E aí, cadê a foto do almoço? Tô esperando!', mood: 'excited' },
  ],
  '/history': [
    { text: 'Olha a sua evolução! Cada prato conta uma história.', mood: 'happy' },
    { text: 'Repara nos padrões... você tá comendo melhor do que pensa!', mood: 'thinking' },
    { text: 'Que tal comparar o prato de hoje com o da semana passada?', mood: 'excited' },
  ],
  '/motivacional': [
    { text: 'Preparei algo especial pra você hoje. Lê com carinho!', mood: 'happy' },
    { text: 'Lembra: progresso não é perfeição. Você tá arrasando!', mood: 'excited' },
    { text: 'Cada escolha saudável é uma vitória. E você tá cheia delas!', mood: 'waving' },
  ],
  '/nutricionista': [
    { text: 'Pode perguntar qualquer coisa! Sem julgamento, prometo.', mood: 'waving' },
    { text: 'Dúvida boba não existe. Manda ver!', mood: 'happy' },
    { text: 'Posso te ajudar com substituições, receitas, dicas... o que precisar!', mood: 'excited' },
  ],
  '/billing': [
    { text: 'Com o Pro você desbloqueia tudo! É um investimento na sua saúde.', mood: 'excited' },
    { text: 'Análises ilimitadas, sem restrição. Imagina a evolução!', mood: 'happy' },
  ],
  '/profile': [
    { text: 'Atualiza seus objetivos que eu me adapto na hora!', mood: 'waving' },
    { text: 'Perfil completo = dicas mais certeiras. Me ajuda a te ajudar!', mood: 'thinking' },
  ],
};

const IDLE_POKES: NutraLine[] = [
  { text: 'Ei, tô aqui! Se precisar de mim é só chamar.', mood: 'waving' },
  { text: 'Não esquece de mim! Bora cuidar da alimentação juntos?', mood: 'happy' },
  { text: 'Hmm... tô pensando numa dica boa pra você...', mood: 'thinking' },
];

const COMPANION_STATE_KEY = 'nutra_companion_state';

export default function NutraCompanion() {
  const pathname = usePathname();
  const [mood, setMood] = useState<NutraMood>('idle');
  const [bubbleText, setBubbleText] = useState('');
  const [bubbleAction, setBubbleAction] = useState<BubbleAction | undefined>();
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleAnimating, setBubbleAnimating] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [isWiggling, setIsWiggling] = useState(false);
  const lastTipRef = useRef<string>('');
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pokeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wiggleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showLine = useCallback((line: NutraLine) => {
    setMood(line.mood);
    setBubbleText(line.text);
    setBubbleAction(line.action);
    setBubbleAnimating(true);
    setTimeout(() => setShowBubble(true), 50);
    lastTipRef.current = line.text;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setShowBubble(false);
      setTimeout(() => {
        setBubbleAnimating(false);
        setMood('idle');
      }, 400);
    }, 7000);
  }, []);

  const pickLine = useCallback((route: string): NutraLine | null => {
    const lines = LINES_BY_ROUTE[route];
    if (!lines || lines.length === 0) return null;
    const available = lines.filter(l => l.text !== lastTipRef.current);
    const pool = available.length > 0 ? available : lines;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(COMPANION_STATE_KEY);
    if (saved === 'minimized') setMinimized(true);
  }, []);

  useEffect(() => {
    if (minimized) return;

    setShowBubble(false);
    setBubbleAnimating(false);
    setMood('idle');

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);

    const entryTimer = setTimeout(() => {
      const line = pickLine(pathname);
      if (line) {
        setMood('waving');
        setTimeout(() => showLine(line), 600);
      } else {
        const poke = IDLE_POKES[Math.floor(Math.random() * IDLE_POKES.length)];
        setMood('waving');
        setTimeout(() => showLine(poke), 600);
      }
    }, 1200);

    return () => {
      clearTimeout(entryTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [pathname, minimized, pickLine, showLine]);

  useEffect(() => {
    if (minimized) return;

    if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);

    const schedulePoke = () => {
      const delay = 15000 + Math.random() * 10000;
      pokeTimerRef.current = setTimeout(() => {
        if (!showBubble) {
          const routeLines = LINES_BY_ROUTE[pathname];
          const pool = routeLines && routeLines.length > 0
            ? [...routeLines, ...IDLE_POKES]
            : IDLE_POKES;
          const available = pool.filter(l => l.text !== lastTipRef.current);
          const line = available.length > 0
            ? available[Math.floor(Math.random() * available.length)]
            : pool[Math.floor(Math.random() * pool.length)];
          showLine(line);
        }
        schedulePoke();
      }, delay);
    };

    schedulePoke();

    return () => {
      if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
    };
  }, [pathname, minimized, showBubble, showLine]);

  useEffect(() => {
    if (minimized) {
      if (wiggleTimerRef.current) clearInterval(wiggleTimerRef.current);
      return;
    }

    wiggleTimerRef.current = setInterval(() => {
      if (!showBubble) {
        setIsWiggling(true);
        setTimeout(() => setIsWiggling(false), 800);
      }
    }, 8000);

    return () => {
      if (wiggleTimerRef.current) clearInterval(wiggleTimerRef.current);
    };
  }, [minimized, showBubble]);

  const handleAvatarTap = () => {
    if (minimized) {
      setMinimized(false);
      sessionStorage.removeItem(COMPANION_STATE_KEY);
      const line = pickLine(pathname);
      if (line) {
        setMood('excited');
        setTimeout(() => showLine(line), 300);
      }
      return;
    }

    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount >= 3) {
      setTapCount(0);
      setMood('excited');
      setBubbleText('Haha, tá me fazendo cócegas!');
      setBubbleAction(undefined);
      setBubbleAnimating(true);
      setTimeout(() => setShowBubble(true), 50);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setShowBubble(false);
        setTimeout(() => {
          setBubbleAnimating(false);
          setMood('idle');
        }, 400);
      }, 4000);
      return;
    }

    setTimeout(() => setTapCount(0), 1500);

    if (showBubble) {
      setShowBubble(false);
      setTimeout(() => {
        setBubbleAnimating(false);
        const line = pickLine(pathname);
        if (line) setTimeout(() => showLine(line), 200);
      }, 300);
    } else {
      const line = pickLine(pathname);
      if (line) showLine(line);
      else {
        const poke = IDLE_POKES[Math.floor(Math.random() * IDLE_POKES.length)];
        showLine(poke);
      }
    }
  };

  const handleDismiss = () => {
    setShowBubble(false);
    setTimeout(() => {
      setBubbleAnimating(false);
      setMinimized(true);
      sessionStorage.setItem(COMPANION_STATE_KEY, 'minimized');
      setMood('idle');
    }, 300);
  };

  if (pathname === '/admin') return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2"
      style={{ pointerEvents: 'none' }}
    >
      <button
        onClick={handleAvatarTap}
        className="pointer-events-auto group relative focus:outline-none"
        style={{
          animation: isWiggling && !showBubble && !minimized
            ? 'nutra-wiggle 0.8s ease-in-out'
            : undefined,
        }}
      >
        <div className={`transition-all duration-300 ${
          minimized ? 'scale-75 opacity-60' : 'scale-100 opacity-100'
        } group-hover:scale-110 group-active:scale-95`}>
          <NutraAvatar
            className="w-18 h-18 drop-shadow-lg"
            mood={mood}
            animate={!minimized}
          />
        </div>

        {minimized && (
          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {bubbleAnimating && !minimized && (
        <div
          className={`pointer-events-auto transition-all duration-400 ${
            showBubble
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-4 scale-95'
          }`}
          style={{ transformOrigin: 'top center' }}
        >
          <div className="relative bg-white rounded-2xl shadow-2xl shadow-emerald-200/30 border border-emerald-200/60 w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden">
            <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-500 border-l border-t border-emerald-500 rotate-45" />
            <div className="px-4 py-3 flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500">
              <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                <NutraAvatar className="w-5 h-5" mood={mood} animate={false} />
              </div>
              <span className="text-sm font-bold text-white">NutraIA</span>
              <button
                onClick={handleDismiss}
                className="ml-auto text-white/60 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700 leading-relaxed font-medium">{bubbleText}</p>
              {bubbleAction && (
                <button
                  onClick={bubbleAction.onClick}
                  className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {bubbleAction.label}
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes nutra-wiggle {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          15% { transform: rotate(-5deg) translateX(-2px); }
          30% { transform: rotate(4deg) translateX(2px); }
          45% { transform: rotate(-4deg) translateX(-1px); }
          60% { transform: rotate(3deg) translateX(1px); }
          75% { transform: rotate(-2deg); }
          90% { transform: rotate(1deg); }
        }
      `}</style>
    </div>
  );
}
