'use client';

import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useState } from 'react';

interface CheckoutAgreementProps {
  onAgreementChange?: (agreed: boolean) => void;
  className?: string;
}

export function CheckoutAgreement({ onAgreementChange, className = '' }: CheckoutAgreementProps) {
  const [agreed, setAgreed] = useState(false);

  const handleCheckedChange = (checked: boolean | 'indeterminate') => {
    const isAgreed = checked === true;
    setAgreed(isAgreed);
    if (onAgreementChange) {
      onAgreementChange(isAgreed);
    }
  };

  return (
    <div className={`flex items-start space-x-3 rounded-lg border border-white/10 bg-white/5 p-4 ${className}`}>
      <Checkbox 
        id="legal-agreement" 
        checked={agreed}
        onCheckedChange={handleCheckedChange}
        className="mt-1 border-white/30 data-[state=checked]:bg-mugen-gold data-[state=checked]:text-black"
      />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor="legal-agreement"
          className="text-sm font-medium leading-relaxed text-white/90 cursor-pointer"
        >
          I agree to the terms
        </label>
        <p className="text-xs text-white/60">
          By making this payment, you agree to our{' '}
          <Link href="/legal/terms-and-conditions" className="text-mugen-gold hover:underline" target="_blank">
            Terms and Conditions
          </Link>
          ,{' '}
          <Link href="/legal/privacy-policy" className="text-mugen-gold hover:underline" target="_blank">
            Privacy Policy
          </Link>
          , and{' '}
          <Link href="/legal/cookie-policy" className="text-mugen-gold hover:underline" target="_blank">
            Cookie Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
