import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import genres from '../config/genres';

// Convert genres config to array for rendering
const genreList = Object.entries(genres).map(([id, data]) => ({
  id,
  name: data.name,
  emoji: data.emoji,
  description: data.description,
  basePrompt: data.basePrompt,
  subGenres: data.subGenres ? Object.entries(data.subGenres).map(([subId, subData]) => ({
    id: subId,
    name: subData.name,
    prompt: subData.prompt
  })) : []
}));

// Map genre IDs to Material Symbols
const genreIcons = {
  corrido: 'music_note',
  norteno: 'library_music',
  banda: 'campaign',
  cumbia: 'nightlife',
  ranchera: 'piano',
  sierreno: 'landscape',
  mariachi: 'celebration',
  bachata: 'favorite',
  merengue: 'speed',
  vallenato: 'queue_music',
  reggaeton: 'graphic_eq',
  latin_trap: 'skull',
  pop_latino: 'star',
  balada: 'heart_broken',
  bolero: 'bedtime',
  salsa: 'sports_handball',
  grupera: 'groups',
  tejano: 'place',
  duranguense: 'music_note',
  huapango: 'directions_walk'
};

// Primary genres (shown first)
const primaryGenreIds = ['corrido', 'norteno', 'banda', 'cumbia', 'ranchera', 'sierreno', 'bachata', 'reggaeton'];

export default function GenrePage() {
  const { navigateTo, formData, setFormData } = useContext(AppContext);
  const [selectedGenre, setSelectedGenre] = useState(formData.genre || null);
  const [selectedSubGenre, setSelectedSubGenre] = useState(formData.subGenre || null);
  const [showMoreGenres, setShowMoreGenres] = useState(false);

  const displayedGenres = showMoreGenres 
    ? genreList 
    : genreList.filter(g => primaryGenreIds.includes(g.id));

  const currentGenre = genreList.find(g => g.id === selectedGenre);
  const secondaryCount = genreList.length - primaryGenreIds.length;

  const handleGenreSelect = (genreId) => {
    setSelectedGenre(genreId);
    setSelectedSubGenre(null);
  };

  const handleSubGenreSelect = (subGenreId) => {
    setSelectedSubGenre(subGenreId);
  };

  const handleContinue = () => {
    if (!selectedGenre) return;
    
    const genre = genreList.find(g => g.id === selectedGenre);
    const subGenre = genre?.subGenres?.find(s => s.id === selectedSubGenre);
    
    setFormData(prev => ({
      ...prev,
      genre: selectedGenre,
      subGenre: selectedSubGenre || '',
      subGenrePrompt: subGenre?.prompt || genre?.basePrompt || ''
    }));
    navigateTo('occasion');
  };

  return (
    <div className="min-h-screen bg-forest text-white flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20" 
          style={{backgroundImage: 'url("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920")'}}></div>
        <div className="hero-gradient absolute inset-0"></div>
        <div className="papel-picado-overlay absolute inset-0 text-white"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col pt-8 pb-4">
        <div className="flex items-center justify-between px-6 md:px-24 mb-6">
          <h2 className="font-display text-white text-2xl font-medium tracking-tight">
            RegalosQueCantan
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-white/40 text-xs uppercase tracking-widest hidden md:block">Paso 1 de 5</span>
            <button 
              onClick={() => navigateTo('landing')}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-white/10 h-[1px] relative">
          <div className="absolute top-0 left-0 h-full w-[20%] bg-gold shadow-[0_0_10px_rgba(212,175,55,0.8)] transition-all duration-700"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-start pt-32 pb-32 overflow-y-auto">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-6xl font-black mb-4 tracking-tight">
              Elige el <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-gold via-white/90 to-gold">Ritmo</span>
            </h1>
            <p className="text-white/60 text-lg font-light max-w-xl mx-auto">
              ¿Qué género musical representa mejor tu historia? Elige la esencia que dará vida a tu canción.
            </p>
          </div>

          {/* Genre Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayedGenres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreSelect(genre.id)}
                className={`
                  glass-morphism p-6 md:p-8 rounded-2xl flex flex-col items-center justify-center gap-3 md:gap-4 
                  group transition-all duration-300
                  ${selectedGenre === genre.id 
                    ? 'border-[3px] border-gold shadow-[0_0_25px_rgba(212,175,55,0.3)] -translate-y-1 bg-white/10' 
                    : 'hover:bg-white/5'}
                `}
              >
                <span className={`material-symbols-outlined text-gold text-3xl md:text-4xl transition-transform ${selectedGenre === genre.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {genreIcons[genre.id] || 'music_note'}
                </span>
                <span className="font-display text-lg md:text-2xl font-semibold tracking-wide">{genre.name}</span>
                <span className="text-white/40 text-[10px] md:text-xs text-center leading-tight hidden md:block">{genre.description}</span>
              </button>
            ))}
          </div>

          {/* Show More Button */}
          {!showMoreGenres && secondaryCount > 0 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowMoreGenres(true)}
                className="text-gold hover:text-white text-sm uppercase tracking-widest flex items-center gap-2 mx-auto transition-colors"
              >
                <span className="material-symbols-outlined text-sm">expand_more</span>
                Ver más géneros ({secondaryCount} más)
              </button>
            </div>
          )}

          {/* Sub-genre Selection */}
          {currentGenre && currentGenre.subGenres && currentGenre.subGenres.length > 0 && (
            <div className="mt-10 p-6 md:p-8 glass-box rounded-2xl">
              <h3 className="text-gold text-xs uppercase tracking-[0.2em] font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">tune</span>
                Estilo de {currentGenre.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {currentGenre.subGenres.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubGenreSelect(sub.id)}
                    className={`
                      p-4 rounded-xl text-left transition-all duration-200
                      ${selectedSubGenre === sub.id
                        ? 'bg-gold/20 border-2 border-gold'
                        : 'bg-white/5 border border-white/10 hover:border-gold/50 hover:bg-white/10'}
                    `}
                  >
                    <span className="block text-sm font-semibold">{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <div className="mt-12 flex flex-col items-center gap-6">
            <button
              onClick={handleContinue}
              disabled={!selectedGenre}
              className={`
                group relative flex min-w-[280px] md:min-w-[340px] cursor-pointer items-center justify-center 
                overflow-hidden rounded-full h-16 px-10 text-lg font-bold shadow-2xl transition-all
                ${selectedGenre 
                  ? 'bg-bougainvillea text-white hover:scale-105 active:scale-95 pink-glow' 
                  : 'bg-white/10 text-white/30 cursor-not-allowed'}
              `}
            >
              <span className="relative z-10 flex items-center gap-2">
                Continuar
                <span className="material-symbols-outlined">arrow_forward</span>
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>
            <p className="text-white/30 text-xs uppercase tracking-widest">
              {selectedGenre ? (selectedSubGenre ? '¡Perfecto!' : 'Puedes elegir un estilo específico') : 'Selecciona un género'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 bg-background-dark/50 backdrop-blur-md py-6 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-display text-white/50 text-lg">RegalosQueCantan</div>
          <div className="flex gap-8">
            <a className="text-white/30 hover:text-gold transition-colors text-[10px] uppercase tracking-widest" href="#">Privacidad</a>
            <a className="text-white/30 hover:text-gold transition-colors text-[10px] uppercase tracking-widest" href="#">Términos</a>
            <a className="text-white/30 hover:text-gold transition-colors text-[10px] uppercase tracking-widest" href="#">FAQ</a>
          </div>
          <p className="text-white/20 text-[10px] uppercase tracking-tighter">© 2025 Hecho en México.</p>
        </div>
      </footer>
    </div>
  );
}
