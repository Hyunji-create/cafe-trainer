'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserContextType = {
  name: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  sessionChecked: boolean;
  login: (name: string) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Restore from sessionStorage on mount
  useEffect(() => {
    const savedName = sessionStorage.getItem('cafeTrainerName');
    if (savedName) {
      setName(savedName); // eslint-disable-line
      setIsLoggedIn(true);
    }
    setSessionChecked(true);
  }, []);

  const login = (userName: string) => {
    const trimmed = userName.trim();
    setName(trimmed);
    setIsLoggedIn(true);
    sessionStorage.setItem('cafeTrainerName', trimmed);
  };

  const logout = () => {
    setName('');
    setIsLoggedIn(false);
    sessionStorage.removeItem('cafeTrainerName');
  };

  const isAdmin = name.toLowerCase() === 'admin';

  return (
    <UserContext.Provider value={{ name, isLoggedIn, isAdmin, sessionChecked, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
