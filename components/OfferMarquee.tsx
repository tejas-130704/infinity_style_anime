'use client';

import React from 'react';
import { PopupOffer } from '@/lib/types/offers';
import { Tag } from 'lucide-react';

interface OfferMarqueeProps {
  offers: PopupOffer[];
  onOfferClick: (index: number) => void;
}

export default function OfferMarquee({ offers, onOfferClick }: OfferMarqueeProps) {
  if (!offers || offers.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden bg-[#161413] border-t border-white/5 py-4 group flex z-10">
      {/* Gradient fade overlays for smooth edges */}
      <div className="absolute inset-y-0 left-0 w-12 md:w-24 bg-gradient-to-r from-[#161413] to-transparent z-20 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-12 md:w-24 bg-gradient-to-l from-[#161413] to-transparent z-20 pointer-events-none"></div>

      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {/* Repeat the group multiple times to ensure enough content for ultra-wide screens */}
        {/* We animate to -50%, which means shifting exactly half of the groups */}
        {Array.from({ length: 10 }).map((_, groupIndex) => (
          <div key={groupIndex} className="flex shrink-0 items-center px-2">
            {offers.map((offer, originalIndex) => (
              <button
                key={`${groupIndex}-${offer.id || originalIndex}`}
                onClick={() => onOfferClick(originalIndex)}
                className="flex items-center gap-3 px-6 py-2.5 mx-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group/btn whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-400 group-hover/btn:bg-red-500 group-hover/btn:text-white transition-colors">
                  <Tag size={12} />
                </div>
                <span className="text-sm font-medium text-white/80 group-hover/btn:text-white transition-colors font-dm-sans">
                  <span className="font-bold text-red-400 group-hover/btn:text-red-300">{offer.discount_text}</span>{' '}
                  <span className="mx-1 opacity-40">•</span>{' '}
                  {offer.title}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
