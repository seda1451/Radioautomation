import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertOctagon, MicOff, RefreshCw, X, Check, Volume2, Radio, Play, History, Zap } from 'lucide-react';
import { ProfanityDelayConfig, ProfanityDelayState, DumpIncident } from '../types';
import { audioEngine } from '../services/audioEngine';

interface ProfanityDelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProfanityDelayConfig;
  state: ProfanityDelayState;
  onUpdateConfig: (config: ProfanityDelayConfig) => void;
  onTriggerDump: () => void;
  onShowToast: (msg: string) => void;
}

export const ProfanityDelayModal: React.FC<ProfanityDelayModalProps> = ({
  isOpen,
  onClose,
  config,
  state,
  onUpdateConfig,
  onTriggerDump,
  onShowToast,
}) => {
  const [bufferSec, setBufferSec] = useState<number>(config.bufferDurationSec || 7);
  const [autoFillCart, setAutoFillCart] = useState<'sweeper' | 'jingle1' | 'jingle2' | 'station_id'>(config.autoFillCartType || 'sweeper');
  const [isCoughMuted, setIsCoughMuted] = useState<boolean>(false);
  const [coughSeconds, setCoughSeconds] = useState<number>(0);

  // Simulated buffer level ramp
  const [currentBufferLevel, setCurrentBufferLevel] = useState<number>(state.delayBufferSec || 7.0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(() => {
      setCurrentBufferLevel((prev) => {
        if (state.isDumping) return 0;
        if (prev < bufferSec) return Math.min(bufferSec, prev + 0.5);
        return bufferSec;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen, bufferSec, state.isDumping]);

  // Cough mute timer
  useEffect(() => {
    let timer: number;
    if (isCoughMuted) {
      timer = window.setInterval(() => {
        setCoughSeconds((s) => s + 1);
      }, 1000);
    } else {
      setCoughSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isCoughMuted]);

  if (!isOpen) return null;

  const handleExecuteDump = () => {
    setCurrentBufferLevel(0);
    onTriggerDump();
    audioEngine.playCartSound(autoFillCart === 'sweeper' ? 'sweeper' : 'jingle1');
    onShowToast(`🚨 PROFANITY DUMP EXECUTED: Dropped ${bufferSec}s audio buffer & fired filler stinger!`);
  };

  const handleToggleCough = () => {
    if (isCoughMuted) {
      setIsCoughMuted(false);
      audioEngine.setCough(false);
      onShowToast('🎙️ Host Microphone Unmuted (Cough button released)');
    } else {
      setIsCoughMuted(true);
      audioEngine.setCough(true);
      onShowToast('🔇 Host Microphone Muted (Cough button active)');
    }
  };

  const handleSaveSettings = () => {
    onUpdateConfig({
      bufferDurationSec: bufferSec,
      autoFillCartType: autoFillCart,
      coughMuteGain: 0,
      autoReArm: true,
    });
    onClose();
    onShowToast('Profanity Delay configuration saved');
  };

  const bufferPercent = Math.min(100, Math.round((currentBufferLevel / bufferSec) * 100));

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#14161f] border border-[#2c303e] rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/25 border border-red-500/50 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Broadcast Profanity Delay & Live DUMP System</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                  bufferPercent >= 95
                    ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                    : 'bg-amber-950/70 border-amber-600 text-amber-300'
                }`}>
                  {bufferPercent >= 95 ? 'DELAY ARMED & SAFE' : `BUFFER BUILDING (${currentBufferLevel.toFixed(1)}s)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hardware-grade time alignment buffer protection against profanity, phone-in slurs, and live broadcast incidents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Action Center: Big Red DUMP Button & Cough Mute */}
        <div className="grid grid-cols-2 gap-4">
          {/* Big Red DUMP Button */}
          <button
            type="button"
            onClick={handleExecuteDump}
            className="p-5 rounded-2xl bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 active:scale-[0.98] border-2 border-red-400/80 shadow-2xl shadow-red-950 flex flex-col items-center justify-center space-y-2 cursor-pointer transition text-white group"
          >
            <AlertOctagon className="w-10 h-10 group-hover:animate-bounce" />
            <div className="font-black text-lg tracking-wider">🚨 DUMP / KILL PROFANITY</div>
            <div className="text-[11px] text-red-100 font-mono bg-red-950/80 px-3 py-0.5 rounded-full border border-red-400/30">
              DROP {bufferSec}s BUFFER & FIRE FILLER
            </div>
          </button>

          {/* Cough / Quick Mute Button */}
          <button
            type="button"
            onClick={handleToggleCough}
            className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center space-y-2 cursor-pointer transition ${
              isCoughMuted
                ? 'bg-amber-600 border-amber-400 text-white animate-pulse shadow-lg'
                : 'bg-[#181b24] hover:bg-[#202432] border-[#31374a] text-slate-300'
            }`}
          >
            <MicOff className="w-9 h-9" />
            <div className="font-black text-base tracking-wider">
              {isCoughMuted ? `COUGH MUTE ACTIVE (${coughSeconds}s)` : 'HOST COUGH MUTE'}
            </div>
            <div className="text-[11px] text-slate-400">
              {isCoughMuted ? 'Click to restore mic' : 'Temporarily kills host microphone'}
            </div>
          </button>
        </div>

        {/* Delay Buffer Level Meter */}
        <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Delay Buffer Depth (Time Delay to Transmitter):</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {currentBufferLevel.toFixed(1)}s / {bufferSec}.0s ({bufferPercent}%)
            </span>
          </div>

          <div className="h-3 w-full bg-[#161822] rounded-full overflow-hidden border border-[#2a2e3f]">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                bufferPercent >= 95
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }`}
              style={{ width: `${bufferPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0.0s (Real-Time In Studio)</span>
            <span>+{bufferSec / 2}s Re-Building</span>
            <span>+{bufferSec}.0s (On-Air to Public)</span>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Target Buffer Length</label>
            <select
              value={bufferSec}
              onChange={(e) => setBufferSec(parseInt(e.target.value, 10))}
              className="w-full bg-[#0f1118] border border-[#262a37] rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-red-500"
            >
              <option value={5}>5.0 Seconds (Standard Music Radio)</option>
              <option value={7}>7.0 Seconds (Recommended Talk/Call-In)</option>
              <option value={10}>10.0 Seconds (High Risk Live Phone-Ins)</option>
              <option value={15}>15.0 Seconds (Extreme Uncensored Events)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Automatic Filler Stinger upon DUMP</label>
            <select
              value={autoFillCart}
              onChange={(e) => setAutoFillCart(e.target.value as typeof autoFillCart)}
              className="w-full bg-[#0f1118] border border-[#262a37] rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-red-500"
            >
              <option value="sweeper">Station Sweeper ("98.5 FM Pure Hits")</option>
              <option value="jingle1">Power Intro Jingle #1</option>
              <option value="jingle2">Upbeat Station ID Jingle #2</option>
              <option value="station_id">Legal Station Top-of-Hour ID</option>
            </select>
          </div>
        </div>

        {/* Audit Log / History */}
        <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Incident Audit Trail (Total Dumps: {state.dumpCount})</span>
            </span>
            <span className="text-[11px] text-slate-500">Auto-logged for broadcast compliance</span>
          </div>

          <div className="space-y-1.5 max-h-24 overflow-y-auto font-mono text-[11px]">
            {state.history.length === 0 ? (
              <div className="text-slate-500 italic py-1">No emergency dump actions triggered in this session. Buffer is nominal.</div>
            ) : (
              state.history.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-[#151722] px-2.5 py-1 rounded border border-[#242838]">
                  <span className="text-red-400 font-bold">{item.timestamp}</span>
                  <span className="text-slate-300">{item.reason}</span>
                  <span className="text-amber-400 font-bold">-{item.secondsDumped}s</span>
                  <span className="text-slate-400">{item.fillerTriggered}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-[#2c303e]">
          <div className="text-[11px] text-slate-400">
            Buffer dynamically rebuilds at 1.05x pitch interpolation seamlessly in background.
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Delay Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
