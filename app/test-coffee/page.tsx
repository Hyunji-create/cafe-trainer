// build trigger

'use client';

import { useState, useEffect, useRef } from 'react';
import CanvasDraw from 'react-canvas-draw';
import Tesseract from 'tesseract.js';
import { useRouter } from 'next/navigation'; // Using the proper Next.js router
import { supabase } from '../../lib/supabase';

export default function SmartCoffeeTrainer() {
  const router = useRouter();
  
  // State Management
  const [coffeeLibrary, setCoffeeLibrary] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState("");
  
  const canvasRef = useRef<any>(null);

  // 1. Fetch Data from Supabase
  useEffect(() => {
    async function loadCodes() {
      try {
        const { data, error } = await supabase
          .from('coffee_codes')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;
        if (data) setCoffeeLibrary(data);
      } catch (err) {
        console.error("Supabase Error:", err);
        setFeedback("Failed to load coffee codes.");
      } finally {
        setLoading(false);
      }
    }
    loadCodes();
  }, []);

  const item = coffeeLibrary[currentIndex];

  // 2. Helper: Clear Canvas
  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    setFeedback("");
  };

  // 3. Helper: Move to Next
  const handleNext = () => {
    if (currentIndex < coffeeLibrary.length - 1) {
      setCurrentIndex(prev => prev + 1);
      handleClear();
    } else {
      alert("Training Module Complete! Great work.");
      router.push('/');
    }
  };

  // 4. AI Verification Logic
  const verifyDrawing = async () => {
    if (!canvasRef.current || !item) return;

    setIsProcessing(true);
    setFeedback("AI is reading your drawing...");

    try {
      // Get the actual drawing canvas
      const canvasElement = canvasRef.current.canvasContainer.children[1] as HTMLCanvasElement;
      const drawingDataUrl = canvasElement.toDataURL("image/png");

      const { data: { text } } = await Tesseract.recognize(drawingDataUrl, 'eng');
      
      const recognizedText = text.toUpperCase().trim().replace(/\s/g, '');
      
      if (item.is_split) {
        const hasUpper = recognizedText.includes(item.upper_code.toUpperCase());
        const hasLower = recognizedText.includes(item.lower_code.toUpperCase());

        if (hasUpper && hasLower) {
          setFeedback("✅ Perfect split! Moving to next...");
          setTimeout(handleNext, 1500);
        } else {
          setFeedback(`❌ Incorrect. Need "${item.upper_code}" & "${item.lower_code}".`);
        }
      } else {
        const target = item.code.toUpperCase();
        if (recognizedText.includes(target)) {
          setFeedback("✅ Correct! Moving to next...");
          setTimeout(handleNext, 1500);
        } else {
          setFeedback(`❌ Try again. AI saw: "${recognizedText}"`);
        }
      }
    } catch (err) {
      setFeedback("⚠️ AI Error. Please try again.");
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

  if (!item) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-slate-500 mb-4">No codes found in your database.</p>
      <button onClick={() => router.push('/')} className="text-blue-600 font-bold underline">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 font-sans">
      {/* Top Header */}
      <header className="w-full max-w-sm flex justify-between items-center mb-6">
        <button onClick={() => router.push('/')} className="text-slate-400 text-2xl font-bold">✕</button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-tighter">
            Zone: {item.zone || 'TOP'}
          </span>
        </div>
        <span className="text-slate-400 font-mono text-sm">{currentIndex + 1}/{coffeeLibrary.length}</span>
      </header>

      {/* Task Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Practice Drawing</p>
        <h1 className="text-3xl font-black text-slate-900 mb-4">{item.name}</h1>
        
        <div className="flex gap-3">
          {item.is_split ? (
            <>
              <div className="flex-1 bg-blue-50 p-3 rounded-2xl border border-blue-100">
                <p className="text-[8px] font-bold text-blue-400 uppercase">Milk (Upper)</p>
                <p className="text-2xl font-black text-blue-700">{item.upper_code}</p>
              </div>
              <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Base (Lower)</p>
                <p className="text-2xl font-black text-slate-800">{item.lower_code}</p>
              </div>
            </>
          ) : (
            <div className="w-full bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-[8px] font-bold text-blue-400 uppercase">Target Code</p>
              <p className="text-3xl font-black text-blue-700">{item.code}</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawing Pad */}
      <div className="relative bg-white rounded-[45px] shadow-2xl shadow-slate-200 border-[12px] border-white overflow-hidden touch-none">
        {item.is_split && (
          <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-blue-100 pointer-events-none z-10 flex justify-center">
            <span className="bg-white px-4 py-1 -mt-3 rounded-full text-[8px] font-black text-blue-300 border border-blue-50 uppercase tracking-widest">
              Milk / Base Split
            </span>
          </div>
        )}
        
        <CanvasDraw
          ref={canvasRef}
          brushColor="#1e293b"
          brushRadius={5}
          canvasWidth={320}
          canvasHeight={320}
          lazyRadius={0}
          backgroundColor="transparent"
        />
      </div>

      {/* Feedback Message */}
      <div className={`mt-6 min-h-[24px] font-bold text-center px-4 ${feedback.includes('✅') ? 'text-green-500' : 'text-orange-500'}`}>
        {feedback}
      </div>

      {/* Footer Buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-auto pb-8">
        <button 
          onClick={handleClear}
          disabled={isProcessing}
          className="p-5 bg-white text-slate-400 rounded-3xl font-bold border-2 border-slate-100 active:scale-95 transition-all"
        >
          Clear
        </button>
        <button 
          onClick={verifyDrawing}
          disabled={isProcessing}
          className={`${
            isProcessing ? 'bg-slate-300' : 'bg-blue-600'
          } p-5 text-white rounded-3xl font-black shadow-xl shadow-blue-200 active:scale-95 transition-all`}
        >
          {isProcessing ? "Reading..." : "Check Mark"}
        </button>
      </div>
    </div>
  );
}