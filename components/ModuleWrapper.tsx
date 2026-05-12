'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type ModuleWrapperProps = {
  title: string;
  icon?: string;
  children: ReactNode;
};

export default function ModuleWrapper({ title, icon, children }: ModuleWrapperProps) {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-6 pt-14 font-sans">
      <header className="w-full flex justify-center items-center fixed top-0 left-0 right-0 bg-slate-50 py-2 z-10">
        <div className="w-full flex items-center px-2 relative">
          <button onClick={() => router.push('/')} className="text-slate-400 text-2xl font-bold p-2 active:scale-95 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
            {icon && <span className="text-lg">{icon}</span>}
            <span className="text-sm font-bold text-slate-800">{title}</span>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
