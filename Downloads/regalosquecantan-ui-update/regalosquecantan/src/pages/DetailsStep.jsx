import React, { useContext } from 'react';
import { AppContext } from '../App';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';

const suggestionChips = [
  { icon: 'auto_awesome', label: 'Recuerdos favoritos' },
  { icon: 'person', label: 'Cualidades' },
  { icon: 'favorite', label: 'Mensaje especial' },
];

export default function DetailsStep() {
  const { navigateTo, formData, updateFormData } = useContext(AppContext);

  const handleContinue = () => {
    if (formData.details.length >= 20) {
      navigateTo('email');
    }
  };

  const addSuggestion = (label) => {
    const addition = formData.details ? ` ${label.toLowerCase()}` : label;
    updateFormData('details', formData.details + addition);
  };

  return (
    <div className="min-h-screen text-[#171612] dark:text-white transition-colors duration-300">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex justify-center">
          <ProgressBar step={5} label="Casi listo, solo faltan los toques personales..." />
        </div>

        {/* Headline */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Cuéntanos más detalles</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            Los mejores regalos son los que cuentan una historia real. Ayúdanos a escribir la letra perfecta.
          </p>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {suggestionChips.map((chip, index) => (
            <button
              key={chip.label}
              onClick={() => addSuggestion(chip.label)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
                index === 0
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>

        {/* Main Input Area */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-500" />
          <div className="relative">
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
              Tu historia
            </label>
            <textarea
              value={formData.details}
              onChange={(e) => updateFormData('details', e.target.value)}
              className="w-full min-h-[280px] p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg leading-relaxed focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-gray-400"
              placeholder="Escribe sobre ese viaje especial, el momento en que se conocieron o lo que más admiras de esa persona... No te preocupes por la rima, nosotros nos encargamos."
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                formData.details.length >= 20 
                  ? 'text-green-600 bg-green-100 dark:bg-green-900/30' 
                  : 'text-gray-400 bg-gray-100 dark:bg-gray-700'
              }`}>
                {formData.details.length} / 20 min
              </span>
              <span className="material-symbols-outlined text-gray-300 text-lg">edit_note</span>
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 mb-12 flex gap-4 items-start">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <span className="material-symbols-outlined block">lightbulb</span>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-1">Un consejo para tu canción</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Sé específico para mejores resultados. Los detalles pequeños —como un apodo, una canción que siempre cantan o un café específico— hacen que la canción sea única.
            </p>
          </div>
        </div>

        {/* Mobile Sticky Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 p-4 md:hidden z-40">
          <div className="flex gap-3">
            <button
              onClick={() => navigateTo('voice')}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Atrás
            </button>
            <button
              onClick={handleContinue}
              disabled={formData.details.length < 20}
              className={`flex-[2] py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                formData.details.length >= 20
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continuar
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Actions */}
        <div className="hidden md:flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-gray-200 dark:border-gray-700 pt-10">
          <button
            onClick={() => navigateTo('voice')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-white font-medium transition-colors group"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Volver al paso anterior
          </button>
          <button
            onClick={handleContinue}
            disabled={formData.details.length < 20}
            className={`w-full sm:w-auto px-10 py-4 font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 ${
              formData.details.length >= 20
                ? 'bg-primary text-white shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continuar
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
        
        {/* Spacer for mobile sticky nav */}
        <div className="h-24 md:hidden" />
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 text-center text-gray-400 text-xs">
        <p>© 2024 RegalosQueCantan. Hecho con amor y música.</p>
      </footer>
    </div>
  );
}
