import React, { useState, useEffect } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { QueueItem } from '../types';

interface EditTrackModalProps {
  isOpen: boolean;
  item: QueueItem | null;
  index: number | null;
  onClose: () => void;
  onConfirmEdit: (index: number, updatedItem: Partial<QueueItem>) => void;
  onShowToast: (msg: string) => void;
}

export const EditTrackModal: React.FC<EditTrackModalProps> = ({
  isOpen,
  item,
  index,
  onClose,
  onConfirmEdit,
  onShowToast,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [dur, setDur] = useState('');
  const [intro, setIntro] = useState('');
  const [type, setType] = useState('CLOUD FRESH');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setArtist(item.artist);
      setDur(item.dur);
      setIntro(item.intro || ':00');
      setType(item.type);
    }
  }, [item]);

  if (!isOpen || !item || index === null) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = dur.split(':');
    const durSeconds = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : item.durSeconds;

    onConfirmEdit(index, {
      title: title.trim(),
      artist: artist.trim(),
      dur: dur.trim(),
      durSeconds,
      intro: intro.trim(),
      type: item.isLive ? 'ON AIR' : type,
    });

    onClose();
    onShowToast(`Updated track "${title}"`);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#1a1c23] border border-[#2c303e] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2">
            <Pencil className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-base text-white">Edit Queue Track</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Track Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
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
                className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Intro Ramp</label>
              <input
                type="text"
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {!item.isLive && (
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
                <option value="LOCAL UPLOAD">LOCAL UPLOAD</option>
                <option value="POP LIBRARY">POP LIBRARY</option>
              </select>
            </div>
          )}

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
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
