import React from 'react';
import { Plus, ListMusic, Play, Pencil, Trash2 } from 'lucide-react';
import { CustomPlaylist } from '../types';

interface PlaylistsPanelProps {
  playlists: CustomPlaylist[];
  activePlaylistName: string;
  onLoadPlaylist: (playlist: CustomPlaylist) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (playlist: CustomPlaylist) => void;
  onDeletePlaylist: (id: number) => void;
}

export const PlaylistsPanel: React.FC<PlaylistsPanelProps> = ({
  playlists,
  activePlaylistName,
  onLoadPlaylist,
  onOpenCreateModal,
  onOpenEditModal,
  onDeletePlaylist,
}) => {
  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 select-none bg-[#1a1c23]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <ListMusic className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Custom Playlists ({playlists.length})
          </span>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded text-xs font-bold shadow flex items-center space-x-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Playlist</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-400">
        Create custom station rotations, daypart schedules, or specialty shows and load them instantly onto the On-Air queue.
      </p>

      <div className="space-y-3 mt-1 overflow-y-auto">
        {playlists.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400 border border-dashed border-[#2c303e] rounded-xl">
            <ListMusic className="w-8 h-8 text-teal-500/50 mx-auto mb-2 stroke-1" />
            <span className="text-sm font-semibold text-gray-300 block">Žádné uložené playlisty</span>
            <p className="text-xs text-slate-500 mt-1">
              Vytvořte si vlastní rotace, denní bloky nebo speciály kliknutím na tlačítko <span className="text-teal-400 font-semibold">New Playlist</span> výše.
            </p>
          </div>
        ) : (
          playlists.map((pl) => {
          const isCurrentlyActive = activePlaylistName === pl.name;
          return (
            <div
              key={pl.id}
              className={`bg-[#121316] border p-3 rounded-lg space-y-2.5 transition shadow-sm ${
                isCurrentlyActive
                  ? 'border-teal-500/80 bg-teal-950/20'
                  : 'border-[#2c303e] hover:border-[#3b82f6]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-white truncate">{pl.name}</h4>
                    {isCurrentlyActive && (
                      <span className="text-[9px] bg-teal-950 text-teal-300 border border-teal-700 px-1.5 rounded font-bold uppercase">
                        ON AIR
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {pl.desc} • <span className="text-gray-300 font-semibold">{pl.tracks.length} tracks</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => onLoadPlaylist(pl)}
                    className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded text-[11px] font-bold shadow flex items-center space-x-1 cursor-pointer transition glow-teal"
                    title="Load onto Playout Queue"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Load</span>
                  </button>

                  <button
                    onClick={() => onOpenEditModal(pl)}
                    className="bg-[#232631] hover:bg-[#2c303e] text-slate-300 hover:text-white px-2 py-1 rounded text-xs border border-[#2c303e] cursor-pointer transition"
                    title="Edit Playlist"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onDeletePlaylist(pl.id)}
                    className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-red-950/40 cursor-pointer transition"
                    title="Delete Playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 truncate border-t border-[#2c303e]/60 pt-1.5 font-mono">
                <span className="text-slate-400 font-sans font-semibold">Tracks: </span>
                {pl.tracks.map((t) => t.title).join(', ')}
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
