import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Settings,
  Radio,
  Clock,
  Sparkles,
  DollarSign,
  Cpu,
  Users,
  ExternalLink,
  Mic,
  ShieldCheck,
  Share2,
  Headphones,
  Zap,
  PhoneCall,
  Activity,
  RadioTower,
  ShieldAlert,
  Sliders,
  Calendar,
  AlertOctagon,
  Phone,
  Car,
  Tv,
} from 'lucide-react';
import { BroadcastSettings, ProfanityDelayState, IcecastEncoderState } from '../types';

interface HeaderProps {
  settings: BroadcastSettings;
  audioActive: boolean;
  onToggleAudio: () => void;
  onOpenSettings: () => void;
  onOpenProgram: () => void;
  onOpenAiVoiceTrack: () => void;
  onOpenTraffic: () => void;
  onOpenDsp: () => void;
  onOpenListeners: () => void;
  onOpenWebPlayer: () => void;
  // Extended Broadcast Modules
  onOpenMorningDuo: () => void;
  onOpenSilenceDetector: () => void;
  onOpenMultitrack: () => void;
  onOpenVisualRadio: () => void;
  onOpenPodcastLogger: () => void;
  onOpenSoundboard: () => void;
  onOpenProfanityDelay: () => void;
  onOpenEncoder: () => void;
  onOpenSegueEditor: () => void;
  onOpenScheduler: () => void;
  onOpenEas: () => void;
  onOpenPhoneIn: () => void;
  onOpenMidi: () => void;
  onOpenRdsDab: () => void;
  isMicActive: boolean;
  onToggleMic: () => void;
  profanityState?: ProfanityDelayState;
  encoderState?: IcecastEncoderState;
  isEasAlertActive?: boolean;
  activePhoneLinesCount?: number;
  isTaActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  audioActive,
  onToggleAudio,
  onOpenSettings,
  onOpenProgram,
  onOpenAiVoiceTrack,
  onOpenTraffic,
  onOpenDsp,
  onOpenListeners,
  onOpenWebPlayer,
  onOpenMorningDuo,
  onOpenSilenceDetector,
  onOpenMultitrack,
  onOpenVisualRadio,
  onOpenPodcastLogger,
  onOpenSoundboard,
  onOpenProfanityDelay,
  onOpenEncoder,
  onOpenSegueEditor,
  onOpenScheduler,
  onOpenEas,
  onOpenPhoneIn,
  onOpenMidi,
  onOpenRdsDab,
  isMicActive,
  onToggleMic,
  profanityState,
  encoderState,
  isEasAlertActive,
  activePhoneLinesCount = 0,
  isTaActive = false,
}) => {

  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      setTimeString(`${hours}:${minutes}:${seconds} ${ampm}`);

      const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
      setDateString(now.toLocaleDateString('en-US', options).toUpperCase());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#161820] border-b border-[#262a37] h-12 flex items-center justify-between px-3 shrink-0 z-20 select-none">
      {/* Left branding */}
      <div className="flex items-center space-x-2.5">
        <div className="flex items-center space-x-1.5 bg-[#0f1118] px-2 py-0.5 rounded-lg border border-[#242838] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="font-bold tracking-wider text-[10px] uppercase text-white">TMG-NET</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Radio className="w-4 h-4 text-blue-400" />
          <h1 className="font-extrabold text-xs md:text-sm tracking-wider bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
            {settings.stationName || 'Cloud Radio'}
          </h1>
        </div>
      </div>

      {/* Center Broadcast Digital Clock & Modules Navigation */}
      <div className="flex items-center space-x-2">
        <div className="bg-[#0f1118] px-2.5 py-0.5 rounded-lg border border-[#242838] flex items-center space-x-2 shadow-inner">
          <div className="font-mono text-xs md:text-sm font-bold tracking-widest text-white">
            {timeString || '12:00:00 PM'}
          </div>
          <div className="text-[9px] text-slate-400 uppercase font-semibold border-l border-[#242838] pl-1.5 hidden sm:block">
            {dateString || 'MON, AUG 17'}
          </div>
        </div>

        {/* Core Broadcast Feature Toolbars */}
        <div className="hidden lg:flex items-center space-x-1">
          {/* 1. AI Voice Track (TTS Live) */}
          <button
            onClick={onOpenAiVoiceTrack}
            className="flex items-center space-x-1 text-[11px] text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 px-2 py-0.5 rounded-lg transition cursor-pointer font-bold"
            title="AI Voice Tracker with Real-Time Web Speech Synthesizer and Dynamic Ducking"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>AI Voice (TTS)</span>
          </button>

          {/* 2. Waveform & Segue Editor */}
          <button
            onClick={onOpenSegueEditor}
            className="flex items-center space-x-1 text-[11px] text-sky-300 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/50 px-2 py-0.5 rounded-lg transition cursor-pointer font-bold"
            title="Waveform Segue Editor with Camelot Wheel Harmonic Mixing & Cue Dragging"
          >
            <Activity className="w-3 h-3 text-sky-400" />
            <span>Waveform & Segue</span>
          </button>

          {/* 3. 7s Profanity Delay (DUMP) */}
          <button
            onClick={onOpenProfanityDelay}
            className="flex items-center space-x-1 text-[11px] text-red-300 bg-red-950/50 hover:bg-red-900/70 border border-red-700/60 px-2 py-0.5 rounded-lg transition cursor-pointer font-bold"
            title="7-Second Broadcast Profanity Delay Buffer & Emergency DUMP Button"
          >
            <AlertOctagon className="w-3 h-3 text-red-400" />
            <span>7s DUMP Delay</span>
          </button>

          {/* 4. Streaming Encoder (Icecast / WebRTC) */}
          <button
            onClick={onOpenEncoder}
            className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-lg transition cursor-pointer font-bold border ${
              encoderState?.isStreaming
                ? 'text-emerald-300 bg-emerald-950/70 border-emerald-500 animate-pulse'
                : 'text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-800/50'
            }`}
            title="Icecast / WebRTC Streaming Master Encoder & Dynamic ICY Pusher"
          >
            <RadioTower className="w-3 h-3 text-emerald-400" />
            <span>{encoderState?.isStreaming ? 'STREAM LIVE' : 'Icecast Encoder'}</span>
          </button>

          {/* 5. Podcast & Logger */}
          <button
            onClick={onOpenPodcastLogger}
            className="flex items-center space-x-1 text-[11px] text-teal-300 bg-teal-950/40 hover:bg-teal-900/60 border border-teal-800/50 px-2 py-0.5 rounded-lg transition cursor-pointer font-bold"
            title="24/7 Compliance Logger, AI Podcast Splicer & RSS Feed"
          >
            <Headphones className="w-3 h-3 text-teal-400" />
            <span>Podcast / Logger</span>
          </button>

          {/* 6. Smart Clock Scheduler */}
          <button
            onClick={onOpenScheduler}
            className="flex items-center space-x-1 text-[11px] text-blue-300 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 px-2 py-0.5 rounded-lg transition cursor-pointer font-bold"
            title="Smart Clock Wheel Rules, Energy Curves & 24h Generator"
          >
            <Calendar className="w-3 h-3 text-blue-400" />
            <span>Smart Clocks</span>
          </button>

          {/* Co-Host Morning Duo */}
          <button
            onClick={onOpenMorningDuo}
            className="flex items-center space-x-1 text-[11px] text-pink-300 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-800/50 px-2 py-0.5 rounded-lg transition cursor-pointer font-bold"
            title="AI Co-Host Morning Show Duo & Caller Simulator"
          >
            <PhoneCall className="w-3 h-3 text-pink-400" />
            <span>Co-Host</span>
          </button>

          {/* Silence Detector */}
          <button
            onClick={onOpenSilenceDetector}
            className="flex items-center space-x-1 text-[11px] text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 px-2 py-0.5 rounded-lg transition cursor-pointer font-bold"
            title="Silence Detector & Auto-Failover Monitor"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Silence</span>
          </button>

          {/* DSP Rack */}
          <button
            onClick={onOpenDsp}
            className="flex items-center space-x-1 text-[11px] text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 px-2 py-0.5 rounded-lg transition cursor-pointer font-bold"
            title="Broadcast DSP Audio Processor Rack (5-Band EQ & AGC)"
          >
            <Cpu className="w-3 h-3 text-amber-400" />
            <span>DSP</span>
          </button>

          {/* 7. Emergency Alert System (EAS / CAP) */}
          <button
            id="btn-header-open-eas"
            onClick={onOpenEas}
            className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-lg transition cursor-pointer font-bold border ${
              isEasAlertActive
                ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/50 animate-bounce'
                : 'text-rose-300 bg-rose-950/50 hover:bg-rose-900/70 border-rose-700/60'
            }`}
            title="Emergency Alert System (EAS / CAP): ČHMÚ & IZS Krizové vysílání"
          >
            <AlertOctagon className={`w-3 h-3 ${isEasAlertActive ? 'text-white fill-white' : 'text-rose-400'}`} />
            <span>{isEasAlertActive ? '🚨 EAS ACTIVE' : '🚨 EAS / ČHMÚ'}</span>
          </button>

          {/* 8. Phone-In Studio & WhatsApp */}
          <button
            id="btn-header-open-phonein"
            onClick={onOpenPhoneIn}
            className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-lg transition cursor-pointer font-bold border ${
              activePhoneLinesCount > 0
                ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                : 'text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/70 border-emerald-700/60'
            }`}
            title="VoIP SIP Phone-In Studio & WhatsApp Voice Inbox"
          >
            <Phone className="w-3 h-3 text-emerald-400" />
            <span>{activePhoneLinesCount > 0 ? `📞 Phone (${activePhoneLinesCount})` : '📞 Phone / WA'}</span>
          </button>

          {/* 9. Hardware & Web MIDI Mapping */}
          <button
            id="btn-header-open-midi"
            onClick={onOpenMidi}
            className="flex items-center space-x-1 text-[11px] text-amber-300 bg-amber-950/50 hover:bg-amber-900/70 border border-amber-700/60 px-2 py-0.5 rounded-lg transition cursor-pointer font-bold"
            title="Hardwarové mapování: Web MIDI, Stream Deck, Korg, Klávesové zkratky"
          >
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>🎛️ MIDI</span>
          </button>

          {/* 10. RDS & DAB+ Slideshow */}
          <button
            id="btn-header-open-rds"
            onClick={onOpenRdsDab}
            className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-lg transition cursor-pointer font-bold border ${
              isTaActive
                ? 'bg-amber-500 text-slate-950 border-amber-300 font-extrabold animate-pulse'
                : 'text-purple-300 bg-purple-950/50 hover:bg-purple-900/70 border-purple-700/60'
            }`}
            title="RDS / DAB+ DLS & MOT Slideshow Generátor (Metadata pro autorádia)"
          >
            <Tv className="w-3 h-3 text-purple-400" />
            <span>{isTaActive ? '🚗 RDS (TA ACTIVE)' : '📡 RDS / DAB+'}</span>
          </button>
        </div>
      </div>


      {/* Right status & action toggles */}
      <div className="flex items-center space-x-2">
        {/* On Air glowing indicator */}
        <div className="flex items-center space-x-1 bg-red-950/70 border border-red-500/50 px-2 py-0.5 rounded-lg text-[11px] font-bold text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
          <span>ON AIR</span>
        </div>

        {/* Host Mic Live Toggle */}
        <button
          onClick={onToggleMic}
          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow cursor-pointer ${
            isMicActive
              ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
              : 'bg-[#232631] hover:bg-[#2c303e] text-slate-300 border border-[#2c303e]'
          }`}
          title={isMicActive ? 'Mic is LIVE (Input to Talk channel)' : 'Activate Host Microphone'}
        >
          <Mic className="w-3 h-3" />
          <span>{isMicActive ? 'MIC ON' : 'MIC'}</span>
        </button>

        {/* Master Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow cursor-pointer ${
            audioActive
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-red-700 hover:bg-red-600 text-white'
          }`}
          title={audioActive ? 'Web Audio Playout Engine Active (Click to Mute)' : 'Click to Enable Studio Audio Playout'}
        >
          {audioActive ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          <span>{audioActive ? 'Audio ON' : 'Audio OFF'}</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#232631] transition cursor-pointer"
          title="Studio Automation Preferences"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
