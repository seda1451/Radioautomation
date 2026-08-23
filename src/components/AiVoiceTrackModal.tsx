import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, Volume2, X, Check, RefreshCw, Play, Square, Radio, CloudSun, Zap, RadioTower } from 'lucide-react';
import { QueueItem } from '../types';
import { audioEngine } from '../services/audioEngine';

interface AiVoiceTrackModalProps {
  isOpen: boolean;
  currentTrack: QueueItem | null;
  nextTrack: QueueItem | null;
  onClose: () => void;
  onInsertVoiceTrack: (vt: {
    title: string;
    artist: string;
    dur: string;
    durSeconds: number;
    audioUrl: string;
  }) => void;
  onShowToast: (msg: string) => void;
}

export const AiVoiceTrackModal: React.FC<AiVoiceTrackModalProps> = ({
  isOpen,
  currentTrack,
  nextTrack,
  onClose,
  onInsertVoiceTrack,
  onShowToast,
}) => {
  const [activeType, setActiveType] = useState<'backsell' | 'weather_traffic' | 'promo' | 'hour_opener'>('backsell');
  const [language, setLanguage] = useState<'cs' | 'en'>('cs');
  const [presenterName, setPresenterName] = useState('Alex');
  const [stationName, setStationName] = useState('Cloud Radio 98.5 FM');
  const [tone, setTone] = useState('upbeat morning energy');
  const [customTopic, setCustomTopic] = useState('');
  const [targetSeconds, setTargetSeconds] = useState(15);

  const [generatedScript, setGeneratedScript] = useState('');
  const [speakerNotes, setSpeakerNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Text to speech & On-Air state
  const [isOnAirSpeaking, setIsOnAirSpeaking] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [ttsRate, setTtsRate] = useState<number>(1.05);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  const [duckDepthPct, setDuckDepthPct] = useState<number>(18); // 18% volume for music

  // Animated speech level
  const [speechLevel, setSpeechLevel] = useState<number>(0);
  const speechAnimRef = useRef<number | null>(null);

  // Load available speech synthesis voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        const preferredIndex = voices.findIndex(v =>
          language === 'cs' ? v.lang.startsWith('cs') : v.lang.startsWith('en')
        );
        if (preferredIndex !== -1) setSelectedVoiceIndex(preferredIndex);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [language]);

  // Speech animation loop during on-air or preview
  useEffect(() => {
    if (isOnAirSpeaking || isPlayingTts) {
      const interval = window.setInterval(() => {
        setSpeechLevel(Math.floor(45 + Math.random() * 50));
      }, 80);
      return () => clearInterval(interval);
    } else {
      setSpeechLevel(0);
    }
  }, [isOnAirSpeaking, isPlayingTts]);

  // Generate script on initial open if empty
  useEffect(() => {
    if (isOpen && !generatedScript) {
      handleGenerateScript();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateScript = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/voice-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeType,
          previousTrack: currentTrack,
          nextTrack: nextTrack,
          stationName,
          presenterName,
          language,
          tone,
          customTopic,
          targetSeconds,
        }),
      });

      const data = await res.json();
      if (data.script) {
        setGeneratedScript(data.script);
        setSpeakerNotes(data.speakerNotes || 'Energetic radio presenter delivery');
        onShowToast('AI Voice Track script generated with Gemini 3.7');
      } else {
        throw new Error('No script returned');
      }
    } catch (err) {
      console.error(err);
      const fallback = language === 'cs'
        ? `Tady je ${presenterName} na ${stationName}! Právě jsme dohráli skvělý track od ${currentTrack?.artist || 'našeho interpreta'} a hned teď vám nasadíme ${nextTrack?.title || 'další energickou pecku'}. Příjemný poslech!`
        : `This is ${presenterName} on ${stationName}! That was ${currentTrack?.title || 'a great song'} by ${currentTrack?.artist || 'our top artist'}, and coming up right now is ${nextTrack?.title || 'the next big track'}. Enjoy the music!`;
      setGeneratedScript(fallback);
      setSpeakerNotes('Upbeat presentation');
      onShowToast('Loaded radio voice track template');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Audition preview (client preview without touching on-air ducking)
  const handleToggleTtsPreview = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onShowToast('Speech Synthesis not supported by this browser');
      return;
    }

    if (isPlayingTts) {
      window.speechSynthesis.cancel();
      setIsPlayingTts(false);
      onShowToast('Audio preview stopped');
    } else {
      if (!generatedScript.trim()) {
        onShowToast('No script text to speak');
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(generatedScript);
      if (availableVoices[selectedVoiceIndex]) {
        utterance.voice = availableVoices[selectedVoiceIndex];
      }
      utterance.rate = ttsRate;
      utterance.pitch = ttsPitch;

      utterance.onstart = () => setIsPlayingTts(true);
      utterance.onend = () => setIsPlayingTts(false);
      utterance.onerror = () => setIsPlayingTts(false);

      window.speechSynthesis.speak(utterance);
      onShowToast('Auditioning AI Host Voice (Offline preview)');
    }
  };

  // 2. LIVE ON-AIR TTS with Real-Time Dynamic Ducking
  const handleTriggerOnAirLiveTts = () => {
    if (isOnAirSpeaking) {
      audioEngine.stopTtsOnAir();
      setIsOnAirSpeaking(false);
      onShowToast('AI On-Air Speech Stopped • Music Volume Restored');
    } else {
      if (!generatedScript.trim()) {
        onShowToast('No script text to broadcast');
        return;
      }
      setIsOnAirSpeaking(true);
      const selectedVoice = availableVoices[selectedVoiceIndex]?.name;
      audioEngine.playTtsOnAir(
        generatedScript,
        {
          rate: ttsRate,
          pitch: ttsPitch,
          lang: language === 'cs' ? 'cs-CZ' : 'en-US',
          voiceName: selectedVoice,
          duckDepth: duckDepthPct / 100,
        },
        () => {
          setIsOnAirSpeaking(true);
          onShowToast(`🎙️ AI ON-AIR LIVE: Auto-Ducking Music down to ${duckDepthPct}%`);
        },
        () => {
          setIsOnAirSpeaking(false);
          onShowToast('AI On-Air Link Completed • Playout Ducking Released to 100%');
        }
      );
    }
  };

  const handleInsertIntoQueue = () => {
    if (isPlayingTts || isOnAirSpeaking) {
      audioEngine.stopTtsOnAir();
      setIsPlayingTts(false);
      setIsOnAirSpeaking(false);
    }

    const calculatedWords = generatedScript.split(/\s+/).length;
    const durSec = Math.max(5, Math.round(calculatedWords / 2.8));
    const mins = Math.floor(durSec / 60);
    const secs = durSec % 60;
    const durStr = `${mins}:${String(secs).padStart(2, '0')}`;

    const titlePrefix = activeType === 'weather_traffic'
      ? 'WEATHER & TRAFFIC'
      : activeType === 'promo'
      ? 'STATION PROMO'
      : `VT: ${presenterName} Link`;

    onInsertVoiceTrack({
      title: `${titlePrefix} (${durStr})`,
      artist: `AI Host ${presenterName}`,
      dur: durStr,
      durSeconds: durSec,
      audioUrl: '',
    });

    onClose();
    onShowToast(`Inserted AI Voice Track into Playout Log (${durStr})`);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#14161f] border border-[#2c303e] rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/25 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">AI Voice Tracker & Real-Time On-Air Synthesizer</h3>
                <span className="bg-purple-900/60 text-purple-300 border border-purple-600/40 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  TTS + AUTO-DUCK
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Generate high-energy radio links via Gemini 3.7 and trigger live synthetic speech with auto-music ducking
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isPlayingTts || isOnAirSpeaking) audioEngine.stopTtsOnAir();
              onClose();
            }}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live On-Air Ducking Banner when Speaking */}
        {isOnAirSpeaking && (
          <div className="bg-red-950/70 border border-red-500/60 rounded-xl p-3 flex items-center justify-between animate-pulse shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <div>
                <div className="text-xs font-bold text-red-300 flex items-center space-x-1.5">
                  <RadioTower className="w-4 h-4 text-red-400" />
                  <span>AI MODERÁTOR VYYSÍLÁ ŽIVĚ DO ÉTERU (ON-AIR LIVE)</span>
                </div>
                <div className="text-[11px] text-red-200/80">
                  Dynamický Ducking aktivní: Hudební podkres automaticky ztlumen na {duckDepthPct}%
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-red-950 rounded-full h-2.5 overflow-hidden border border-red-800">
                <div className="bg-red-500 h-full transition-all duration-75" style={{ width: `${speechLevel}%` }} />
              </div>
              <button
                type="button"
                onClick={handleTriggerOnAirLiveTts}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
              >
                STOP ON-AIR
              </button>
            </div>
          </div>
        )}

        {/* Format Selector Pills */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {[
            { id: 'backsell', label: 'Song Backsell & Tease', icon: Radio },
            { id: 'weather_traffic', label: 'Weather & Traffic', icon: CloudSun },
            { id: 'promo', label: 'Station Promo', icon: Sparkles },
            { id: 'hour_opener', label: 'Top of Hour Opener', icon: Mic },
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveType(item.id as typeof activeType)}
                className={`py-2 px-2.5 rounded-xl border text-center font-bold flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                  isSel
                    ? 'bg-purple-950/70 border-purple-500 text-white shadow-md'
                    : 'bg-[#101217] border-[#2c303e] text-slate-400 hover:text-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSel ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="text-[11px]">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'cs' | 'en')}
              className="w-full bg-[#101217] border border-[#2c303e] rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-purple-500"
            >
              <option value="cs">Čeština (Czech)</option>
              <option value="en">English (US/UK)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Presenter Name</label>
            <input
              type="text"
              value={presenterName}
              onChange={(e) => setPresenterName(e.target.value)}
              className="w-full bg-[#101217] border border-[#2c303e] rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Tone & Energy</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-[#101217] border border-[#2c303e] rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-purple-500"
            >
              <option value="upbeat morning energy">Morning Drive (High Energy)</option>
              <option value="smooth late night chill">Late Night (Smooth & Warm)</option>
              <option value="punchy top 40 hit radio">Top 40 (Fast & Punchy)</option>
              <option value="friendly daytime companion">Afternoon Drive (Friendly)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Target Duration</label>
            <select
              value={targetSeconds}
              onChange={(e) => setTargetSeconds(parseInt(e.target.value, 10))}
              className="w-full bg-[#101217] border border-[#2c303e] rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-purple-500"
            >
              <option value={10}>10s (Quick Intro Link)</option>
              <option value={15}>15s (Standard Bridge)</option>
              <option value={25}>25s (Weather & Topic)</option>
              <option value={35}>35s (Story & Competition)</option>
            </select>
          </div>
        </div>

        {/* Custom Topic Prompt input */}
        <div className="text-xs">
          <label className="block text-slate-400 font-semibold mb-1">
            Custom Topic / Local Cue (Optional)
          </label>
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder={
              language === 'cs'
                ? 'např. Dnes odpoledne slunečno 24 °C, D1 u Brna bez kolon, soutěž o lístky na koncert'
                : 'e.g. Sunny afternoon 75F, highway traffic moving smoothly, tickets giveaway on line 4'
            }
            className="w-full bg-[#101217] border border-[#2c303e] rounded-lg px-3 py-1.5 text-gray-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Teleprompter / Script Area */}
        <div className="bg-[#101217] border border-[#2c303e] rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 flex items-center space-x-1.5">
              <Mic className="w-3.5 h-3.5" />
              <span>Broadcast Teleprompter Script</span>
            </span>
            <button
              type="button"
              onClick={handleGenerateScript}
              disabled={isLoading}
              className="text-[11px] text-purple-300 hover:text-white flex items-center space-x-1 cursor-pointer bg-purple-950/40 border border-purple-800/40 px-2.5 py-1 rounded-lg"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Generating with Gemini...' : 'Re-generate with Gemini'}</span>
            </button>
          </div>

          <textarea
            rows={4}
            value={generatedScript}
            onChange={(e) => setGeneratedScript(e.target.value)}
            placeholder="AI generated script will appear here..."
            className="w-full bg-[#161820] border border-[#2c303e] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 font-sans leading-relaxed"
          />

          {speakerNotes && (
            <div className="text-[10px] text-slate-400 italic">
              Delivery Notes: {speakerNotes}
            </div>
          )}
        </div>

        {/* Speech Synthesis Voice Controls & Dynamic Ducking Settings */}
        <div className="bg-[#101217] border border-[#2c303e] rounded-xl p-3 grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Synthesizer Voice</label>
            <select
              value={selectedVoiceIndex}
              onChange={(e) => setSelectedVoiceIndex(parseInt(e.target.value, 10))}
              className="w-full bg-[#161820] border border-[#2c303e] rounded-lg px-2 py-1.5 text-gray-200 text-[11px]"
            >
              {availableVoices.map((v, i) => (
                <option key={i} value={i}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 text-[11px] mb-1">
              <span>Auto-Ducking Music Volume:</span>
              <span className="font-mono text-purple-400 font-bold">{duckDepthPct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={duckDepthPct}
              onChange={(e) => setDuckDepthPct(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleToggleTtsPreview}
              className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow transition border border-[#2c303e] ${
                isPlayingTts
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#202330] hover:bg-[#2c3040] text-gray-200'
              }`}
            >
              {isPlayingTts ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
              <span>{isPlayingTts ? 'Stop Preview' : 'Audition'}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerOnAirLiveTts}
              className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow transition ${
                isOnAirSpeaking
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-red-700/80 hover:bg-red-600 text-white border border-red-500/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isOnAirSpeaking ? 'Stop On-Air' : '🎙️ On-Air TTS'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-[#2c303e]">
          <div className="text-[11px] text-slate-400">
            Auto-ducks music track smoothly and restores volume when speech completes.
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                if (isPlayingTts || isOnAirSpeaking) audioEngine.stopTtsOnAir();
                onClose();
              }}
              className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleInsertIntoQueue}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Insert Voice Track into Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

