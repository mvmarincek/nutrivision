interface BowlLogoProps {
  className?: string;
}

export default function BowlLogo({ className = "w-8 h-8" }: BowlLogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="3" fill="currentColor"/>
      <circle cx="12" cy="12" r="6" fill="currentColor"/>
      <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
      <rect x="6" y="2" width="5" height="3" rx="1" fill="currentColor"/>
      <circle cx="18" cy="6.5" r="1.5" fill="currentColor"/>
      <circle cx="18" cy="6.5" r="0.8" fill="white" opacity="0.5"/>
      <circle cx="9.5" cy="10.5" r="1" fill="#22c55e"/>
      <circle cx="14" cy="10" r="0.8" fill="#fb923c"/>
      <circle cx="13.5" cy="14" r="1" fill="#ef4444"/>
      <circle cx="10" cy="13.5" r="0.7" fill="#eab308"/>
    </svg>
  );
}
