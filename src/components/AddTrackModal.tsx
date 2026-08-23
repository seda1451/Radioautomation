import React, { useState } from 'react';
import { PlusCircle, X, Check } from 'lucide-react';
import { QueueItem } from '../types';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAdd: (item: Omit<QueueItem, 'id' | 'isLive'>) => void;
  onShowToast: (msg: string) => void;
}

export const AddTrackModal: React.FC<AddTrackModalProps> = ({
  isOpen,
  onClose,
  onConfirmAdd,
  onShowToast,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [dur, setDur] = useState('3:30');
  const [intro, setIntro] = useState(':00');
  const [type, setType] = useState('CLOUD FRESH');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Please enter a track title');
      return;
    }

    const parts = dur.split(':');
    const durSeconds = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : 210;

    let color = 'text-blue-400';
    if (type.includes('FRESH')) color = 'text-amber-400';
    else if (type.includes('2010')) color = 'text-blue-400';
    else if (type.includes('SPONSOR')) color = 'text-pink-400';
    else if (type.includes('BUMPER')) color = 'text-teal-400';

    onConfirmAdd({
      time: '5:30 PM',
      title: title.trim(),
      artist: artist.trim() || 'Broadcast Artist',
      intro: intro.trim(),
      dur: dur.trim(),
      durSeconds,
      type,
      color,
      category: 'MUSIC',
    });

    setTitle('');
    setArtist('');
    onClose();
    onShowToast(`Added "${title}" to Playout Queue`);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#1a1c23] border border-[#2c303e] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-base text-white">Add Item to Playout Log</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Track Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blinding Lights"
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Artist / Source</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. The Weeknd"
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Duration (MM:SS)</label>
              <input
                type="text"
                value={dur}
                onChange={(e) => setDur(e.target.value)}
                placeholder="3:30"
                className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Intro Ramp (:SS)</label>
              <input
                type="text"
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder=":00"
                className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Category Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            >
              <option value="CLOUD FRESH">CLOUD FRESH</option>
              <option value="CLOUD 2010S">CLOUD 2010S</option>
              <option value="SONG SPONSOR">SONG SPONSOR</option>
              <option value="BUMPERS">BUMPERS</option>
              <option value="STATION ID">STATION ID</option>
              <option value="LOCAL UPLOAD">LOCAL UPLOAD</option>
            </select>
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
              <span>Add to Queue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
