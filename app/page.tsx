'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../lib/user-context';

export default function CafeTrainer() {
  const router = useRouter();
  const { name, isLoggedIn, sessionChecked, login, logout } = useUser();
  const [inputName, setInputName] = useState('');

  const courses = [
    { id: 1, title: "Coffee Code + Test", icon: "☕", path: "/coffee-test" },
    { id: 2, title: "English Name Spelling", icon: "✍️", path: "#" },
    { id: 3, title: "Batch Brew Explanation", icon: "⚗️", path: "#" },
    { id: 4, title: "Unusual Orders & Response", icon: "🗣️", path: "#" },
    { id: 5, title: "Quiet Time Tasks", icon: "🧹", path: "#" },
    { id: 6, title: "General Final Test", icon: "🎓", path: "#" }
  ];

  // Wait for session check before rendering
  if (!sessionChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Screen 1: Login
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-50 rounded-2xl mb-4">
              <span className="text-4xl">☕</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Cafe Trainer</h1>
            <p className="text-slate-500 mt-2">Enter your name to begin training</p>
          </div>
          
          <input 
            type="text" 
            placeholder="Your Full Name"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            onChange={(e) => setInputName(e.target.value)}
            onInput={(e) => setInputName((e.target as HTMLInputElement).value)}
            value={inputName}
          />
          
          <button 
            onClick={() => inputName.trim().length > 2 && login(inputName)}
            disabled={inputName.trim().length <= 2}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95 cursor-pointer"
          >
            Start Training
          </button>
        </div>
      </div>
    );
  }

  // Screen 2: Course Selection
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white p-6 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Staff Member</p>
            <h2 className="text-2xl font-black text-slate-900">{name}</h2>
          </div>
          <button 
            onClick={() => logout()}
            className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold cursor-pointer"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <main className="p-6">
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">Select a Module</h3>
        <div className="grid gap-4">
          {courses.map((course) => (
  <button 
    key={course.id}
    onClick={() => {
      if (course.id === 1) {
        router.push('/coffee-test');
      } else {
        alert("Coming soon!");
      }
    }}
    className="w-full bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-all mb-3 sm:mb-4 cursor-pointer"
  >
    <div className="flex items-center gap-4 text-left">
      <div className="w-12 h-12 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl">
        {course.icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900">{course.title}</h3>
        <p className="text-[10px] text-slate-400">TAP TO START</p>
      </div>
    </div>
  </button>
))}
        </div>
      </main>
    </div>
  );
}
