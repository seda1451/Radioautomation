import React, { useState, useEffect, useRef } from 'react';
import { Sliders, X, Play, Square, Check, Volume2, ArrowRightLeft, Music, Disc, Sparkles, Compass, AlertTriangle } from 'lucide-react';
import { QueueItem, LibrarySong } from '../types';
import { audioEngine } from '../services/audioEngine';

interface VisualSegueEditorModalProps {
  isOpen: boolean;
  outgoingTrack: QueueItem | null;
  incomingTrack: QueueItem | null;
  librarySongs?: LibrarySong[];
  onClose: () => void;
  onSaveSegue: (outgoingUpdates: Partial<QueueItem>, incomingUpdates: Partial<QueueItem>) => void;
  onSelectIncomingTrack?: (song: LibrarySong) => void;
  onShowToast: (msg: string) => void;
}

export const VisualSegueEditorModal: React.FC<VisualSegueEditorModalProps> = ({
  isOpen,
  outgoingTrack,
  incomingTrack,
  librarySongs = [],
  onClose,
  onSaveSegue,
  onSelectIncomingTrack,
  onShowToast,
}) => {
  // Outgoing track markers
  const [outgoingFadeSec, setOutgoingFadeSec] = useState<number>(3.5);
  const [outgoingSeguePoint, setOutgoingSeguePoint] = useState<number>(4.0); // seconds from end of track

  // Incoming track markers
  const [incomingCueIn, setIncomingCueIn] = useState<number>(0.2); // skip initial silence
  const [incomingIntroSec, setIncomingIntroSec] = useState<number>(12.0); // vocal ramp intro
  const [hookInSec, setHookInSec] = useState<number>(35.0);
  const [hookOutSec, setHookOutSec] = useState<number>(50.0);

  const [crossfadeCurve, setCrossfadeCurve] = useState<'linear' | 'exponential' | 's-curve'>('exponential');
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [activeTab, setActiveTab] = useState<'waveform' | 'camelot'>('waveform');

  const outgoingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const incomingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (outgoingTrack) {
      setOutgoingFadeSec(outgoingTrack.fadeSec || 3.5);
      setOutgoingSeguePoint(outgoingTrack.segueSec || 4.0);
    }
    if (incomingTrack) {
      setIncomingCueIn(incomingTrack.cueIn || 0.2);
      const parsedIntro = parseInt(incomingTrack.intro?.replace(':', '') || '10', 10);
      setIncomingIntroSec(incomingTrack.introSec || (isNaN(parsedIntro) ? 10 : parsedIntro));
    }
    setIsAuditioning(false);
  }, [outgoingTrack, incomingTrack, isOpen]);

  // Waveform rendering
  useEffect(() => {
    if (!isOpen) return;

    // 1. Outgoing Canvas
    const outCanvas = outgoingCanvasRef.current;
    if (outCanvas) {
      const ctx = outCanvas.getContext('2d');
      if (ctx) {
        const w = outCanvas.width;
        const h = outCanvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = '#0b0d14';
        ctx.fillRect(0, 0, w, h);

        const bars = 90;
        const barWidth = w / bars;
        for (let i = 0; i < bars; i++) {
          const ratio = i / bars;
          const fadeStartRatio = 1 - outgoingSeguePoint / 20;
          let amp = Math.sin(i * 0.22) * 0.35 + 0.55 + Math.random() * 0.12;
          if (ratio > fadeStartRatio) {
            const decay = (ratio - fadeStartRatio) / (1 - fadeStartRatio);
            amp *= Math.max(0.04, 1 - decay);
          }

          const barH = amp * (h - 22);
          ctx.fillStyle = ratio > fadeStartRatio ? '#f43f5e' : '#3b82f6';
          ctx.fillRect(i * barWidth, (h - barH) / 2, barWidth - 1.2, barH);
        }

        // Segue Start Marker line
        const markerX = Math.max(20, w * (1 - outgoingSeguePoint / 20));
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(markerX, 0);
        ctx.lineTo(markerX, h);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`NEXT START (-${outgoingSeguePoint.toFixed(1)}s)`, markerX - 95, 12);
      }
    }

    // 2. Incoming Canvas
    const inCanvas = incomingCanvasRef.current;
    if (inCanvas) {
      const ctx = inCanvas.getContext('2d');
      if (ctx) {
        const w = inCanvas.width;
        const h = inCanvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = '#0b0d14';
        ctx.fillRect(0, 0, w, h);

        const bars = 90;
        const barWidth = w / bars;
        const introRatio = incomingIntroSec / 30;

        for (let i = 0; i < bars; i++) {
          const ratio = i / bars;
          let amp = Math.cos(i * 0.28) * 0.38 + 0.52 + Math.random() * 0.1;
          if (ratio < incomingCueIn / 30) amp = 0.02;
          const barH = amp * (h - 22);

          ctx.fillStyle = ratio < introRatio ? '#10b981' : '#8b5cf6';
          ctx.fillRect(i * barWidth, (h - barH) / 2, barWidth - 1.2, barH);
        }

        // Cue In
        const cueX = w * (incomingCueIn / 30);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cueX, 0);
        ctx.lineTo(cueX, h);
        ctx.stroke();

        // Intro Vocal Limit
        const introX = w * (incomingIntroSec / 30);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(introX, 0);
        ctx.lineTo(introX, h);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`CUE IN (+${incomingCueIn.toFixed(1)}s)`, cueX + 4, 12);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`VOCAL RAMP (+${incomingIntroSec.toFixed(1)}s)`, introX + 4, h - 6);
      }
    }
  }, [isOpen, outgoingSeguePoint, outgoingFadeSec, incomingCueIn, incomingIntroSec]);

  if (!isOpen || !outgoingTrack) return null;

  // Camelot compatibility math
  const outKey = outgoingTrack.camelotKey || '8A';
  const inKey = incomingTrack?.camelotKey || '8A';
  const outBpm = outgoingTrack.bpm || 124;
  const inBpm = incomingTrack?.bpm || 126;
  const bpmDeltaPct = ((inBpm - outBpm) / outBpm) * 100;

  // Compute Camelot match quality
  const getCompatibility = (k1: string, k2: string) => {
    if (k1 === k2) return { status: 'PERFECT_MATCH', label: '🟢 Dokonalá harmonie (Stejný klíč)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
    const num1 = parseInt(k1.slice(0, -1), 10);
    const letter1 = k1.slice(-1);
    const num2 = parseInt(k2.slice(0, -1), 10);
    const letter2 = k2.slice(-1);

    if (num1 === num2 && letter1 !== letter2) {
      return { status: 'RELATIVE_MOOD', label: '🟡 Změna nálady (Relativní dur/moll)', color: 'text-amber-400 bg-amber-950/60 border-amber-800' };
    }
    const diff = (num2 - num1 + 12) % 12;
    if (diff === 1 && letter1 === letter2) {
      return { status: 'ENERGY_BOOST', label: '🟢 Zvýšení energie (+1 Camelot step)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
    }
    if (diff === 11 && letter1 === letter2) {
      return { status: 'ENERGY_DROP', label: '🔵 Uklidnění / Pokles energie (-1 step)', color: 'text-sky-400 bg-sky-950/60 border-sky-800' };
    }
    return { status: 'CLASH', label: '🔴 Harmonický skok (Pozor na střet tónin)', color: 'text-rose-400 bg-rose-950/60 border-rose-800' };
  };

  const compatibility = getCompatibility(outKey, inKey);

  // Recommended compatible tracks from library
  const compatibleSongs = librarySongs.filter(s => {
    if (s.id === outgoingTrack.id) return false;
    const match = getCompatibility(outKey, s.camelotKey || '8A');
    return match.status === 'PERFECT_MATCH' || match.status === 'ENERGY_BOOST' || match.status === 'RELATIVE_MOOD';
  }).slice(0, 4);

  const handleAuditionSegue = () => {
    if (isAuditioning) {
      audioEngine.stopSegueAudition();
      setIsAuditioning(false);
      onShowToast('Audition stopped');
    } else {
      setIsAuditioning(true);
      onShowToast(`Auditioning segue overlap (${outgoingSeguePoint.toFixed(1)}s crossfade)`);
      audioEngine.auditionSegueTransition(
        outgoingTrack.title,
        incomingTrack?.title || 'Next Song',
        outgoingSeguePoint,
        () => {
          setIsAuditioning(false);
          onShowToast('Segue audition finished');
        }
      );
    }
  };

  const handleSave = () => {
    onSaveSegue(
      {
        fadeSec: outgoingFadeSec,
        segueSec: outgoingSeguePoint,
      },
      {
        cueIn: incomingCueIn,
        introSec: incomingIntroSec,
        intro: `:${String(Math.round(incomingIntroSec)).padStart(2, '0')}`,
      }
    );
    audioEngine.stopSegueAudition();
    onClose();
    onShowToast('Custom Segue, Cue & Harmonic Points applied to playlist');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#14161f] border border-[#2c303e] rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/25 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Waveform & Harmonic Segue Editor</h3>
                <span className="bg-indigo-950/70 border border-indigo-600/40 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  CAMELOT MIXING
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Calibrate broadcast crossfades, talk-over intro ramps, BPM drift, and harmonic key compatibility
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audioEngine.stopSegueAudition();
              onClose();
            }}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex space-x-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('waveform')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 cursor-pointer transition ${
              activeTab === 'waveform'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#1b1e28] text-slate-400 hover:text-gray-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Audio Waveforms & Cue Points</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camelot')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 cursor-pointer transition ${
              activeTab === 'camelot'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#1b1e28] text-slate-400 hover:text-gray-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-300" />
            <span>Harmonic Compatibility & Camelot Advisor</span>
          </button>
        </div>

        {activeTab === 'waveform' ? (
          <>
            {/* 1. OUTGOING TRACK WAVEFORM */}
            <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="bg-red-950/60 text-red-400 border border-red-800/60 px-2 py-0.5 rounded text-[10px] font-bold">
                    OUTGOING (A)
                  </span>
                  <span className="font-bold text-white truncate max-w-[280px]">
                    {outgoingTrack.title}
                  </span>
                  <span className="text-slate-400 text-[11px]">- {outgoingTrack.artist}</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900">
                    {outKey} ({outgoingTrack.musicalKey || 'A min'}) • {outBpm} BPM
                  </span>
                  <span className="font-mono text-slate-400">{outgoingTrack.dur}</span>
                </div>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-[#222634]">
                <canvas ref={outgoingCanvasRef} width={680} height={65} className="w-full h-16 block" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Next Start Trigger (Overlap from end):</span>
                    <span className="font-bold text-emerald-400 font-mono">-{outgoingSeguePoint.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.1"
                    value={outgoingSeguePoint}
                    onChange={(e) => setOutgoingSeguePoint(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Fade-Out Tail Duration:</span>
                    <span className="font-bold text-red-400 font-mono">{outgoingFadeSec.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.2"
                    value={outgoingFadeSec}
                    onChange={(e) => setOutgoingFadeSec(parseFloat(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 2. INCOMING TRACK WAVEFORM */}
            <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-bold">
                    INCOMING (B)
                  </span>
                  <span className="font-bold text-white truncate max-w-[280px]">
                    {incomingTrack?.title || 'Next Scheduled Track'}
                  </span>
                  <span className="text-slate-400 text-[11px]">- {incomingTrack?.artist || 'Artist'}</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900">
                    {inKey} ({incomingTrack?.musicalKey || 'E min'}) • {inBpm} BPM
                  </span>
                  <span className="font-mono text-slate-400">Intro: :{String(Math.round(incomingIntroSec)).padStart(2, '0')}</span>
                </div>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-[#222634]">
                <canvas ref={incomingCanvasRef} width={680} height={65} className="w-full h-16 block" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Cue In (Skip Leading Silence):</span>
                    <span className="font-bold text-sky-400 font-mono">+{incomingCueIn.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={incomingCueIn}
                    onChange={(e) => setIncomingCueIn(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Intro Vocal Ramp Limit (Voice Track Zone):</span>
                    <span className="font-bold text-amber-400 font-mono">+{incomingIntroSec.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="25.0"
                    step="1.0"
                    value={incomingIntroSec}
                    onChange={(e) => setIncomingIntroSec(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* CAMELOT & HARMONIC MIXING TAB */
          <div className="space-y-3 text-xs">
            {/* Compatibility Summary Bar */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${compatibility.color}`}>
              <div className="flex items-center space-x-3">
                <Compass className="w-5 h-5" />
                <div>
                  <div className="font-bold">{compatibility.label}</div>
                  <div className="text-[11px] opacity-80">
                    Klíč: {outKey} ({outgoingTrack.musicalKey || 'A minor'}) ➔ {inKey} ({incomingTrack?.musicalKey || 'E minor'}) | Tempo: {outBpm} ➔ {inBpm} BPM ({bpmDeltaPct >= 0 ? '+' : ''}{bpmDeltaPct.toFixed(1)}% drift)
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-black/40 border border-white/10">
                  {Math.abs(bpmDeltaPct) < 5 ? 'PERFECT TEMPO MATCH' : 'TEMPO SHIFT'}
                </span>
              </div>
            </div>

            {/* Harmonic Wheel Guide */}
            <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-4 grid grid-cols-3 gap-3">
              <div className="border border-[#232736] bg-[#141722] p-3 rounded-lg text-center">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Current Song Key</div>
                <div className="text-2xl font-black text-white font-mono">{outKey}</div>
                <div className="text-xs text-indigo-300">{outgoingTrack.musicalKey || 'A minor'}</div>
              </div>

              <div className="border border-[#232736] bg-[#141722] p-3 rounded-lg text-center">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Harmonic Target Keys</div>
                <div className="flex items-center justify-center space-x-2 mt-1">
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold text-sm">
                    {outKey}
                  </span>
                  <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold text-sm">
                    {((parseInt(outKey.slice(0, -1), 10) % 12) + 1) + outKey.slice(-1)}
                  </span>
                  <span className="bg-amber-950 text-amber-400 border border-amber-700 px-2 py-0.5 rounded font-mono font-bold text-sm">
                    {outKey.slice(0, -1) + (outKey.slice(-1) === 'A' ? 'B' : 'A')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Same • Energy +1 • Relative</div>
              </div>

              <div className="border border-[#232736] bg-[#141722] p-3 rounded-lg text-center">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Incoming Song Key</div>
                <div className="text-2xl font-black text-emerald-400 font-mono">{inKey}</div>
                <div className="text-xs text-emerald-300">{incomingTrack?.musicalKey || 'E minor'}</div>
              </div>
            </div>

            {/* Smart Replacement Recommendations */}
            <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Doporučené harmonicky kompatibilní skladby z knihovny:</span>
                </span>
                <span className="text-[11px] text-slate-400">Automatický výběr pro hladký přechod</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {compatibleSongs.map((song) => (
                  <div
                    key={song.id}
                    className="p-2.5 bg-[#141722] hover:bg-[#1a1e2d] border border-[#242838] hover:border-indigo-500 rounded-lg flex items-center justify-between transition cursor-pointer"
                    onClick={() => {
                      if (onSelectIncomingTrack) {
                        onSelectIncomingTrack(song);
                        onShowToast(`Selected "${song.title}" as incoming track`);
                      }
                    }}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-white text-xs truncate">{song.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{song.artist}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-indigo-950 text-indigo-300 border border-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                        {song.camelotKey || '8A'} • {song.bpm} BPM
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Crossfade Profile & Audition */}
        <div className="flex items-center justify-between bg-[#12141c] p-3 rounded-xl border border-[#262a37] text-xs">
          <div className="flex items-center space-x-3">
            <span className="text-slate-400 font-semibold flex items-center space-x-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span>Crossfade Profile:</span>
            </span>
            <div className="flex space-x-1">
              {(['linear', 'exponential', 's-curve'] as const).map((curve) => (
                <button
                  key={curve}
                  type="button"
                  onClick={() => setCrossfadeCurve(curve)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                    crossfadeCurve === curve
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-[#1a1d27] text-slate-400 hover:text-white'
                  }`}
                >
                  {curve.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAuditionSegue}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow transition ${
              isAuditioning
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                : 'bg-[#252a38] hover:bg-[#303648] text-indigo-300 border border-indigo-500/30'
            }`}
          >
            {isAuditioning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAuditioning ? 'Stop Audition' : 'Audition Segue Mix'}</span>
          </button>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end space-x-3 pt-2 border-t border-[#2c303e]">
          <button
            type="button"
            onClick={() => {
              audioEngine.stopSegueAudition();
              onClose();
            }}
            className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Segue & Cue Points</span>
          </button>
        </div>
      </div>
    </div>
  );
};
