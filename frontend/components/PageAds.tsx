'use client';

import { useAuth } from '@/lib/auth';
import AdSenseAd from './AdSenseAd';

interface PageAdsProps {
  position?: 'top' | 'bottom' | 'inline';
}

export default function PageAds({ position = 'inline' }: PageAdsProps) {
  const { user } = useAuth();
  
  if (user?.plan !== 'free') {
    return null;
  }

  return (
    <div className={`${position === 'top' ? 'mb-4' : position === 'bottom' ? 'mt-8 mb-4' : 'my-4'}`}>
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-400 text-center mb-2">Publicidade</p>
        <AdSenseAd />
      </div>
    </div>
  );
}
