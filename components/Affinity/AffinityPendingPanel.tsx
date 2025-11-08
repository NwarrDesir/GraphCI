'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaEnvelope, FaHourglass, FaUser } from 'react-icons/fa';
import { AffinityAnswer } from '@/lib/types';

interface PendingRequest {
  id: string;
  from: string;
  fromUser: {
    idUnique: string;
    displayName?: string;
    photoURL?: string;
    commune?: string;
    age?: number;
    nationality?: string;
  } | null;
  testId: string;
  autoScore?: number;
  autoScorePassed?: boolean;
  openQuestions: AffinityAnswer[];
  createdAt: any;
}

interface AffinityPendingPanelProps {
  userId: string;
  onClose: () => void;
  onRequestProcessed: () => void;
}

export default function AffinityPendingPanel({
  userId,
  onClose,
  onRequestProcessed,
}: AffinityPendingPanelProps) {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPendingRequests();
  }, [userId]);

  const loadPendingRequests = async () => {
    try {
      const response = await fetch(`/api/affinity/pending?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      setRequests(data.requests);
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Erreur chargement demandes:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDecision = async (
    requestId: string,
    decision: 'approved' | 'rejected',
    comment?: string
  ) => {
    setError('');
    setProcessing(requestId);

    try {
      const response = await fetch('/api/affinity/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          userId,
          decision,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      console.log('✅ Décision enregistrée:', data);

      // Retirer la demande de la liste
      setRequests(requests.filter((r) => r.id !== requestId));
      
      onRequestProcessed();
    } catch (err: any) {
      console.error('❌ Erreur validation:', err);
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-lg text-gray-700">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Demandes en attente
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {requests.length} demande{requests.length !== 1 ? 's' : ''} à valider
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/50 transition"
            >
              <FaTimes className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Liste des demandes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FaHourglass className="text-3xl text-gray-400" />
              </div>
              <p className="text-lg text-gray-600 font-medium">
                Aucune demande en attente
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Les demandes nécessitant votre validation apparaîtront ici
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                processing={processing === request.id}
                onApprove={() => handleDecision(request.id, 'approved')}
                onReject={() => handleDecision(request.id, 'rejected')}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {error && (
          <div className="p-6 border-t border-gray-200">
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// Carte d'une demande
// ========================================

interface RequestCardProps {
  request: PendingRequest;
  processing: boolean;
  onApprove: () => void;
  onReject: () => void;
}

function RequestCard({
  request,
  processing,
  onApprove,
  onReject,
}: RequestCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const displayName = request.fromUser?.displayName || request.fromUser?.idUnique || 'Utilisateur';

  return (
    <div className="border-2 border-purple-200 rounded-xl overflow-hidden bg-gradient-to-r from-purple-50 to-white">
      {/* En-tête */}
      <div className="p-4 bg-purple-100/50">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xl">
            {request.fromUser?.photoURL ? (
              <img
                src={request.fromUser.photoURL}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <FaUser />
            )}
          </div>

          {/* Infos */}
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{displayName}</h3>
            <p className="text-sm text-gray-600">
              {request.fromUser?.commune && `${request.fromUser.commune} • `}
              {request.fromUser?.age && `${request.fromUser.age} ans • `}
              {request.fromUser?.nationality}
            </p>
          </div>

          {/* Score auto */}
          {request.autoScore !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">
                {request.autoScore.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Questions auto</div>
              {request.autoScorePassed && (
                <div className="text-xs text-green-600 font-medium mt-1 flex items-center justify-end gap-1">
                  <FaCheck />
                  <span>Seuil atteint</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bouton pour afficher les réponses */}
      <div className="px-4 py-3 border-t border-purple-200">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-2 px-4 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition text-purple-700 font-medium"
        >
          {showDetails ? '▼' : '▶'} Voir les réponses ouvertes ({request.openQuestions.length})
        </button>
      </div>

      {/* Détails des réponses ouvertes */}
      {showDetails && (
        <div className="px-4 py-4 space-y-4 bg-white">
          {request.openQuestions.map((answer, index) => (
            <div key={answer.questionId} className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="px-4 py-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {answer.answerText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-purple-200 flex gap-3">
        <button
          onClick={onReject}
          disabled={processing}
          className="flex-1 py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Traitement...' : '✗ Refuser'}
        </button>
        <button
          onClick={onApprove}
          disabled={processing}
          className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? 'Traitement...' : (
            <>
              <FaCheck />
              <span>Accepter</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
