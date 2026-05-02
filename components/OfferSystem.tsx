'use client';

import React, { useState, useEffect } from 'react';
import { PopupOffer, OfferApiResponse } from '@/lib/types/offers';
import OfferMarquee from './OfferMarquee';
import OfferPopup from './OfferPopup';

export default function OfferSystem() {
  const [offers, setOffers] = useState<PopupOffer[]>([]);
  const [settings, setSettings] = useState<{ is_enabled: boolean; delay_seconds: number } | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch('/api/offers');
        if (!res.ok) return;
        const data: OfferApiResponse = await res.json();
        
        if (data.settings && data.settings.is_enabled && data.offers && data.offers.length > 0) {
          setSettings(data.settings);
          setOffers(data.offers);
        }
      } catch (error) {
        console.error('Failed to fetch offers:', error);
      } finally {
        setHasFetched(true);
      }
    };

    fetchOffers();
  }, []);

  // Auto-show logic
  useEffect(() => {
    if (settings && offers.length > 0) {
      if (sessionStorage.getItem('offerPopupClosed')) {
        return; // User already closed it this session
      }

      const timer = setTimeout(() => {
        setIsPopupVisible(true);
      }, settings.delay_seconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [settings, offers]);

  const handleClosePopup = () => {
    setIsPopupVisible(false);
    sessionStorage.setItem('offerPopupClosed', 'true');
  };

  const handleOpenPopup = (index: number) => {
    setCurrentPopupIndex(index);
    setIsPopupVisible(true);
    // Note: We don't clear the sessionStorage here. 
    // Opening via click is explicit, so it can bypass the 'offerPopupClosed' flag for visibility.
  };

  const handleNextOffer = () => {
    setCurrentPopupIndex((prev) => (prev + 1) % offers.length);
  };

  const handlePrevOffer = () => {
    setCurrentPopupIndex((prev) => (prev === 0 ? offers.length - 1 : prev - 1));
  };

  if (!hasFetched || offers.length === 0) return null;

  return (
    <>
      {/* 
        The marquee flows naturally in the document, sitting just above the footer 
        since OfferSystem is placed right before Footer in layout.tsx.
      */}
      <OfferMarquee offers={offers} onOfferClick={handleOpenPopup} />

      {/* 
        The popup is fixed position, so it sits on top of everything when visible.
      */}
      <OfferPopup 
        offers={offers}
        isVisible={isPopupVisible}
        currentIndex={currentPopupIndex}
        onClose={handleClosePopup}
        onNext={handleNextOffer}
        onPrev={handlePrevOffer}
      />
    </>
  );
}
