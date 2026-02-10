'use client';

interface NutraAvatarProps {
  className?: string;
  mood?: 'idle' | 'happy' | 'waving' | 'thinking' | 'excited';
  animate?: boolean;
}

export default function NutraAvatar({ className = 'w-10 h-10', mood = 'idle', animate = true }: NutraAvatarProps) {
  const uid = `nutra-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uid}-body`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id={`${uid}-leaf`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={`${uid}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id={`${uid}-shadow`}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#059669" floodOpacity="0.3" />
        </filter>
      </defs>

      {animate && (
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-3; 0,0; 0,1; 0,0"
            dur="3s"
            repeatCount="indefinite"
          />
        </g>
      )}

      <g filter={`url(#${uid}-shadow)`}>
        {animate && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-3; 0,0; 0,1; 0,0"
            dur="3s"
            repeatCount="indefinite"
          />
        )}

        <circle cx="60" cy="65" r="38" fill={`url(#${uid}-body)`} />
        <ellipse cx="60" cy="40" rx="28" ry="10" fill={`url(#${uid}-shine)`} />

        <g>
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 55 28; -8 55 28; 0 55 28; 5 55 28; 0 55 28"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
          <path d="M58 28 Q63 10 75 16 Q68 28 58 32 Z" fill={`url(#${uid}-leaf)`} />
          <path d="M58 28 Q52 12 42 18 Q48 28 58 32 Z" fill={`url(#${uid}-leaf)`} opacity="0.85" />
          <line x1="58" y1="32" x2="60" y2="22" stroke="#059669" strokeWidth="0.8" opacity="0.5" />
          <line x1="65" y1="22" x2="62" y2="17" stroke="#059669" strokeWidth="0.5" opacity="0.4" />
        </g>

        <ellipse cx="45" cy="58" rx="7" ry="8" fill="white" />
        <ellipse cx="75" cy="58" rx="7" ry="8" fill="white" />

        <g>
          {animate && (
            <animate
              attributeName="opacity"
              values="1;1;1;1;1;1;1;1;0;1;1;1;1;1;1;1;1;1;1;0;0;1"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
          {mood === 'thinking' ? (
            <>
              <circle cx="44" cy="59" r="3.5" fill="#1e293b" />
              <circle cx="76" cy="56" r="3.5" fill="#1e293b" />
              <circle cx="45.5" cy="57" r="1.3" fill="white" />
              <circle cx="77.5" cy="54" r="1.3" fill="white" />
            </>
          ) : (
            <>
              <circle cx="46" cy="59" r="3.5" fill="#1e293b" />
              <circle cx="76" cy="59" r="3.5" fill="#1e293b" />
              <circle cx="47.5" cy="57.5" r="1.3" fill="white" />
              <circle cx="77.5" cy="57.5" r="1.3" fill="white" />
            </>
          )}
        </g>

        {(mood === 'happy' || mood === 'excited') && (
          <>
            <path d="M47 73 Q60 84 73 73" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="36" cy="68" rx="6" ry="3.5" fill="#fca5a5" opacity="0.45" />
            <ellipse cx="84" cy="68" rx="6" ry="3.5" fill="#fca5a5" opacity="0.45" />
          </>
        )}
        {mood === 'idle' && (
          <>
            <path d="M48 72 Q60 80 72 72" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="36" cy="67" rx="5" ry="3" fill="#fca5a5" opacity="0.4" />
            <ellipse cx="84" cy="67" rx="5" ry="3" fill="#fca5a5" opacity="0.4" />
          </>
        )}
        {mood === 'thinking' && (
          <>
            <ellipse cx="62" cy="74" rx="5" ry="3" fill="#1e293b" opacity="0.15" />
            <path d="M50 73 Q57 70 64 73" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {mood === 'waving' && (
          <>
            <path d="M48 72 Q60 82 72 72" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="36" cy="67" rx="5" ry="3" fill="#fca5a5" opacity="0.4" />
            <ellipse cx="84" cy="67" rx="5" ry="3" fill="#fca5a5" opacity="0.4" />
          </>
        )}

        {mood === 'waving' && (
          <g>
            {animate && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 95 55; -20 95 55; 15 95 55; -20 95 55; 0 95 55"
                dur="0.8s"
                repeatCount="indefinite"
              />
            )}
            <circle cx="98" cy="48" r="6" fill={`url(#${uid}-body)`} />
            <circle cx="98" cy="48" r="4" fill={`url(#${uid}-body)`} opacity="0.7" />
          </g>
        )}

        {mood === 'excited' && animate && (
          <>
            <line x1="30" y1="35" x2="25" y2="28" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.7">
              <animate attributeName="opacity" values="0;0.7;0" dur="1.5s" repeatCount="indefinite" />
            </line>
            <line x1="90" y1="35" x2="95" y2="28" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.7">
              <animate attributeName="opacity" values="0;0.7;0" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
            </line>
            <line x1="60" y1="22" x2="60" y2="14" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.7">
              <animate attributeName="opacity" values="0;0.7;0" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
            </line>
          </>
        )}
      </g>
    </svg>
  );
}
