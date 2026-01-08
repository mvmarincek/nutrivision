'use client';

import { useEffect, useId } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseAdProps {
  slot?: string;
  className?: string;
}

export default function AdSenseAd({ slot = '5278243728', className = '' }: AdSenseAdProps) {
  const id = useId();

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} style={{ minHeight: '100px', width: '100%' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-3364979853180818"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
        key={id}
      />
    </div>
  );
}
