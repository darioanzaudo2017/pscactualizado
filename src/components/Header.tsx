import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-8 py-4 w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md bg-opacity-80">
      <div className="flex flex-col">
        <h1 className="text-blue-900 dark:text-blue-200 font-extrabold tracking-tight font-headline text-lg">
          Secretaría de Políticas Sociales, Inclusión y Convivencia
        </h1>
        <p className="text-xs text-slate-500 font-medium">Gestión de Personas en Situación de Calle</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button className="p-2 text-slate-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors active:scale-95 duration-150">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-white"></span>
        </div>
        <button className="flex items-center gap-2 p-1 pr-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors active:scale-95 duration-150">
          <span className="material-symbols-outlined text-3xl">account_circle</span>
          <span className="font-semibold text-blue-900 dark:text-blue-300">
            {profile?.nombre || 'Admin'}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
