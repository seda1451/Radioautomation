import React, { useState, useEffect } from 'react';
import {
  Radio,
  Tv,
  Image as ImageIcon,
  Car,
  CloudSun,
  AlertTriangle,
  Gift,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  X,
  Sliders,
  Send,
  Eye,
  Volume2,
  Disc,
  Clock,
  Layers,
} from 'lucide-react';
import { RdsConfig, DabMotSlide, QueueItem } from '../types';

interface RdsDabSlideshowModalProps {
  isOpen: boolean;
  onClose: () => void;
  rdsConfig: RdsConfig;
  onUpdateRdsConfig: (config: RdsConfig) => void;
  slides: DabMotSlide[];
  onUpdateSlides: (slides: DabMotSlide[]) => void;
  currentTrack: QueueItem | null;
  onShowToast: (msg: string) => void;
}

export const RdsDabSlideshowModal: React.FC<RdsDabSlideshowModalProps> = ({
  isOpen,
  onClose,
  rdsConfig,
  onUpdateRdsConfig,
  slides,
  onUpdateSlides,
  currentTrack,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'car-display' | 'rds-encoder' | 'slides-manager'>('car-display');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isGeneratingAiSlides, setIsGeneratingAiSlides] = useState(false);
  const [autoRotateSlides, setAutoRotateSlides] = useState(true);

  // Auto rotate slides in simulated car radio
  useEffect(() => {
    if (!autoRotateSlides || slides.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRotateSlides, slides.length]);

  if (!isOpen) return null;

  const currentSlide = slides[activeSlideIndex] || slides[0];

  const handleToggleTa = () => {
    const newTaState = !rdsConfig.isTaActive;
    onUpdateRdsConfig({
      ...rdsConfig,
      isTaActive: newTaState,
    });
    if (newTaState) {
      onShowToast('🚗 TA (Traffic Announcement) AKTIVOVÁNO! Autorádia přepínají na dopravní vysílání.');
    } else {
      onShowToast('✅ TA dopravní příznak vypnut, autorádia se vrátila k předchozímu zdroji.');
    }
  };

  const handleGenerateAiSlides = async () => {
    setIsGeneratingAiSlides(true);
    try {
      const res = await fetch('/api/gemini/dab-slideshow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTrack,
          weatherCity: 'Praha',
          stationName: 'Cloud Radio',
        }),
      });
      const data = await res.json();

      if (data.slides && data.slides.length > 0) {
        const newSlides: DabMotSlide[] = data.slides.map((s: any, idx: number) => ({
          id: `dab-slide-${Date.now()}-${idx}`,
          type: s.type || 'NOW_PLAYING',
          title: s.title,
          subtitle: s.subtitle,
          imageUrl: '',
          accentColor: s.accentColor || '#6366f1',
          generatedAt: new Date().toLocaleTimeString(),
          isActive: true,
          badge: s.badge || 'DAB+ LIVE',
        }));

        onUpdateSlides(newSlides);
        setActiveSlideIndex(0);
        onShowToast('✨ Vygenerovány 4 nové DAB+ MOT Slideshow obrazovky přes Gemini AI!');
      }
    } catch {
      onShowToast('⚠️ Nepodařilo se vygenerovat nové slidy, ponechána původní sada.');
    } finally {
      setIsGeneratingAiSlides(false);
    }
  };

  return (
    <div id="rds-dab-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div id="rds-dab-modal-container" className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  RDS / DAB+ DLS & MOT Slideshow Generátor
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  DAB+ Layer II • MOT 320x240
                </span>
                {rdsConfig.isTaActive && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 border border-amber-300 animate-pulse flex items-center gap-1">
                    <Car className="w-3.5 h-3.5" /> TA ACTIVE ON-AIR
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Vizuální metadata pro moderní autorádia, dynamický RadioText Plus a dopravní hlášení (TA/TP)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BIG TA BUTTON IN HEADER */}
            <button
              onClick={handleToggleTa}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                rdsConfig.isTaActive
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-2 border-amber-300 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40'
              }`}
              title="Aktivovat Traffic Announcement (přepne autorádia na dopravní zprávy)"
            >
              <Car className="w-4 h-4" />
              <span>{rdsConfig.isTaActive ? '🚗 TA ZAPNUTO (ON-AIR)' : '🚗 TA Doprava'}</span>
            </button>

            <button
              onClick={handleGenerateAiSlides}
              disabled={isGeneratingAiSlides}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAiSlides ? 'animate-spin' : ''}`} />
              {isGeneratingAiSlides ? 'Generuji...' : 'AI Generovat slidy'}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center border-b border-slate-700/60 bg-slate-900/90 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('car-display')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'car-display'
                ? 'border-purple-500 text-purple-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            Simulátor autorádia (DAB+ MOT Screen)
          </button>
          <button
            onClick={() => setActiveTab('rds-encoder')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'rds-encoder'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            RDS Enkodér (PS / RT+ / PTY / TP)
          </button>
          <button
            onClick={() => setActiveTab('slides-manager')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'slides-manager'
                ? 'border-teal-500 text-teal-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Správa MOT slidů ({slides.length})
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: CAR RADIO SIMULATOR */}
          {activeTab === 'car-display' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* VIRTUAL DASHBOARD SCREEN (LEFT) */}
              <div className="lg:col-span-7 flex flex-col items-center">
                
                {/* CAR DASHBOARD BEZEL */}
                <div className="w-full max-w-md bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 rounded-3xl border-4 border-slate-800 shadow-2xl ring-1 ring-slate-700">
                  
                  {/* TOP STATUS BAR */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>DAB+</span>
                      <span className="text-purple-400">12C CRa DAB+</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400">TP</span>
                      {rdsConfig.isTaActive && (
                        <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black rounded text-[10px] animate-pulse">
                          TA
                        </span>
                      )}
                      <span className="font-mono text-slate-300">14:32</span>
                    </div>
                  </div>

                  {/* MAIN COLOR DISPLAY (320x240 DAB+ MOT SCREEN) */}
                  <div
                    className="relative aspect-square w-full rounded-2xl overflow-hidden my-3 border border-slate-800 flex flex-col justify-between p-5 text-white shadow-inner transition-all duration-700"
                    style={{
                      background: `linear-gradient(135deg, ${currentSlide.accentColor}cc 0%, #0f172a 100%)`,
                    }}
                  >
                    {/* TOP BADGE */}
                    <div className="flex items-center justify-between z-10">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider bg-black/60 backdrop-blur-md border border-white/20 uppercase">
                        {currentSlide.badge}
                      </span>
                      <span className="font-extrabold text-xs tracking-widest text-white/90 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        CLOUD RADIO
                      </span>
                    </div>

                    {/* CENTER GRAPHIC / ICON */}
                    <div className="flex flex-col items-center justify-center text-center my-auto z-10 py-4">
                      {currentSlide.type === 'NOW_PLAYING' && (
                        <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center shadow-lg mb-2">
                          <Disc className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '8s' }} />
                        </div>
                      )}
                      {currentSlide.type === 'WEATHER' && (
                        <div className="w-20 h-20 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shadow-lg mb-2">
                          <CloudSun className="w-10 h-10 text-sky-300" />
                        </div>
                      )}
                      {currentSlide.type === 'TRAFFIC' && (
                        <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shadow-lg mb-2">
                          <Car className="w-10 h-10 text-amber-300 animate-bounce" />
                        </div>
                      )}
                      {currentSlide.type === 'PROMO_CONTEST' && (
                        <div className="w-20 h-20 rounded-2xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center shadow-lg mb-2">
                          <Gift className="w-10 h-10 text-pink-300" />
                        </div>
                      )}

                      <h3 className="text-lg font-black tracking-tight text-white drop-shadow-md px-2">
                        {currentSlide.title}
                      </h3>
                      <p className="text-xs font-semibold text-white/80 drop-shadow mt-0.5">
                        {currentSlide.subtitle}
                      </p>
                    </div>

                    {/* BOTTOM DLS TICKER */}
                    <div className="bg-black/70 backdrop-blur-md rounded-xl p-2.5 border border-white/10 z-10">
                      <div className="text-[10px] font-mono text-purple-300 uppercase font-bold mb-0.5">
                        DLS Text (128 char):
                      </div>
                      <div className="text-xs font-medium text-white truncate font-mono">
                        {rdsConfig.dabDlsText || `${currentTrack ? `${currentTrack.artist} - ${currentTrack.title}` : 'Cloud Radio Czech'}`}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM HARDWARE KNOBS / BUTTONS OF CAR */}
                  <div className="flex items-center justify-between px-3 pt-2 text-slate-500">
                    <span className="text-[10px] font-bold">PRESET 1</span>
                    <div className="flex gap-1.5">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSlideIndex(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            activeSlideIndex === idx ? 'bg-purple-400 w-6' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold">INFO / MOT</span>
                  </div>

                </div>

              </div>

              {/* SLIDES PREVIEW & CONTROLS (RIGHT) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-white">Vysílané MOT Slideshow obrazy</h4>
                    <button
                      onClick={() => setAutoRotateSlides(!autoRotateSlides)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                        autoRotateSlides ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {autoRotateSlides ? '🔄 Auto-rotace zapnuta (6s)' : '⏸️ Zastaveno'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Kliknutím na snímek okamžitě vynuťte jeho odeslání do multiplexu:
                  </p>
                </div>

                <div className="space-y-2">
                  {slides.map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        activeSlideIndex === idx
                          ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-md'
                          : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-sm"
                          style={{ backgroundColor: s.accentColor }}
                        >
                          {s.type === 'NOW_PLAYING' && <Disc className="w-5 h-5" />}
                          {s.type === 'WEATHER' && <CloudSun className="w-5 h-5" />}
                          {s.type === 'TRAFFIC' && <Car className="w-5 h-5" />}
                          {s.type === 'PROMO_CONTEST' && <Gift className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white">{s.title}</div>
                          <div className="text-[11px] text-slate-400">{s.subtitle}</div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-slate-700">
                        {s.badge}
                      </span>
                    </div>
                  ))}
                </div>

                {/* TA FAST TRIGGER PANEL */}
                <div className="p-4 bg-amber-950/30 border border-amber-600/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-sm text-white">Dopravní vysílání (TA Flag)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Aktivuje RDS TA bit v FM a DAB+ streamu. Posluchačům v autech automaticky přeruší CD/Bluetooth a naladí dopravní zprávy.
                  </p>
                  <button
                    onClick={handleToggleTa}
                    className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      rdsConfig.isTaActive
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/40 animate-pulse'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    {rdsConfig.isTaActive ? 'VYPNOUT TA PŘÍZNAK' : 'ZAPNOUT TA DOPRAVNÍ HLÁŠENÍ'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: RDS ENCODER SETTINGS */}
          {activeTab === 'rds-encoder' && (
            <div className="max-w-3xl mx-auto space-y-5 bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
              <div>
                <h4 className="text-base font-bold text-white">Parametry FM RDS Enkodéru (UECP Protocol)</h4>
                <p className="text-xs text-slate-400">Konfigurace dynamických polí pro FM vysílač a RDS kodér</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">PI Code (Hex):</label>
                  <input
                    type="text"
                    value={rdsConfig.piCode}
                    onChange={(e) => onUpdateRdsConfig({ ...rdsConfig, piCode: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-purple-400 uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">PS Name (8 znaků):</label>
                  <input
                    type="text"
                    maxLength={8}
                    value={rdsConfig.psName}
                    onChange={(e) => onUpdateRdsConfig({ ...rdsConfig, psName: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">PTY (Žánr):</label>
                  <input
                    type="text"
                    value={rdsConfig.pty}
                    onChange={(e) => onUpdateRdsConfig({ ...rdsConfig, pty: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">TP Flag:</label>
                  <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> TP Aktivní (1)
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  RadioText (RT - 64 znaků pro běžná rádia):
                </label>
                <input
                  type="text"
                  maxLength={64}
                  value={rdsConfig.rtText}
                  onChange={(e) => onUpdateRdsConfig({ ...rdsConfig, rtText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-amber-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telefon do studia (RT+):</label>
                  <input
                    type="text"
                    value={rdsConfig.studioPhone}
                    onChange={(e) => onUpdateRdsConfig({ ...rdsConfig, studioPhone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / SMS brána:</label>
                  <input
                    type="text"
                    value={rdsConfig.studioSms}
                    onChange={(e) => onUpdateRdsConfig({ ...rdsConfig, studioSms: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  DAB+ Dynamic Label Segment (DLS - 128 znaků pro digitální přijímače):
                </label>
                <textarea
                  rows={2}
                  maxLength={128}
                  value={rdsConfig.dabDlsText}
                  onChange={(e) => onUpdateRdsConfig({ ...rdsConfig, dabDlsText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-purple-300"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SLIDES MANAGER */}
          {activeTab === 'slides-manager' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Editor DAB+ MOT Snímků</h4>
                  <p className="text-xs text-slate-400">Přizpůsobte texty a grafiku pro slideshow multiplexu</p>
                </div>
                <button
                  onClick={handleGenerateAiSlides}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Obnovit přes AI
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slides.map((slide, idx) => (
                  <div key={slide.id} className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-purple-400 uppercase">Slide #{idx + 1} ({slide.type})</span>
                      <span className="text-[10px] text-slate-400">Gen: {slide.generatedAt}</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Hlavní titulek:</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => {
                          const updated = slides.map((s) => (s.id === slide.id ? { ...s, title: e.target.value } : s));
                          onUpdateSlides(updated);
                        }}
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">Podtitul / Detail:</label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => {
                          const updated = slides.map((s) => (s.id === slide.id ? { ...s, subtitle: e.target.value } : s));
                          onUpdateSlides(updated);
                        }}
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <span>RDS UECP & DAB+ MOT Enkodér aktivní • Všechny změny se okamžitě promítají do vysílacího streamu.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-colors"
          >
            Zavřít RDS panel
          </button>
        </div>

      </div>
    </div>
  );
};
