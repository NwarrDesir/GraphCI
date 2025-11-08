'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUser } from '@/lib/hooks/useUsers';
import LoadingScreen from '@/components/UI/LoadingScreen';

export default function RootPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { user: userProfile, loading: profileLoading } = useUser(user?.uid || null);

  useEffect(() => {
    if (authLoading || profileLoading) return;

    // Pas connecté → Landing page
    if (!user) {
      router.replace('/landing');
      return;
    }

    // Connecté mais pas de profil → Signup
    if (!userProfile) {
      router.replace('/signup');
      return;
    }

    // Tout est OK → Map
    router.replace('/map');
  }, [authLoading, profileLoading, user, userProfile, router]);

  return <LoadingScreen message="Initialisation..." />;
}
