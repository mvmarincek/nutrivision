'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseAdProps {
  slot?: string;
  className?: string;
}

const AD_SLOTS = ['5278243728', '7180344729'];

export default function AdSenseAd({ slot, className = '' }: AdSenseAdProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [selectedSlot] = useState(() => slot || AD_SLOTS[Math.floor(Math.random() * AD_SLOTS.length)]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`ad-container ${className}`} 
      style={{ 
        minHeight: adLoaded ? '100px' : '0px', 
        width: '100%',
        transition: 'min-height 0.3s'
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-3364979853180818"
        data-ad-slot={selectedSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
