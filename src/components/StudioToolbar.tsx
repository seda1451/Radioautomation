import React from 'react';
import {
  Mic,
  RotateCw,
  Globe,
  Power,
  Trash2,
  VolumeX,
  Split,
  Headphones,
  Wand2,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface StudioToolbarProps {
  cushionActive: boolean;
  isEngaged: boolean;
  isCoughActive: boolean;
  isCueActive: boolean;
  onToggleVoiceTrack: () => void;
  onTriggerRotators: () => void;
  onOpenDistantVT: () => void;
  onToggleCushion: () => void;
  onToggleEngage: () => void;
  onClearDumpBuffer: () => void;
  onTriggerCough: () => void;
  onTriggerSegue: () => void;
  onToggleCue: () => void;
  onTriggerTlc: () => void;
  onOpenScheduler: () => void;
}

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  cushionActive,
  isEngaged,
  isCoughActive,
  isCueActive,
  onToggleVoiceTrack,
  onTriggerRotators,
  onOpenDistantVT,
  onToggleCushion,
  onToggleEngage,
  onClearDumpBuffer,
  onTriggerCough,
  onTriggerSegue,
  onToggleCue,
  onTriggerTlc,
  onOpenScheduler,
}) => {
  return (
    <div className="bg-[#121316] border-t border-[#2c303e] p-2 grid grid-cols-5 sm:grid-cols-10 gap-1.5 shrink-0 text-center text-[11px] select-none">
      {/* 1. Voice Track AI Studio */}
      <button
        onClick={onToggleVoiceTrack}
        className="bg-[#1a1c23] hover:bg-purple-950/60 active:scale-95 border border-[#2c303e] hover:border-purple-500/50 p-2 rounded flex flex-col items-center justify-center transition group cursor-pointer shadow-sm"
        title="Open AI Voice Track & Presenter Studio"
      >
        <Sparkles className="w-4 h-4 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-purple-200">VOICE TRACK</span>
      </button>

      {/* 2. Rotators / 24h Scheduler */}
      <button
        onClick={onOpenScheduler}
        className="bg-[#1a1c23] hover:bg-blue-950/60 active:scale-95 border border-[#2c303e] hover:border-blue-500/50 p-2 rounded flex flex-col items-center justify-center transition group cursor-pointer shadow-sm"
        title="Music Scheduling Engine & 24h Generator"
      >
        <Calendar className="w-4 h-4 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-blue-200">SCHEDULER</span>
      </button>

      {/* 3. Distant VT */}
      <button
        onClick={onOpenDistantVT}
        className="bg-[#1a1c23] hover:bg-[#232631] active:scale-95 border border-[#2c303e] p-2 rounded flex flex-col items-center justify-center transition group cursor-pointer shadow-sm"
        title="Cloud Distant VT Synchronization"
      >
        <Globe className="w-4 h-4 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-gray-300">DISTANT VT</span>
      </button>

      {/* 4. 7s Cushion */}
      <button
        onClick={onToggleCushion}
        className="bg-[#1a1c23] hover:bg-[#232631] active:scale-95 border border-[#2c303e] p-2 rounded flex flex-col items-center justify-center transition group cursor-pointer shadow-sm"
        title="Broadcast Delay Cushion (Profanity Dump Safe)"
      >
        <span
          className={`text-[9px] px-1.5 py-0.2 rounded font-bold mb-1 border ${
            cushionActive
              ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
              : 'bg-[#121316] text-slate-400 border-[#2c303e]'
          }`}
        >
          {cushionActive ? 'ON' : 'OFF'}
        </span>
        <span className="font-semibold text-gray-300">7s cushion</span>
      </button>

      {/* 5. Engage */}
      <button
        onClick={onToggleEngage}
        className={`active:scale-95 border p-2 rounded flex flex-col items-center justify-center transition group cursor-pointer shadow-sm ${
          isEngaged
            ? 'bg-emerald-950/40 border-emerald-500/40'
            : 'bg-[#1a1c23] hover:bg-[#232631] border-[#2c303e]'
        }`}
        title="Studio Playout Interlock"
      >
        <Power className={`w-4 h-4 mb-1 ${isEngaged ? 'text-emerald-400' : 'text-slate-400'}`} />
        <span className={`font-semibold ${isEngaged ? 'text-emerald-300' : 'text-gray-300'}`}>ENGAGE</span>
      </button>

      {/* 6. Dump */}
      <button
        onClick={onClearDumpBuffer}
        className="bg-[#1a1c23] hover:bg-red-950/60 active:scale-95 border border-[#2c303e] p-2 rounded flex flex-col items-center justify-center transition group cursor-pointer shadow-sm"
        title="Clear Delay Buffer Immediately (Dump profanity)"
      >
        <Trash2 className="w-4 h-4 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-gray-300">DUMP</span>
      </button>

      {/* 7. Cough */}
      <button
        onClick={onTriggerCough}
        className={`active:scale-95 border p-2 rounded flex flex-col items-center justify-center transition group cursor-pointer shadow-sm ${
          isCoughActive
            ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
            : 'bg-[#1a1c23] hover:bg-[#232631] border-[#2c303e] text-gray-300'
        }`}
        title="Host Mic Momentary Mute (Cough Button - Key 'C')"
      >
        <VolumeX className="w-4 h-4 text-yellow-400 mb-1" />
        <span className="font-semibold">COUGH</span>
      </button>

      {/* 8. Segue Editor */}
      <button
        onClick={onTriggerSegue}
        className="bg-[#1a1c23] hover:bg-orange-950/60 active:scale-95 border border-[#2c303e] hover:border-orange-500/50 p-2 rounded flex flex-col items-center justify-center transition group cursor-pointer shadow-sm"
        title="Open Visual Segue & Cue Waveform Editor"
      >
        <Split className="w-4 h-4 text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-orange-200">SEGUE MIX</span>
      </button>

      {/* 9. Cue */}
      <button
        onClick={onToggleCue}
        className={`active:scale-95 border p-2 rounded flex flex-col items-center justify-center transition group cursor-pointer shadow-sm ${
          isCueActive
            ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
            : 'bg-[#1a1c23] hover:bg-[#232631] border-[#2c303e] text-gray-300'
        }`}
        title="Toggle Headphone Preview Cue Bus"
      >
        <Headphones className="w-4 h-4 text-purple-400 mb-1" />
        <span className="font-semibold">CUE</span>
      </button>

      {/* 10. TLC / DSP Rack */}
      <button
        onClick={onTriggerTlc}
        className="bg-[#1a1c23] hover:bg-red-950/60 active:scale-95 border border-[#2c303e] hover:border-red-500/50 p-2 rounded flex flex-col items-center justify-center transition group cursor-pointer shadow-sm"
        title="Open Total Level Control (TLC) DSP Audio Processor Rack"
      >
        <Wand2 className="w-4 h-4 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-red-200">TLC / DSP</span>
      </button>
    </div>
  );
};
