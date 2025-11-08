'use client';

import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaArrowsAlt, FaPaperPlane, FaMinus } from 'react-icons/fa';
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: any;
  read: boolean;
}

interface FloatingChatWindowProps {
  currentUserId: string;
  targetUserId: string;
  targetUserName: string;
  targetUserIdUnique: string;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

export default function FloatingChatWindow({
  currentUserId,
  targetUserId,
  targetUserName,
  targetUserIdUnique,
  onClose,
  initialPosition = { x: 100, y: 100 }
}: FloatingChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Charger les messages en temps réel
  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUserId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message))
        .filter(msg => 
          (msg.from === currentUserId && msg.to === targetUserId) ||
          (msg.from === targetUserId && msg.to === currentUserId)
        );
      
      setMessages(messagesData);
      
      // Marquer les messages reçus comme lus
      messagesData.forEach(async (msg) => {
        if (msg.to === currentUserId && !msg.read) {
          try {
            await updateDoc(doc(db, 'messages', msg.id), {
              read: true
            });
          } catch (error) {
            console.error('Erreur marquage message lu:', error);
          }
        }
      });
      
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [currentUserId, targetUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        from: currentUserId,
        to: targetUserId,
        text: newMessage.trim(),
        timestamp: Timestamp.now(),
        read: false,
        participants: [currentUserId, targetUserId] // Pour les requêtes
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setSending(false);
    }
  };

  // Gestion du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 3000,
        width: isMinimized ? '300px' : '380px',
        height: isMinimized ? '50px' : '500px',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
      className="flex flex-col bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header - Zone de drag */}
      <div className="drag-handle bg-gradient-to-r from-blue-600/40 to-blue-500/40 px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-white/10">
        <div className="flex items-center gap-2">
          <FaArrowsAlt className="text-white/50 text-sm" />
          <div>
            <h3 className="text-white font-semibold text-sm">{targetUserName || targetUserIdUnique}</h3>
            <p className="text-white/50 text-xs">{targetUserIdUnique}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition text-white"
          >
            <FaMinus className="text-sm" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 transition text-white"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
      </div>

      {/* Messages - Caché si minimisé */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-white/40 text-sm mt-8">
                Aucun message. Commencez la conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.from === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                        isMe
                          ? 'bg-blue-500/80 text-white'
                          : 'bg-white/10 text-white border border-white/20'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.text}</p>
                      <div className="flex items-center gap-2 justify-between mt-1">
                        <p className="text-[10px] opacity-60">
                          {msg.timestamp?.toDate?.()?.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {isMe && (
                          <span className="text-[10px] opacity-60">
                            {msg.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-black/30">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez votre message..."
                disabled={sending}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition text-white"
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
