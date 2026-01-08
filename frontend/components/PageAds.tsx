'use client';

import { useAuth } from '@/lib/auth';
import AdBanner from './AdBanner';

interface PageAdsProps {
  slot: string;
  position: 'top' | 'bottom';
}

export default function PageAds({ slot, position }: PageAdsProps) {
  const { user } = useAuth();
  
  if (position === 'top') {
    if (user?.plan !== 'free') return null;
    
    return (
      <div className="mb-4 sticky top-0 z-40 bg-gradient-to-b from-gray-100 to-transparent pb-2">
        <AdBanner slot={slot} format="horizontal" className="rounded-xl overflow-hidden shadow-md" />
      </div>
    );
  }
  
  return (
    <div className={`mt-6 ${user?.plan === 'free' ? 'mb-4' : 'mb-2 opacity-80'}`}>
      <AdBanner 
        slot={slot} 
        format="horizontal" 
        className={`rounded-2xl overflow-hidden ${user?.plan === 'free' ? 'shadow-lg' : ''}`} 
      />
    </div>
  );
}
