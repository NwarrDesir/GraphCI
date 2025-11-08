'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  generateFriendCode, 
  getCodeExpirationDate, 
  getFriendshipId 
} from '@/lib/utils/userUtils';
import { FaQrcode, FaUserPlus, FaClock, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import type { FriendCode, User, Friendship } from '@/lib/types';

export default function FriendsPage() {
  const { user } = useAuth();
  
  const [activeCode, setActiveCode] = useState<FriendCode | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [generating, setGenerating] = useState(false);
  
  const [scanCode, setScanCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');

  // Compte à rebours
  useEffect(() => {
    if (!activeCode || activeCode.used) return;
    
    const interval = setInterval(() => {
      const expiresAt = activeCode.expiresAt instanceof Date 
        ? activeCode.expiresAt 
        : (activeCode.expiresAt as Timestamp).toDate();
      
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        setActiveCode(null);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeCode]);

  const handleGenerateCode = async () => {
    if (!user) return;
    
    setGenerating(true);
    try {
      const code = generateFriendCode();
      const expiresAt = getCodeExpirationDate();
      
      const newCode: Omit<FriendCode, 'id'> = {
        code,
        userId: user.uid,
        expiresAt,
        used: false,
      };
      
      const docRef = await addDoc(collection(db, 'friendCodes'), newCode);
      
      setActiveCode({
        id: docRef.id,
        ...newCode,
      });
      
      setTimeLeft(120);
    } catch (err) {
      console.error('Erreur génération code:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleScanCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !scanCode || scanCode.length !== 6) {
      setScanError('Code invalide (6 chiffres requis)');
      return;
    }
    
    setScanning(true);
    setScanError('');
    setScanSuccess('');
    
    try {
      // Rechercher le code
      const codeQuery = query(
        collection(db, 'friendCodes'),
        where('code', '==', scanCode)
      );
      const codeSnapshot = await getDocs(codeQuery);
      
      if (codeSnapshot.empty) {
        setScanError('Code introuvable');
        setScanning(false);
        return;
      }
      
      const codeDoc = codeSnapshot.docs[0];
      const codeData = codeDoc.data() as FriendCode;
      
      // Vérifications
      if (codeData.used) {
        setScanError('Code déjà utilisé');
        setScanning(false);
        return;
      }
      
      const expiresAt = codeData.expiresAt instanceof Date 
        ? codeData.expiresAt 
        : (codeData.expiresAt as Timestamp).toDate();
      
      if (new Date() > expiresAt) {
        setScanError('Code expiré');
        setScanning(false);
        return;
      }
      
      if (codeData.userId === user.uid) {
        setScanError('Vous ne pouvez pas scanner votre propre code');
        setScanning(false);
        return;
      }
      
      // Vérifier si déjà amis
      const friendshipId = getFriendshipId(user.uid, codeData.userId);
      const friendshipDoc = await getDoc(doc(db, 'friendships', friendshipId));
      
      if (friendshipDoc.exists()) {
        setScanError('Vous êtes déjà amis avec cette personne');
        setScanning(false);
        return;
      }
      
      // Créer l'amitié
      const [userId1, userId2] = [user.uid, codeData.userId].sort();
      
      const newFriendship: Omit<Friendship, 'id'> = {
        userId1,
        userId2,
        status: 'accepted', // Acceptation immédiate avec code
        createdAt: new Date(),
        acceptedAt: new Date(),
      };
      
      await setDoc(doc(db, 'friendships', friendshipId), {
        id: friendshipId,
        ...newFriendship,
      });
      
      // Marquer le code comme utilisé
      await updateDoc(doc(db, 'friendCodes', codeDoc.id), {
        used: true,
        usedBy: user.uid,
        usedAt: new Date(),
      });
      
      // Incrémenter friendCount pour les deux utilisateurs
      const user1Ref = doc(db, 'users', userId1);
      const user2Ref = doc(db, 'users', userId2);
      
      const user1Doc = await getDoc(user1Ref);
      const user2Doc = await getDoc(user2Ref);
      
      if (user1Doc.exists()) {
        const user1Data = user1Doc.data() as User;
        await updateDoc(user1Ref, {
          friendCount: (user1Data.friendCount || 0) + 1,
        });
      }
      
      if (user2Doc.exists()) {
        const user2Data = user2Doc.data() as User;
        await updateDoc(user2Ref, {
          friendCount: (user2Data.friendCount || 0) + 1,
        });
      }
      
      setScanSuccess('Ami ajouté avec succès ! 🎉');
      setScanCode('');
      
      setTimeout(() => setScanSuccess(''), 3000);
    } catch (err: any) {
      console.error('Erreur scan code:', err);
      setScanError(err.message || 'Erreur lors du scan');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Gestion des Amis
        </h1>

        {/* Génération de code */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaQrcode className="text-white text-2xl" />
            <h2 className="text-xl font-bold text-white">
              Générer un code ami
            </h2>
          </div>
          
          <p className="text-gray-400 mb-6">
            Générez un code temporaire que vos amis pourront scanner pour se connecter avec vous.
            Le code expire après 2 minutes et est à usage unique.
          </p>
          
          {!activeCode || activeCode.used || timeLeft === 0 ? (
            <button
              onClick={handleGenerateCode}
              disabled={generating}
              className="w-full px-6 py-4 bg-white text-black rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <FaQrcode />
                  <span>Générer un code</span>
                </>
              )}
            </button>
          ) : (
            <div className="bg-white/10 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">Votre code ami :</p>
              <div className="text-6xl font-bold text-white tracking-wider mb-4">
                {activeCode.code}
              </div>
              <div className="flex items-center justify-center gap-2 text-yellow-500">
                <FaClock />
                <span className="text-lg font-medium">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-4">
                Partagez ce code avec la personne que vous souhaitez ajouter
              </p>
            </div>
          )}
        </div>

        {/* Scanner de code */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaUserPlus className="text-white text-2xl" />
            <h2 className="text-xl font-bold text-white">
              Scanner un code ami
            </h2>
          </div>
          
          <p className="text-gray-400 mb-6">
            Entrez le code à 6 chiffres que votre ami a généré pour vous connecter.
          </p>
          
          <form onSubmit={handleScanCode} className="space-y-4">
            <input
              type="text"
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-lg text-white text-center text-3xl font-bold tracking-wider placeholder-gray-600 focus:outline-none focus:border-white/30"
            />
            
            {scanError && (
              <div className="flex items-center gap-2 text-red-500">
                <FaTimes />
                <span>{scanError}</span>
              </div>
            )}
            
            {scanSuccess && (
              <div className="flex items-center gap-2 text-green-500">
                <FaCheck />
                <span>{scanSuccess}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={scanning || scanCode.length !== 6}
              className="w-full px-6 py-4 bg-white text-black rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {scanning ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Validation...</span>
                </>
              ) : (
                <>
                  <FaUserPlus />
                  <span>Ajouter cet ami</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
