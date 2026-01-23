import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import Header from '../components/Header';

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

export default function SuccessPage() {
  const { navigateTo, formData, songData, clearSession } = useContext(AppContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);
  const audioRef = useRef(null);

  const selectedGenre = genres[formData.genre] || { name: 'Música', emoji: '🎵' };
  const audioUrl = songData?.previewUrl || songData?.audioUrl || songData?.audio_url;

  // Hide confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Real audio player events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateAnother = () => {
    clearSession();
  };

  const shareText = encodeURIComponent(`¡Escucha la canción personalizada que me crearon en RegalosQueCantan! 🎵❤️`);
  const shareUrl = encodeURIComponent('https://regalosquecantan.com');

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rotate-45"
                style={{
                  backgroundColor: ['#d4af35', '#E11D74', '#1A4338', '#ff6b6b', '#4ecdc4'][Math.floor(Math.random() * 5)],
                }}
              />
            </div>
          ))}
        </div>
      )}

      <Header />

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Celebration Header */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-4xl md:text-5xl font-black text-[#171612] dark:text-white mb-4 tracking-tight">
            ¡Gracias por tu compra!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Tu canción completa está en camino a{' '}
            <span className="text-primary font-semibold">{formData.email}</span>
          </p>
        </div>

        {/* Full Song Player */}
        <div className="bg-gradient-to-br from-forest to-forest/90 rounded-2xl p-8 mb-8 shadow-2xl">
          {/* Album Art */}
          <div className="w-40 h-40 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gold/30 to-bougainvillea/20 flex items-center justify-center relative overflow-hidden shadow-xl">
            <span className="text-6xl">{selectedGenre.emoji}</span>
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gold rounded-full animate-equalizer"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: '30px',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1">
              Canción para {formData.recipientName}
            </h2>
            <p className="text-white/60 text-sm">
              {selectedGenre.name} • Canción Completa
            </p>
          </div>

          {/* Full Audio Player */}
          <div className="bg-white/10 rounded-xl p-6">
            {audioUrl && (
              <audio ref={audioRef} src={audioUrl} preload="metadata" />
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                disabled={!audioUrl}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center text-forest shadow-lg shadow-gold/30 hover:scale-105 transition-transform disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <div className="flex-1">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold/80 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/50 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        {audioUrl ? (
          <a
            href={audioUrl}
            download={`cancion-para-${formData.recipientName}.mp3`}
            className="w-full py-5 rounded-xl font-bold text-forest text-xl transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-gold to-gold/90 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gold/30 mb-8"
          >
            <span className="material-symbols-outlined text-2xl">download</span>
            Descargar MP3
          </a>
        ) : (
          <button
            disabled
            className="w-full py-5 rounded-xl font-bold text-forest text-xl bg-gray-300 mb-8 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-2xl">download</span>
            Descarga no disponible
          </button>
        )}

        {/* Share Section */}
        <div className="bg-white dark:bg-[#2c3136] rounded-xl p-6 border border-gray-100 dark:border-white/5 mb-8">
          <h3 className="font-bold text-[#171612] dark:text-white mb-4 text-center">
            Comparte tu canción 🎶
          </h3>
          <div className="flex justify-center gap-4">
            <a
              href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 dark:bg-[#2c3136] rounded-xl p-6 border border-gray-100 dark:border-white/5 mb-8">
          <h3 className="font-bold text-[#171612] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            Detalles de tu pedido
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Número de orden</span>
              <span className="font-mono text-[#171612] dark:text-white">#{songData?.id?.slice(-8) || 'RQC-2024-001'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Canción para</span>
              <span className="text-[#171612] dark:text-white">{formData.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Género</span>
              <span className="text-[#171612] dark:text-white">{selectedGenre.emoji} {selectedGenre.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total pagado</span>
              <span className="font-bold text-primary">$19.99 USD</span>
            </div>
          </div>
        </div>

        {/* Create Another */}
        <div className="text-center">
          <button
            onClick={handleCreateAnother}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Crear otra canción
          </button>
        </div>
      </main>

      {/* Custom animations */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        @keyframes equalizer {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .animate-equalizer {
          animation: equalizer 0.5s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </div>
  );
}
