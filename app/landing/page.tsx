'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirection automatique vers la carte
export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
