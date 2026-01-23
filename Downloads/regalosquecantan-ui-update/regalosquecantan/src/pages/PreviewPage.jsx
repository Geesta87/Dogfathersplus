import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import Header from '../components/Header';
import { createCheckout, supabase, regenerateSong, validateCoupon } from '../services/api';

// Preview settings
const PREVIEW_START = 15; // Skip intro - start at 15 seconds where vocals usually begin
const PREVIEW_DURATION = 20; // Play for 20 seconds
const PREVIEW_END = PREVIEW_START + PREVIEW_DURATION; // Stop at 35 seconds

// Countdown timer (10 minutes in seconds)
const COUNTDOWN_DURATION = 10 * 60;

const genres = {
  corrido: { name: 'Corrido', emoji: '🤠', color: 'from-amber-500 to-orange-600' },
  norteno: { name: 'Norteño', emoji: '🪗', color: 'from-green-500 to-emerald-600' },
  banda: { name: 'Banda', emoji: '🎺', color: 'from-yellow-500 to-amber-600' },
  cumbia: { name: 'Cumbia', emoji: '💃', color: 'from-pink-500 to-rose-600' },
  ranchera: { name: 'Ranchera', emoji: '🎸', color: 'from-red-500 to-rose-600' },
  balada: { name: 'Balada', emoji: '❤️', color: 'from-purple-500 to-violet-600' },
  reggaeton: { name: 'Reggaetón', emoji: '🔥', color: 'from-orange-500 to-red-600' },
  salsa: { name: 'Salsa', emoji: '🎹', color: 'from-teal-500 to-cyan-600' },
};

const occasions = {
  cumpleanos: 'Cumpleaños',
  aniversario: 'Aniversario',
  declaracion: 'Declaración de Amor',
  disculpa: 'Pedir Perdón',
  graduacion: 'Graduación',
  quinceanera: 'Quinceañera',
  boda: 'Boda',
  madre: 'Día de las Madres',
  padre: 'Día del Padre',
  amistad: 'Amistad',
  motivacion: 'Motivación',
  otro: 'Otro',
};

