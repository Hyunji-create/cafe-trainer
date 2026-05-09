'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form'; // Cleaner form handling
import { useRouter } from 'next/navigation';
import { useUser } from '../../lib/user-context';

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

type FormValues = {
  answer: string;
  upperAnswer: string;
  lowerAnswer: string;
};

export default function TypingCoffeeTrainer() {
  const router = useRouter();
  const { name: userName } = useUser();
  const { register, handleSubmit, reset, setFocus, setValue, getValues } = useForm<FormValues>();
  const [showSpecialChars, setShowSpecialChars] = useState<string | false>(false);
  const specialChars = ['Ⓢ', '/', '!', '¡', '↓', '↑'];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const upperInputRef = useRef<HTMLInputElement | null>(null);
  const lowerInputRef = useRef<HTMLInputElement | null>(null);
  const cursorPosRef = useRef<number>(0);
  const upperCursorRef = useRef<number>(0);
  const lowerCursorRef = useRef<number>(0);

  const { ref: formRef, ...registerRest } = register('answer');
  const { ref: upperFormRef, ...upperRegisterRest } = register('upperAnswer');
  const { ref: lowerFormRef, ...lowerRegisterRest } = register('lowerAnswer');
  
  // State Management
  const [coffeeLibrary, setCoffeeLibrary] = useState<CoffeeCodeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
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
      }
    } catch (err) {
      console.error("Connection Error:", err);
      setFeedback({message: "Failed to connect to the server.", type: 'error'});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes(1); // eslint-disable-line
  }, []); // eslint-disable-line

  // Ensure focus remains in the input field when the index changes
  useEffect(() => {
    if (!loading && coffeeLibrary.length > 0) {
      const currentItem = coffeeLibrary[currentIndex];
      setFocus(currentItem?.is_split ? 'upperAnswer' : 'answer');
    }
  }, [currentIndex, loading, coffeeLibrary, setFocus]);

  const [isComplete, setIsComplete] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const item = coffeeLibrary[currentIndex];

  // 2. Helper: Move to Next
  const handleNext = () => {
    reset(); // Clear the input field
    setFeedback({message: "", type: "neutral"});
    if (currentIndex < coffeeLibrary.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  // 3. Verification Logic with "Fuzzy" Matching
  const onSubmit = async (values: FormValues) => {
    if (isProcessing || !item) return;
    setIsProcessing(true);

    // Helper to clean both input and correct answer (uppercase, no spaces)
    const normalize = (str: string | null | undefined) => {
      if (!str) return '';
      return str.toUpperCase().trim().replace(/\s+/g, '');
    };

    // For split items, validate upper and lower separately
    if (item.is_split) {
      if (!values.upperAnswer?.trim() || !values.lowerAnswer?.trim()) {
        setFeedback({message: " Please type both answers.", type: 'neutral'});
        setIsProcessing(false);
        if (!values.upperAnswer?.trim()) {
          setFocus('upperAnswer');
        } else {
          setFocus('lowerAnswer');
        }
        return;
      }
    } else {
      const userInput = values.answer;
      if (!userInput?.trim()) {
        setFeedback({message: " Please type your answer first.", type: 'neutral'});
        setIsProcessing(false);
        setFocus('answer');
        return;
      }
    }

    const cleanInput = normalize(values.answer);

    try {
      if (item.is_split) {
        // Check upper and lower code separately
        const upperInput = normalize(values.upperAnswer);
        const lowerInput = normalize(values.lowerAnswer);
        const targetUpper = normalize(item.upper_code);
        const targetLower = normalize(item.lower_code);

        if (upperInput === targetUpper && lowerInput === targetLower) {
          setFeedback({message: `✅ Correct!`, type: 'success'});
          setTimeout(handleNext, 1200);
        } else {
          setFeedback({message: `❌ Incorrect. The targets code was "${item.upper_code}/${item.lower_code}".`, type: 'error'});
          setFocus('upperAnswer');
        }
      } else {
        // Standard single code check
        const target = normalize(item.code);
        console.log(cleanInput, target);
        if (cleanInput === target || cleanInput.includes(target)) {
          setFeedback({message: "✅ Correct!", type: 'success'});
          setTimeout(handleNext, 1200);
        } else {
          setFeedback({message: `❌ Incorrect. The target code was "${item.code}".`, type: 'error'});
          setFocus('answer');
        }
      }
    } catch (err) {
      setFeedback({message: "⚠️ Error verifying answer. Please try again.", type: 'error'});
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isComplete) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="inline-block p-4 bg-green-50 rounded-2xl mb-4">
          <span className="text-5xl">🎉</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Level Complete!</h1>
        <p className="text-slate-500 mb-2">You nailed all level {currentLevel} questions.</p>
        <p className="text-slate-400 text-sm mb-8">Excellent focus. Keep it up!</p>
        <div className="flex flex-col gap-3">
          {currentLevel < maxLevel ? (
            <button
              onClick={() => {
                setIsComplete(false);
                setCurrentIndex(0);
                reset();
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
              reset();
              setFeedback({message: "", type: "neutral"});
              loadCodes(currentLevel);
            }}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 p-4 rounded-xl font-bold transition-all active:scale-95 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-6 py-14 font-sans">
      {/* Top Header */}
      <header className="w-full flex justify-center items-center fixed top-0 left-0 right-0 bg-slate-50 py-2 z-10">
        <div className="w-full flex items-center px-2 relative">
          <button onClick={() => router.push('/')} className="text-slate-400 text-2xl font-bold p-2 active:scale-95 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-tighter">
              Coffee Code
            </span>
          </div>
        </div>
      </header>

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
          <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm flex flex-col gap-3">
            {item?.is_split ? (
              <>
                <div className="flex flex-col items-center gap-0">
                  <div className="relative w-full">
                    <input
                      {...upperRegisterRest}
                      ref={(e) => {
                        upperFormRef(e);
                        upperInputRef.current = e;
                      }}
                      type="text"
                      placeholder="Type the code here"
                      className="w-full p-4 pl-14 text-xl font-black text-center text-slate-950 uppercase bg-white rounded-t-2xl shadow-sm border-4 border-white focus:border-blue-300 focus:ring-0 focus:outline-none placeholder:text-slate-200 transition-all"
                      disabled={feedback.type === 'success'}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      onSelect={(e) => { upperCursorRef.current = (e.target as HTMLInputElement).selectionStart || 0; }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowSpecialChars(showSpecialChars === 'upper' ? false : 'upper')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 hover:bg-blue-100 rounded-lg flex items-center justify-center text-sm text-slate-500 active:scale-95 transition-all cursor-pointer"
                      title="Special characters"
                    >
                      #
                    </button>
                    {showSpecialChars === 'upper' && (
                      <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 flex gap-2 z-20">
                        {specialChars.map((char) => (
                          <button
                            key={char}
                            type="button"
                            onClick={() => {
                              const current = getValues('upperAnswer') || '';
                              const pos = upperCursorRef.current;
                              const newValue = current.slice(0, pos) + char + current.slice(pos);
                              setValue('upperAnswer', newValue);
                              setShowSpecialChars(false);
                              setTimeout(() => {
                                if (upperInputRef.current) {
                                  upperInputRef.current.focus();
                                  const newPos = pos + char.length;
                                  upperInputRef.current.setSelectionRange(newPos, newPos);
                                  upperCursorRef.current = newPos;
                                }
                              }, 0);
                            }}
                            className="w-10 h-10 bg-slate-50 hover:bg-blue-100 rounded-xl flex items-center justify-center text-lg font-bold text-slate-700 active:scale-95 transition-all cursor-pointer"
                          >
                            {char}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-full h-[2px] bg-slate-900"></div>
                  <div className="relative w-full">
                    <input
                      {...lowerRegisterRest}
                      ref={(e) => {
                        lowerFormRef(e);
                        lowerInputRef.current = e;
                      }}
                      type="text"
                      placeholder="Type the code here"
                      className="w-full p-4 pl-14 text-xl font-black text-center text-slate-950 uppercase bg-white rounded-b-2xl shadow-lg shadow-slate-200 border-4 border-white focus:border-blue-300 focus:ring-0 focus:outline-none placeholder:text-slate-200 transition-all"
                      disabled={feedback.type === 'success'}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      onSelect={(e) => { lowerCursorRef.current = (e.target as HTMLInputElement).selectionStart || 0; }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowSpecialChars(showSpecialChars === 'lower' ? false : 'lower')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 hover:bg-blue-100 rounded-lg flex items-center justify-center text-sm text-slate-500 active:scale-95 transition-all cursor-pointer"
                      title="Special characters"
                    >
                      #
                    </button>
                    {showSpecialChars === 'lower' && (
                      <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 flex gap-2 z-20">
                        {specialChars.map((char) => (
                          <button
                            key={char}
                            type="button"
                            onClick={() => {
                              const current = getValues('lowerAnswer') || '';
                              const pos = lowerCursorRef.current;
                              const newValue = current.slice(0, pos) + char + current.slice(pos);
                              setValue('lowerAnswer', newValue);
                              setShowSpecialChars(false);
                              setTimeout(() => {
                                if (lowerInputRef.current) {
                                  lowerInputRef.current.focus();
                                  const newPos = pos + char.length;
                                  lowerInputRef.current.setSelectionRange(newPos, newPos);
                                  lowerCursorRef.current = newPos;
                                }
                              }, 0);
                            }}
                            className="w-10 h-10 bg-slate-50 hover:bg-blue-100 rounded-xl flex items-center justify-center text-lg font-bold text-slate-700 active:scale-95 transition-all cursor-pointer"
                          >
                            {char}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="relative w-full">
                <input
                  {...registerRest}
                  ref={(e) => {
                    formRef(e);
                    inputRef.current = e;
                  }}
                  type="text"
                  placeholder="Type the code here"
                  className="w-full p-4 pl-11 text-xl font-black text-center text-slate-950 uppercase bg-white rounded-2xl shadow-lg shadow-slate-200 border-4 border-white focus:border-blue-300 focus:ring-0 focus:outline-none placeholder:text-slate-200 transition-all"
                  disabled={feedback.type === 'success'}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  onSelect={(e) => {
                    cursorPosRef.current = (e.target as HTMLInputElement).selectionStart || 0;
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowSpecialChars(showSpecialChars === 'answer' ? false : 'answer')
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 hover:bg-blue-100 rounded-lg flex items-center justify-center text-sm text-slate-500 active:scale-95 transition-all cursor-pointer"
                  title="Special characters"
                >
                  #
                </button>
                {showSpecialChars === 'answer' && (
                  <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 flex gap-2 z-20">
                    {specialChars.map((char) => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => {
                          const current = getValues('answer') || '';
                          const pos = cursorPosRef.current;
                          const newValue = current.slice(0, pos) + char + current.slice(pos);
                          setValue('answer', newValue);
                          setShowSpecialChars(false);
                          setTimeout(() => {
                            if (inputRef.current) {
                              inputRef.current.focus();
                              const newPos = pos + char.length;
                              inputRef.current.setSelectionRange(newPos, newPos);
                              cursorPosRef.current = newPos;
                            }
                          }, 0);
                        }}
                        className="w-10 h-10 bg-slate-50 hover:bg-blue-100 rounded-xl flex items-center justify-center text-lg font-bold text-slate-700 active:scale-95 transition-all cursor-pointer"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feedback Message */}
            <div className={`min-h-[20px] font-bold text-center text-sm ${feedback.type === 'success' ? 'text-green-500' : 'text-orange-500'}`}>
              {feedback.message}
            </div>

            {/* Footer Buttons */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-auto pb-8">
                <button 
                    type="button" // Important: Stop form submission
                    onClick={() => reset()}
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

      {/* Floating Admin Button & Panel */}
      {userName.toLowerCase() === 'admin' && (
        <>
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="fixed bottom-4 right-4 w-12 h-12 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer z-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          {showAdminPanel && (
            <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-30 bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Admin Only</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (currentLevel > 1) {
                      setCurrentIndex(0);
                      reset();
                      setFeedback({message: "", type: "neutral"});
                      loadCodes(currentLevel - 1);
                    }
                  }}
                  disabled={currentLevel <= 1}
                  className="p-3 bg-orange-100 text-orange-600 rounded-2xl font-bold text-sm active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev Level
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (currentLevel < maxLevel) {
                      setCurrentIndex(0);
                      reset();
                      setFeedback({message: "", type: "neutral"});
                      loadCodes(currentLevel + 1);
                    }
                  }}
                  disabled={currentLevel >= maxLevel}
                  className="p-3 bg-orange-100 text-orange-600 rounded-2xl font-bold text-sm active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next Level →
                </button>
              </div>
              <div className="flex items-center justify-between w-full gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="All"
                  value={quizLimit}
                  onChange={(e) => setQuizLimit(e.target.value)}
                  className="w-16 p-2 text-sm text-center bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <span className="text-xs text-slate-400">quiz(zes) per level</span>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex(0);
                    reset();
                    setFeedback({message: "", type: "neutral"});
                    loadCodes(currentLevel, quizLimit);
                  }}
                  className="px-3 py-2 bg-orange-100 text-orange-600 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuizLimit('');
                    setCurrentIndex(0);
                    reset();
                    setFeedback({message: "", type: "neutral"});
                    loadCodes(currentLevel, '');
                  }}
                  className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  All
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}