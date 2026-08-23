import React, { useState, useEffect } from 'react';
import { ListChecks, X, Check, Music } from 'lucide-react';
import { CustomPlaylist, LibrarySong } from '../types';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  editingPlaylist: CustomPlaylist | null;
  library: LibrarySong[];
  onClose: () => void;
  onSavePlaylist: (playlistData: { id?: number; name: string; desc: string; tracks: LibrarySong[] }) => void;
  onShowToast: (msg: string) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  editingPlaylist,
  library,
  onClose,
  onSavePlaylist,
  onShowToast,
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (editingPlaylist) {
      setName(editingPlaylist.name);
      setDesc(editingPlaylist.desc);
      setSelectedIds(editingPlaylist.tracks.map((t) => t.id));
    } else {
      setName('');
      setDesc('');
      setSelectedIds([]);
    }
  }, [editingPlaylist, isOpen]);

  if (!isOpen) return null;

  const toggleTrack = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === library.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(library.map((s) => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Please enter a playlist name');
      return;
    }
    if (selectedIds.length === 0) {
      onShowToast('Please select at least one track');
      return;
    }

    const selectedTracks = library.filter((s) => selectedIds.includes(s.id));

    onSavePlaylist({
      id: editingPlaylist ? editingPlaylist.id : Date.now(),
      name: name.trim(),
      desc: desc.trim() || 'Station Rotation Schedule',
      tracks: selectedTracks,
    });

    onClose();
    onShowToast(`Playlist "${name}" saved!`);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#1a1c23] border border-[#2c303e] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2">
            <ListChecks className="w-5 h-5 text-teal-500" />
            <h3 className="font-bold text-base text-white">
              {editingPlaylist ? 'Edit Custom Playlist' : 'Create Custom Playlist'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Playlist Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Friday Night Rock Rotation"
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Description / Genre</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Upbeat indie and rock hits"
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-400 font-semibold">
                Select Tracks from Library ({selectedIds.length} chosen)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[10px] text-teal-400 hover:underline cursor-pointer"
              >
                {selectedIds.length === library.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto bg-[#121316] border border-[#2c303e] rounded-lg p-2 space-y-1">
              {library.map((song) => {
                const isSelected = selectedIds.includes(song.id);
                return (
                  <label
                    key={song.id}
                    className={`flex items-center space-x-2.5 p-1.5 rounded cursor-pointer transition ${
                      isSelected ? 'bg-teal-950/40 text-white' : 'hover:bg-[#1a1c23] text-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTrack(song.id)}
                      className="accent-teal-600 rounded cursor-pointer"
                    />
                    <div className="truncate flex-1">
                      <span className="font-semibold">{song.title}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">- {song.artist}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{song.dur}</span>
                  </label>
                );
              })}
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
              className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer glow-teal"
            >
              <Check className="w-4 h-4" />
              <span>Save Playlist</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
