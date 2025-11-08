'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUsers } from '@/lib/hooks/useUsers';
import { useUser } from '@/lib/hooks/useUsers';
import LoadingScreen from '@/components/UI/LoadingScreen';
import SignupForm from '@/components/Auth/SignupForm';
import LoginModal from '@/components/Auth/LoginModal';
import Header from '@/components/Layout/Header';

// Import dynamique pour éviter les problèmes SSR avec Leaflet
const GraphView = dynamic(() => import('@/components/Graph/GraphView'), {
  ssr: false,
  loading: () => <LoadingScreen message="Chargement de la carte..." />,
});

export default function HomePage() {
  const { user: authUser, loading: authLoading, signInWithGoogle, signInWithEmail } = useAuth();
  const { user: userProfile, loading: profileLoading } = useUser(authUser?.uid || null);
  const { users, loading: usersLoading } = useUsers();
  const [showSignupOverlay, setShowSignupOverlay] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Si connecté mais pas de profil, afficher overlay signup
  useEffect(() => {
    if (!authLoading && !profileLoading && authUser && !userProfile) {
      setShowSignupOverlay(true);
    } else {
      setShowSignupOverlay(false);
    }
  }, [authLoading, profileLoading, authUser, userProfile]);

  // Afficher loading initial SEULEMENT si nécessaire
  if (authLoading) {
    return <LoadingScreen message="Vérification de la connexion..." />;
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* HEADER - VISIBLE POUR TOUS avec boutons Se connecter/S'inscrire */}
      <Header 
        user={userProfile} 
        authUser={authUser}
        onSignIn={() => setShowLoginModal(true)}
        onShowSignup={() => setShowSignupOverlay(true)}
      />

      {/* LA CARTE - VISIBLE POUR TOUS (connecté ou non) */}
      {usersLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement de la carte...</p>
          </div>
        </div>
      ) : (
        <GraphView users={users} currentUserId={authUser?.uid} />
      )}

      {/* OVERLAY: Création profil (si connecté sans profil) */}
      {showSignupOverlay && authUser && (
        <SignupOverlay 
          userId={authUser.uid}
          userEmail={authUser.email}
          onClose={() => setShowSignupOverlay(false)} 
        />
      )}

      {/* MODAL: Connexion (email/password + Google) */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
          onSignInWithEmail={signInWithEmail}
          onSignInWithGoogle={signInWithGoogle}
        />
      )}
    </main>
  );
}

// Composant overlay signup intégré
function SignupOverlay({ 
  userId, 
  userEmail, 
  onClose 
}: { 
  userId: string; 
  userEmail?: string | null; 
  onClose: () => void 
}) {
  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[10000] p-6 overflow-y-auto">
      <div className="bg-black border border-white/20 rounded-2xl p-8 max-w-md w-full my-auto">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Créer votre profil</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Complétez vos informations pour accéder à la carte
        </p>
        
        <SignupForm 
          userId={userId} 
          userEmail={userEmail}
          onComplete={onClose}
        />
      </div>
    </div>
  );
}
