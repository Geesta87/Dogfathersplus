import React, { useContext, useState } from 'react';
import { AppContext } from '../App';

const occasions = [
  { id: 'cumpleanos', name: 'Cumpleaños', icon: 'cake' },
  { id: 'aniversario', name: 'Aniversario', icon: 'favorite' },
  { id: 'boda', name: 'Boda', icon: 'celebration' },
  { id: 'nacimiento', name: 'Nacimiento', icon: 'child_care' },
  { id: 'madre', name: 'Día de la Madre', icon: 'home' },
  { id: 'padre', name: 'Día del Padre', icon: 'potted_plant' },
  { id: 'amor', name: 'Amor / Pareja', icon: 'volunteer_activism' },
  { id: 'graduacion', name: 'Graduación', icon: 'school' },
  { id: 'amistad', name: 'Amistad', icon: 'diversity_3' },
  { id: 'agradecimiento', name: 'Agradecimiento', icon: 'redeem' },
  { id: 'quinceanera', name: 'Quinceañera', icon: 'auto_awesome' },
  { id: 'otro', name: 'Otra Ocasión', icon: 'more_horiz' }
];

export default function OccasionPage() {
  const { navigateTo, formData, setFormData } = useContext(AppContext);
  const [selectedOccasion, setSelectedOccasion] = useState(formData.occasion || null);

  const handleOccasionSelect = (occasionId) => {
    setSelectedOccasion(occasionId);
  };

  const handleContinue = () => {
    if (!selectedOccasion) return;
    
    setFormData(prev => ({
      ...prev,
      occasion: selectedOccasion
    }));
    navigateTo('names');
  };

  const handleBack = () => {
    navigateTo('genre');
  };

  return (
    <div className="min-h-screen bg-forest text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20" 
          style={{backgroundImage: 'url("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920")'}}></div>
        <div className="hero-gradient absolute inset-0"></div>
        <div className="papel-picado-overlay absolute inset-0 text-white"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-24 py-6 bg-forest/80 backdrop-blur-md border-b border-white/5">
        <h2 className="font-display text-white text-xl font-medium tracking-tight">
          RegalosQueCantan
        </h2>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Paso 2 de 5</span>
            <span className="text-xs font-bold text-gold">Selecciona la Ocasión</span>
          </div>
          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="w-2/5 h-full bg-gold"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen pt-32 pb-40 flex flex-col items-center overflow-y-auto">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Title */}
          <div className="text-center mb-12">
            <span className="text-gold uppercase tracking-[0.3em] text-[10px] font-bold mb-4 block">Personalización</span>
            <h1 className="text-white font-display text-4xl md:text-6xl font-black leading-tight tracking-tight mb-2">
              ¿Cuál es la <span className="italic font-normal">ocasión?</span>
            </h1>
            <p className="text-white/60 text-sm md:text-base font-light max-w-lg mx-auto">
              Elige el motivo de tu regalo para que podamos adaptar el ritmo y la letra a tu historia.
            </p>
          </div>

          {/* Occasions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {occasions.map((occasion) => (
              <button
                key={occasion.id}
                onClick={() => handleOccasionSelect(occasion.id)}
                className={`
                  relative overflow-hidden transition-all duration-300 backdrop-blur-sm
                  flex flex-col items-center justify-center p-6 rounded-2xl group
                  ${selectedOccasion === occasion.id
                    ? 'border-gold bg-white/20 ring-1 ring-gold border'
                    : 'border border-white/10 bg-white/5 hover:border-gold/50 hover:bg-white/10'}
                `}
              >
                <span className={`material-symbols-outlined text-gold text-4xl mb-3 transition-transform ${selectedOccasion === occasion.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {occasion.icon}
                </span>
                <span className="text-sm font-medium tracking-wide text-center">{occasion.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Decorative corners */}
        <div className="fixed top-40 left-8 w-24 h-24 border-l border-t border-gold/10 hidden md:block pointer-events-none"></div>
        <div className="fixed bottom-40 right-8 w-24 h-24 border-r border-b border-gold/10 hidden md:block pointer-events-none"></div>
      </main>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background-dark/80 backdrop-blur-xl border-t border-white/5 py-8 px-6 md:px-24">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Atrás
          </button>

          <button
            onClick={handleContinue}
            disabled={!selectedOccasion}
            className={`
              flex items-center gap-2 px-12 py-4 rounded-full text-sm font-bold shadow-xl transition-all
              ${selectedOccasion 
                ? 'bg-bougainvillea hover:bg-bougainvillea/90 text-white hover:scale-105 active:scale-95 pink-glow' 
                : 'bg-white/10 text-white/30 cursor-not-allowed'}
            `}
          >
            Continuar
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
