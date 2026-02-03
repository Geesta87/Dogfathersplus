import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import genres from '../config/genres';

export default function ConfirmPage() {
  const { navigateTo, formData, setFormData } = useContext(AppContext);
  const [email, setEmail] = useState(formData.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const genreConfig = formData.genre ? genres[formData.genre] : null;
  const subGenreConfig = formData.subGenre && genreConfig?.subGenres ? genreConfig.subGenres[formData.subGenre] : null;

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    if (!validateEmail(email)) return;
    
    setIsSubmitting(true);
    
    setFormData(prev => ({
      ...prev,
      email: email.trim()
    }));
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    navigateTo('generating');
  };

  const isValid = validateEmail(email);

  return (
    <div className="min-h-screen bg-forest text-white antialiased flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-forest via-forest/95 to-background-dark" />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L100 50 L50 100 L0 50 Z M50 20 L80 50 L50 80 L20 50 Z' fill='%23fff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-6">
        <h2 className="font-display text-white text-xl font-medium tracking-tight">
          RegalosQueCantan
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-gold/30" />
            <div className="w-2 h-2 rounded-full bg-gold/30" />
            <div className="w-2 h-2 rounded-full bg-gold/30" />
            <div className="w-2 h-2 rounded-full bg-gold/30" />
            <div className="w-8 h-2 rounded-full bg-gold" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Paso 5 de 5</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow pt-28 pb-20 flex flex-col items-center justify-center px-4 md:px-8 overflow-y-auto">
        <div className="container mx-auto max-w-2xl">
          {/* Title */}
          <div className="text-center mb-8">
            <span className="text-gold uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Casi Listos</span>
            <h1 className="font-display text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Confirma tu Creación</h1>
            <p className="text-white/60 text-base md:text-lg font-light">Revisa los detalles de tu obra maestra antes de comenzar la producción.</p>
          </div>

          {/* Summary Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-gold/30 rounded-2xl p-6 md:p-8 mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl text-gold">auto_awesome</span>
            </div>
            
            <h3 className="text-gold text-sm uppercase tracking-widest font-bold mb-6 border-b border-gold/10 pb-4">
              Resumen de la Canción
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Género Musical</p>
                <p className="text-white text-lg md:text-xl font-medium">
                  {genreConfig?.name || formData.genre || '—'}
                  {subGenreConfig && <span className="text-gold/70 text-base ml-2">({subGenreConfig.name})</span>}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Ocasión</p>
                <p className="text-white text-lg md:text-xl font-medium capitalize">{formData.occasion || '—'}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Para</p>
                <p className="text-white text-lg md:text-xl font-medium">{formData.recipientName || '—'}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">De parte de</p>
                <p className="text-white text-lg md:text-xl font-medium">{formData.senderName || '—'}</p>
              </div>
              {formData.voiceType && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Tipo de Voz</p>
                  <p className="text-white text-lg font-medium capitalize">
                    {formData.voiceType === 'male' ? 'Masculina' : formData.voiceType === 'female' ? 'Femenina' : 'Dueto'}
                  </p>
                </div>
              )}
              {formData.artistInspiration && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Inspiración</p>
                  <p className="text-white text-lg font-medium">{formData.artistInspiration}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gold/10">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Tu Historia</p>
              <p className="text-white/80 italic text-base leading-relaxed">
                "{formData.details?.substring(0, 150) || '—'}{formData.details?.length > 150 ? '...' : ''}"
              </p>
            </div>
          </div>

          {/* Email Input */}
          <div className="flex flex-col gap-6 items-center mb-10">
            <div className="w-full">
              <label 
                htmlFor="email"
                className="block text-center text-gold/80 text-sm uppercase tracking-widest font-bold mb-4"
              >
                ¿A dónde enviamos tu canción?
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-transparent border-0 border-b-2 border-gold/30 py-4 text-xl md:text-2xl text-center focus:ring-0 focus:border-gold text-white placeholder:text-white/20 transition-all font-light"
              />
              {email && !validateEmail(email) && (
                <p className="text-bougainvillea text-xs text-center mt-2">Por favor ingresa un email válido</p>
              )}
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className={`
                group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-20 px-10 text-xl font-bold transition-all
                ${isValid && !isSubmitting
                  ? 'bg-bougainvillea text-white shadow-[0_0_20px_rgba(225,29,116,0.4)] hover:scale-[1.02] active:scale-95' 
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
            >
              <span className="relative z-10">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Iniciando...
                  </span>
                ) : (
                  '🎤 Crear Mi Canción GRATIS'
                )}
              </span>
              {isValid && !isSubmitting && <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />}
            </button>
            
            <p className="text-white/40 text-[10px] uppercase tracking-tighter text-center">
              Al hacer clic, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button 
              onClick={() => navigateTo('details')}
              className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-widest font-medium mx-auto"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Editar detalles
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-4 md:gap-8 opacity-60">
            <div className="flex items-center gap-2 border border-gold/20 rounded-lg px-4 py-2">
              <span className="material-symbols-outlined text-gold text-xl">verified_user</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white">Seguridad Total</span>
            </div>
            <div className="flex items-center gap-2 border border-gold/20 rounded-lg px-4 py-2">
              <span className="material-symbols-outlined text-gold text-xl">high_quality</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white">Alta Fidelidad</span>
            </div>
            <div className="flex items-center gap-2 border border-gold/20 rounded-lg px-4 py-2">
              <span className="material-symbols-outlined text-gold text-xl">auto_fix_high</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white">100% Original</span>
            </div>
          </div>
        </div>

        {/* Decorative corners */}
        <div className="absolute top-40 left-10 w-24 h-24 border-l border-t border-gold/10 hidden lg:block" />
        <div className="absolute bottom-40 right-10 w-24 h-24 border-r border-b border-gold/10 hidden lg:block" />
      </main>

      {/* Footer */}
      <footer className="bg-background-dark py-8 px-6 border-t border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-display text-white/30 text-lg tracking-wider uppercase">RegalosQueCantan</div>
          <div className="flex gap-8">
            <a href="#" className="text-white/30 hover:text-gold transition-colors text-[10px] uppercase tracking-[0.2em]">Ayuda</a>
            <a href="#" className="text-white/30 hover:text-gold transition-colors text-[10px] uppercase tracking-[0.2em]">Privacidad</a>
            <a href="#" className="text-white/30 hover:text-gold transition-colors text-[10px] uppercase tracking-[0.2em]">Términos</a>
          </div>
          <p className="text-white/20 text-[10px] uppercase tracking-widest">© 2024 • Hecho con alma en México.</p>
        </div>
      </footer>
    </div>
  );
}
