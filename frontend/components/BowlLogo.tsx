interface BowlLogoProps {
  className?: string;
}

export default function BowlLogo({ className = "w-8 h-8" }: BowlLogoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="15" rx="8" ry="5" />
      <path d="M4 15c0-4 3.5-7 8-7s8 3 8 7" />
      <path d="M8 8c.5-1.5 1-2.5 1.2-3" />
      <path d="M12 7c0-1.5 0-2.5 0-3.5" />
      <path d="M16 8c-.5-1.5-1-2.5-1.2-3" />
    </svg>
  );
}
