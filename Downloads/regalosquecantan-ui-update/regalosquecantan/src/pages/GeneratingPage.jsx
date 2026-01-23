import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppContext } from '../App';
import { generateSong, checkSongStatus } from '../services/api';

const funFacts = [
  "🎸 Los corridos tumbados nacieron en 2020 y revolucionaron la música regional mexicana",
  "🎺 La banda sinaloense usa más de 15 instrumentos diferentes",
  "💃 La cumbia tiene más de 100 variantes en Latinoamérica",
  "🎤 El mariachi fue declarado Patrimonio de la Humanidad por la UNESCO",
  "🌮 La música norteña nació en la frontera Texas-México en los 1800s",
  "🎵 Un corrido tradicional cuenta una historia completa en solo 3 minutos",
  "🪗 El acordeón llegó a México con inmigrantes alemanes en el siglo XIX",
  "❤️ Las rancheras expresan los sentimientos más profundos del alma mexicana",
  "🎹 La salsa nació en Nueva York pero tiene raíces cubanas y puertorriqueñas",
  "🌹 La bachata era considerada música de cantina hasta los años 90"
];

export default function GeneratingPage() {
  const { navigateTo, formData, setSongData } = useContext(AppContext);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [error, setError] = useState(null);
  const [songId, setSongId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const hasStarted = useRef(false);
  const pollIntervalRef = useRef(null);

  const steps = [
    { icon: 'edit_note', label: 'Escribiendo la letra...' },
    { icon: 'music_note', label: 'Componiendo la melodía...' },
    { icon: 'graphic_eq', label: 'Produciendo la canción...' },
    { icon: 'check_circle', label: '¡Casi listo!' }
  ];

  // Rotate fun facts
  useEffect(() => {
    const factTimer = setInterval(() => {
      setFactIndex(prev => (prev + 1) % funFacts.length);
    }, 5000);
    return () => clearInterval(factTimer);
  }, []);

  // Progress animation
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 2;
      });
    }, 1000);
    return () => clearInterval(progressTimer);
  }, []);

  // Update step based on progress
  useEffect(() => {
    if (progress < 25) setCurrentStep(0);
    else if (progress < 50) setCurrentStep(1);
    else if (progress < 75) setCurrentStep(2);
    else setCurrentStep(3);
  }, [progress]);

  // Start generation
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function startGeneration() {
      try {
        console.log('Starting song generation...');
        const result = await generateSong(formData);
        
        console.log('Generate result:', result);
        
        const id = result?.song?.id;
        
        if (result.success && id) {
          console.log('Song creation started, ID:', id);
          setSongId(id);
          setIsPolling(true);
        } else {
          console.error('No song ID in response:', result);
          throw new Error(result.error || 'No song ID returned');
        }
      } catch (err) {
        console.error('Generation error:', err);
        setError(err.message);
      }
    }

    startGeneration();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [formData]);

  // Poll for status
  useEffect(() => {
    if (!isPolling || !songId) return;

    async function pollStatus() {
      try {
        console.log('Polling status for:', songId);
        const result = await checkSongStatus(songId);
        
        console.log('Status result:', result);
        
        if (result.success && result.song) {
          console.log('Song status:', result.song.status);
          
          if (result.song.status === 'completed') {
            setProgress(100);
            clearInterval(pollIntervalRef.current);
            
            setSongData({
              id: result.song.id,
              previewUrl: result.song.previewUrl,
              audioUrl: result.song.audioUrl,
              title: `Canción para ${result.song.recipientName}`,
              genre: result.song.genre,
              occasion: result.song.occasion,
              lyrics: result.song.lyrics
            });
            
            setTimeout(() => navigateTo('preview'), 1000);
          } else if (result.song.status === 'failed') {
            throw new Error('La generación de la canción falló');
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }

    pollIntervalRef.current = setInterval(pollStatus, 3000);
    pollStatus();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isPolling, songId, navigateTo, setSongData]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#1A4338] flex flex-col">
        {/* Background */}
        <div className="fixed inset-0 w-full h-full pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A4338] to-[#0F1211]" />
        </div>

        <main className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#E11D74]/20 border border-[#E11D74]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[#E11D74]">error</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-4">
              Oops, algo salió mal
            </h2>
            <p className="text-white/60 mb-6">{error}</p>
            <button
              onClick={() => navigateTo('details')}
              className="px-8 py-4 bg-[#E11D74] text-white rounded-full font-bold hover:scale-105 transition-all"
            >
              Intentar de nuevo
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A4338] flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 w-full h-full pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A4338] to-[#0F1211]" />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L100 50 L50 100 L0 50 Z' fill='%23fff' fill-opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-center px-6 py-6">
        <h2 className="font-display text-white text-xl font-medium tracking-tight">
          RegalosQueCantan
        </h2>
      </header>
      
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center">
          {/* Animated Icon */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#E11D74] to-[#D4AF37] opacity-20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-[#E11D74] to-[#D4AF37] opacity-40 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-[#1A4338] flex items-center justify-center shadow-xl border border-[#D4AF37]/20">
              <span className="material-symbols-outlined text-5xl text-[#D4AF37] animate-bounce">
                {steps[currentStep].icon}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
            Creando tu canción...
          </h1>
          <p className="text-white/50 mb-8">
            Para: <span className="font-semibold text-[#D4AF37]">{formData.recipientName}</span>
          </p>

          {/* Progress Bar */}
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-4">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#E11D74] to-[#D4AF37] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Progress Text */}
          <p className="text-sm text-white/60 mb-8">
            {steps[currentStep].label}
          </p>

          {/* Steps */}
          <div className="flex justify-center gap-3 mb-10">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  idx <= currentStep
                    ? 'bg-[#D4AF37] text-[#1A4338] scale-110'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{step.icon}</span>
              </div>
            ))}
          </div>

          {/* Fun Fact */}
          <div className="bg-white/5 backdrop-blur-sm border border-[#D4AF37]/20 rounded-2xl p-6">
            <p className="text-sm text-white/40 mb-2">¿Sabías que?</p>
            <p className="text-white/80 font-medium transition-opacity duration-500">
              {funFacts[factIndex]}
            </p>
          </div>

          {/* Time Estimate */}
          <p className="text-xs text-white/30 mt-6">
            ⏱️ Tiempo estimado: 1-3 minutos
          </p>
        </div>
      </main>

      {/* Decorative Corners */}
      <div className="absolute top-32 left-8 w-24 h-24 border-l border-t border-[#D4AF37]/10 hidden md:block pointer-events-none" />
      <div className="absolute bottom-32 right-8 w-24 h-24 border-r border-b border-[#D4AF37]/10 hidden md:block pointer-events-none" />
    </div>
  );
}
