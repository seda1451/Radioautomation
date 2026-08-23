import React, { useEffect, useRef } from 'react';
import { FastForward, Radio, Activity } from 'lucide-react';
import { QueueItem } from '../types';
import { audioEngine } from '../services/audioEngine';

interface OnAirBannerProps {
  currentTrack: QueueItem | null;
  nextTrack1: QueueItem | null;
  nextTrack2: QueueItem | null;
  isPlaying: boolean;
  timeRemainingSec: number;
  onSkipTrack: () => void;
}

export const OnAirBanner: React.FC<OnAirBannerProps> = ({
  currentTrack,
  nextTrack1,
  nextTrack2,
  isPlaying,
  timeRemainingSec,
  onSkipTrack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animate Waveform on live audio
  useEffect(() => {
    let animFrame: number;
    const render = () => {
      if (isPlaying && canvasRef.current) {
        audioEngine.drawWaveform(canvasRef.current);
      }
      animFrame = requestAnimationFrame(render);
    };
    animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying]);

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = currentTrack && currentTrack.durSeconds > 0
    ? Math.min(100, Math.max(0, ((currentTrack.durSeconds - timeRemainingSec) / currentTrack.durSeconds) * 100))
    : 0;

  return (
    <div className="bg-[#1a1c23] border-b border-[#2c303e] p-3 grid grid-cols-1 gap-2 shrink-0 select-none">
      {/* ON AIR ROW */}
      <div className="flex items-center justify-between bg-red-950/20 border border-red-500/30 px-3 py-2 rounded-lg relative overflow-hidden shadow-inner">
        {/* Active red indicator bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>

        {/* Dynamic progress bar background */}
        <div
          className="absolute bottom-0 left-0 top-0 bg-red-600/10 pointer-events-none transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="flex items-center space-x-3 flex-1 min-w-0 z-10">
          <div className="flex items-center space-x-1.5 bg-red-950 px-2 py-0.5 rounded border border-red-700/80 shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-[11px] font-extrabold text-red-300 tracking-wider">ON AIR</span>
          </div>
          <span className="font-bold text-sm text-white truncate">
            {currentTrack?.title || 'No active track'}
          </span>
          <span className="text-xs text-slate-500 shrink-0">-</span>
          <span className="text-xs text-gray-300 truncate">
            {currentTrack?.artist || 'Cloud Radio Studio'}
          </span>

          {currentTrack?.bpm && (
            <span className="text-[10px] bg-[#121316] text-slate-400 px-1.5 py-0.5 rounded border border-[#2c303e] shrink-0 font-mono">
              {currentTrack.bpm} BPM
            </span>
          )}
        </div>

        {/* Live Audio Waveform Canvas */}
        <div className="hidden md:flex items-center space-x-2 px-3 z-10">
          <Activity className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <canvas ref={canvasRef} width={90} height={20} className="w-24 h-5 rounded bg-[#121316]/70 border border-red-900/30" />
        </div>

        {/* Right Remaining Time & Skip button */}
        <div className="flex items-center space-x-4 shrink-0 pl-3 z-10">
          <div className="text-right">
            <span className="font-mono text-xs text-white font-bold tracking-wider">
              -{formatRemaining(timeRemainingSec)}
            </span>
            <div className="text-[9px] text-slate-400 font-mono">
              total {currentTrack?.dur || '3:00'}
            </div>
          </div>

          <button
            onClick={onSkipTrack}
            className="w-8 h-8 rounded bg-red-950/60 hover:bg-red-900/80 border border-red-700/50 text-red-200 hover:text-white transition flex items-center justify-center cursor-pointer shadow"
            title="Skip to Next Song"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NEXT QUEUE ROWS */}
      <div className="space-y-1">
        {/* Next Track 1 */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#232631]/60 border border-[#2c303e]/50 text-xs">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="font-bold text-purple-400 bg-purple-950/70 px-1.5 py-0.5 rounded border border-purple-800/60 shrink-0 text-[10px] tracking-wider">
              NEXT
            </span>
            <span className="font-semibold text-gray-200 truncate">
              {nextTrack1?.title || 'End of log'}
            </span>
            <span className="text-slate-400 truncate text-[11px]">
              {nextTrack1?.artist || ''}
            </span>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <span className="font-mono text-[11px] text-gray-300">
              {nextTrack1?.dur || '--:--'}
            </span>
            <span className="bg-blue-900/40 text-blue-300 border border-blue-700/50 px-1.5 py-0.5 rounded text-[10px] font-bold">
              AUTO
            </span>
          </div>
        </div>

        {/* 3rd Track */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#232631]/30 border border-[#2c303e]/30 text-xs text-slate-400">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="font-bold text-slate-400 bg-[#121316] px-1.5 py-0.5 rounded shrink-0 text-[10px]">
              3RD
            </span>
            <span className="truncate text-gray-300">
              {nextTrack2?.title || 'End of log'}
            </span>
            <span className="text-slate-500 truncate text-[11px]">
              {nextTrack2?.artist || ''}
            </span>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <span className="font-mono text-[11px]">
              {nextTrack2?.dur || '--:--'}
            </span>
            <span className="bg-[#121316] text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-medium border border-[#2c303e]/50">
              AUTO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
