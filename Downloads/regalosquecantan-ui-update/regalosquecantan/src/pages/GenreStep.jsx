import React, { useContext } from 'react';
import { AppContext } from '../App';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';
import { genreStyles } from '../services/api';

const genres = [
  { id: 'corrido', name: 'Corrido', emoji: '🤠', desc: 'Historias con garra' },
  { id: 'norteno', name: 'Norteño', emoji: '🪗', desc: 'El alma del acordeón' },
  { id: 'banda', name: 'Banda', emoji: '🎺', desc: 'Fuerza y pasión' },
  { id: 'cumbia', name: 'Cumbia', emoji: '💃', desc: 'Para bailar y celebrar' },
  { id: 'ranchera', name: 'Ranchera', emoji: '🎸', desc: 'Sentimiento mexicano' },
  { id: 'balada', name: 'Balada', emoji: '❤️', desc: 'Romance y suavidad' },
  { id: 'reggaeton', name: 'Reggaetón', emoji: '🔥', desc: 'Ritmo y energía' },
  { id: 'salsa', name: 'Salsa', emoji: '🎹', desc: 'Sabor y movimiento' },
];

export default function GenreStep() {
  const { navigateTo, formData, updateFormData } = useContext(AppContext);

  const handleGenreSelect = (genreId) => {
    updateFormData('genre', genreId);
    updateFormData('genreStyle', genreStyles[genreId]);
  };

  const handleContinue = () => {
    if (formData.genre) {
      navigateTo('subgenre');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[960px]">
          <div className="flex justify-center">
            <ProgressBar step={1} />
          </div>

          {/* Headline with back button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="text-center md:text-left flex-1">
              <h1 className="text-[#171612] dark:text-white text-3xl md:text-4xl font-bold tracking-tight mb-2">
                ¿Qué género musical prefieres?
              </h1>
              <p className="text-[#857d66] dark:text-gray-400 text-lg">
                Selecciona el estilo que mejor cuente tu historia.
              </p>
            </div>
            <button
              onClick={() => navigateTo('landing')}
              className="self-center md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#2a261a] border border-[#e4e3dc] dark:border-[#3a362a] text-[#171612] dark:text-white font-medium hover:shadow-md transition-all group"
            >
              <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span>Inicio</span>
            </button>
          </div>

          {/* Genre Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            {genres.map((genre) => (
              <div
                key={genre.id}
                onClick={() => handleGenreSelect(genre.id)}
                className={`genre-card cursor-pointer group flex flex-col p-5 md:p-6 rounded-xl border-2 transition-all hover:-translate-y-1 ${
                  formData.genre === genre.id
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-[#e4e3dc]/50 dark:border-white/5 bg-white dark:bg-background-dark/50 hover:border-primary/50'
                }`}
              >
                {formData.genre === genre.id && (
                  <div className="flex justify-end mb-1">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  </div>
                )}
                <div className={`text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform ${formData.genre !== genre.id ? 'mt-6' : ''}`}>
                  {genre.emoji}
                </div>
                <h3 className="text-base md:text-lg font-bold text-[#171612] dark:text-white mb-1">{genre.name}</h3>
                <p className="text-xs md:text-sm text-[#857d66] dark:text-gray-400 leading-tight">{genre.desc}</p>
              </div>
            ))}
          </div>

          {/* Sticky Bottom Actions for Mobile */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 p-4 md:hidden z-40">
            <button
              onClick={handleContinue}
              disabled={!formData.genre}
              className={`w-full font-bold text-lg py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                formData.genre
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continuar
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex flex-col items-center gap-6">
            <button
              onClick={handleContinue}
              disabled={!formData.genre}
              className={`min-w-[280px] font-bold text-lg py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                formData.genre
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/20 hover:-translate-y-0.5'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continuar
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
          
          {/* Spacer for mobile sticky button */}
          <div className="h-20 md:hidden" />
        </div>
      </main>
    </div>
  );
}
