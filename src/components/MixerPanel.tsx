import React from 'react';
import { Plus, Radio, Sparkles, Volume2, Mic } from 'lucide-react';
import { MixerChannelState, CartItem } from '../types';

interface MixerPanelProps {
  faders: MixerChannelState;
  meterLevels: { talk: number; playout: number; elements: number; carts: number; pgm: number };
  carts: CartItem[];
  currentTrackTitle: string;
  onUpdateFader: (channel: keyof MixerChannelState, val: number) => void;
  onPlayCart: (cart: CartItem) => void;
  onOpenAddCartModal: () => void;
}

export const MixerPanel: React.FC<MixerPanelProps> = ({
  faders,
  meterLevels,
  carts,
  currentTrackTitle,
  onUpdateFader,
  onPlayCart,
  onOpenAddCartModal,
}) => {
  const getDbLabel = (val: number): string => {
    if (val > 85) return '+3 dB';
    if (val > 70) return '0 dB';
    if (val > 50) return '-6 dB';
    if (val > 30) return '-12 dB';
    if (val > 10) return '-24 dB';
    return '-inf dB';
  };

  const getMeterColorClass = (channel: string) => {
    if (channel === 'playout' || channel === 'pgm') {
      return 'bg-gradient-to-t from-emerald-500 via-amber-500 to-red-500';
    }
    if (channel === 'talk') {
      return 'bg-gradient-to-t from-amber-500 to-red-500';
    }
    return 'bg-gradient-to-t from-blue-500 to-indigo-400';
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-5 select-none bg-[#1a1c23]">
      {/* 5-FADER MIXER CONSOLE */}
      <div className="grid grid-cols-5 gap-2.5 h-84 bg-[#121316] p-3 rounded-xl border border-[#2c303e] shadow-inner">
        {/* FADER 1: TALK */}
        <div className="flex flex-col items-center justify-between py-1">
          <div className="text-center">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">TALK</span>
            <div className="text-[9px] text-slate-400 font-medium leading-tight flex items-center justify-center space-x-0.5">
              <Mic className="w-2.5 h-2.5 text-amber-400" />
              <span>host mic</span>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono">0—</div>

          {/* Fader Track */}
          <div className="relative h-44 w-10 flex items-center justify-center py-2">
            {/* LED VU Meter Bar */}
            <div className="absolute w-2 h-full bg-[#232631] rounded-full overflow-hidden flex flex-col justify-end border border-[#2c303e]">
              <div
                className={`w-full ${getMeterColorClass('talk')} transition-all duration-75`}
                style={{ height: `${meterLevels.talk}%` }}
              />
            </div>

            {/* Hidden native vertical input range */}
            <input
              type="range"
              min="0"
              max="100"
              value={faders.talk}
              onChange={(e) => onUpdateFader('talk', Number(e.target.value))}
              className="absolute h-40 w-10 opacity-0 cursor-pointer z-20"
              style={{ transform: 'rotate(-90deg)' }}
            />

            {/* Metallic Knob Thumb */}
            <div
              className="absolute w-7 h-4 bg-gradient-to-b from-gray-200 to-gray-400 border border-gray-600 rounded-sm shadow-md pointer-events-none transition-all duration-75 flex items-center justify-center"
              style={{ bottom: `${faders.talk * 0.85}%` }}
            >
              <div className="w-4 h-0.5 bg-red-600"></div>
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-400 font-semibold">
            {getDbLabel(faders.talk)}
          </span>
        </div>

        {/* FADER 2: PLAYOUT */}
        <div className="flex flex-col items-center justify-between py-1">
          <div className="text-center w-full px-1">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">PLAYOUT</span>
            <div className="text-[9px] text-slate-400 font-medium leading-tight truncate">
              {currentTrackTitle || 'music'}
            </div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono">+3—</div>

          <div className="relative h-44 w-10 flex items-center justify-center py-2">
            <div className="absolute w-2 h-full bg-[#232631] rounded-full overflow-hidden flex flex-col justify-end border border-[#2c303e]">
              <div
                className={`w-full ${getMeterColorClass('playout')} transition-all duration-75`}
                style={{ height: `${meterLevels.playout}%` }}
              />
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={faders.playout}
              onChange={(e) => onUpdateFader('playout', Number(e.target.value))}
              className="absolute h-40 w-10 opacity-0 cursor-pointer z-20"
              style={{ transform: 'rotate(-90deg)' }}
            />

            <div
              className="absolute w-7 h-4 bg-gradient-to-b from-gray-200 to-gray-400 border border-gray-600 rounded-sm shadow-md pointer-events-none transition-all duration-75 flex items-center justify-center"
              style={{ bottom: `${faders.playout * 0.85}%` }}
            >
              <div className="w-4 h-0.5 bg-blue-600"></div>
            </div>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            {getDbLabel(faders.playout)}
          </span>
        </div>

        {/* FADER 3: ELEMENTS */}
        <div className="flex flex-col items-center justify-between py-1">
          <div className="text-center">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">ELEMENTS</span>
            <div className="text-[9px] text-slate-400 font-medium leading-tight">assets</div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono">0—</div>

          <div className="relative h-44 w-10 flex items-center justify-center py-2">
            <div className="absolute w-2 h-full bg-[#232631] rounded-full overflow-hidden flex flex-col justify-end border border-[#2c303e]">
              <div
                className={`w-full ${getMeterColorClass('elements')} transition-all duration-75`}
                style={{ height: `${meterLevels.elements}%` }}
              />
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={faders.elements}
              onChange={(e) => onUpdateFader('elements', Number(e.target.value))}
              className="absolute h-40 w-10 opacity-0 cursor-pointer z-20"
              style={{ transform: 'rotate(-90deg)' }}
            />

            <div
              className="absolute w-7 h-4 bg-gradient-to-b from-gray-200 to-gray-400 border border-gray-600 rounded-sm shadow-md pointer-events-none transition-all duration-75 flex items-center justify-center"
              style={{ bottom: `${faders.elements * 0.85}%` }}
            >
              <div className="w-4 h-0.5 bg-teal-600"></div>
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-400 font-semibold">
            {getDbLabel(faders.elements)}
          </span>
        </div>

        {/* FADER 4: CARTS */}
        <div className="flex flex-col items-center justify-between py-1">
          <div className="text-center">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">CARTS</span>
            <div className="text-[9px] text-slate-400 font-medium leading-tight">jingles</div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono">0—</div>

          <div className="relative h-44 w-10 flex items-center justify-center py-2">
            <div className="absolute w-2 h-full bg-[#232631] rounded-full overflow-hidden flex flex-col justify-end border border-[#2c303e]">
              <div
                className={`w-full ${getMeterColorClass('carts')} transition-all duration-75`}
                style={{ height: `${meterLevels.carts}%` }}
              />
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={faders.carts}
              onChange={(e) => onUpdateFader('carts', Number(e.target.value))}
              className="absolute h-40 w-10 opacity-0 cursor-pointer z-20"
              style={{ transform: 'rotate(-90deg)' }}
            />

            <div
              className="absolute w-7 h-4 bg-gradient-to-b from-gray-200 to-gray-400 border border-gray-600 rounded-sm shadow-md pointer-events-none transition-all duration-75 flex items-center justify-center"
              style={{ bottom: `${faders.carts * 0.85}%` }}
            >
              <div className="w-4 h-0.5 bg-purple-600"></div>
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-400 font-semibold">
            {getDbLabel(faders.carts)}
          </span>
        </div>

        {/* FADER 5: PGM (PROGRAM) */}
        <div className="flex flex-col items-center justify-between py-1">
          <div className="text-center">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">PGM</span>
            <div className="text-[9px] text-slate-400 font-medium leading-tight">master bus</div>
          </div>

          <div className="text-[9px] text-slate-500 font-mono">0—</div>

          <div className="relative h-44 w-10 flex items-center justify-center py-2">
            <div className="absolute w-2 h-full bg-[#232631] rounded-full overflow-hidden flex flex-col justify-end border border-[#2c303e]">
              <div
                className={`w-full ${getMeterColorClass('pgm')} transition-all duration-75`}
                style={{ height: `${meterLevels.pgm}%` }}
              />
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={faders.pgm}
              onChange={(e) => onUpdateFader('pgm', Number(e.target.value))}
              className="absolute h-40 w-10 opacity-0 cursor-pointer z-20"
              style={{ transform: 'rotate(-90deg)' }}
            />

            <div
              className="absolute w-7 h-4 bg-gradient-to-b from-gray-200 to-gray-400 border border-gray-600 rounded-sm shadow-md pointer-events-none transition-all duration-75 flex items-center justify-center"
              style={{ bottom: `${faders.pgm * 0.85}%` }}
            >
              <div className="w-4 h-0.5 bg-red-600"></div>
            </div>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            {getDbLabel(faders.pgm)}
          </span>
        </div>
      </div>

      {/* CONSOLE ACTION BUTTONS */}
      <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold">
        <button className="bg-[#121316] hover:bg-[#232631] border border-[#2c303e] py-2 rounded text-gray-300 flex flex-col items-center justify-center shadow-sm cursor-pointer transition">
          <span className="text-[9px] text-slate-400">CUE</span>
          <span className="text-white font-bold">ON</span>
        </button>
        <button className="bg-blue-600 hover:bg-blue-500 border border-blue-500 py-2 rounded text-white flex flex-col items-center justify-center shadow-sm cursor-pointer transition glow-blue">
          <span className="text-[9px] text-blue-200">AUTO</span>
          <span className="font-bold">ON</span>
        </button>
        <button className="bg-[#121316] hover:bg-[#232631] border border-[#2c303e] py-2 rounded text-gray-300 flex flex-col items-center justify-center shadow-sm cursor-pointer transition">
          <span className="text-[9px] text-slate-400">OVL</span>
          <span className="text-white font-bold">OFF</span>
        </button>
        <button className="bg-[#121316] hover:bg-[#232631] border border-[#2c303e] py-2 rounded text-gray-300 flex flex-col items-center justify-center shadow-sm cursor-pointer transition">
          <span className="text-[9px] text-slate-400">MON</span>
          <span className="text-white font-bold">PGM</span>
        </button>
      </div>

      {/* INSTANT CARTS WALL */}
      <div className="bg-[#121316] p-3 rounded-xl border border-[#2c303e] space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span className="tracking-wider uppercase">INSTANT CARTS (HOTKEYS 1-6)</span>
          </div>
          <button
            onClick={onOpenAddCartModal}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Cart</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {carts.length === 0 ? (
            <div className="col-span-3 py-6 px-3 text-center text-slate-400 border border-dashed border-[#2c303e] rounded-lg">
              <span className="text-[11px] font-semibold text-gray-400 block">Žádné předvolené cart zvuky</span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Přidejte jingly nebo efekty kliknutím na <span className="text-blue-400 font-semibold">+ Add Cart</span>.
              </p>
            </div>
          ) : (
            carts.map((cart) => (
              <button
                key={cart.id}
                onClick={() => onPlayCart(cart)}
                className="bg-[#1a1c23] hover:bg-[#232631] active:scale-95 border border-[#2c303e] p-2.5 rounded-lg text-left transition group cursor-pointer shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-extrabold text-blue-400 group-hover:text-blue-300">
                    {cart.title}
                  </span>
                  <span className="text-[9px] bg-[#121316] text-slate-400 px-1 rounded font-mono border border-[#2c303e]">
                    #{cart.key}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 truncate">
                  {cart.subtitle}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
