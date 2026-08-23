import React, { useState } from 'react';
import { Calendar, Clock, X, Check, Sparkles, Plus } from 'lucide-react';
import { ProgramClock } from '../types';
import { INITIAL_PROGRAM_CLOCKS } from '../data/initialState';

interface ProgramSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyClockFormat: (clock: ProgramClock) => void;
  onShowToast: (msg: string) => void;
}

export const ProgramSchedulerModal: React.FC<ProgramSchedulerModalProps> = ({
  isOpen,
  onClose,
  onApplyClockFormat,
  onShowToast,
}) => {
  const [clocks, setClocks] = useState<ProgramClock[]>(INITIAL_PROGRAM_CLOCKS);
  const [selectedClockId, setSelectedClockId] = useState<string>(clocks[0]?.id || '');

  if (!isOpen) return null;

  const currentClock = clocks.find((c) => c.id === selectedClockId) || clocks[0];

  const handleApply = () => {
    if (currentClock) {
      onApplyClockFormat(currentClock);
      onClose();
      onShowToast(`Applied broadcast clock: "${currentClock.name}"`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#1a1c23] border border-[#2c303e] rounded-xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-base text-white">Broadcast Program Clock & Rotation Scheduler</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clocks Selector */}
        <div className="flex space-x-2 border-b border-[#2c303e] pb-3">
          {clocks.map((clk) => (
            <button
              key={clk.id}
              onClick={() => setSelectedClockId(clk.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                selectedClockId === clk.id
                  ? 'bg-blue-600 text-white shadow glow-blue'
                  : 'bg-[#121316] text-slate-400 hover:text-white border border-[#2c303e]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{clk.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({clk.hourRange})</span>
            </button>
          ))}
        </div>

        {/* Clock Wheel Slots */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>HOUR ROTATION WHEEL (60 MINUTES)</span>
            <span>{currentClock.slots.length} SCHEDULED BLOCKS</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 bg-[#121316] border border-[#2c303e] rounded-xl p-3">
            {currentClock.slots.map((slot, index) => (
              <div
                key={index}
                className="bg-[#1a1c23] border border-[#2c303e] p-2.5 rounded-lg flex items-center justify-between text-xs transition hover:border-[#3b82f6]/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="font-mono text-xs font-bold text-blue-400 bg-[#121316] px-2 py-0.5 rounded border border-[#2c303e]">
                    :{slot.minute < 10 ? '0' : ''}
                    {slot.minute}
                  </div>
                  <div>
                    <div className="font-bold text-gray-200">{slot.category}</div>
                    <div className="text-[10px] text-slate-400">{slot.description}</div>
                  </div>
                </div>

                <div className={`w-3 h-3 rounded-full ${slot.color || 'bg-blue-500'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-[#2c303e]">
          <div className="text-[11px] text-slate-400">
            Applying this clock will balance your active music rotation & schedule markers.
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Clock to Queue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
