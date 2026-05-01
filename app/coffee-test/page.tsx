'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form'; // Cleaner form handling
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

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
};

export default function TypingCoffeeTrainer() {
  const router = useRouter();
  const { register, handleSubmit, reset, setFocus } = useForm<FormValues>();
  
  // State Management
  const [coffeeLibrary, setCoffeeLibrary] = useState<CoffeeCodeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{message: string; type: 'success' | 'error' | 'neutral'}>({message: "", type: "neutral"});
  
  // 1. Fetch Data from Supabase
  useEffect(() => {
    async function loadCodes() {
      console.log("Fetching coffee_codes...");
      try {
        const { data, error } = await supabase
          .from('coffee_codes')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          console.error("Supabase Error:", error);
          setFeedback({message: `Failed to load codes: ${error.message}`, type: 'error'});
        } else if (data) {
          setCoffeeLibrary(data as CoffeeCodeItem[]);
        }
      } catch (err) {
        console.error("Connection Error:", err);
        setFeedback({message: "Failed to connect to the database.", type: 'error'});
      } finally {
        setLoading(false);
      }
    }
    loadCodes();
  }, []);

  // Ensure focus remains in the input field when the index changes
  useEffect(() => {
    if (!loading && coffeeLibrary.length > 0) {
      setFocus('answer');
    }
  }, [currentIndex, loading, coffeeLibrary, setFocus]);

  const item = coffeeLibrary[currentIndex];

  // 2. Helper: Move to Next
  const handleNext = () => {
    reset(); // Clear the input field
    setFeedback({message: "", type: "neutral"});
    if (currentIndex < coffeeLibrary.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      alert("Training Module Complete! Excellent focus.");
      router.push('/');
    }
  };

  // 3. Verification Logic with "Fuzzy" Matching
  const onSubmit = async (values: FormValues) => {
    if (isProcessing || !item) return;
    setIsProcessing(true);

    const userInput = values.answer;
    
    // Safety check if user clicks submit with no text
    if (!userInput.trim()) {
      setFeedback({message: " Please type your answer first.", type: 'neutral'});
      setIsProcessing(false);
      setFocus('answer');
      return;
    }

    // Helper to clean both input and correct answer (uppercase, no spaces)
    const normalize = (str: string | null) => {
      if (!str) return '';
      return str.toUpperCase().trim().replace(/\s+/g, '');
    };

    const cleanInput = normalize(userInput);

    try {
      if (item.is_split) {
        // Look for BOTH upper and lower codes in the input string
        const targetUpper = normalize(item.upper_code);
        const targetLower = normalize(item.lower_code);
        const hasUpper = cleanInput.includes(targetUpper);
        const hasLower = cleanInput.includes(targetLower);

        if (hasUpper && hasLower) {
          setFeedback({message: `✅ Correct split! "${userInput}" accepted.`, type: 'success'});
          setTimeout(handleNext, 1200);
        } else {
          setFeedback({message: `❌ Incorrect. The targets were "${item.upper_code}" & "${item.lower_code}".`, type: 'error'});
          setFocus('answer');
        }
      } else {
        // Standard single code check
        const target = normalize(item.code);
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

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!item || coffeeLibrary.length === 0) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-slate-500 mb-6">No codes found. Verify your 'coffee_codes' table has data and is in the 'public' schema.</p>
      <button onClick={() => router.push('/')} className="text-blue-600 font-bold underline">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 font-sans">
      {/* Top Header */}
      <header className="w-full max-w-sm flex justify-between items-center mb-6">
        <button onClick={() => router.push('/')} className="text-slate-400 text-2xl font-bold p-2 active:scale-95">✕</button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-tighter">
            Zone: {item.zone || 'MAIN'}
          </span>
        </div>
        <span className="text-slate-400 font-mono text-sm">{currentIndex + 1}/{coffeeLibrary.length}</span>
      </header>

      {/* Task Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Memorization Test</p>
        <h1 className="text-3xl font-black text-slate-900 mb-6">{item.name}</h1>
        
        <div className="w-full h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <p className="text-slate-500 text-sm font-medium">Type the code(s) below</p>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm flex flex-col gap-4">
        {item.is_split ? (
          <div className="p-4 bg-white rounded-2xl border border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Provide both</p>
            <p className="text-lg font-black text-slate-800">Milk (Upper) + Base (Lower)</p>
          </div>
        ) : null}

        <input
          {...register('answer')}
          type="text"
          placeholder={item.is_split ? "Example: m,b" : "Example: l"}
          className="w-full p-6 text-2xl font-black text-center text-slate-950 uppercase bg-white rounded-3xl shadow-lg shadow-slate-200 border-4 border-white focus:border-blue-300 focus:ring-0 placeholder:text-slate-200 transition-all"
          disabled={feedback.type === 'success'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
        />

        {/* Feedback Message */}
        <div className={`mt-2 min-h-[24px] font-bold text-center px-4 ${feedback.type === 'success' ? 'text-green-500' : 'text-orange-500'}`}>
          {feedback.message}
        </div>

        {/* Footer Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-auto pb-8">
            <button 
                type="button" // Important: Stop form submission
                onClick={() => reset()}
                disabled={isProcessing}
                className="p-5 bg-white text-slate-400 rounded-3xl font-bold border-2 border-slate-100 active:scale-95 transition-all"
            >
                Clear
            </button>
            <button 
                type="submit"
                disabled={isProcessing || feedback.type === 'success'}
                className={`${
                feedback.type === 'success' ? 'bg-green-500' : 
                isProcessing ? 'bg-slate-300' : 'bg-blue-600'
                } p-5 text-white rounded-3xl font-black shadow-xl shadow-blue-200 active:scale-95 transition-all`}
            >
                {feedback.type === 'success' ? "Checked!" : isProcessing ? "Verifying..." : "Check Answer"}
            </button>
        </div>
      </form>
    </div>
  );
}