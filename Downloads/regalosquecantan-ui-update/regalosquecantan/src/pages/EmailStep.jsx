import React, { useContext } from 'react';
import { AppContext } from '../App';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';

const genres = {
  corrido: { name: 'Corrido', emoji: '🤠' },
  norteno: { name: 'Norteño', emoji: '🪗' },
  banda: { name: 'Banda', emoji: '🎺' },
  cumbia: { name: 'Cumbia', emoji: '💃' },
  ranchera: { name: 'Ranchera', emoji: '🎸' },
  balada: { name: 'Balada', emoji: '❤️' },
  reggaeton: { name: 'Reggaetón', emoji: '🔥' },
  salsa: { name: 'Salsa', emoji: '🎹' },
};

const occasions = {
  cumpleanos: { name: 'Cumpleaños', emoji: '🎂' },
  aniversario: { name: 'Aniversario', emoji: '💍' },
  declaracion: { name: 'Declaración de Amor', emoji: '💕' },
  disculpa: { name: 'Pedir Perdón', emoji: '🙏' },
  graduacion: { name: 'Graduación', emoji: '🎓' },
  quinceanera: { name: 'Quinceañera', emoji: '👑' },
  boda: { name: 'Boda', emoji: '💒' },
  madre: { name: 'Día de las Madres', emoji: '🌹' },
  padre: { name: 'Día del Padre', emoji: '👔' },
  amistad: { name: 'Amistad', emoji: '🤝' },
  motivacion: { name: 'Motivación', emoji: '💪' },
  otro: { name: 'Otro', emoji: '✨' },
};

export default function EmailStep() {
  const { navigateTo, formData, updateFormData } = useContext(AppContext);

  const isValidEmail = formData.email && formData.email.includes('@') && formData.email.includes('.');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValidEmail) {
      navigateTo('generating');
    }
  };

  const selectedGenre = genres[formData.genre] || { name: 'No seleccionado', emoji: '🎵' };
  const selectedOccasion = occasions[formData.occasion] || { name: 'No seleccionada', emoji: '✨' };

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Header />

      <main className="max-w-[640px] mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="flex justify-center mb-8">
          <ProgressBar step={6} label="¡Último paso!" />
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#171612] dark:text-white mb-3">
            ¡Casi listo!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Ingresa tu correo para recibir tu canción personalizada.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Summary Card - Glass Effect */}
          <div className="bg-white/60 dark:bg-[#1f251d]/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-primary/10">
            {/* Banner Image */}
            <div className="relative w-full h-32 bg-gradient-to-br from-forest via-forest-light to-primary/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
              <div className="absolute bottom-4 left-6 z-20">
                <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Resumen del Pedido
                </span>
                <h3 className="text-xl font-bold mt-2 text-white">Tu Canción Personalizada</h3>
              </div>
            </div>
            
            {/* Summary Items Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                  <span className="material-symbols-outlined text-primary text-2xl">equalizer</span>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Género</p>
                    <p className="font-bold text-sm text-[#171612] dark:text-white">{selectedGenre.emoji} {selectedGenre.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                  <span className="material-symbols-outlined text-primary text-2xl">celebration</span>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Ocasión</p>
                    <p className="font-bold text-sm text-[#171612] dark:text-white">{selectedOccasion.emoji} {selectedOccasion.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                  <span className="material-symbols-outlined text-primary text-2xl">person</span>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Para</p>
                    <p className="font-bold text-sm text-[#171612] dark:text-white truncate">{formData.recipientName || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold px-1 text-gray-600 dark:text-gray-400">
              Tu correo electrónico <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                mail
              </span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className="w-full bg-white dark:bg-[#1f251d] border-2 border-gray-200 dark:border-[#2d372a] focus:border-primary focus:ring-0 rounded-full py-4 pl-12 pr-6 text-lg transition-all outline-none text-[#171612] dark:text-white placeholder:text-gray-400"
                placeholder="nombre@ejemplo.com"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 flex gap-4 items-start">
            <div className="bg-primary p-2 rounded-full text-white shrink-0">
              <span className="material-symbols-outlined text-lg block">info</span>
            </div>
            <div>
              <h4 className="font-bold text-primary">¿Qué sigue?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Nuestra IA creará tu canción en ~60 segundos. Primero escucharás un preview GRATIS, y si te gusta, la compras por solo <strong>$19.99 USD</strong>.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-4 pt-4">
            <button
              type="submit"
              disabled={!isValidEmail}
              className={`w-full py-5 rounded-full font-extrabold text-xl shadow-xl transition-all flex items-center justify-center gap-3 group ${
                isValidEmail
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/30'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined group-hover:scale-125 transition-transform">mic</span>
              CREAR MI CANCIÓN GRATIS
            </button>
            
            <div className="flex justify-between items-center px-2">
              <button
                type="button"
                onClick={() => navigateTo('details')}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors uppercase tracking-tight"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Volver
              </button>
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <span className="material-symbols-outlined text-xs">lock</span>
                Pago Seguro
              </div>
            </div>
          </div>

          {/* Privacy Footer */}
          <p className="text-center text-[11px] text-gray-500 px-8 leading-tight">
            Al hacer clic en "Crear Mi Canción", aceptas nuestros <a className="underline hover:text-primary" href="#">Términos de Servicio</a> y <a className="underline hover:text-primary" href="#">Política de Privacidad</a>. No enviamos spam.
          </p>
        </form>
      </main>
    </div>
  );
}
