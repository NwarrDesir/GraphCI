'use client';

import { useState } from 'react';
import { FaTimes, FaMapMarkerAlt, FaUser, FaHeart, FaBirthdayCake, FaFlag, FaUserFriends, FaEnvelope } from 'react-icons/fa';
import { User } from '@/lib/types';

interface UserProfilePopupProps {
  user: User;
  currentUserId: string | null;
  isAlreadyFriend: boolean;
  onClose: () => void;
  onStartAffinityTest: () => void;
  onSendMessage?: () => void;
}

export default function UserProfilePopup({
  user,
  currentUserId,
  isAlreadyFriend,
  onClose,
  onStartAffinityTest,
  onSendMessage,
}: UserProfilePopupProps) {
  const displayName = user.showRealName && user.displayName ? user.displayName : user.idUnique;
  const isOwnProfile = currentUserId === user.id;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="bg-black/90 border border-white/10 rounded-[32px] p-6 max-w-sm w-full mx-4 shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header minimaliste */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold text-white/90">Profil</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-75 flex items-center justify-center"
          >
            <FaTimes className="text-white/60" />
          </button>
        </div>

        {/* Avatar centré */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <FaUser className="text-3xl text-white/40" />
            )}
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-white mb-1">
              {displayName}
            </div>
            <div className="text-sm text-white/40">{user.nationality}</div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-6 px-4 py-3 bg-white/5 rounded-2xl">
            <p className="text-sm text-white/70 leading-relaxed text-center">
              {user.bio}
            </p>
          </div>
        )}

        {/* Infos en grille minimaliste */}
        <div className="space-y-3 mb-8">
          {user.commune && (
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-white/40 text-sm" />
                <span className="text-sm text-white/40">Localisation</span>
              </div>
              <span className="text-sm font-medium text-white">{user.commune}</span>
            </div>
          )}

          {user.age && (
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FaBirthdayCake className="text-white/40 text-sm" />
                <span className="text-sm text-white/40">Âge</span>
              </div>
              <span className="text-sm font-medium text-white">{user.age} ans</span>
            </div>
          )}

          {user.nationality && (
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FaFlag className="text-white/40 text-sm" />
                <span className="text-sm text-white/40">Nationalité</span>
              </div>
              <span className="text-sm font-medium text-white">{user.nationality}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <FaUserFriends className="text-white/40 text-sm" />
              <span className="text-sm text-white/40">Amis</span>
            </div>
            <span className="text-sm font-medium text-white">
              {user.friendCount || 0}
            </span>
          </div>
        </div>

        {/* Actions Apple-style */}
        {!isOwnProfile && currentUserId && (
          <div className="space-y-3">
            {/* Bouton Message (toujours disponible) */}
            {onSendMessage && (
              <button
                onClick={onSendMessage}
                className="w-full py-4 bg-blue-500 text-white rounded-[20px] font-medium text-sm hover:bg-blue-600 transition-all duration-75 flex items-center justify-center gap-2"
              >
                <FaEnvelope />
                <span>Envoyer un message</span>
              </button>
            )}
            
            {/* Bouton Demander en ami */}
            {isAlreadyFriend ? (
              <div className="w-full py-4 bg-white/5 text-white/60 rounded-[20px] font-medium text-sm text-center border border-white/10 flex items-center justify-center gap-2">
                <FaUserFriends />
                <span>Déjà ami</span>
              </div>
            ) : (
              <button
                onClick={onStartAffinityTest}
                className="w-full py-4 bg-white text-black rounded-[20px] font-medium text-sm hover:bg-white/90 transition-all duration-75"
              >
                Demander en ami
              </button>
            )}
          </div>
        )}

        {isOwnProfile && (
          <div className="w-full py-4 bg-white/5 text-white/60 rounded-[20px] font-medium text-sm text-center border border-white/10">
            Votre profil
          </div>
        )}
      </div>
    </div>
  );
}
