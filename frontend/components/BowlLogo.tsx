interface BowlLogoProps {
  className?: string;
}

export default function BowlLogo({ className = "w-8 h-8" }: BowlLogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="3" fill="white"/>
      <rect x="9" y="3" width="4" height="2.5" rx="1" fill="white"/>
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
      <circle cx="19" cy="7" r="1" fill="currentColor" opacity="0.5"/>
      <circle cx="10" cy="10.5" r="1" fill="#22c55e"/>
      <circle cx="14" cy="10" r="0.9" fill="#fb923c"/>
      <circle cx="10.5" cy="13.5" r="0.8" fill="#eab308"/>
      <circle cx="14" cy="13" r="1" fill="#ef4444"/>
    </svg>
  );
}
