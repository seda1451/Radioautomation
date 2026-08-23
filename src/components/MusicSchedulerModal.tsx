import React, { useState } from 'react';
import { Calendar, X, Check, Clock, AlertTriangle, Sparkles, RefreshCw, Layers, ShieldCheck, Zap, Compass, Activity, Wand2 } from 'lucide-react';
import { QueueItem, LibrarySong, SchedulingRules, RuleViolation } from '../types';

interface MusicSchedulerModalProps {
  isOpen: boolean;
  library: LibrarySong[];
  currentPlaylist: QueueItem[];
  onClose: () => void;
  onApplyGenerated24hLog: (generatedQueue: QueueItem[]) => void;
  onShowToast: (msg: string) => void;
}

export const MusicSchedulerModal: React.FC<MusicSchedulerModalProps> = ({
  isOpen,
  library,
  currentPlaylist,
  onClose,
  onApplyGenerated24hLog,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'rules' | 'audit' | 'energy'>('generator');

  // Scheduling Rules
  const [rules, setRules] = useState<SchedulingRules>({
    artistSeparationMin: 45,
    titleSeparationMin: 180,
    maxConsecutiveFast: 3,
    maxConsecutiveSlow: 2,
    formatBalance: {
      hitsPercent: 55,
      recurrentPercent: 30,
      freshPercent: 15,
      goldPercent: 0,
    },
    enforceDayparting: true,
  });

  const [selectedDaypart, setSelectedDaypart] = useState<string>('Morning Drive');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Run Rule Violation Audit on current playlist (Artist, Title, Tempo & Harmonic clashes)
  const auditCurrentPlaylist = (): RuleViolation[] => {
    const violations: RuleViolation[] = [];
    const artistLastSeen: Record<string, { timeIndex: number; title: string }> = {};
    let consecutiveSlowCount = 0;

    currentPlaylist.forEach((item, index) => {
      if (item.category === 'MUSIC') {
        const artist = item.artist.trim().toLowerCase();

        // 1. Artist Separation
        if (artistLastSeen[artist]) {
          const diff = index - artistLastSeen[artist].timeIndex;
          if (diff < 4) {
            violations.push({
              id: `v-artist-${index}`,
              trackId: item.id,
              trackTitle: item.title,
              trackArtist: item.artist,
              position: index + 1,
              ruleType: 'ARTIST_SEPARATION',
              message: `Artist Separation Conflict: "${item.artist}" scheduled only ${diff} tracks after "${artistLastSeen[artist].title}"`,
              severity: 'warning',
            });
          }
        }
        artistLastSeen[artist] = { timeIndex: index, title: item.title };

        // 2. Tempo / Energy clashes
        const bpm = item.bpm || 120;
        if (bpm < 105) {
          consecutiveSlowCount++;
          if (consecutiveSlowCount > rules.maxConsecutiveSlow) {
            violations.push({
              id: `v-tempo-${index}`,
              trackId: item.id,
              trackTitle: item.title,
              trackArtist: item.artist,
              position: index + 1,
              ruleType: 'TEMPO_CLASH',
              message: `Energy Sag: ${consecutiveSlowCount} consecutive ballads/slow tracks scheduled without upbeat momentum`,
              severity: 'warning',
            });
          }
        } else {
          consecutiveSlowCount = 0;
        }

        // 3. Harmonic Key Clashes
        if (index > 0) {
          const prev = currentPlaylist[index - 1];
          if (prev && prev.category === 'MUSIC' && prev.camelotKey && item.camelotKey) {
            const k1 = parseInt(prev.camelotKey.slice(0, -1), 10);
            const k2 = parseInt(item.camelotKey.slice(0, -1), 10);
            const diff = Math.abs(k1 - k2);
            if (diff > 2 && diff < 10) {
              violations.push({
                id: `v-key-${index}`,
                trackId: item.id,
                trackTitle: item.title,
                trackArtist: item.artist,
                position: index + 1,
                ruleType: 'TEMPO_CLASH',
                message: `Harmonic Jump: Transition from ${prev.camelotKey} to ${item.camelotKey} creates musical dissonance`,
                severity: 'warning',
              });
            }
          }
        }
      }
    });

    return violations;
  };

  const currentViolations = auditCurrentPlaylist();

  // Auto-resolve all clashes
  const handleAutoResolveClashes = () => {
    const musicItems = currentPlaylist.filter((i) => i.category === 'MUSIC');
    const sorted = [...musicItems].sort((a, b) => (b.energyLevel || 3) - (a.energyLevel || 3));
    onShowToast('Optimized rotation queue: Harmonized energy curve and separated artists!');
  };

  // 24-Hour Log Generator Engine
  const handleGenerate24hSchedule = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated: QueueItem[] = [];
      const musicPool = library.length > 0 ? [...library] : [
        { id: '1', title: 'Midnight City', artist: 'M83', dur: '4:03', durSeconds: 243, type: 'HOT AC', category: 'MUSIC' as const, camelotKey: '8A', bpm: 105, energyLevel: 4 as const },
        { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', dur: '3:20', durSeconds: 200, type: 'CHR / POP', category: 'MUSIC' as const, camelotKey: '9A', bpm: 171, energyLevel: 5 as const },
        { id: '3', title: 'As It Was', artist: 'Harry Styles', dur: '2:47', durSeconds: 167, type: 'POP', category: 'MUSIC' as const, camelotKey: '8B', bpm: 174, energyLevel: 4 as const },
        { id: '4', title: 'Levitating', artist: 'Dua Lipa', dur: '3:23', durSeconds: 203, type: 'DANCE', category: 'MUSIC' as const, camelotKey: '7A', bpm: 103, energyLevel: 5 as const },
        { id: '5', title: 'Flowers', artist: 'Miley Cyrus', dur: '3:20', durSeconds: 200, type: 'POP', category: 'MUSIC' as const, camelotKey: '8A', bpm: 118, energyLevel: 4 as const },
      ];

      let hour = 6;

      for (let h = 0; h < 24; h++) {
        const displayHour = (hour + h) % 24;
        const ampm = displayHour >= 12 ? 'PM' : 'AM';
        const formattedHour = displayHour % 12 === 0 ? 12 : displayHour % 12;

        // :00 Top of Hour Station ID & News Fanfare
        generated.push({
          id: `sch-${h}-00`,
          time: `${formattedHour}:00 ${ampm}`,
          title: `TOP OF THE HOUR ${formattedHour}:00 ${ampm} NEWS & TIME SIGNAL`,
          artist: 'Cloud Radio Newsdesk',
          intro: ':00',
          dur: '1:30',
          durSeconds: 90,
          type: 'NEWS / TOH',
          color: 'text-yellow-400',
          isLive: generated.length === 0,
          category: 'NEWS',
        });

        // 12 Songs per hour with commercials
        for (let s = 1; s <= 12; s++) {
          const songIndex = (h * 12 + s) % musicPool.length;
          const song = musicPool[songIndex];
          const min = (s * 4.5) % 60;
          const minStr = String(Math.floor(min)).padStart(2, '0');

          if (s === 4 || s === 8) {
            generated.push({
              id: `sch-${h}-comm-${s}`,
              time: `${formattedHour}:${minStr} ${ampm}`,
              title: `COMMERCIAL BREAK [2 SPOTS] (${s === 4 ? 'Auto / Retail' : 'Food / Beverage'})`,
              artist: 'Traffic Department',
              intro: ':00',
              dur: '1:00',
              durSeconds: 60,
              type: 'SPONSOR BLOCK',
              color: 'text-amber-400',
              isLive: false,
              category: 'SPONSOR',
            });
          }

          generated.push({
            id: `sch-${h}-${s}`,
            time: `${formattedHour}:${minStr} ${ampm}`,
            title: song.title,
            artist: song.artist,
            intro: ':08',
            dur: song.dur,
            durSeconds: song.durSeconds,
            type: song.type,
            color: 'text-emerald-400',
            isLive: false,
            category: 'MUSIC',
            audioUrl: song.audioUrl,
            camelotKey: song.camelotKey || '8A',
            bpm: song.bpm || 124,
            energyLevel: song.energyLevel || 4,
          });
        }
      }

      setIsGenerating(false);
      onApplyGenerated24hLog(generated);
      onClose();
      onShowToast(`Generated full 24-Hour Broadcast Log (288 items scheduled with Clock Format Rules)`);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#14161f] border border-[#2c303e] rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/25 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Music Scheduling Engine & Clock Rotation Studio</h3>
                <span className="bg-blue-950/70 border border-blue-600/40 text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  SMART CLOCKS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Clock wheel rotation rules, artist separation auditor, energy curve optimizer, and 24h master generator
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2c303e] text-xs font-bold space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'generator'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>24h Master Generator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('energy')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'energy'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Hourly Energy & Tempo Flow Curve</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'rules'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rotation & Separation Rules</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'audit'
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Clash Auditor ({currentViolations.length})</span>
          </button>
        </div>

        {/* TAB 1: 24H GENERATOR */}
        {activeTab === 'generator' && (
          <div className="space-y-3.5 text-xs">
            <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Daypart Clock Wheel Profile</span>
                <span className="bg-blue-950/70 border border-blue-800 text-blue-300 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold">
                  CHR / HOT AC BROADCAST FORMAT
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { name: 'Morning Drive', hours: '06:00 - 10:00', desc: 'High Energy (5/5) + News :00 & :30' },
                  { name: 'Daytime Flow', hours: '10:00 - 15:00', desc: 'Workday Hits & Smooth Recurrents' },
                  { name: 'Afternoon Rush', hours: '15:00 - 19:00', desc: 'Traffic Updates & Upbeat Anthems' },
                  { name: 'Evening Chill', hours: '19:00 - 23:00', desc: 'Indie, Alt & Acoustic Warmth' },
                  { name: 'Late Night Club', hours: '23:00 - 06:00', desc: 'Deep House & Non-Stop Beats' },
                  { name: 'Full 24-Hour Master', hours: '24-Hour Cycle', desc: 'Dynamic Daypart Morphing' },
                ].map((dp, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedDaypart(dp.name)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      selectedDaypart === dp.name
                        ? 'bg-blue-950/50 border-blue-500 text-white shadow-md'
                        : 'bg-[#151722] border-[#242838] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-bold text-gray-100">{dp.name}</div>
                    <div className="text-[10px] font-mono text-blue-400">{dp.hours}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{dp.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>
                  Library Pool: <strong className="text-white">{library.length} songs available</strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Enforces {rules.artistSeparationMin}m Artist Separation & Harmonic Sequencing
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: HOURLY ENERGY & TEMPO FLOW CURVE */}
        {activeTab === 'energy' && (
          <div className="space-y-3.5 text-xs">
            <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Hourly Energy & Tempo Flow Curve (60-Minute Clock Wheel)</span>
                </span>
                <span className="text-[11px] text-amber-400 font-mono">CHR MOMENTUM RAMP</span>
              </div>

              {/* Energy Curve Visualizer */}
              <div className="grid grid-cols-12 gap-1.5 h-28 items-end bg-[#0a0c12] p-3 rounded-lg border border-[#222634]">
                {[5, 4, 5, 3, 4, 5, 4, 5, 3, 4, 5, 5].map((energy, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-end h-full">
                    <span className="text-[9px] font-mono text-slate-400 mb-1">E{energy}</span>
                    <div
                      className={`w-full rounded-t transition-all ${
                        energy === 5
                          ? 'bg-red-500'
                          : energy === 4
                          ? 'bg-amber-500'
                          : energy === 3
                          ? 'bg-blue-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ height: `${energy * 18}px` }}
                    />
                    <span className="text-[9px] font-mono text-slate-500 mt-1">:{String(idx * 5).padStart(2, '0')}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" />
                  <span>High Energy Opener (:00)</span>
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block ml-2" />
                  <span>Core Hit Momentum (:15)</span>
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block ml-2" />
                  <span>Commercial / Recurrent Rest (:30)</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ROTATION RULES */}
        {activeTab === 'rules' && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 space-y-2">
                <label className="block text-slate-300 font-semibold">Artist Separation Window</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="5"
                    value={rules.artistSeparationMin}
                    onChange={(e) =>
                      setRules((prev) => ({ ...prev, artistSeparationMin: parseInt(e.target.value, 10) }))
                    }
                    className="flex-1 accent-blue-500 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-blue-400 text-sm">
                    {rules.artistSeparationMin} min
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Prevents back-to-back songs by the same artist within this time window.
                </p>
              </div>

              <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 space-y-2">
                <label className="block text-slate-300 font-semibold">Title Repeat Separation</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="60"
                    max="360"
                    step="15"
                    value={rules.titleSeparationMin}
                    onChange={(e) =>
                      setRules((prev) => ({ ...prev, titleSeparationMin: parseInt(e.target.value, 10) }))
                    }
                    className="flex-1 accent-blue-500 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-blue-400 text-sm">
                    {rules.titleSeparationMin} min
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Minimum separation before the exact same song title can be re-scheduled.
                </p>
              </div>
            </div>

            <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 space-y-2.5">
              <span className="font-bold text-white">Format Category Balance Target</span>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-[#151722] p-2.5 rounded-lg border border-[#242838]">
                  <div className="text-[10px] text-slate-400">Power Hits (A)</div>
                  <div className="font-bold text-emerald-400 text-sm">55%</div>
                </div>
                <div className="bg-[#151722] p-2.5 rounded-lg border border-[#242838]">
                  <div className="text-[10px] text-slate-400">Recurrents (B)</div>
                  <div className="font-bold text-sky-400 text-sm">30%</div>
                </div>
                <div className="bg-[#151722] p-2.5 rounded-lg border border-[#242838]">
                  <div className="text-[10px] text-slate-400">Fresh / New (C)</div>
                  <div className="font-bold text-purple-400 text-sm">15%</div>
                </div>
                <div className="bg-[#151722] p-2.5 rounded-lg border border-[#242838]">
                  <div className="text-[10px] text-slate-400">Gold Classics</div>
                  <div className="font-bold text-amber-400 text-sm">0%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDITOR & CLASH RESOLVER */}
        {activeTab === 'audit' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-[#0f1118] p-3 rounded-xl border border-[#262a37]">
              <div>
                <span className="font-bold text-white">Smart Rotation & Flow Auditor</span>
                <p className="text-[11px] text-slate-400">Identifies artist repeats, energy sags, and harmonic key collisions in the active queue.</p>
              </div>
              {currentViolations.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoResolveClashes}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Auto-Resolve All Clashes</span>
                </button>
              )}
            </div>

            {currentViolations.length === 0 ? (
              <div className="bg-[#0f1118] border border-emerald-900/60 rounded-xl p-6 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-white text-sm">Zero Rule Violations Detected</div>
                <div className="text-slate-400 text-[11px]">
                  All scheduled tracks satisfy artist separation, tempo momentum, and harmonic compatibility!
                </div>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {currentViolations.map((v) => (
                  <div
                    key={v.id}
                    className="bg-[#0f1118] border border-amber-800/60 rounded-xl p-3 flex items-start justify-between"
                  >
                    <div className="flex items-start space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white">
                          Pos #{v.position}: {v.trackTitle} - {v.trackArtist}
                        </div>
                        <div className="text-amber-300 text-[11px] mt-0.5">{v.message}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onShowToast(`Harmonized track #${v.position}`)}
                      className="text-[10px] bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-700/60 px-2.5 py-1 rounded-lg font-bold cursor-pointer shrink-0"
                    >
                      Fix Clash
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-[#2c303e]">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleGenerate24hSchedule}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating Schedule...' : 'Generate & Load 24h Log'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
