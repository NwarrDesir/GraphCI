'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUsers } from '@/lib/hooks/useUsers';
import { useUser } from '@/lib/hooks/useUsers';
import Header from '@/components/Layout/Header';
import LoadingScreen from '@/components/UI/LoadingScreen';

// Import dynamique pour éviter les problèmes SSR avec Leaflet
const GraphView = dynamic(() => import('@/components/Graph/GraphView'), {
  ssr: false,
  loading: () => <LoadingScreen message="Chargement du graphe..." />,
});

export default function MapPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const { user: userProfile, loading: profileLoading } = useUser(authUser?.uid || null);
  const { users, loading: usersLoading, error } = useUsers();

  // Gestion des redirections
  useEffect(() => {
    if (authLoading || profileLoading) return;

    // Si pas d'utilisateur connecté, rediriger vers landing
    if (!authUser) {
      router.push('/landing');
      return;
    }

    // Si connecté mais pas de profil, rediriger vers signup
    if (!userProfile) {
      router.push('/signup');
      return;
    }
  }, [authLoading, profileLoading, authUser, userProfile, router]);

  // Afficher le loading tant que l'auth ou le profil charge
  if (authLoading || profileLoading || usersLoading) {
    return <LoadingScreen message="Chargement de votre monde..." />;
  }

  // Si pas d'utilisateur ou pas de profil, ne rien afficher (redirection en cours)
  if (!authUser || !userProfile) {
    return <LoadingScreen message="Redirection..." />;
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* Header */}
      <Header 
        user={userProfile}
        authUser={authUser}
        onSignIn={() => {}}
        onShowSignup={() => {}}
      />

      {/* Titre de l'application */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] text-center pointer-events-none">
        <h1 className="text-3xl font-bold text-white mb-1">
          Votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-green-500">Monde</span>
        </h1>
        <p className="text-gray-400 text-sm">
          {userProfile.idUnique} • {userProfile.nationality}
        </p>
        <p className="text-gray-500 text-xs mt-1">{users.length} connectés • {userProfile.friendCount} amis</p>
      </div>

      {/* Graphe principal */}
      {error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-500 mb-4">Erreur de chargement des données</p>
            <p className="text-sm text-gray-400">{error.message}</p>
          </div>
        </div>
      ) : (
        <GraphView users={users} currentUserId={authUser?.uid} />
      )}
    </main>
  );
}
