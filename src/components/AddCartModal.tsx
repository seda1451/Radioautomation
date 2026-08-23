import React, { useState } from 'react';
import { Radio, X, Check } from 'lucide-react';
import { CartItem } from '../types';

interface AddCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddCart: (cart: CartItem) => void;
  onShowToast: (msg: string) => void;
}

export const AddCartModal: React.FC<AddCartModalProps> = ({
  isOpen,
  onClose,
  onConfirmAddCart,
  onShowToast,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [soundType, setSoundType] = useState<CartItem['soundType']>('jingle1');
  const [key, setKey] = useState('7');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Please enter a cart title');
      return;
    }

    const newCart: CartItem = {
      id: Date.now(),
      key,
      title: title.trim().toUpperCase(),
      subtitle: subtitle.trim() || 'Custom Sound Cart',
      color: 'blue',
      soundType,
    };

    onConfirmAddCart(newCart);
    onClose();
    onShowToast(`Added Cart Pad #${key}: "${title}"`);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#1a1c23] border border-[#2c303e] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-base text-white">Add Instant Cart Wall Sound</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Pad Title (Short) *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BREAKING NEWS"
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Subtitle / Sponsor Name</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Urgent Update Stinger"
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Synthesized Sound Stinger</label>
              <select
                value={soundType}
                onChange={(e) => setSoundType(e.target.value as CartItem['soundType'])}
                className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
              >
                <option value="jingle1">Jingle 1 (Chime Fanfare)</option>
                <option value="jingle2">Power ID (Synth Sweep & Sub)</option>
                <option value="sponsor">Sponsor (Warm Marimba)</option>
                <option value="sweeper">Sweeper (Noise Bandpass)</option>
                <option value="laser">Laser Blast (Club Drop)</option>
                <option value="airhorn">Air Horn (Hype Brass)</option>
                <option value="chime">Top of Hour Chime</option>
                <option value="scratch">Vinyl Scratch</option>
                <option value="news">News Fanfare</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Keyboard Hotkey</label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((k) => (
                  <option key={k} value={k}>
                    Key [{k}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-[#2c303e]">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer glow-blue"
            >
              <Check className="w-4 h-4" />
              <span>Add Cart Pad</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
