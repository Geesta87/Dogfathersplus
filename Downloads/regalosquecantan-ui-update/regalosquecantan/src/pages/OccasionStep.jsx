import React, { useContext } from 'react';
import { AppContext } from '../App';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';

const occasions = [
  { id: 'cumpleanos', name: 'Cumpleaños', emoji: '🎂' },
  { id: 'aniversario', name: 'Aniversario', emoji: '💍' },
  { id: 'declaracion', name: 'Declaración de Amor', emoji: '💕' },
  { id: 'disculpa', name: 'Pedir Perdón', emoji: '🙏' },
  { id: 'graduacion', name: 'Graduación', emoji: '🎓' },
  { id: 'quinceanera', name: 'Quinceañera', emoji: '👑' },
  { id: 'boda', name: 'Boda', emoji: '💒' },
  { id: 'madre', name: 'Día de las Madres', emoji: '🌹' },
  { id: 'padre', name: 'Día del Padre', emoji: '👔' },
  { id: 'amistad', name: 'Amistad', emoji: '🤝' },
  { id: 'motivacion', name: 'Motivación', emoji: '💪' },
  { id: 'otro', name: 'Otro', emoji: '✨' },
];

export default function OccasionStep() {
  const { navigateTo, formData, updateFormData } = useContext(AppContext);

  const handleContinue = () => {
    if (formData.occasion) {
      navigateTo('names');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-x-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 mexican-pattern pointer-events-none opacity-5" />
      
      <Header />

      <main className="flex-1 flex justify-center py-8">
        <div className="max-w-[1024px] w-full px-6 flex flex-col gap-8">
          <div className="flex justify-center">
            <ProgressBar step={2} />
          </div>

          {/* Page Heading */}
          <div className="text-center md:text-left mb-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-[-0.03em] mb-2 text-[#171612] dark:text-white">
              ¿Cuál es la ocasión?
            </h1>
            <p className="text-[#857d66] dark:text-gray-400 text-lg">
              Selecciona el motivo especial para tu canción personalizada.
            </p>
          </div>

          {/* Occasion Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {occasions.map((occasion) => (
              <div
                key={occasion.id}
                onClick={() => updateFormData('occasion', occasion.id)}
                className={`group relative flex flex-col items-center justify-center p-6 rounded-xl shadow-sm transition-all cursor-pointer ${
                  formData.occasion === occasion.id
                    ? 'bg-primary/5 dark:bg-primary/10 border-2 border-primary shadow-md'
                    : 'bg-white dark:bg-[#2a261a] border-2 border-transparent hover:border-primary/50 hover:shadow-xl'
                }`}
              >
                {formData.occasion === occasion.id && (
                  <div className="absolute top-3 right-3 text-primary">
                    <span className="material-symbols-outlined font-bold">check_circle</span>
                  </div>
                )}
                <div className={`text-5xl mb-4 transition-transform ${formData.occasion !== occasion.id ? 'group-hover:scale-110' : ''}`}>
                  {occasion.emoji}
                </div>
                <p className="font-bold text-center text-[#171612] dark:text-white">{occasion.name}</p>
              </div>
            ))}
          </div>

          {/* Mobile Sticky Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 p-4 md:hidden z-40">
            <div className="flex gap-3">
              <button
                onClick={() => navigateTo('genre')}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Atrás
              </button>
              <button
                onClick={handleContinue}
                disabled={!formData.occasion}
                className={`flex-[2] py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                  formData.occasion
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continuar
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Desktop Action Footer */}
          <div className="mt-8 hidden md:flex justify-between items-center pb-20">
            <button 
              onClick={() => navigateTo('genre')}
              className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#2a261a] border border-[#e4e3dc] dark:border-[#3a362a] text-[#171612] dark:text-white font-bold hover:shadow-md transition-all"
            >
              <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span>Volver</span>
            </button>
            <button
              onClick={handleContinue}
              disabled={!formData.occasion}
              className={`group flex min-w-[200px] items-center justify-center gap-3 overflow-hidden rounded-xl h-14 px-8 text-lg font-black leading-normal tracking-wide shadow-lg transition-all ${
                formData.occasion
                  ? 'bg-primary text-white shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Continuar</span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>
          </div>
          
          {/* Spacer for mobile sticky nav */}
          <div className="h-24 md:hidden" />
        </div>
      </main>

      {/* Decorative Footer */}
      <footer className="w-full h-16 bg-white dark:bg-[#1a1710] border-t border-[#e4e3dc] dark:border-[#3a362a] flex items-center justify-center overflow-hidden">
        <div className="flex gap-4 opacity-10">
          <span className="material-symbols-outlined text-4xl">favorite</span>
          <span className="material-symbols-outlined text-4xl">music_note</span>
          <span className="material-symbols-outlined text-4xl">celebration</span>
          <span className="material-symbols-outlined text-4xl">loyalty</span>
          <span className="material-symbols-outlined text-4xl">volunteer_activism</span>
          <span className="material-symbols-outlined text-4xl">music_note</span>
          <span className="material-symbols-outlined text-4xl">favorite</span>
        </div>
      </footer>
    </div>
  );
}
