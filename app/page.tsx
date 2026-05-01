'use client';
import { useState } from 'react';

export default function CafeTrainer() {
  const [name, setName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const courses = [
    { id: 1, title: "Coffee Code + Test", icon: "☕" },
    { id: 2, title: "English Name Spelling", icon: "✍️" },
    { id: 3, title: "Batch Brew Explanation", icon: "⚗️" },
    { id: 4, title: "Unusual Orders & Response", icon: "🗣️" },
    { id: 5, title: "Quiet Time Tasks", icon: "🧹" },
    { id: 6, title: "General Final Test", icon: "🎓" }
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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

      {/* Course List */}
      <main className="p-6">
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">Select a Module</h3>
        <div className="grid gap-4">
          {courses.map((course) => (
            <button 
              key={course.id}
              onClick={() => setSelectedCourse(course.title)}
              className="group flex items-center w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-500 hover:shadow-md transition-all active:scale-98"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors mr-4 text-2xl">
                {course.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs text-blue-600 font-bold">Module 0{course.id}</p>
                <h4 className="text-slate-800 font-bold">{course.title}</h4>
              </div>
              <div className="text-slate-300 group-hover:text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
