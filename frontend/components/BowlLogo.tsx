interface BowlLogoProps {
  className?: string;
}

export default function BowlLogo({ className = "w-8 h-8" }: BowlLogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="16" rx="8" ry="4" />
      <path d="M4 16c0-4 3.5-7 8-7s8 3 8 7" />
      <path d="M8.5 9c-.3-1-.5-2-.3-3" />
      <path d="M12 8c.3-1 .3-2 0-3" />
      <path d="M15.5 9c.3-1 .5-2 .3-3" />
    </svg>
  );
}
