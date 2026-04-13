'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLoader } from '@/context/LoaderContext';

const ZenitsuLoader = dynamic(() => import('@/components/ZenitsuLoader'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-50 bg-gradient-to-b from-black via-gray-950 to-black" aria-hidden />,
});

export function GlobalLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, setLoading } = useLoader();
  const [initialLoad, setInitialLoad] = useState(true);

  // Show loader on initial page load
  useEffect(() => {
    if (initialLoad) {
      setLoading(true);
      const timer = setTimeout(() => {
        setInitialLoad(false);
        setLoading(false);
      }, 2000); // Show for 2 seconds on initial load

      return () => clearTimeout(timer);
    }
  }, [initialLoad, setLoading]);

  // Show loader on route change
  useEffect(() => {
    if (!initialLoad) {
      setLoading(true);
      
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [pathname, initialLoad, setLoading]);

  return (
    <ZenitsuLoader isLoading={isLoading || initialLoad}>
      {children}
    </ZenitsuLoader>
  );
}
