'use client';

import { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseAdProps {
  slot?: string;
  className?: string;
}

const AD_SLOTS = ['5278243728'];

export default function AdSenseAd({ slot, className = '' }: AdSenseAdProps) {
  const [adFilled, setAdFilled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSlot] = useState(() => slot || AD_SLOTS[Math.floor(Math.random() * AD_SLOTS.length)]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }, 100);

    const checkAdFilled = setInterval(() => {
      if (containerRef.current) {
        const ins = containerRef.current.querySelector('ins.adsbygoogle');
        if (ins) {
          const hasAd = ins.getAttribute('data-ad-status') === 'filled' || 
                        ins.querySelector('iframe') !== null ||
                        (ins as HTMLElement).offsetHeight > 10;
          if (hasAd) {
            setAdFilled(true);
            clearInterval(checkAdFilled);
          }
        }
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(checkAdFilled);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(checkAdFilled);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`ad-container flex justify-center ${className}`} 
      style={{ 
        minHeight: adFilled ? '90px' : '0px',
        maxHeight: adFilled ? '120px' : '0px',
        height: adFilled ? 'auto' : '0px',
        width: '100%',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        opacity: adFilled ? 1 : 0
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: adFilled ? '90px' : '0px' }}
        data-ad-client="ca-pub-3364979853180818"
        data-ad-slot={selectedSlot}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}
