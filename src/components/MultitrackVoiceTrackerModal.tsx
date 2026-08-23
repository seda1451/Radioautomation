import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Volume2, X, Check, Scissors, Sliders, Music, Radio } from 'lucide-react';
import { QueueItem } from '../types';
import { audioEngine } from '../services/audioEngine';

interface MultitrackVoiceTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  outgoingTrack: QueueItem | null;
  incomingTrack: QueueItem | null;
  onInsertVoiceTrack: (vt: {
    title: string;
    artist: string;
    dur: string;
    durSeconds: number;
    audioUrl: string;
  }) => void;
  onShowToast: (msg: string) => void;
}

export const MultitrackVoiceTrackerModal: React.FC<MultitrackVoiceTrackerModalProps> = ({
  isOpen,
  onClose,
  outgoingTrack,
  incomingTrack,
  onInsertVoiceTrack,
  onShowToast,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // Settings
  const [duckingPct, setDuckingPct] = useState(20); // 20% volume during voice
  const [voiceGainDb, setVoiceGainDb] = useState(3.0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [normalizeVoice, setNormalizeVoice] = useState(true);

  // Playback Audition
  const [isPlayingAudition, setIsPlayingAudition] = useState(false);
  const timerRef = useRef<number | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioEngine.releasePlayoutDucking();
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleRecord = async () => {
    if (!isRecording) {
      // Start recording
      const ok = await audioEngine.startVoiceTrackRecording();
      if (!ok) {
        onShowToast('Could not access microphone');
        return;
      }
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordedAudioUrl(null);

      // Duck music bed in background
      audioEngine.setPlayoutDucking(duckingPct / 100);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      onShowToast('Recording Voice Track with Auto-Ducking active...');
    } else {
      // Stop recording
      if (timerRef.current) clearInterval(timerRef.current);
      audioEngine.releasePlayoutDucking();
      setIsRecording(false);

      try {
        const result = await audioEngine.stopVoiceTrackRecording();
        setRecordedAudioUrl(result.audioUrl);
        setRecordedBlob(result.blob);
        setTrimEnd(result.durationSec);
        onShowToast(`Captured ${result.durationSec}s Voice Track`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAuditionRecording = () => {
    if (!recordedAudioUrl) {
      onShowToast('Record a voice track first');
      return;
    }

    if (isPlayingAudition) {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
      }
      audioEngine.releasePlayoutDucking();
      setIsPlayingAudition(false);
      return;
    }

    const audio = new Audio(recordedAudioUrl);
    auditionAudioRef.current = audio;
    setIsPlayingAudition(true);

    // Apply auto ducking to music bed while previewing recorded voice
    audioEngine.setPlayoutDucking(duckingPct / 100);

    audio.onended = () => {
      setIsPlayingAudition(false);
      audioEngine.releasePlayoutDucking();
    };

    audio.onerror = () => {
      setIsPlayingAudition(false);
      audioEngine.releasePlayoutDucking();
    };

    audio.play().catch(console.error);
  };

  const handleInsertToPlayout = () => {
    if (!recordedAudioUrl && recordingSeconds === 0) {
      onShowToast('Please record a voice link first');
      return;
    }

    const totalDur = Math.max(4, recordingSeconds || 10);
    const mins = Math.floor(totalDur / 60);
    const secs = totalDur % 60;
    const durStr = `${mins}:${String(secs).padStart(2, '0')}`;

    onInsertVoiceTrack({
      title: `LIVE VT: Studio Host (${durStr})`,
      artist: 'Aircheck Multitrack',
      dur: durStr,
      durSeconds: totalDur,
      audioUrl: recordedAudioUrl || '',
    });

    onClose();
    onShowToast(`Inserted Aircheck Voice Track into On-Air Log`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#161820] border border-[#2c303e] rounded-xl p-6 w-full max-w-3xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Aircheck Multitrack Voice Tracker</h3>
              <p className="text-[11px] text-slate-400">
                Record live voice over music bed with real-time Auto-Ducking, trimming, and broadcast gain
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multitrack Waveform Visual Canvas */}
        <div className="bg-[#101217] border border-[#2c303e] rounded-lg p-3 space-y-3">
          {/* Track 1: Music Bed / Outgoing Song */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center space-x-1.5 text-blue-400">
                <Music className="w-3.5 h-3.5" />
                <span>Track 1: Playout Bed ({outgoingTrack?.title || 'Current Music Track'})</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {isRecording ? `Ducked to ${duckingPct}%` : 'Normal Playout (100%)'}
              </span>
            </div>
            <div className="h-10 bg-[#161820] rounded border border-[#232734] flex items-center px-3 relative overflow-hidden">
              <div
                className={`absolute inset-0 bg-blue-600/10 transition-all ${
                  isRecording ? 'opacity-40' : 'opacity-100'
                }`}
              />
              <div className="flex items-center space-x-1 w-full relative z-10">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500/60 rounded-full transition-all duration-200"
                    style={{
                      height: `${Math.max(4, Math.sin(i * 0.3) * (isRecording ? 10 : 28) + 12)}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Track 2: Live Host Mic / Recorded Voice */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center space-x-1.5 text-red-400">
                <Mic className="w-3.5 h-3.5" />
                <span>Track 2: Live Host Voice Link</span>
              </span>
              <span className="text-[11px] text-red-400 font-mono">
                {isRecording ? `REC: 00:${String(recordingSeconds).padStart(2, '0')}` : recordedAudioUrl ? 'Audio Captured' : 'Ready'}
              </span>
            </div>
            <div className="h-12 bg-[#161820] rounded border border-[#232734] flex items-center px-3 relative overflow-hidden">
              <div
                className={`absolute inset-0 bg-red-600/10 transition-all ${
                  isRecording ? 'opacity-100 animate-pulse' : 'opacity-20'
                }`}
              />
              <div className="flex items-center space-x-1 w-full relative z-10">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-150 ${
                      isRecording ? 'bg-red-500' : recordedAudioUrl ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    style={{
                      height: `${
                        isRecording
                          ? Math.max(6, Math.random() * 36)
                          : recordedAudioUrl
                          ? Math.max(4, Math.sin(i * 0.5) * 22 + 10)
                          : 4
                      }}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DSP & Auto-Ducking Controls */}
        <div className="grid grid-cols-3 gap-3 text-xs bg-[#101217] border border-[#2c303e] rounded-lg p-3.5">
          <div>
            <div className="flex justify-between font-semibold text-slate-400 mb-1">
              <span>Auto-Ducking Bed Depth:</span>
              <span className="font-mono text-blue-400">{duckingPct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={duckingPct}
              onChange={(e) => setDuckingPct(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Music volume level while presenter is talking</span>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-400 mb-1">
              <span>Voice Boost Gain:</span>
              <span className="font-mono text-red-400">+{voiceGainDb} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              value={voiceGainDb}
              onChange={(e) => setVoiceGainDb(parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Broadcast warmth & vocal presence boost</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={normalizeVoice}
                onChange={(e) => setNormalizeVoice(e.target.checked)}
                className="rounded accent-red-500"
              />
              <span className="font-semibold text-slate-300">Auto-Normalize Voice to -14 LUFS</span>
            </label>
            <div className="text-[10px] text-slate-500">
              Crops head/tail silence automatically on insert
            </div>
          </div>
        </div>

        {/* Footer with Big Record Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2c303e]">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleToggleRecord}
              className={`px-5 py-2.5 rounded-lg font-bold text-xs shadow flex items-center space-x-2 cursor-pointer transition ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                  : 'bg-red-950/60 border border-red-700 hover:bg-red-900 text-red-300'
              }`}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'Stop Recording' : 'Record Voice Track (Mic)'}</span>
            </button>

            {recordedAudioUrl && (
              <button
                type="button"
                onClick={handleAuditionRecording}
                className="bg-[#252836] hover:bg-[#313547] text-gray-200 px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                {isPlayingAudition ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingAudition ? 'Stop Audition' : 'Audition Mix'}</span>
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsertToPlayout}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Insert into Playout Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
