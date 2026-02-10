export default function NutraAvatar({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nutra-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="nutra-leaf" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="55" r="35" fill="url(#nutra-body)" />
      <circle cx="50" cy="55" r="31" fill="url(#nutra-body)" opacity="0.9" />
      <path d="M50 20 Q55 8 65 12 Q60 22 50 25 Z" fill="url(#nutra-leaf)" />
      <path d="M50 20 Q45 10 38 15 Q42 23 50 25 Z" fill="url(#nutra-leaf)" opacity="0.8" />
      <ellipse cx="38" cy="50" rx="5" ry="6" fill="white" />
      <ellipse cx="62" cy="50" rx="5" ry="6" fill="white" />
      <circle cx="39" cy="51" r="3" fill="#1e293b" />
      <circle cx="63" cy="51" r="3" fill="#1e293b" />
      <circle cx="40.5" cy="49.5" r="1.2" fill="white" />
      <circle cx="64.5" cy="49.5" r="1.2" fill="white" />
      <path d="M42 64 Q50 72 58 64" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="30" cy="58" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="70" cy="58" rx="5" ry="3" fill="#fca5a5" opacity="0.5" />
    </svg>
  );
}