export default function PreviewPage() {
  const { navigateTo, formData, setFormData, songData, setSongData, directSongId } = useContext(AppContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const [previewEnded, setPreviewEnded] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [offerExpired, setOfferExpired] = useState(false);
  const audioRef = useRef(null);
  
  // Regeneration state (max 2 regenerates = 3 total versions)
  const MAX_REGENERATES = 2;
  const [regeneratesLeft, setRegeneratesLeft] = useState(() => {
    // Persist regenerate count in sessionStorage per song
    const stored = sessionStorage.getItem(`regenerates_${songData?.id}`);
    return stored !== null ? parseInt(stored) : MAX_REGENERATES;
  });
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  // Base prices
  const BASE_PRICE = 29.99;
  const SALE_PRICE = 19.99;

  // Load song from database if accessed via direct URL (email link)
  useEffect(() => {
    const loadSongFromDatabase = async () => {
      if (directSongId && !songData) {
        setIsLoadingSong(true);
        setLoadError(null);
        
        try {
          console.log('Loading song from database:', directSongId);
          
          const { data: song, error } = await supabase
            .from('songs')
            .select('*')
            .eq('id', directSongId)
            .single();
          
          if (error) {
            console.error('Error loading song:', error);
            setLoadError('No se pudo encontrar la canción');
            return;
          }
          
          if (song) {
            console.log('Song loaded:', song);
            
            // Update songData
            setSongData({
              id: song.id,
              previewUrl: song.preview_url || song.audio_url,
              audioUrl: song.audio_url,
              albumArt: song.album_art,
              lyrics: song.lyrics
            });
            
            // Update formData with song details
            setFormData(prev => ({
              ...prev,
              genre: song.genre || '',
              occasion: song.occasion || '',
              recipientName: song.recipient_name || '',
              senderName: song.sender_name || '',
              voiceType: song.voice_type || 'male'
            }));
          }
        } catch (err) {
          console.error('Error:', err);
          setLoadError('Error al cargar la canción');
        } finally {
          setIsLoadingSong(false);
        }
      }
    };
    
    loadSongFromDatabase();
  }, [directSongId, songData, setSongData, setFormData]);

  const selectedGenre = genres[formData.genre] || { name: 'Música', emoji: '🎵', color: 'from-primary to-primary-dark' };
  const selectedOccasion = occasions[formData.occasion] || 'Ocasión especial';

  // Get audio URL from songData
  const audioUrl = songData?.previewUrl || songData?.audioUrl || songData?.audio_url;
  
  // Album art URL (from songData or generate placeholder)
  const albumArtUrl = songData?.albumArt || null;

  // 10-minute countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setOfferExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setOfferExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Format countdown as MM:SS
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    console.log('Song data:', songData);
    console.log('Audio URL:', audioUrl);
  }, [songData, audioUrl]);

  // Handle audio events with preview window (skip intro, play 20 seconds)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      // Calculate progress within the preview window
      const previewTime = time - PREVIEW_START;
      setCurrentTime(Math.max(0, previewTime));
      setProgress((Math.max(0, previewTime) / PREVIEW_DURATION) * 100);
      
      // Stop at end of preview window
      if (time >= PREVIEW_END) {
        audio.pause();
        audio.currentTime = PREVIEW_START;
        setIsPlaying(false);
        setPreviewEnded(true);
        setProgress(100);
        setCurrentTime(PREVIEW_DURATION);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
      setAudioError('Error loading audio');
      setIsPlaying(false);
    };

    // Set initial position to skip intro
    const handleLoadedMetadata = () => {
      audio.currentTime = PREVIEW_START;
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (previewEnded) {
      // Reset to start of preview window
      audio.currentTime = PREVIEW_START;
      setPreviewEnded(false);
      setProgress(0);
      setCurrentTime(0);
    }

    if (isPlaying) {
      audio.pause();
    } else {
      // Make sure we start at the right position
      if (audio.currentTime < PREVIEW_START) {
        audio.currentTime = PREVIEW_START;
      }
      audio.play().catch(err => {
        console.error('Play error:', err);
        setAudioError('No se pudo reproducir el audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      // If coupon makes it completely free, handle it specially
      if (couponData && finalPrice === 0) {
        const result = await createCheckout(
          songData?.id, 
          formData.email,
          couponData.code
        );
        
        if (result.success) {
          // For free songs, navigate directly to success
          if (result.free) {
            navigateTo('success');
            return;
          }
          // Otherwise redirect to the URL
          if (result.url) {
            window.location.href = result.url;
          }
        } else {
          throw new Error(result.error || 'Checkout failed');
        }
      } else {
        // Normal paid checkout
        const result = await createCheckout(
          songData?.id, 
          formData.email,
          couponData?.code
        );
        if (result.success && result.url) {
          window.location.href = result.url;
        } else {
          throw new Error(result.error || 'Checkout failed');
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Error al procesar. Por favor intenta de nuevo.');
      setIsLoading(false);
    }
  };

  // Handle song regeneration
  const handleRegenerate = async () => {
    if (regeneratesLeft <= 0 || isRegenerating) return;
    
    setIsRegenerating(true);
    try {
      // Call regenerate API
      const result = await regenerateSong(songData?.id);
      
      if (result.success && result.song) {
        // Update song data with new song
        setSongData({
          id: result.song.id,
          previewUrl: result.song.preview_url || result.song.audio_url,
          audioUrl: result.song.audio_url,
          albumArt: result.song.album_art,
          lyrics: result.song.lyrics
        });
        
        // Decrease regenerates left
        const newCount = regeneratesLeft - 1;
        setRegeneratesLeft(newCount);
        sessionStorage.setItem(`regenerates_${result.song.id}`, newCount.toString());
        
        // Reset audio player
        setProgress(0);
        setCurrentTime(0);
        setPreviewEnded(false);
        setIsPlaying(false);
        
        // Navigate to generating page to wait for new song
        navigateTo('generating');
      } else {
        throw new Error(result.error || 'Regeneration failed');
      }
    } catch (err) {
      console.error('Regenerate error:', err);
      alert('Error al regenerar la canción. Por favor intenta de nuevo.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle coupon validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsValidatingCoupon(true);
    setCouponError('');
    
    try {
      const result = await validateCoupon(couponCode);
      
      if (result.valid) {
        setCouponData(result.coupon);
        setCouponError('');
      } else {
        setCouponData(null);
        setCouponError(result.message || 'Código inválido');
      }
    } catch (err) {
      console.error('Coupon error:', err);
      setCouponData(null);
      setCouponError('Código inválido o expirado');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponCode('');
    setCouponError('');
  };

  // Calculate final price
  const calculateFinalPrice = () => {
    const currentPrice = offerExpired ? BASE_PRICE : SALE_PRICE;
    
    if (!couponData) return currentPrice;
    
    if (couponData.type === 'free' || couponData.discount === 100) {
      return 0;
    }
    
    if (couponData.type === 'percentage') {
      return Math.max(0, currentPrice * (1 - couponData.discount / 100));
    }
    
    if (couponData.type === 'fixed') {
      return Math.max(0, currentPrice - couponData.discount);
    }
    
    return currentPrice;
  };

  const finalPrice = calculateFinalPrice();

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Loading state when coming from email link */}
        {isLoadingSong && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            </div>
            <h2 className="text-2xl font-bold text-[#171612] dark:text-white mb-2">Cargando tu canción...</h2>
            <p className="text-gray-500">Un momento por favor</p>
          </div>
        )}

        {/* Error state */}
        {loadError && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
              <span className="material-symbols-outlined text-4xl text-red-500">error</span>
            </div>
            <h2 className="text-2xl font-bold text-[#171612] dark:text-white mb-2">No se encontró la canción</h2>
            <p className="text-gray-500 mb-6">{loadError}</p>
            <button
              onClick={() => navigateTo('landing')}
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Crear una canción nueva
            </button>
          </div>
        )}

        {/* Main content - only show when not loading and no error */}
        {!isLoadingSong && !loadError && (
          <>
        {/* Success Badge */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-6 py-3 rounded-full font-semibold">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            ¡Tu canción está lista!
          </span>
        </div>

        {/* Countdown Timer */}
        {!offerExpired ? (
          <div className={`mb-6 p-4 rounded-xl text-center ${
            countdown <= 60 
              ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700' 
              : 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className={`material-symbols-outlined text-2xl ${countdown <= 60 ? 'text-red-500 animate-pulse' : 'text-amber-600'}`}>
                timer
              </span>
              <div>
                <p className={`text-sm font-medium ${countdown <= 60 ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  ⚡ Oferta especial expira en:
                </p>
                <p className={`text-3xl font-black tracking-wider ${countdown <= 60 ? 'text-red-600 dark:text-red-400' : 'text-amber-800 dark:text-amber-300'}`}>
                  {formatCountdown(countdown)}
                </p>
              </div>
            </div>
            {countdown <= 60 && (
              <p className="text-red-500 text-sm mt-2 font-medium animate-pulse">
                ¡Últimos segundos! El precio subirá a $29.99
              </p>
            )}
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-xl text-center bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              ⏰ La oferta especial ha expirado
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Precio actual: $29.99
            </p>
          </div>
        )}

        {/* Song Card */}
        <div className="bg-gradient-to-br from-forest/90 to-forest rounded-2xl p-8 mb-8 shadow-2xl">
          {/* Album Art */}
          <div className="w-48 h-48 mx-auto mb-6 rounded-2xl relative overflow-hidden shadow-2xl group">
            {albumArtUrl ? (
              <img src={albumArtUrl} alt="Album Art" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${selectedGenre.color} flex items-center justify-center`}>
                <div className="text-center">
                  <span className="text-6xl block mb-2 drop-shadow-lg">{selectedGenre.emoji}</span>
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider">{selectedGenre.name}</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {/* Vinyl record effect */}
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-black/80 border-4 border-gray-700 opacity-70 group-hover:rotate-45 transition-transform duration-500">
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-600 to-gray-800" />
              <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gold" />
            </div>
          </div>

          {/* Song Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Canción para {formData.recipientName}
            </h2>
            <p className="text-white/60">
              {selectedGenre.name} • {selectedOccasion}
            </p>
            {formData.voiceType && (
              <p className="text-white/40 text-sm mt-1">
                {formData.voiceType === 'female' ? '👩‍🎤 Voz femenina' : formData.voiceType === 'duet' ? '👫 Dueto' : '👨‍🎤 Voz masculina'}
              </p>
            )}
          </div>

          {/* Audio Player - Real Audio */}
          <div className="bg-white/10 border-2 border-gold/40 rounded-xl p-6 mb-6">
            {/* Hidden audio element */}
            {audioUrl && (
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                preload="metadata"
                crossOrigin="anonymous"
              />
            )}
            
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                disabled={!audioUrl}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center text-forest shadow-lg shadow-gold/30 hover:scale-105 transition-transform disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <div className="flex-1">
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold/80 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/50 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(PREVIEW_DURATION)}</span>
                </div>
              </div>
            </div>
            
            {audioError && (
              <p className="text-red-400 text-sm mt-2 text-center">{audioError}</p>
            )}
            
            <div className="text-center mt-4">
              {previewEnded ? (
                <span className="bg-bougainvillea/20 text-bougainvillea text-xs px-4 py-2 rounded-full font-semibold">
                  🔒 Preview terminado - ¡Compra para escuchar completa!
                </span>
              ) : (
                <span className="bg-gold/20 text-gold text-xs px-4 py-2 rounded-full font-semibold">
                  🎧 Preview de 20 segundos
                </span>
              )}
            </div>
          </div>

          {/* Lyrics Preview */}
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <p className="text-white/40 text-xs mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lyrics</span>
              Vista previa de la letra:
            </p>
            <p className="text-white/80 text-sm italic leading-relaxed whitespace-pre-line">
              "{songData?.lyrics || `${formData.recipientName}, esta canción es para ti,
con todo el amor que ${formData.senderName} siente aquí,
en cada nota va mi corazón...`}"
            </p>
          </div>

          {/* Regenerate Button */}
          <div className="mt-4">
            <button
              onClick={handleRegenerate}
              disabled={regeneratesLeft <= 0 || isRegenerating}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                regeneratesLeft > 0 && !isRegenerating
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
              }`}
            >
              {isRegenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando nueva versión...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">refresh</span>
                  {regeneratesLeft > 0 
                    ? `Generar Nueva Versión (${regeneratesLeft} ${regeneratesLeft === 1 ? 'intento' : 'intentos'} restante${regeneratesLeft === 1 ? '' : 's'})`
                    : 'Sin intentos restantes'
                  }
                </>
              )}
            </button>
            <p className="text-white/40 text-xs text-center mt-2">
              Misma letra, nueva melodía e interpretación
            </p>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="bg-white dark:bg-[#2c3136] rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-white/5">
          {/* Price */}
          <div className="text-center mb-6">
            {couponData && finalPrice === 0 ? (
              // Free with coupon
              <>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-gray-400 line-through text-2xl">${offerExpired ? BASE_PRICE : SALE_PRICE}</span>
                  <span className="text-5xl font-black text-green-500">¡GRATIS!</span>
                </div>
                <p className="text-green-500 font-semibold">
                  🎉 Código {couponData.code} aplicado
                </p>
              </>
            ) : couponData ? (
              // Discounted with coupon
              <>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-gray-400 line-through text-2xl">${offerExpired ? BASE_PRICE : SALE_PRICE}</span>
                  <span className="text-5xl font-black text-green-500">${finalPrice.toFixed(2)}</span>
                  <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-bold">
                    {couponData.type === 'percentage' ? `${couponData.discount}% OFF` : `-$${couponData.discount}`}
                  </span>
                </div>
                <p className="text-green-500 font-semibold">
                  ✅ Código {couponData.code} aplicado
                </p>
              </>
            ) : !offerExpired ? (
              // Regular sale price
              <>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-gray-400 line-through text-2xl">${BASE_PRICE}</span>
                  <span className="text-5xl font-black text-[#171612] dark:text-white">${SALE_PRICE}</span>
                  <span className="bg-bougainvillea text-white text-sm px-3 py-1 rounded-full font-bold animate-pulse">
                    33% OFF
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  ⏰ Precio especial por <span className="text-bougainvillea font-bold">{formatCountdown(countdown)}</span>
                </p>
              </>
            ) : (
              // Regular price (offer expired)
              <>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-5xl font-black text-[#171612] dark:text-white">${BASE_PRICE}</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Precio regular
                </p>
              </>
            )}
          </div>

          {/* Coupon Code Input */}
          <div className="mb-6">
            {!couponData ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Código de descuento"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-[#171612] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponCode.trim()}
                  className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isValidatingCoupon ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Aplicar'
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-100 dark:bg-green-900/30 px-4 py-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600">discount</span>
                  <span className="text-green-700 dark:text-green-400 font-semibold">{couponData.code}</span>
                  <span className="text-green-600 dark:text-green-500 text-sm">
                    {couponData.type === 'free' ? '(Gratis)' : 
                     couponData.type === 'percentage' ? `(${couponData.discount}% desc.)` : 
                     `(-$${couponData.discount})`}
                  </span>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-red-500 hover:text-red-600 text-sm font-medium"
                >
                  Quitar
                </button>
              </div>
            )}
            {couponError && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {couponError}
              </p>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-8">
            {[
              { icon: 'music_note', text: 'Canción completa (2-3 minutos)' },
              { icon: 'download', text: 'Descarga en MP3 alta calidad' },
              { icon: 'verified', text: 'Sin marca de agua' },
              { icon: 'all_inclusive', text: 'Uso personal ilimitado' },
              { icon: 'bolt', text: 'Entrega instantánea por email' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="material-symbols-outlined text-primary/60 text-xl">{item.icon}</span>
                <span className="text-[#171612] dark:text-white">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className={`w-full py-5 rounded-xl font-bold text-white text-xl transition-all flex items-center justify-center gap-3 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-70 disabled:cursor-not-allowed ${
              finalPrice === 0
                ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/30'
                : couponData
                  ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/30'
                  : !offerExpired 
                    ? 'bg-gradient-to-r from-bougainvillea to-bougainvillea/80 shadow-bougainvillea/30' 
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 shadow-gray-500/30'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : finalPrice === 0 ? (
              <>
                <span className="material-symbols-outlined">download</span>
                ¡Obtener Gratis!
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">credit_card</span>
                {!offerExpired && !couponData ? '¡Comprar Ahora!' : 'Comprar Canción'}
                <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                  ${finalPrice.toFixed(2)}
                </span>
              </>
            )}
          </button>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-6 mt-6 text-gray-400 text-sm">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">lock</span>
              Pago seguro
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">credit_card</span>
              Stripe
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-lg">verified_user</span>
              Garantía
            </span>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-10 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl">
              👩
            </div>
            <div>
              <p className="text-[#171612] dark:text-white italic mb-2">
                "Mi esposo lloró cuando escuchó la canción. Nunca había visto algo tan especial. ¡Vale cada centavo!"
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                — María G., Guadalajara
              </p>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigateTo('email')}
            className="text-gray-400 hover:text-primary transition-colors text-sm"
          >
            ← Volver a editar detalles
          </button>
        </div>
          </>
        )}
      </main>
    </div>
  );
}
