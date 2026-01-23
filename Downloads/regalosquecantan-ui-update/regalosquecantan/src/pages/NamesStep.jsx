import React, { useContext } from 'react';
import { AppContext } from '../App';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';

const voiceOptions = [
  { id: 'male', label: 'Masculina', emoji: '👨‍🎤', desc: 'Cantante hombre' },
  { id: 'female', label: 'Femenina', emoji: '👩‍🎤', desc: 'Cantante mujer' },
];

export default function NamesStep() {
  const { navigateTo, formData, updateFormData } = useContext(AppContext);

  const handleContinue = (e) => {
    e.preventDefault();
    if (formData.recipientName && formData.senderName) {
      navigateTo('voice');
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="flex justify-center w-full">
          <ProgressBar step={3} />
        </div>

        {/* Main Form Card */}
        <div className="w-full max-w-[640px] bg-white dark:bg-[#2c3136] rounded-xl shadow-lg p-8 md:p-12 border border-[#f4f3f1] dark:border-white/5">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-[#171612] dark:text-white mb-4 tracking-tight">
              ¿A quién va dedicada?
            </h1>
            <p className="text-[#857d66] dark:text-gray-400 text-lg">
              Así es como aparecerán los nombres en la letra de tu canción
            </p>
          </div>

          <form onSubmit={handleContinue} className="space-y-8">
            {/* Recipient Name */}
            <div className="group">
              <label className="block mb-2">
                <span className="text-sm font-semibold text-[#171612] dark:text-gray-200">
                  Nombre del destinatario <span className="text-primary">*</span>
                </span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary">
                  person
                </span>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => updateFormData('recipientName', e.target.value)}
                  className="w-full pl-12 pr-4 h-14 bg-[#fafafa] dark:bg-background-dark/50 border border-[#e4e3dc] dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[#171612] dark:text-white placeholder:text-[#857d66]/50"
                  placeholder="Ej: Lucía"
                />
              </div>
            </div>

            {/* Sender Name */}
            <div className="group">
              <label className="block mb-2">
                <span className="text-sm font-semibold text-[#171612] dark:text-gray-200">
                  Tu nombre <span className="text-primary">*</span>
                </span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary">
                  pen_size_2
                </span>
                <input
                  type="text"
                  value={formData.senderName}
                  onChange={(e) => updateFormData('senderName', e.target.value)}
                  className="w-full pl-12 pr-4 h-14 bg-[#fafafa] dark:bg-background-dark/50 border border-[#e4e3dc] dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[#171612] dark:text-white placeholder:text-[#857d66]/50"
                  placeholder="Ej: Marcos"
                />
              </div>
            </div>

            {/* Relationship */}
            <div className="group">
              <label className="block mb-2 flex justify-between">
                <span className="text-sm font-semibold text-[#171612] dark:text-gray-200">Relación</span>
                <span className="text-[10px] text-[#857d66] dark:text-gray-500 uppercase font-bold tracking-widest">Opcional</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary">
                  favorite
                </span>
                <input
                  type="text"
                  value={formData.relationship}
                  onChange={(e) => updateFormData('relationship', e.target.value)}
                  className="w-full pl-12 pr-4 h-14 bg-[#fafafa] dark:bg-background-dark/50 border border-[#e4e3dc] dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-[#171612] dark:text-white placeholder:text-[#857d66]/50"
                  placeholder="Ej: Pareja, Madre, Amiga..."
                />
              </div>
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block mb-3">
                <span className="text-sm font-semibold text-[#171612] dark:text-gray-200">
                  🎤 Tipo de voz
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {voiceOptions.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => updateFormData('voiceType', voice.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      (formData.voiceType || 'male') === voice.id
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 ring-2 ring-primary/20'
                        : 'border-[#e4e3dc] dark:border-white/10 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-3xl block mb-2">{voice.emoji}</span>
                    <span className={`font-bold block ${
                      (formData.voiceType || 'male') === voice.id
                        ? 'text-primary' 
                        : 'text-[#171612] dark:text-white'
                    }`}>
                      {voice.label}
                    </span>
                    <span className="text-xs text-[#857d66] dark:text-gray-400">
                      {voice.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Sticky Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 p-4 md:hidden z-40">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigateTo('occasion')}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={!formData.recipientName || !formData.senderName}
                  className={`flex-[2] py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                    formData.recipientName && formData.senderName
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuar
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="pt-6 hidden md:flex flex-col md:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigateTo('occasion')}
                className="order-2 md:order-1 flex-1 h-14 rounded-lg font-bold text-[#857d66] dark:text-gray-300 hover:bg-[#e4e3dc]/30 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
                Atrás
              </button>
              <button
                type="submit"
                disabled={!formData.recipientName || !formData.senderName}
                className={`order-1 md:order-2 flex-[2] h-14 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  formData.recipientName && formData.senderName
                    ? 'bg-primary text-white shadow-primary/20 hover:brightness-110 active:scale-[0.98]'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continuar
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
            
            {/* Spacer for mobile sticky nav */}
            <div className="h-20 md:hidden" />
          </form>
        </div>

        {/* Footer Small */}
        <footer className="mt-12 text-center text-[#857d66] dark:text-gray-500 text-sm max-w-md">
          <p>Tu privacidad es importante. Solo usamos estos nombres para generar el contenido de tu pedido personalizado.</p>
        </footer>
      </main>
    </div>
  );
}
