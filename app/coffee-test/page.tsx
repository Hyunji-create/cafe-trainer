'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QuizAnswerInput, { QuizAnswerInputHandle } from '../../components/QuizAnswerInput';
import Confetti from '../../components/Confetti';
import AdminPanel from '../../components/AdminPanel';
import ModuleWrapper from '../../components/ModuleWrapper';

// Definition for the table data structure
type CoffeeCodeItem = {
  id: number;
  name: string;
  code: string | null;
  zone: string | null;
  is_split: boolean;
  upper_code: string | null;
  lower_code: string | null;
};

const SPECIAL_CHARS = ['Ⓢ', '/', '!', '¡', '↓', '↑'];
const MODULE_TITLE = 'Coffee Code + Test';
const MODULE_ICON = '☕';

export default function TypingCoffeeTrainer() {
  const router = useRouter();
  const answerRef = useRef<QuizAnswerInputHandle>(null);
  const upperRef = useRef<QuizAnswerInputHandle>(null);
  const lowerRef = useRef<QuizAnswerInputHandle>(null);
  
  // State Management
  const [coffeeLibrary, setCoffeeLibrary] = useState<CoffeeCodeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedLevel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('coffeeTestLevel');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showResumePrompt, setShowResumePrompt] = useState(savedLevel > 1 && savedLevel !== -1);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [maxLevel, setMaxLevel] = useState(1);
  const [quizLimit, setQuizLimit] = useState<string>('');
  const [feedback, setFeedback] = useState<{message: string; type: 'success' | 'error' | 'neutral'}>({message: "", type: "neutral"});
  
  // 1. Fetch Data from API Route
  const loadCodes = async (level: number = currentLevel, limit?: string) => {
    setLoading(true);
    try {
      const limitParam = limit ?? quizLimit;
      const url = limitParam
        ? `/api/coffee-codes?level=${level}&limit=${limitParam}`
        : `/api/coffee-codes?level=${level}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Error:", errorData);
        setFeedback({message: `Failed to load codes: ${errorData.error}`, type: 'error'});
      } else {
        const { data, maxLevel: max } = await res.json();
        setCoffeeLibrary(data as CoffeeCodeItem[]);
        setMaxLevel(max);
        setCurrentLevel(level);
        sessionStorage.setItem('coffeeTestLevel', String(level));
      }
    } catch (err) {
      console.error("Connection Error:", err);
      setFeedback({message: "Failed to connect to the server.", type: 'error'});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showResumePrompt) {
      loadCodes(1); // eslint-disable-line
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  // Ensure focus remains in the input field when the index changes
  useEffect(() => {
    if (!loading && coffeeLibrary.length > 0) {
      const currentItem = coffeeLibrary[currentIndex];
      if (currentItem?.is_split) {
        upperRef.current?.focus();
      } else {
        answerRef.current?.focus();
      }
    }
  }, [currentIndex, loading, coffeeLibrary]);

  const [isComplete, setIsComplete] = useState(false);

  const item = coffeeLibrary[currentIndex];

  // 2. Helper: Move to Next
  const handleNext = () => {
    answerRef.current?.clear();
    upperRef.current?.clear();
    lowerRef.current?.clear();
    setFeedback({message: "", type: "neutral"});
    if (currentIndex < coffeeLibrary.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      if (currentLevel >= maxLevel) {
        sessionStorage.setItem('coffeeTestLevel', '-1');
      }
    }
  };

  // 3. Verification Logic with "Fuzzy" Matching
  const onSubmit = () => {
    if (isProcessing || !item) return;
    setIsProcessing(true);

    // Helper to clean both input and correct answer (uppercase, no spaces)
    const normalize = (str: string | null | undefined) => {
      if (!str) return '';
      return str.toUpperCase().trim().replace(/\s+/g, '');
    };

    // For split items, validate upper and lower separately
    if (item.is_split) {
      const upperVal = upperRef.current?.getValue() || '';
      const lowerVal = lowerRef.current?.getValue() || '';
      if (!upperVal.trim() || !lowerVal.trim()) {
        setFeedback({message: " Please type both answers.", type: 'neutral'});
        setIsProcessing(false);
        if (!upperVal.trim()) {
          upperRef.current?.focus();
        } else {
          lowerRef.current?.focus();
        }
        return;
      }

      const upperInput = normalize(upperVal);
      const lowerInput = normalize(lowerVal);
      const targetUpper = normalize(item.upper_code);
      const targetLower = normalize(item.lower_code);

      if (upperInput === targetUpper && lowerInput === targetLower) {
        setFeedback({message: `✅ Correct!`, type: 'success'});
        setTimeout(handleNext, 1200);
      } else {
        setFeedback({message: `❌ Incorrect. The answer is "${item.upper_code}/${item.lower_code}".`, type: 'error'});
        upperRef.current?.focus();
      }
    } else {
      const answerVal = answerRef.current?.getValue() || '';
      if (!answerVal.trim()) {
        setFeedback({message: " Please type your answer first.", type: 'neutral'});
        setIsProcessing(false);
        answerRef.current?.focus();
        return;
      }

      const cleanInput = normalize(answerVal);
      const target = normalize(item.code);
      if (cleanInput === target || cleanInput.includes(target)) {
        setFeedback({message: "✅ Correct!", type: 'success'});
        setTimeout(handleNext, 1200);
      } else {
        setFeedback({message: `❌ Incorrect. The answer is "${item.code}".`, type: 'error'});
        answerRef.current?.focus();
      }
    }

    setIsProcessing(false);
  };

  if (showResumePrompt) return (
    <ModuleWrapper title={MODULE_TITLE} icon={MODULE_ICON}>
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
        <div className="inline-block p-4 bg-blue-50 rounded-2xl mb-4">
          <span className="text-4xl">📋</span>
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-2">Welcome Back!</h1>
        <p className="text-slate-500 mb-6">You were on Level {savedLevel} last time.</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setShowResumePrompt(false);
              loadCodes(savedLevel);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer"
          >
            Resume Level {savedLevel}
          </button>
          <button
            onClick={() => {
              setShowResumePrompt(false);
              sessionStorage.setItem('coffeeTestLevel', '1');
              loadCodes(1);
            }}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 p-4 rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
          >
            Start from Level 1
          </button>
        </div>
      </div>
    </ModuleWrapper>
  );

  if (isComplete) return (
    <ModuleWrapper title={MODULE_TITLE} icon={MODULE_ICON}>
      {currentLevel >= maxLevel && <Confetti />}
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
        <div className="inline-block p-4 bg-green-50 rounded-2xl mb-4">
          <span className="text-5xl">{currentLevel >= maxLevel ? '🏆' : '🎉'}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          {currentLevel >= maxLevel ? "All Levels Complete!" : "Level Complete!"}
        </h1>
        <p className="text-slate-500 mb-2">
          {currentLevel >= maxLevel
            ? <>You&apos;ve mastered all<br />☕ Coffee Code training.</>
            : `You nailed all level ${currentLevel} questions.`}
        </p>
        <p className="text-slate-400 text-sm mb-4">
          {currentLevel >= maxLevel ? "" : "Excellent focus. Keep it up!"}
        </p>
        <div className="flex flex-col gap-3">
          {currentLevel < maxLevel ? (
            <button
              onClick={() => {
                setIsComplete(false);
                setCurrentIndex(0);
                answerRef.current?.clear();
                upperRef.current?.clear();
                lowerRef.current?.clear();
                setFeedback({message: "", type: "neutral"});
                loadCodes(currentLevel + 1);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer"
            >
              Next Level →
            </button>
          ) : (
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer"
            >
              Back to Modules
            </button>
          )}
          <button
            onClick={() => {
              setIsComplete(false);
              setCurrentIndex(0);
              answerRef.current?.clear();
              upperRef.current?.clear();
              lowerRef.current?.clear();
              setFeedback({message: "", type: "neutral"});
              loadCodes(currentLevel);
            }}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 p-4 rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    </ModuleWrapper>
  );

  return (
    <ModuleWrapper title={MODULE_TITLE} icon={MODULE_ICON}>
      {(!loading && (!item || coffeeLibrary.length === 0)) ? (
        <div className="bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-slate-500 mb-6">No quiz found.</p>
          <button onClick={() => router.push('/')} className="text-blue-600 font-bold underline">Go Back</button>
        </div>
      ): (
        <>
          {/* Level & Progress */}
          <div className="w-full max-w-sm flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-green-600 bg-green-100 px-3 py-1 rounded-full uppercase tracking-tighter">
              Level {loading? "-" : currentLevel} / {loading? "-" : maxLevel}
            </span>
            <span className="text-slate-400 font-mono text-sm">{loading? "-" : currentIndex + 1}/{loading? "-" : coffeeLibrary.length}</span>
          </div>

          {/* Task Card */}
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Memorization Test</p>
            <h1 className="text-2xl font-black text-slate-900">
              {loading ? <div className="w-40 h-8 bg-slate-200 rounded-lg animate-pulse mx-auto"></div> : item.name}
            </h1>
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="w-full max-w-sm flex flex-col gap-3">
            {item?.is_split ? (
              <div className="flex flex-col items-center gap-0">
                <QuizAnswerInput
                  ref={upperRef}
                  placeholder="Type the upper code here"
                  disabled={feedback.type === 'success'}
                  rounded="top"
                  specialChars={SPECIAL_CHARS}
                />
                <div className="w-full h-[2px] bg-slate-900"></div>
                <QuizAnswerInput
                  ref={lowerRef}
                  placeholder="Type the lower code here"
                  disabled={feedback.type === 'success'}
                  rounded="bottom"
                  specialChars={SPECIAL_CHARS}
                />
              </div>
            ) : (
              <QuizAnswerInput
                ref={answerRef}
                placeholder="Type the code here"
                disabled={feedback.type === 'success'}
                rounded="full"
                specialChars={SPECIAL_CHARS}
              />
            )}

            {/* Feedback Message */}
            <div className={`min-h-[20px] font-bold text-center text-sm ${feedback.type === 'success' ? 'text-green-500' : 'text-orange-500'}`}>
              {feedback.message}
            </div>

            {/* Footer Buttons */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-auto pb-8">
                <button 
                    type="button"
                    onClick={() => { answerRef.current?.clear(); upperRef.current?.clear(); lowerRef.current?.clear(); }}
                    disabled={loading || isProcessing}
                    className="p-3 bg-white text-slate-400 rounded-2xl font-bold border-2 border-slate-100 active:scale-95 transition-all cursor-pointer"
                >
                    Clear
                </button>
                <button 
                    type="submit"
                    disabled={loading || isProcessing || feedback.type === 'success'}
                    className={`${
                    feedback.type === 'success' ? 'bg-green-500' : 
                    isProcessing ? 'bg-slate-300' : 'bg-blue-600'
                    } p-3 text-white rounded-2xl font-black shadow-xl shadow-blue-200 active:scale-95 transition-all cursor-pointer`}
                >
                    {feedback.type === 'success' ? "Checked!" : isProcessing ? "Verifying..." : "Submit"}
                </button>
            </div>

            {/* Admin section removed from flow - now floating */}
          </form>
       </>
      )}

      {/* Floating Admin Panel */}
      <AdminPanel>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              if (currentLevel > 1) {
                setCurrentIndex(0);
                answerRef.current?.clear(); upperRef.current?.clear(); lowerRef.current?.clear();
                setFeedback({message: "", type: "neutral"});
                loadCodes(currentLevel - 1);
              }
            }}
            disabled={currentLevel <= 1}
            className="p-3 bg-orange-100 text-orange-600 rounded-xl font-bold text-sm active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev Level
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentLevel < maxLevel) {
                setCurrentIndex(0);
                answerRef.current?.clear(); upperRef.current?.clear(); lowerRef.current?.clear();
                setFeedback({message: "", type: "neutral"});
                loadCodes(currentLevel + 1);
              }
            }}
            disabled={currentLevel >= maxLevel}
            className="p-3 bg-orange-100 text-orange-600 rounded-xl font-bold text-sm active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next Level →
          </button>
        </div>
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              placeholder="All"
              value={quizLimit}
              onChange={(e) => setQuizLimit(e.target.value)}
              className="w-16 p-2 text-sm text-center bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <span className="text-xs text-slate-400">quiz(zes) per level</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentIndex(0);
              answerRef.current?.clear(); upperRef.current?.clear(); lowerRef.current?.clear();
              setFeedback({message: "", type: "neutral"});
              loadCodes(currentLevel, quizLimit);
            }}
            className="px-3 py-2 bg-orange-100 text-orange-600 rounded-lg font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setQuizLimit('');
              setCurrentIndex(0);
              answerRef.current?.clear(); upperRef.current?.clear(); lowerRef.current?.clear();
              setFeedback({message: "", type: "neutral"});
              loadCodes(currentLevel, '');
            }}
            className="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            All
          </button>
        </div>
      </AdminPanel>
    </ModuleWrapper>
  );
}