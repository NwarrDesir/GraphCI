'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTimes, FaCheck, FaTrash, FaArrowUp, FaArrowDown, FaUserShield } from 'react-icons/fa';
import { AffinityQuestion, AffinityQuestionType } from '@/lib/types';

interface AffinityTestBuilderProps {
  userId: string;
  onSaved: () => void;
  onCancel: () => void;
}

export default function AffinityTestBuilder({
  userId,
  onSaved,
  onCancel,
}: AffinityTestBuilderProps) {
  const [title, setTitle] = useState('On se ressemble ?');
  const [description, setDescription] = useState('Réponds à ces questions pour devenir mon ami !');
  const [minimumScore, setMinimumScore] = useState(70);
  const [questions, setQuestions] = useState<AffinityQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Charger le test existant au démarrage
  useEffect(() => {
    loadExistingTest();
  }, [userId]);

  const loadExistingTest = async () => {
    try {
      const response = await fetch(`/api/affinity/test?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Charger les données du test
        setTitle(data.title || 'On se ressemble ?');
        setDescription(data.description || 'Réponds à ces questions pour devenir mon ami !');
        setMinimumScore(data.minimumScore || 70);
        
        // Charger les questions (avec les réponses correctes cette fois)
        // Il faut faire une autre requête pour obtenir le test complet avec réponses
        const fullTestResponse = await fetch(`/api/affinity/test?userId=${userId}&full=true`);
        if (fullTestResponse.ok) {
          const fullData = await fullTestResponse.json();
          if (fullData.questions && fullData.questions.length > 0) {
            setQuestions(fullData.questions);
          }
        }
      }
    } catch (err) {
      console.log('Pas de test existant, on démarre avec un test vide');
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une nouvelle question
  const addQuestion = (type: AffinityQuestionType) => {
    const newQuestion: AffinityQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      question: '',
      order: questions.length,
      options: type === 'qcm' ? ['', '', '', ''] : undefined,
      correctAnswerIndex: type === 'qcm' ? 0 : undefined,
      correctAnswer: type === 'vrai-faux' ? true : undefined,
    };

    setQuestions([...questions, newQuestion]);
  };

  // Supprimer une question
  const deleteQuestion = (questionId: string) => {
    const filtered = questions.filter((q) => q.id !== questionId);
    // Réorganiser les ordres
    const reordered = filtered.map((q, index) => ({ ...q, order: index }));
    setQuestions(reordered);
  };

  // Déplacer une question
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ];

    // Mettre à jour les ordres
    const reordered = newQuestions.map((q, i) => ({ ...q, order: i }));
    setQuestions(reordered);
  };

  // Mettre à jour une question
  const updateQuestion = (
    questionId: string,
    updates: Partial<AffinityQuestion>
  ) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
    );
  };

  // Mettre à jour une option de QCM
  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  // Sauvegarder le test
  const saveTest = async () => {
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }

    if (questions.length === 0) {
      setError('Ajoutez au moins une question');
      return;
    }

    // Vérifier que toutes les questions sont complètes
    for (const q of questions) {
      if (!q.question.trim()) {
        setError('Toutes les questions doivent avoir un texte');
        return;
      }

      if (q.type === 'qcm') {
        if (!q.options || q.options.some((opt) => !opt.trim())) {
          setError('Toutes les options des QCM doivent être remplies');
          return;
        }
        if (q.correctAnswerIndex === undefined) {
          setError('Sélectionnez la bonne réponse pour chaque QCM');
          return;
        }
      }

      if (q.type === 'vrai-faux' && q.correctAnswer === undefined) {
        setError('Sélectionnez la bonne réponse pour chaque Vrai/Faux');
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch('/api/affinity/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          description,
          questions,
          minimumScore,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      console.log('✅ Test créé:', data.testId);
      onSaved();
    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Créer mon test d'affinité
            </h2>
            <button
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <FaTimes className="text-gray-600" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du test
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Ex: On se ressemble ?"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Instructions pour ceux qui répondent..."
                rows={2}
              />
            </div>

            {/* Score minimum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score minimum requis: <span className="font-bold text-blue-600">{minimumScore}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minimumScore}
                onChange={(e) => setMinimumScore(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Score requis pour les questions automatiques (QCM + Vrai/Faux)
              </p>
            </div>
          </div>
        </div>

        {/* Liste des questions */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {questions.map((q, index) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={index}
              totalQuestions={questions.length}
              onUpdate={(updates) => updateQuestion(q.id, updates)}
              onDelete={() => deleteQuestion(q.id)}
              onMove={(direction) => moveQuestion(index, direction)}
              onUpdateOption={(optionIndex, value) =>
                updateOption(q.id, optionIndex, value)
              }
            />
          ))}

          {questions.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Aucune question pour le moment</p>
              <p className="text-sm">Cliquez sur les boutons ci-dessous pour ajouter des questions</p>
            </div>
          )}
        </div>

        {/* Footer - Boutons d'ajout et de sauvegarde */}
        <div className="p-6 border-t border-gray-200 space-y-4">
          {/* Boutons d'ajout de question */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => addQuestion('qcm')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FaPlus /> QCM
            </button>
            <button
              onClick={() => addQuestion('vrai-faux')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <FaPlus /> Vrai/Faux
            </button>
            <button
              onClick={() => addQuestion('ouverte')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
            >
              <FaPlus /> Question ouverte
            </button>
          </div>

          {/* Erreur */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Boutons de validation */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={saveTest}
              disabled={saving || questions.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <FaCheck /> Sauvegarder
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Composant d'édition d'une question
// ========================================

interface QuestionEditorProps {
  question: AffinityQuestion;
  index: number;
  totalQuestions: number;
  onUpdate: (updates: Partial<AffinityQuestion>) => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onUpdateOption: (optionIndex: number, value: string) => void;
}

function QuestionEditor({
  question,
  index,
  totalQuestions,
  onUpdate,
  onDelete,
  onMove,
  onUpdateOption,
}: QuestionEditorProps) {
  const typeColors = {
    qcm: 'bg-blue-50 border-blue-300',
    'vrai-faux': 'bg-gray-50 border-gray-300',
    ouverte: 'bg-gray-100 border-gray-400',
  };

  const typeLabels = {
    qcm: 'QCM',
    'vrai-faux': 'Vrai/Faux',
    ouverte: 'Question ouverte',
  };

  return (
    <div
      className={`border-2 rounded-xl p-4 ${
        typeColors[question.type]
      } space-y-3`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Question {index + 1} - {typeLabels[question.type]}
        </span>
        <div className="flex items-center gap-2">
          {/* Boutons de déplacement */}
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FaArrowUp className="text-sm" />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={index === totalQuestions - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FaArrowDown className="text-sm" />
          </button>
          {/* Bouton supprimer */}
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 transition text-red-600"
          >
            <FaTrash className="text-sm" />
          </button>
        </div>
      </div>

      {/* Question */}
      <input
        type="text"
        value={question.question}
        onChange={(e) => onUpdate({ question: e.target.value })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
        placeholder="Posez votre question..."
      />

      {/* Options spécifiques au type */}
      {question.type === 'qcm' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Options:</p>
          {question.options?.map((option, optIndex) => (
            <div key={optIndex} className="flex items-center gap-3">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correctAnswerIndex === optIndex}
                onChange={() => onUpdate({ correctAnswerIndex: optIndex })}
                className="w-5 h-5 text-blue-600"
              />
              <input
                type="text"
                value={option}
                onChange={(e) => onUpdateOption(optIndex, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
              />
            </div>
          ))}
          <p className="text-xs text-gray-500">
            Sélectionnez la bonne réponse avec le bouton radio
          </p>
        </div>
      )}

      {question.type === 'vrai-faux' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Bonne réponse:</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correctAnswer === true}
                onChange={() => onUpdate({ correctAnswer: true })}
                className="w-5 h-5 text-blue-600"
              />
              <span className="font-medium text-blue-700">Vrai</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correctAnswer === false}
                onChange={() => onUpdate({ correctAnswer: false })}
                className="w-5 h-5 text-gray-600"
              />
              <span className="font-medium text-gray-700">Faux</span>
            </label>
          </div>
        </div>
      )}

      {question.type === 'ouverte' && (
        <div className="px-4 py-3 bg-gray-100 rounded-lg text-sm text-gray-800 flex items-center gap-2">
          <FaUserShield className="text-gray-600" />
          <span>Les réponses à cette question seront validées manuellement par vous</span>
        </div>
      )}
    </div>
  );
}
