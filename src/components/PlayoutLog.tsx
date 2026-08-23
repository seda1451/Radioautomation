import React from 'react';
import {
  ListMusic,
  Play,
  Pause,
  Square,
  FastForward,
  Shuffle,
  Radio,
  CloudUpload,
  Plus,
  Calendar,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Headphones,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { QueueItem, AutomationMode } from '../types';

interface PlayoutLogProps {
  playlist: QueueItem[];
  isPlaying: boolean;
  autoPlayoutActive: boolean;
  automationMode: AutomationMode;
  activePlaylistName: string;
  onToggleAutoPlayout: () => void;
  onSetAutomationMode: (mode: AutomationMode) => void;
  onToggleMasterPlay: () => void;
  onStopMasterPlay: () => void;
  onPauseMasterPlay: () => void;
  onSkipSong: () => void;
  onTriggerSegue: () => void;
  onMoveItem: (index: number, direction: number) => void;
  onRemoveItem: (index: number) => void;
  onSkipToTrack: (index: number) => void;
  onOpenEditModal: (index: number) => void;
  onOpenAddModal: () => void;
  onOpenUploadModal: () => void;
  onOpenProgramModal: () => void;
  onOpenMusicScheduler: () => void;
  onOpenAiVoiceTrack: () => void;
  onOpenSegueEditorForTrack: (index: number) => void;
  onCuePreview: (track: QueueItem) => void;
  onShowToast: (msg: string) => void;
}

export const PlayoutLog: React.FC<PlayoutLogProps> = ({
  playlist,
  isPlaying,
  autoPlayoutActive,
  automationMode,
  activePlaylistName,
  onToggleAutoPlayout,
  onSetAutomationMode,
  onToggleMasterPlay,
  onStopMasterPlay,
  onPauseMasterPlay,
  onSkipSong,
  onTriggerSegue,
  onMoveItem,
  onRemoveItem,
  onSkipToTrack,
  onOpenEditModal,
  onOpenAddModal,
  onOpenUploadModal,
  onOpenProgramModal,
  onOpenMusicScheduler,
  onOpenAiVoiceTrack,
  onOpenSegueEditorForTrack,
  onCuePreview,
  onShowToast,
}) => {
  const nextTrack = playlist.find((item, idx) => {
    const liveIdx = playlist.findIndex((p) => p.isLive);
    return liveIdx !== -1 ? idx === liveIdx + 1 : idx === 1;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121316] select-none">
      {/* LOG CONTROL HEADER */}
      <div className="bg-[#1a1c23] border-b border-[#2c303e] px-4 py-2 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <ListMusic className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-white uppercase tracking-wider">ON-AIR LOG</span>
            <span className="text-slate-400 font-mono text-[11px] bg-[#121316] px-2 py-0.5 rounded border border-[#2c303e]">
              {playlist.length} items
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-[#121316] px-2 py-0.5 rounded border border-[#2c303e]">
            <span className="text-[10px] text-slate-400 font-semibold">ROTATION</span>
            <span className="bg-teal-950 text-teal-300 border border-teal-800 px-1.5 py-0.2 rounded font-bold text-[10px]">
              {activePlaylistName}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* AI Voice Track Button */}
          <button
            onClick={onOpenAiVoiceTrack}
            className="bg-purple-950/60 hover:bg-purple-900 border border-purple-700/60 text-purple-300 px-3 py-1 rounded text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow"
            title="Generate & Insert AI Voice Track Link"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>AI Voice Link</span>
          </button>

          {/* 24h Music Scheduler Button */}
          <button
            onClick={onOpenMusicScheduler}
            className="bg-blue-950/60 hover:bg-blue-900 border border-blue-700/60 text-blue-300 px-3 py-1 rounded text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow"
            title="Music Scheduling Engine & 24h Generator"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>24h Scheduler</span>
          </button>

          {/* Auto Playout Glowing Toggle Button */}
          <button
            onClick={onToggleAutoPlayout}
            className={`px-3 py-1 rounded text-xs font-bold transition flex items-center space-x-1.5 shadow cursor-pointer ${
              autoPlayoutActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white glow-green'
                : 'bg-[#232631] hover:bg-[#2c303e] text-slate-300 border border-[#2c303e]'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Auto Playout: {autoPlayoutActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Add Track Button */}
          <button
            onClick={onOpenAddModal}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs font-bold text-white transition flex items-center space-x-1.5 shadow cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Track</span>
          </button>
        </div>
      </div>

      {/* Mode Subheader */}
      <div className="bg-[#1a1c23] border-b border-[#2c303e] px-4 py-1.5 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center space-x-1 bg-[#121316] p-0.5 rounded border border-[#2c303e]">
          {(['auto', 'assist', 'manual'] as AutomationMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onSetAutomationMode(mode)}
              className={`px-3 py-0.5 rounded font-bold uppercase transition text-[11px] cursor-pointer ${
                automationMode === mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'font-semibold text-slate-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          NEXT <span className="text-gray-200 font-semibold">{nextTrack?.title || 'End of schedule'}</span>
        </div>
      </div>

      {/* PLAYLIST LOG TABLE */}
      <div className="flex-1 overflow-y-auto bg-[#121316]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#1a1c23] text-slate-400 sticky top-0 border-b border-[#2c303e] uppercase font-semibold text-[10px] tracking-wider z-10 shadow-sm">
            <tr>
              <th className="py-2.5 px-3 w-16">Start</th>
              <th className="py-2.5 px-3">Title</th>
              <th className="py-2.5 px-3 w-48">Artist</th>
              <th className="py-2.5 px-3 w-14 text-center">Intro</th>
              <th className="py-2.5 px-3 w-14 text-right">Dur</th>
              <th className="py-2.5 px-3 w-32">Type</th>
              <th className="py-2.5 px-3 w-44 text-center">Actions & Mix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2c303e]/40 font-medium">
            {playlist.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2.5">
                    <ListMusic className="w-9 h-9 text-slate-600 stroke-1" />
                    <span className="text-sm font-bold text-gray-300">Vysílací fronta (Playout Log) je prázdná</span>
                    <p className="text-xs text-slate-500 max-w-md">
                      Přidejte skladby tlačítkem <span className="text-blue-400 font-semibold">+ Skladba</span> nahoře, nahráním audio souborů nebo výběrem ze záložky <span className="text-emerald-400 font-semibold">Library</span> v pravém panelu.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              playlist.map((item, index) => {
              const isCurrent = item.isLive;
              return (
                <tr
                  key={item.id}
                  className={`transition group border-b border-[#2c303e]/30 ${
                    isCurrent
                      ? 'bg-red-950/20 border-l-4 border-l-red-500 font-bold text-white'
                      : 'hover:bg-[#1a1c23]/80 text-gray-300'
                  }`}
                >
                  {/* Start time */}
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {item.time}
                  </td>

                  {/* Title */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2">
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                      )}
                      <span className={`truncate max-w-xs ${isCurrent ? 'text-white font-bold' : 'text-gray-200'}`}>
                        {item.title}
                      </span>
                      {item.audioUrl && (
                        <span className="text-[9px] bg-orange-950/80 text-orange-400 border border-orange-800/80 px-1 rounded font-mono shrink-0">
                          FILE
                        </span>
                      )}
                      {item.segueSec && (
                        <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1 rounded font-mono shrink-0">
                          SEGUE {item.segueSec}s
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Artist */}
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-[160px]">
                    {item.artist}
                  </td>

                  {/* Intro */}
                  <td className="py-2.5 px-3 font-mono text-center text-slate-400">
                    {item.intro || ''}
                  </td>

                  {/* Duration */}
                  <td className="py-2.5 px-3 font-mono text-right text-gray-300">
                    {item.dur}
                  </td>

                  {/* Category Type */}
                  <td className="py-2.5 px-3">
                    <span
                      className={`bg-[#1a1c23] border border-[#2c303e] px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
                        item.color || 'text-gray-300'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>

                  {/* Actions buttons */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Visual Segue & Cue Editor Button */}
                      <button
                        onClick={() => onOpenSegueEditorForTrack(index)}
                        className="w-6 h-6 rounded bg-[#1a1c23] hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-400 border border-transparent hover:border-indigo-700/60 flex items-center justify-center transition cursor-pointer"
                        title="Open Visual Waveform Segue & Cue Editor for this transition"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>

                      {/* Move Up */}
                      <button
                        onClick={() => onMoveItem(index, -1)}
                        disabled={index === 0}
                        className="w-6 h-6 rounded bg-[#1a1c23] hover:bg-[#2c303e] text-slate-400 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer"
                        title="Move Up in Queue"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => onMoveItem(index, 1)}
                        disabled={index === playlist.length - 1}
                        className="w-6 h-6 rounded bg-[#1a1c23] hover:bg-[#2c303e] text-slate-400 hover:text-blue-400 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition cursor-pointer"
                        title="Move Down in Queue"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>

                      {/* Cue Pre-listen */}
                      <button
                        onClick={() => onCuePreview(item)}
                        className="w-6 h-6 rounded bg-[#1a1c23] hover:bg-[#2c303e] text-slate-400 hover:text-purple-400 flex items-center justify-center transition cursor-pointer"
                        title="Cue Pre-listen"
                      >
                        <Headphones className="w-3 h-3" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onOpenEditModal(index)}
                        className="w-6 h-6 rounded bg-[#1a1c23] hover:bg-[#2c303e] text-slate-400 hover:text-amber-400 flex items-center justify-center transition cursor-pointer"
                        title="Edit Track Details"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>

                      {/* Instant Play Now */}
                      <button
                        onClick={() => onSkipToTrack(index)}
                        className="w-6 h-6 rounded bg-[#1a1c23] hover:bg-emerald-900/60 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition cursor-pointer"
                        title="Play Track Immediately"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="w-6 h-6 rounded bg-[#1a1c23] hover:bg-red-950/60 text-slate-400 hover:text-red-400 flex items-center justify-center transition cursor-pointer"
                        title="Remove from Playout Queue"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* MASTER PLAYOUT TRANSPORT BAR */}
      <div className="bg-[#1a1c23] border-t border-[#2c303e] p-2.5 flex items-center justify-between shrink-0">
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          {/* Main Play/Pause Button */}
          <button
            onClick={onToggleMasterPlay}
            className={`w-9 h-9 rounded-lg text-white flex items-center justify-center shadow transition cursor-pointer ${
              isPlaying
                ? 'bg-blue-600 hover:bg-blue-500 glow-blue'
                : 'bg-amber-600 hover:bg-amber-500'
            }`}
            title={isPlaying ? 'Pause Playout' : 'Start Playout'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Stop Button */}
          <button
            onClick={onStopMasterPlay}
            className="w-9 h-9 rounded-lg bg-[#232631] hover:bg-[#2c303e] border border-[#2c303e] text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Stop & Reset Playout"
          >
            <Square className="w-4 h-4 fill-current text-gray-400" />
          </button>

          {/* Skip Next Button */}
          <button
            onClick={onSkipSong}
            className="w-9 h-9 rounded-lg bg-[#232631] hover:bg-[#2c303e] border border-[#2c303e] text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Skip to Next Track"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-[#2c303e] mx-1"></div>

          {/* Segue Crossfade Button */}
          <button
            onClick={onTriggerSegue}
            className="px-3 py-2 rounded-lg bg-[#232631] hover:bg-[#2c303e] border border-[#2c303e] text-gray-200 font-semibold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            title="Immediate Smooth Segue Crossfade"
          >
            <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Segue</span>
          </button>
        </div>

        {/* Live Broadcast Information & Bulk Upload */}
        <div className="flex items-center space-x-4 text-xs text-slate-400">
          <button
            onClick={() => onShowToast('Encoder Connected: ICEcast 2 / 320kbps MP3 (Port 8000)')}
            className="hover:text-white flex items-center space-x-1.5 transition cursor-pointer bg-[#121316] px-2.5 py-1 rounded border border-[#2c303e]"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-300 font-medium">ICEcast Live</span>
          </button>

          <button
            onClick={onOpenUploadModal}
            className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/40 px-3 py-1 rounded font-bold transition flex items-center space-x-1.5 cursor-pointer shadow"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Upload Tracks (Bulk)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
