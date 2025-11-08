'use client';

import { useState, useEffect, useRef } from 'react';
import { FaMapMarkedAlt, FaUser, FaBell, FaEnvelope, FaGoogle, FaSignInAlt, FaSignOutAlt, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '@/lib/hooks/useAuth';
import type { User } from '@/lib/types';
import type { User as FirebaseUser } from 'firebase/auth';
import AffinityPendingPanel from '@/components/Affinity/AffinityPendingPanel';
import AffinityTestBuilder from '@/components/Affinity/AffinityTestBuilder';

interface HeaderProps {
  user: User | null;
  authUser: FirebaseUser | null;
  onSignIn: () => void;
  onShowSignup: () => void;
}

export default function Header({ user, authUser, onSignIn, onShowSignup }: HeaderProps) {
  const { signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [showTestBuilder, setShowTestBuilder] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  const messagesRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Charger le nombre de demandes en attente
  useEffect(() => {
    if (authUser) {
      loadPendingCount();
      loadUnreadMessages();
      // Recharger toutes les 30 secondes
      const interval = setInterval(() => {
        loadPendingCount();
        loadUnreadMessages();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [authUser]);

  const loadPendingCount = async () => {
    if (!authUser) return;
    
    try {
      const response = await fetch(`/api/affinity/pending?userId=${authUser.uid}`);
      const data = await response.json();
      
      if (response.ok) {
        setPendingCount(data.count || 0);
      }
    } catch (error) {
      console.error('❌ Erreur chargement demandes:', error);
    }
  };

  const loadUnreadMessages = async () => {
    if (!authUser) return;
    
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const messagesQuery = query(
        collection(db, 'messages'),
        where('to', '==', authUser.uid),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(messagesQuery);
      setUnreadMessagesCount(snapshot.size);
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-[1001] bg-white shadow-md border-b border-gray-200"
      style={{ touchAction: 'none' }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="container mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo - Gauche */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <FaMapMarkedAlt className="text-xl text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-gray-900">GraphCI</h1>
        </div>

        {/* Actions - Droite */}
        <div className="flex items-center gap-2">
          {/* Si connecté */}
          {authUser && user && (
            <>
              {/* Icône Messages */}
              <div className="relative flex items-center" ref={messagesRef}>
                <button
                  onClick={() => {
                    setShowMessages(!showMessages);
                    setShowNotifications(false);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition relative"
                >
                  <FaEnvelope className="text-xl text-gray-700" />
                  {/* Badge notification - nombre réel de messages non lus */}
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Messages */}
                {showMessages && (
                  <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-[1100]">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">Messages</h3>
                    </div>
                    <div className="p-4 text-sm text-gray-600">
                      {unreadMessagesCount > 0 ? (
                        <p className="text-blue-600 font-medium">
                          {unreadMessagesCount} message{unreadMessagesCount > 1 ? 's' : ''} non lu{unreadMessagesCount > 1 ? 's' : ''}
                        </p>
                      ) : (
                        <p>Aucun nouveau message</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Icône Notifications */}
              <div className="relative flex items-center" ref={notificationsRef}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowMessages(false);
                    if (!showNotifications && pendingCount > 0) {
                      setShowPendingPanel(true);
                      setShowNotifications(false);
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition relative"
                >
                  <FaBell className="text-xl text-gray-700" />
                  {/* Badge notification - nombre réel de demandes */}
                  {pendingCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Notifications */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-[1100]">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                    </div>
                    <div className="p-4 text-sm text-gray-600">
                      {pendingCount > 0 ? (
                        <button
                          onClick={() => {
                            setShowPendingPanel(true);
                            setShowNotifications(false);
                          }}
                          className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-left"
                        >
                          <div className="font-bold">
                            {pendingCount} demande{pendingCount > 1 ? 's' : ''} d'affinité en attente
                          </div>
                          <div className="text-xs text-blue-100 mt-1">
                            Cliquez pour valider
                          </div>
                        </button>
                      ) : (
                        <p>Aucune notification pour le moment</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Profil */}
              <div className="relative ml-2" ref={menuRef}>
                <button
                  onClick={() => {
                    setShowMenu(!showMenu);
                    setShowNotifications(false);
                    setShowMessages(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-full transition"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <FaUser className="text-white text-sm" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 hidden sm:block">{user.idUnique}</span>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-12 w-64 bg-white border border-gray-200 rounded-lg shadow-2xl z-[1100]">
                    <div className="p-4 border-b border-gray-200">
                      <div className="font-bold text-gray-900">{user.idUnique}</div>
                      <div className="text-xs text-gray-500 mt-1">{user.commune || 'Côte d\'Ivoire'}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <FaUser className="text-[10px]" />
                        <span>{user.friendCount || 0} amis</span>
                      </div>
                    </div>
                    
                    {/* Créer/Modifier mon test */}
                    <button
                      onClick={() => {
                        setShowTestBuilder(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition flex items-center gap-2 text-gray-700 border-b border-gray-100"
                    >
                      <FaClipboardList />
                      <span>Mon test d'affinité</span>
                    </button>
                    
                    {/* Déconnexion */}
                    <button
                      onClick={async () => {
                        try {
                          await signOut();
                          setShowMenu(false);
                        } catch (error) {
                          console.error('Erreur déconnexion:', error);
                        }
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition flex items-center gap-2 text-red-600"
                    >
                      <FaSignOutAlt />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Si connecté SANS profil */}
          {authUser && !user && (
            <button
              onClick={onShowSignup}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition shadow-md"
            >
              Créer mon profil
            </button>
          )}

          {/* Si PAS connecté */}
          {!authUser && (
            <button
              onClick={onSignIn}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition shadow-md flex items-center gap-2"
            >
              <FaGoogle className="text-sm" />
              <span>Se connecter</span>
            </button>
          )}
        </div>
      </div>

      {/* Panel des demandes en attente */}
      {showPendingPanel && authUser && (
        <AffinityPendingPanel
          userId={authUser.uid}
          onClose={() => setShowPendingPanel(false)}
          onRequestProcessed={() => {
            // Recharger le compteur après traitement
            loadPendingCount();
          }}
        />
      )}

      {/* Créateur de test d'affinité */}
      {showTestBuilder && authUser && (
        <AffinityTestBuilder
          userId={authUser.uid}
          onSaved={() => {
            setShowTestBuilder(false);
            alert('Votre test d\'affinité a été enregistré !');
          }}
          onCancel={() => setShowTestBuilder(false)}
        />
      )}
    </header>
  );
}
