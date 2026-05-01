'use client';
import { useState } from 'react';
import Link from 'next/link'; // Added this import

export default function CafeTrainer() {
  const [name, setName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const courses = [
    { id: 1, title: "Coffee Code + Test", icon: "☕", path: "/coffee-test" },
    { id: 2, title: "English Name Spelling", icon: "✍️", path: "#" },
    { id: 3, title: "Batch Brew Explanation", icon: "⚗️", path: "#" },
    { id: 4, title: "Unusual Orders & Response", icon: "🗣️", path: "#" },
    { id: 5, title: "Quiet Time Tasks", icon: "🧹", path: "#" },
    { id: 6, title: "General Final Test", icon: "🎓", path: "#" }
  ];

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
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
          
          <button 
            onClick={() => name.length > 2 && setIsLoggedIn(true)}
            disabled={name.length <= 2}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95"
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
      <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Staff Member</p>
            <h2 className="text-2xl font-black text-slate-900">{name}</h2>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold"
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
      console.log("Button clicked for ID:", course.id); // Check if this shows in console
      if (course.id === 1) {
        window.location.assign('/coffee-test'); // Forces a fresh page load
      } else {
        alert("Coming soon!");
      }
    }}
    className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-all mb-4"
  >
    <div className="flex items-center gap-4 text-left">
      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">
        {course.icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900">{course.title}</h3>
        <p className="text-[10px] text-slate-400">TAP TO START</p>
      </div>
    </div>
    <div className="text-slate-300 font-bold pr-2">NEXT</div>
  </button>
))}
        </div>
      </main>
    </div>
  );
}