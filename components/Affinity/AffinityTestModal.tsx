'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaHourglass, FaChartBar, FaExclamationTriangle, FaUserShield } from 'react-icons/fa';
import { AffinityQuestion, AffinityAnswer } from '@/lib/types';

interface AffinityTestModalProps {
  testId: string;
  testOwnerName: string;
  testTitle: string;
  testDescription?: string;
  currentUserId: string;
  onClose: () => void;
  onSubmitted: (result: {
    status: string;
    autoScore?: number;
    needsManualReview?: boolean;
    message: string;
  }) => void;
}

export default function AffinityTestModal({
  testId,
  testOwnerName,
  testTitle,
  testDescription,
  currentUserId,
  onClose,
  onSubmitted,
}: AffinityTestModalProps) {
  const [questions, setQuestions] = useState<AffinityQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [questionId: string]: AffinityAnswer }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [minimumScore, setMinimumScore] = useState(70);

  // Charger le test
  useEffect(() => {
    loadTest();
  }, [testId]);

  const loadTest = async () => {
    try {
      console.log('🔍 Chargement du test pour userId:', testId);
      const response = await fetch(`/api/affinity/test?userId=${testId}`);
      const data = await response.json();
      
      console.log('📥 Réponse API:', { status: response.status, data });

      if (!response.ok) {
        if (data.hasTest === false) {
          setError('Cet utilisateur n\'a pas encore créé de test d\'affinité');
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Erreur lors du chargement du test');
      }

      if (!data.questions || data.questions.length === 0) {
        setError('Ce test ne contient aucune question');
        setLoading(false);
        return;
      }

      console.log('✅ Test chargé avec', data.questions.length, 'questions');
      
      setQuestions(data.questions);
      setMinimumScore(data.minimumScore);
      
      // Initialiser les réponses
      const initialAnswers: { [key: string]: AffinityAnswer } = {};
      data.questions.forEach((q: AffinityQuestion) => {
        initialAnswers[q.id] = {
          questionId: q.id,
          questionType: q.type,
        };
      });
      setAnswers(initialAnswers);
      
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Erreur chargement test:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Mettre à jour une réponse
  const updateAnswer = (questionId: string, updates: Partial<AffinityAnswer>) => {
    setAnswers({
      ...answers,
      [questionId]: { ...answers[questionId], ...updates },
    });
  };

  // Valider que toutes les questions ont une réponse
  const validateAnswers = (): boolean => {
    for (const q of questions) {
      const answer = answers[q.id];
      
      if (q.type === 'qcm' && answer.answerIndex === undefined) {
        setError('Veuillez répondre à toutes les questions QCM');
        return false;
      }
      
      if (q.type === 'vrai-faux' && answer.answerBoolean === undefined) {
        setError('Veuillez répondre à toutes les questions Vrai/Faux');
        return false;
      }
      
      if (q.type === 'ouverte' && !answer.answerText?.trim()) {
        setError('Veuillez répondre à toutes les questions ouvertes');
        return false;
      }
    }
    
    return true;
  };

  // Soumettre le test
  const submitTest = async () => {
    setError('');
    
    if (!validateAnswers()) {
      return;
    }

    setSubmitting(true);

    try {
      console.log('📤 Soumission du test:', {
        testId,
        fromUserId: currentUserId,
        toUserId: testId,
        answersCount: Object.values(answers).length
      });
      
      const response = await fetch('/api/affinity/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          fromUserId: currentUserId,
          toUserId: testId, // testId EST le userId du propriétaire du test
          answers: Object.values(answers),
        }),
      });

      const data = await response.json();
      
      console.log('📥 Réponse soumission:', { status: response.status, data });

      if (!response.ok) {
        if (data.blocked) {
          setError(data.error);
          setSubmitting(false);
          return;
        }
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      console.log('✅ Test soumis:', data);
      onSubmitted(data);
    } catch (err: any) {
      console.error('❌ Erreur soumission:', err);
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-lg text-gray-700">Chargement du test...</span>
          </div>
        </div>
      </div>
    );
  }

  // Si erreur et pas de questions - afficher message d'erreur
  if (error && questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-2xl text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">Test introuvable</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <FaTimes className="text-gray-600" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{error}</p>
          
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-gray-900">{testTitle}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/50 transition"
            >
              <FaTimes className="text-gray-600" />
            </button>
          </div>
          
          <p className="text-gray-600 mb-2">
            Test créé par <span className="font-semibold text-blue-600">{testOwnerName}</span>
          </p>
          
          {testDescription && (
            <p className="text-sm text-gray-500">{testDescription}</p>
          )}
          
          <div className="mt-4 px-4 py-3 bg-blue-100 rounded-lg text-sm text-blue-800 flex items-center gap-2">
            <FaChartBar className="text-blue-600" />
            <span>Score minimum requis : <span className="font-bold">{minimumScore}%</span></span>
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="space-y-3">
              <h3 className="font-medium text-gray-900">
                {index + 1}. {q.question}
              </h3>

              {/* QCM */}
              {q.type === 'qcm' && q.options && (
                <div className="space-y-2 pl-4">
                  {q.options.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        checked={answers[q.id]?.answerIndex === optIndex}
                        onChange={() =>
                          updateAnswer(q.id, { answerIndex: optIndex })
                        }
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-gray-700">
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Vrai/Faux */}
              {q.type === 'vrai-faux' && (
                <div className="flex gap-4 pl-4">
                  <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition flex-1">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      checked={answers[q.id]?.answerBoolean === true}
                      onChange={() =>
                        updateAnswer(q.id, { answerBoolean: true })
                      }
                      className="w-5 h-5 text-green-600"
                    />
                    <span className="font-medium text-green-700">Vrai</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-red-400 hover:bg-red-50 transition flex-1">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      checked={answers[q.id]?.answerBoolean === false}
                      onChange={() =>
                        updateAnswer(q.id, { answerBoolean: false })
                      }
                      className="w-5 h-5 text-red-600"
                    />
                    <span className="font-medium text-red-700">Faux</span>
                  </label>
                </div>
              )}

              {/* Question ouverte */}
              {q.type === 'ouverte' && (
                <div className="pl-4">
                  <textarea
                    value={answers[q.id]?.answerText || ''}
                    onChange={(e) =>
                      updateAnswer(q.id, { answerText: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Rédigez votre réponse..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                    <FaUserShield className="text-purple-500" />
                    <span>Cette réponse sera lue par {testOwnerName}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              onClick={submitTest}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <FaCheck /> Soumettre mes réponses
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
