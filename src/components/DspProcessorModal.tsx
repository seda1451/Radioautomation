import React, { useState, useEffect } from 'react';
import { Cpu, X, Check, Power, Activity, Disc, Volume2, Sliders, Shield } from 'lucide-react';
import { DspProcessorSettings } from '../types';
import { audioEngine, DSP_PRESETS } from '../services/audioEngine';

interface DspProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const DspProcessorModal: React.FC<DspProcessorModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [settings, setSettings] = useState<DspProcessorSettings>(audioEngine.getDspSettings());
  const [lufsMetrics, setLufsMetrics] = useState({
    momentaryLufs: -14.0,
    shortTermLufs: -14.2,
    integratedLufs: -14.0,
    gainReductionDb: 0,
  });

  // Poll real-time LUFS & Gain Reduction from AudioEngine
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setLufsMetrics(audioEngine.getLufsMetrics());
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey: string) => {
    const preset = DSP_PRESETS[presetKey];
    if (preset) {
      const updated = { ...preset, enabled: settings.enabled };
      setSettings(updated);
      audioEngine.updateDspSettings(updated);
      onShowToast(`Applied Broadcast Audio Preset: ${presetKey.replace('_', ' ')}`);
    }
  };

  const handleToggleBypass = () => {
    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    audioEngine.updateDspSettings(updated);
    onShowToast(updated.enabled ? 'DSP Processor ENGAGED' : 'DSP Processor BYPASSED');
  };

  const updateEqBand = (band: keyof typeof settings.eq, val: number) => {
    const updated: DspProcessorSettings = {
      ...settings,
      preset: 'CUSTOM',
      eq: { ...settings.eq, [band]: val },
    };
    setSettings(updated);
    audioEngine.updateDspSettings(updated);
  };

  const updateAgcParam = (param: keyof typeof settings.agc, val: number) => {
    const updated: DspProcessorSettings = {
      ...settings,
      preset: 'CUSTOM',
      agc: { ...settings.agc, [param]: val },
    };
    setSettings(updated);
    audioEngine.updateDspSettings(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#161820] border border-[#2c303e] rounded-xl p-6 w-full max-w-3xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Broadcast DSP Audio Processor Rack</h3>
              <p className="text-[11px] text-slate-400">
                5-Band Parametric Equalizer, Multiband AGC Compressor, Stereo Enhancer & EBU R128 LUFS Loudness
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleToggleBypass}
              className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow transition ${
                settings.enabled
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 border-slate-600 text-slate-400'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{settings.enabled ? 'DSP ACTIVE' : 'BYPASSED'}</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Broadcast Sound Presets */}
        <div className="flex items-center space-x-2 bg-[#101217] p-2.5 rounded-lg border border-[#2c303e] text-xs">
          <span className="text-slate-400 font-semibold shrink-0">Station Sound Preset:</span>
          <div className="flex space-x-2 overflow-x-auto w-full">
            {[
              { key: 'FM_PUNCH', label: 'FM Punch & Clarity' },
              { key: 'HYPER_TOP40', label: 'Hyper-Compressed Top 40' },
              { key: 'WARM_VINTAGE', label: 'Warm American Classic' },
              { key: 'TALK_ACOUSTIC', label: 'Talk / Acoustic Clean' },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handleApplyPreset(p.key)}
                className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                  settings.preset === p.key
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-[#1a1d26] text-slate-300 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. 5-BAND EQUALIZER */}
        <div className="bg-[#101217] border border-[#2c303e] rounded-lg p-3.5 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-white flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>5-Band Master Parametric Equalizer</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">Low-Shelf / Peaking / High-Shelf</span>
          </div>

          <div className="grid grid-cols-5 gap-3 text-center">
            {[
              { band: 'subBass80Hz', label: '80 Hz', sub: 'Sub-Bass', val: settings.eq.subBass80Hz, color: 'accent-red-500' },
              { band: 'lowMid250Hz', label: '250 Hz', sub: 'Low-Mid', val: settings.eq.lowMid250Hz, color: 'accent-amber-500' },
              { band: 'mid1kHz', label: '1.0 kHz', sub: 'Mid Clarity', val: settings.eq.mid1kHz, color: 'accent-emerald-500' },
              { band: 'presence4kHz', label: '4.0 kHz', sub: 'Presence', val: settings.eq.presence4kHz, color: 'accent-sky-500' },
              { band: 'air12kHz', label: '12.0 kHz', sub: 'Air / Silk', val: settings.eq.air12kHz, color: 'accent-purple-500' },
            ].map((b) => (
              <div key={b.band} className="bg-[#161820] border border-[#2c303e] rounded p-2 space-y-1.5">
                <div className="text-[11px] font-bold text-white">{b.label}</div>
                <div className="text-[9px] text-slate-400">{b.sub}</div>
                <div className="font-mono text-xs font-bold text-indigo-300">
                  {b.val > 0 ? `+${b.val.toFixed(1)}` : b.val.toFixed(1)} dB
                </div>
                <input
                  type="range"
                  min="-8.0"
                  max="8.0"
                  step="0.5"
                  value={b.val}
                  onChange={(e) =>
                    updateEqBand(b.band as keyof typeof settings.eq, parseFloat(e.target.value))
                  }
                  className={`w-full ${b.color} cursor-pointer`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 2. MULTIBAND AGC & LOUDNESS METERS */}
        <div className="grid grid-cols-2 gap-3.5 text-xs">
          {/* AGC Compressor Controls */}
          <div className="bg-[#101217] border border-[#2c303e] rounded-lg p-3.5 space-y-2.5">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-red-400" />
              <span>Broadcast AGC Compressor</span>
            </span>

            <div className="space-y-2 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Threshold:</span>
                  <span className="font-mono text-white font-bold">{settings.agc.threshold} dB</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="0"
                  step="1"
                  value={settings.agc.threshold}
                  onChange={(e) => updateAgcParam('threshold', parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Compression Ratio:</span>
                  <span className="font-mono text-white font-bold">{settings.agc.ratio.toFixed(1)}:1</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="12.0"
                  step="0.5"
                  value={settings.agc.ratio}
                  onChange={(e) => updateAgcParam('ratio', parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span>Attack Time:</span>
                  <span className="font-mono text-white font-bold">{(settings.agc.attack * 1000).toFixed(0)} ms</span>
                </div>
                <input
                  type="range"
                  min="0.002"
                  max="0.05"
                  step="0.002"
                  value={settings.agc.attack}
                  onChange={(e) => updateAgcParam('attack', parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* EBU R128 LUFS Loudness Monitor */}
          <div className="bg-[#101217] border border-[#2c303e] rounded-lg p-3.5 space-y-2.5">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>EBU R128 / ITU-R BS.1770 Loudness</span>
            </span>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#161820] border border-[#2c303e] rounded p-2">
                <div className="text-[10px] text-slate-400">Integrated Target</div>
                <div className="font-mono text-lg font-bold text-emerald-400">
                  {lufsMetrics.integratedLufs.toFixed(1)} LUFS
                </div>
                <div className="text-[9px] text-emerald-500 font-semibold">BROADCAST COMPLIANT</div>
              </div>

              <div className="bg-[#161820] border border-[#2c303e] rounded p-2">
                <div className="text-[10px] text-slate-400">Momentary Readout</div>
                <div className="font-mono text-lg font-bold text-sky-400">
                  {lufsMetrics.momentaryLufs.toFixed(1)} LUFS
                </div>
                <div className="text-[9px] text-slate-400">Short-Term: {lufsMetrics.shortTermLufs.toFixed(1)}</div>
              </div>
            </div>

            <div className="bg-[#161820] border border-[#2c303e] rounded p-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">AGC Gain Reduction:</span>
              <span className="font-mono text-xs font-bold text-amber-400">
                {lufsMetrics.gainReductionDb.toFixed(1)} dB
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-[#2c303e]">
          <div className="text-[11px] text-slate-400">
            Real-time DSP applied to master program (PGM) broadcast stream.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded font-bold text-xs shadow cursor-pointer"
          >
            Save & Close Rack
          </button>
        </div>
      </div>
    </div>
  );
};
