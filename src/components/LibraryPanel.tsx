import React, { useState } from 'react';
import { Search, Plus, CloudUpload, Music, Play, Disc } from 'lucide-react';
import { LibrarySong } from '../types';

interface LibraryPanelProps {
  library: LibrarySong[];
  onAddSongToQueue: (song: LibrarySong) => void;
  onOpenUploadModal: () => void;
  onOpenAddTrackModal: () => void;
  onPreviewSong: (song: LibrarySong) => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
  library,
  onAddSongToQueue,
  onOpenUploadModal,
  onOpenAddTrackModal,
  onPreviewSong,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = ['ALL', 'POP', 'DANCE', 'ROCK', 'ALT', 'JINGLE', 'SPONSOR', 'LOCAL'];

  const filtered = library.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'ALL' ||
      s.type.toUpperCase() === activeCategory ||
      s.category.toUpperCase() === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3.5 select-none bg-[#1a1c23]">
      {/* Library Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Music className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Audio Database ({library.length})
          </span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onOpenUploadModal}
            className="bg-orange-600 hover:bg-orange-500 text-white px-2.5 py-1 rounded text-xs font-bold shadow flex items-center space-x-1 cursor-pointer"
          >
            <CloudUpload className="w-3 h-3" />
            <span>Upload MP3</span>
          </button>
          <button
            onClick={onOpenAddTrackModal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-xs font-bold shadow flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Item</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, artist, or year..."
          className="w-full bg-[#121316] border border-[#2c303e] rounded pl-9 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-0.5 rounded font-semibold whitespace-nowrap transition cursor-pointer border ${
              activeCategory === cat
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-[#121316] text-slate-400 hover:text-white border-[#2c303e]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Library Tracks List */}
      <div className="space-y-1.5 mt-1 overflow-y-auto flex-1 max-h-[460px]">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No tracks found matching "{search}"
          </div>
        ) : (
          filtered.map((song) => (
            <div
              key={song.id}
              className="bg-[#121316] hover:bg-[#232631] border border-[#2c303e] p-2.5 rounded-lg flex items-center justify-between text-xs transition group"
            >
              <div className="flex items-center space-x-2.5 flex-1 min-w-0 pr-2">
                <button
                  onClick={() => onPreviewSong(song)}
                  className="w-7 h-7 rounded bg-[#1a1c23] hover:bg-blue-600 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition cursor-pointer"
                  title="Preview Audio"
                >
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </button>
                <div className="min-w-0">
                  <div className="font-bold text-gray-200 truncate">{song.title}</div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center space-x-2">
                    <span>{song.artist}</span>
                    <span>•</span>
                    <span className="font-mono">{song.dur}</span>
                    <span>•</span>
                    <span className="bg-[#1a1c23] px-1 rounded text-blue-400 font-semibold border border-[#2c303e]">
                      {song.type}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onAddSongToQueue(song)}
                className="bg-blue-600/80 hover:bg-blue-600 text-white px-2.5 py-1 rounded text-[11px] font-bold shadow flex items-center space-x-1 shrink-0 cursor-pointer transition"
                title="Add to Playout Queue"
              >
                <Plus className="w-3 h-3" />
                <span>Queue</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
