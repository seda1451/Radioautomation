import React, { useState } from 'react';
import { Sparkles, Play, Plus, X, Zap, Volume2, Music, Sliders } from 'lucide-react';
import { FxSynthPreset } from '../types';
import { audioEngine } from '../services/audioEngine';

interface BroadcastSoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const BroadcastSoundboardModal: React.FC<BroadcastSoundboardModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [presets, setPresets] = useState<FxSynthPreset[]>([
    {
      id: 'fx-1',
      name: 'Cyber Laser Sweeper',
      type: 'LASER_SWEEP',
      color: 'rose',
      durationSec: 0.5,
      baseFreqHz: 3200,
      modFreqHz: 80,
      decaySec: 0.45,
      noiseAmount: 0.1,
    },
    {
      id: 'fx-2',
      name: 'Sub-Bass Drop Impact',
      type: 'SUB_DROP',
      color: 'purple',
      durationSec: 1.2,
      baseFreqHz: 160,
      modFreqHz: 32,
      decaySec: 1.2,
      noiseAmount: 0.0,
    },
    {
      id: 'fx-3',
      name: 'White Noise Whoosh Transition',
      type: 'WHITE_WHOOSH',
      color: 'teal',
      durationSec: 0.9,
      baseFreqHz: 200,
      modFreqHz: 4500,
      decaySec: 0.9,
      noiseAmount: 1.0,
    },
    {
      id: 'fx-4',
      name: 'Top-40 Radio Stinger Fanfare',
      type: 'RADIO_STING',
      color: 'amber',
      durationSec: 0.6,
      baseFreqHz: 440,
      modFreqHz: 1100,
      decaySec: 0.6,
      noiseAmount: 0.0,
    },
    {
      id: 'fx-5',
      name: 'Turntable Vinyl Brake Stop',
      type: 'VINYL_BRAKE',
      color: 'blue',
      durationSec: 0.65,
      baseFreqHz: 800,
      modFreqHz: 20,
      decaySec: 0.65,
      noiseAmount: 0.2,
    },
    {
      id: 'fx-6',
      name: 'Top of Hour Chime Fanfare',
      type: 'CHIME_FANFARE',
      color: 'green',
      durationSec: 0.85,
      baseFreqHz: 523,
      modFreqHz: 1046,
      decaySec: 0.85,
      noiseAmount: 0.0,
    },
  ]);

  // Live Sound Generator Customizer
  const [selectedType, setSelectedType] = useState<FxSynthPreset['type']>('LASER_SWEEP');
  const [customPitch, setCustomPitch] = useState(3000);
  const [customDecay, setCustomDecay] = useState(0.5);

  if (!isOpen) return null;

  const handleTriggerFx = (p: FxSynthPreset) => {
    audioEngine.playSynthesizedFx({
      type: p.type,
      baseFreqHz: p.baseFreqHz,
      decaySec: p.decaySec,
      noiseAmount: p.noiseAmount,
    });
    onShowToast(`Fired FX: ${p.name}`);
  };

  const handleTestCustomSynth = () => {
    audioEngine.playSynthesizedFx({
      type: selectedType,
      baseFreqHz: customPitch,
      decaySec: customDecay,
    });
  };

  const handleSaveCustomToSoundboard = () => {
    const newPreset: FxSynthPreset = {
      id: `fx-${Date.now()}`,
      name: `Custom ${selectedType.replace('_', ' ')}`,
      type: selectedType,
      color: 'amber',
      durationSec: customDecay,
      baseFreqHz: customPitch,
      modFreqHz: Math.round(customPitch / 4),
      decaySec: customDecay,
      noiseAmount: 0.5,
    };
    setPresets((prev) => [...prev, newPreset]);
    onShowToast('Saved custom synthesized FX to soundboard');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#161820] border border-[#2c303e] rounded-xl p-6 w-full max-w-3xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Broadcast FX & Soundboard Synthesizer</h3>
              <p className="text-[11px] text-slate-400">
                Real-time Web Audio synthesized radio sweeps, sub-drops, laser drops, and vinyl brakes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6-Pad Studio Instant Soundboard Matrix */}
        <div className="grid grid-cols-3 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleTriggerFx(preset)}
              className="bg-[#101217] hover:bg-[#1c202b] border border-[#2c303e] hover:border-rose-500/60 p-4 rounded-xl text-left transition transform active:scale-95 shadow cursor-pointer group flex flex-col justify-between h-28"
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-white text-xs group-hover:text-rose-300">
                  {preset.name}
                </span>
                <span className="w-6 h-6 rounded-full bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition">
                  <Play className="w-3 h-3 fill-current" />
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>:{preset.durationSec}s length</span>
                <span className="bg-[#1e2230] px-1.5 py-0.5 rounded text-rose-300">
                  {preset.type.replace('_', ' ')}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Real-time Synthesizer Sound Designer Rack */}
        <div className="bg-[#101217] border border-[#2c303e] rounded-lg p-3.5 space-y-3 text-xs">
          <div className="flex justify-between items-center font-bold text-rose-400">
            <span className="flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive FM Radio FX Designer</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Synthesis Model</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full bg-[#161820] border border-[#2c303e] rounded px-2 py-1.5 text-gray-200"
              >
                <option value="LASER_SWEEP">Laser Sweep / Down-Pitch</option>
                <option value="SUB_DROP">Sub-Bass 808 Drop</option>
                <option value="WHITE_WHOOSH">Bandpassed White Noise Whoosh</option>
                <option value="RADIO_STING">Harmonic Brass Stinger</option>
                <option value="VINYL_BRAKE">Motor Vinyl Power Down</option>
                <option value="CHIME_FANFARE">Glockenspiel Jingle</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 font-semibold mb-1">
                <span>Base Frequency:</span>
                <span className="font-mono text-rose-400">{customPitch} Hz</span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={customPitch}
                onChange={(e) => setCustomPitch(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 font-semibold mb-1">
                <span>Decay / Release:</span>
                <span className="font-mono text-rose-400">{customDecay.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.05"
                value={customDecay}
                onChange={(e) => setCustomDecay(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-1">
            <button
              type="button"
              onClick={handleTestCustomSynth}
              className="bg-[#252836] hover:bg-[#313547] text-rose-300 font-bold px-4 py-1.5 rounded flex items-center space-x-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Audition Synthesizer</span>
            </button>
            <button
              type="button"
              onClick={handleSaveCustomToSoundboard}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-1.5 rounded flex items-center space-x-1.5 cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Soundboard Grid</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#2c303e]">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded font-semibold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
