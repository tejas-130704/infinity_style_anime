'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { PopupOffer } from '@/lib/types/offers';

interface OfferPopupProps {
  offers: PopupOffer[];
  isVisible: boolean;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function OfferPopup({
  offers,
  isVisible,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: OfferPopupProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Countdown timer logic
  useEffect(() => {
    if (!isVisible || offers.length === 0) return;

    const currentOffer = offers[currentIndex];
    const expiryDate = new Date(currentOffer.expiry_date).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = expiryDate - now;

      if (distance <= 0) {
        setTimeRemaining('EXPIRED');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isVisible, currentIndex, offers]);

  if (!isVisible || offers.length === 0) return null;

  const currentOffer = offers[currentIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative flex items-center"
          >
            {offers.length > 1 && (
              <button
                onClick={onPrev}
                className="absolute -left-12 lg:-left-16 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                aria-label="Previous offer"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div className="relative w-full max-w-[340px] drop-shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute -top-3 -right-3 z-20 p-1.5 rounded-full bg-mugen-crimson text-white hover:bg-red-600 shadow-lg border-2 border-mugen-black transition-colors"
              >
                <X size={16} />
              </button>

              {/* TICKET CONTAINER (Updated Style) */}
              <div
                className={`relative w-full max-w-[340px] rounded-2xl border overflow-hidden flex flex-col transition-all duration-500 ease-out
                  bg-gradient-to-b from-red-900/80 via-mugen-dark/90 to-mugen-black
                  border-mugen-crimson/50
                  shadow-[0_0_60px_rgba(134,56,65,0.5)]
                `}
              >
                {/* Inner gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-800/30 via-transparent to-transparent pointer-events-none" />

                {/* Shimmer sweep */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-100 animate-[shimmer_3s_infinite]"
                />

                {/* Card content */}
                <div className="relative z-10 flex flex-col flex-1 p-8 text-center">
                  {/* Tag */}
                  <div className="flex items-center justify-center mb-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide bg-mugen-crimson text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                      <Flame size={12} />
                      GIFT VOUCHER
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-sans text-xs uppercase tracking-widest font-semibold mb-3 text-[#e43444]">
                    {currentOffer.title}
                  </h3>
                  
                  {/* Title without forced split */}
                  <div className="font-cinzel text-4xl md:text-5xl font-extrabold text-white leading-snug mb-2 whitespace-pre-wrap [text-shadow:0_2px_20px_rgba(0,0,0,0.8)]">
                    {currentOffer.discount_text}
                  </div>

                  {currentOffer.description && (
                    <p className="font-sans text-sm text-white/80 leading-relaxed mt-4 max-w-[240px] mx-auto">
                      {currentOffer.description}
                    </p>
                  )}
                  
                  {/* Decorative faint line / Divider */}
                  <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-mugen-crimson/50 to-transparent mx-auto mt-6"></div>
                  
                  {/* Expiry and CTA */}
                  <div className="mt-8 pt-6 flex flex-col items-center gap-4">
                    <span className="text-[10px] tracking-widest text-white/60 uppercase font-medium">
                      EXPIRES IN {timeRemaining}
                    </span>
                    
                    <a href={currentOffer.cta_url} onClick={onClose} className="w-full block">
                      <button className="group relative w-full overflow-hidden rounded-lg bg-mugen-crimson py-3.5 px-6 font-bold text-white transition-colors duration-500 hover:text-[#3d2616] flex items-center justify-center shadow-[0_4px_14px_rgba(228,52,68,0.4)] hover:shadow-[0_4px_20px_rgba(244,196,48,0.5)]">
                        {/* Left-to-right fill animation background */}
                        <span className="absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-[#ffdb58] to-[#f4c430] transition-all duration-500 ease-out group-hover:w-full"></span>
                        
                        <span className="relative z-10 flex items-center gap-2">
                          CLAIM NOW <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </button>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {offers.length > 1 && (
              <button
                onClick={onNext}
                className="absolute -right-12 lg:-right-16 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                aria-label="Next offer"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {offers.length > 1 && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
                {offers.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentIndex ? 'bg-white scale-125' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
