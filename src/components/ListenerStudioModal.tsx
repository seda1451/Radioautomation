import React, { useState } from 'react';
import { Users, X, MessageSquare, Plus, Music, Radio, Globe, Send, CheckCircle2, TrendingUp } from 'lucide-react';
import { ListenerStats, ListenerMessage, QueueItem } from '../types';

interface ListenerStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQueueRequestedSong: (title: string, artist: string) => void;
  onShowToast: (msg: string) => void;
}

export const ListenerStudioModal: React.FC<ListenerStudioModalProps> = ({
  isOpen,
  onClose,
  onQueueRequestedSong,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'analytics'>('inbox');

  const [stats] = useState<ListenerStats>({
    currentListeners: 1420,
    peakToday: 2180,
    averageListeningTimeMin: 48,
    bandwidthMbps: 45.4,
    streamHealth: 'EXCELLENT',
    topLocations: [
      { city: 'Prague', country: 'Czechia', count: 680, flag: '🇨🇿' },
      { city: 'Brno', country: 'Czechia', count: 340, flag: '🇨🇿' },
      { city: 'Ostrava', country: 'Czechia', count: 180, flag: '🇨🇿' },
      { city: 'Bratislava', country: 'Slovakia', count: 120, flag: '🇸🇰' },
      { city: 'London', country: 'UK', count: 100, flag: '🇬🇧' },
    ],
    hourlyHistory: [
      { hour: '06:00', listeners: 420 },
      { hour: '08:00', listeners: 1650 },
      { hour: '10:00', listeners: 1320 },
      { hour: '12:00', listeners: 1840 },
      { hour: '14:00', listeners: 1420 },
      { hour: '16:00', listeners: 2180 },
    ],
  });

  const [messages, setMessages] = useState<ListenerMessage[]>([
    {
      id: 'm1',
      sender: 'Honza K.',
      location: 'Praha 4',
      timestamp: '14:24',
      message: 'Ahoj Alexi! Zdravím všechny v kanclu. Mohli byste zahrát Blinding Lights od The Weeknd?',
      type: 'REQUEST',
      requestedSong: { title: 'Blinding Lights', artist: 'The Weeknd' },
      status: 'NEW',
    },
    {
      id: 'm2',
      sender: 'Lenka & Tomáš',
      location: 'Brno',
      timestamp: '14:18',
      message: 'Super odpolední playlist, skvěle se u toho pracuje! Držíme palce studiu.',
      type: 'SHOUTOUT',
      status: 'READ',
    },
    {
      id: 'm3',
      sender: 'Michal',
      location: 'Ostrava',
      timestamp: '14:05',
      message: 'Můžete pustit novou Miley Cyrus - Flowers pro mou přítelkyni k svátku?',
      type: 'REQUEST',
      requestedSong: { title: 'Flowers', artist: 'Miley Cyrus' },
      status: 'NEW',
    },
  ]);

  if (!isOpen) return null;

  const handleQueueRequest = (msg: ListenerMessage) => {
    if (msg.requestedSong) {
      onQueueRequestedSong(msg.requestedSong.title, msg.requestedSong.artist);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'QUEUED' } : m))
      );
      onShowToast(`Song "${msg.requestedSong.title}" queued from listener request (${msg.sender})`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#161820] border border-[#2c303e] rounded-xl p-6 w-full max-w-2xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Live Listener Studio & Request Inbox</h3>
              <p className="text-[11px] text-slate-400">
                Real-time active stream analytics, listener shoutouts, and 1-click song request queueing
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#2c303e] text-xs font-bold space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'inbox'
                ? 'text-teal-400 border-teal-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Studio Inbox ({messages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'analytics'
                ? 'text-teal-400 border-teal-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Live Stream Metrics ({stats.currentListeners} Online)</span>
          </button>
        </div>

        {/* TAB 1: INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-3 text-xs">
            <div className="max-h-72 overflow-y-auto space-y-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#101217] border border-[#2c303e] p-3.5 rounded-lg space-y-2 hover:border-teal-500/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{m.sender}</span>
                      <span className="text-slate-400 text-[11px]">({m.location})</span>
                      <span className="font-mono text-[10px] text-slate-500">{m.timestamp}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {m.type === 'REQUEST' && (
                        <span className="bg-teal-950/80 text-teal-300 border border-teal-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          SONG REQUEST
                        </span>
                      )}
                      {m.status === 'QUEUED' && (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>QUEUED ON-AIR</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-200 text-xs leading-relaxed bg-[#161820] p-2 rounded border border-[#222634]">
                    "{m.message}"
                  </p>

                  {m.requestedSong && m.status !== 'QUEUED' && (
                    <div className="flex items-center justify-between bg-teal-950/40 border border-teal-800/40 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <Music className="w-3.5 h-3.5 text-teal-400" />
                        <span className="font-bold text-teal-200">
                          {m.requestedSong.title} - {m.requestedSong.artist}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQueueRequest(m)}
                        className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded font-bold text-xs shadow flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Queue Song</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-3.5 text-xs">
            {/* Top Stats Counters */}
            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="bg-[#101217] border border-[#2c303e] p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400">Current Listeners</div>
                <div className="text-lg font-mono font-bold text-teal-400">{stats.currentListeners}</div>
              </div>
              <div className="bg-[#101217] border border-[#2c303e] p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400">Peak Today</div>
                <div className="text-lg font-mono font-bold text-emerald-400">{stats.peakToday}</div>
              </div>
              <div className="bg-[#101217] border border-[#2c303e] p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400">Avg Tune-In Time</div>
                <div className="text-lg font-mono font-bold text-sky-400">{stats.averageListeningTimeMin}m</div>
              </div>
              <div className="bg-[#101217] border border-[#2c303e] p-2.5 rounded-lg">
                <div className="text-[10px] text-slate-400">Stream Status</div>
                <div className="text-xs font-bold text-emerald-400 mt-1">100% HEALTHY</div>
              </div>
            </div>

            {/* Geolocation distribution */}
            <div className="bg-[#101217] border border-[#2c303e] rounded-lg p-3 space-y-2">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>Listener Top Geolocation Cities</span>
              </span>

              <div className="space-y-1.5">
                {stats.topLocations.map((loc, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span>{loc.flag}</span>
                      <span className="font-semibold text-white">{loc.city}</span>
                      <span className="text-slate-500">({loc.country})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-[#1e2330] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-500 h-full rounded-full"
                          style={{ width: `${(loc.count / stats.currentListeners) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-teal-300 font-bold w-12 text-right">
                        {loc.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
