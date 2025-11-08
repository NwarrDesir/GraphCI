import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs, doc, getDoc, where, onSnapshot } from 'firebase/firestore';
import type { User, Friendship } from '@/lib/types';

/**
 * Hook pour récupérer tous les utilisateurs
 */
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'));
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as User[];
        
        setUsers(usersData);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
}

/**
 * Hook pour récupérer un utilisateur spécifique
 */
export function useUser(userId: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUser({ ...userDoc.data(), id: userDoc.id } as User);
        }
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
}

/**
 * Hook pour récupérer les amitiés d'un utilisateur
 */
export function useFriendships(userId: string | null) {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q1 = query(
      collection(db, 'friendships'),
      where('userId1', '==', userId)
    );
    
    const q2 = query(
      collection(db, 'friendships'),
      where('userId2', '==', userId)
    );

    const fetchFriendships = async () => {
      try {
        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(q1),
          getDocs(q2),
        ]);
        
        const friendshipsData = [
          ...snapshot1.docs.map(doc => ({ ...doc.data(), id: doc.id })),
          ...snapshot2.docs.map(doc => ({ ...doc.data(), id: doc.id })),
        ] as Friendship[];
        
        setFriendships(friendshipsData);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchFriendships();
  }, [userId]);

  return { friendships, loading, error };
}

/**
 * Hook pour récupérer les amis d'un utilisateur (avec infos complètes)
 */
export function useFriends(userId: string | null) {
  const { friendships, loading: friendshipsLoading } = useFriendships(userId);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (friendshipsLoading) return;
    
    const fetchFriends = async () => {
      try {
        const friendIds = friendships
          .filter(f => f.status === 'accepted')
          .map(f => f.userId1 === userId ? f.userId2 : f.userId1);
        
        if (friendIds.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }
        
        const friendsData = await Promise.all(
          friendIds.map(async (friendId) => {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            return friendDoc.exists() 
              ? { ...friendDoc.data(), id: friendDoc.id } as User
              : null;
          })
        );
        
        setFriends(friendsData.filter(f => f !== null) as User[]);
        setLoading(false);
      } catch (err) {
        console.error('Erreur chargement amis:', err);
        setLoading(false);
      }
    };

    fetchFriends();
  }, [friendships, friendshipsLoading, userId]);

  return { friends, loading };
}
