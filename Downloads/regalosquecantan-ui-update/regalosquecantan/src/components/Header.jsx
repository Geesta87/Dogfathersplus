import React, { useContext } from 'react';
import { AppContext } from '../App';

export default function Header({ variant = 'default' }) {
  const { navigateTo, clearSession } = useContext(AppContext);

  const handleLogoClick = () => {
    clearSession(); // Reset everything and go to landing
  };

  if (variant === 'landing') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-4">
        <button 
          onClick={handleLogoClick}
          className="flex items-center gap-3 group cursor-pointer hover:opacity-90 transition-opacity"
        >
          <img 
            src="/images/logo-small.png" 
            alt="RegalosQueCantan" 
            className="h-14 w-14 md:h-16 md:w-16 object-contain drop-shadow-lg"
          />
          <h2 className="brand-font text-white text-xl md:text-2xl font-bold tracking-tight drop-shadow-lg">
            RegalosQueCantan
          </h2>
        </button>
        <div className="flex items-center">
          <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-white hover:text-forest transition-all">
            Ingresar
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#e4e3dc]/50 dark:border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        <button 
          onClick={handleLogoClick}
          className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity"
        >
          <img 
            src="/images/logo-small.png" 
            alt="RegalosQueCantan" 
            className="h-10 w-10 md:h-12 md:w-12 object-contain"
          />
          <span className="text-lg md:text-xl font-bold tracking-tight text-[#171612] dark:text-white">
            RegalosQueCantan
          </span>
        </button>
        <div className="hidden md:flex items-center gap-10">
          <a className="text-sm font-medium text-[#857d66] dark:text-gray-400 hover:text-primary transition-colors" href="#">Proceso</a>
          <a className="text-sm font-medium text-[#857d66] dark:text-gray-400 hover:text-primary transition-colors" href="#">Precios</a>
          <a className="text-sm font-medium text-[#857d66] dark:text-gray-400 hover:text-primary transition-colors" href="#">Ayuda</a>
        </div>
      </div>
    </header>
  );
}
