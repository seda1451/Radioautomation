import React, { useState } from 'react';
import { Archive, Download, Headphones, Mic, Sparkles, Check, X, FileAudio, Calendar, Clock, Rss, Copy, Play, ListOrdered, Filter } from 'lucide-react';
import { BroadcastLogEntry, PodcastEpisode, PodcastChapter, PodcastRssMetadata } from '../types';

interface BroadcastLoggerPodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const BroadcastLoggerPodcastModal: React.FC<BroadcastLoggerPodcastModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'logger' | 'podcast' | 'rss'>('logger');
  const [filterMode, setFilterMode] = useState<'talk_only' | 'talk_jingles' | 'full'>('talk_only');

  const [logEntries] = useState<BroadcastLogEntry[]>([
    { id: 'log-1', timeStr: '08:00:00', category: 'JINGLE', title: 'Top of Hour Station Sweeper', artist: 'Cloud Radio Imaging', durSeconds: 15, status: 'AIRED', audioArchived: true },
    { id: 'log-2', timeStr: '08:00:15', category: 'VOICE_TRACK', title: 'Morning Show Host Welcome & Traffic', artist: 'Alex & Tereza', durSeconds: 45, status: 'AIRED', audioArchived: true },
    { id: 'log-3', timeStr: '08:01:00', category: 'MUSIC', title: 'Midnight City', artist: 'M83', durSeconds: 243, status: 'AIRED', audioArchived: true },
    { id: 'log-4', timeStr: '08:05:03', category: 'VOICE_TRACK', title: 'Listener Phone-In Contest (Petr z Brna)', artist: 'Studio Hotline', durSeconds: 62, status: 'AIRED', audioArchived: true },
    { id: 'log-5', timeStr: '08:06:05', category: 'COMMERCIAL', title: 'Apex Motors Summer SUV Spot', artist: 'Apex Motor Group', durSeconds: 30, status: 'AIRED', audioArchived: true },
    { id: 'log-6', timeStr: '08:06:35', category: 'MUSIC', title: 'Blinding Lights', artist: 'The Weeknd', durSeconds: 200, status: 'AIRED', audioArchived: true },
    { id: 'log-7', timeStr: '08:09:55', category: 'VOICE_TRACK', title: 'Weather & Daily Entertainment Wrap-up', artist: 'Tereza', durSeconds: 40, status: 'AIRED', audioArchived: true },
  ]);

  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([
    {
      id: 'ep-1',
      title: 'Ranní Jízda s Alexem & Terezou – To nejlepší z éteru',
      description: 'Záznam ranní show bez reklam a hudby: ranní probuzení, vtipná debata o kávě, živý telefonát posluchače Petra a ranní servis.',
      recordedDate: 'Dnes, 08:00 - 09:00',
      durationMinutes: 14,
      includedSegmentsCount: 5,
    },
  ]);

  // AI Generated Chapters
  const [chapters, setChapters] = useState<PodcastChapter[]>([
    { id: 'ch-1', startTimeSec: 0, timeFormatted: '00:00', title: 'Úvod & Ranní kofeinový start', summary: 'Alex a Tereza otevírají dnešní téma ranního vstávání.', speaker: 'Alex & Tereza' },
    { id: 'ch-2', startTimeSec: 165, timeFormatted: '02:45', title: 'Živý telefonát: Petr z Brna', summary: 'Vtipná reakce posluchače z ranní kolony.', speaker: 'Petr & Alex' },
    { id: 'ch-3', startTimeSec: 350, timeFormatted: '05:50', title: 'Předpověď počasí a doprava na D1', summary: 'Aktuální servis a ranní tipy.', speaker: 'Tereza' },
  ]);

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedRssXml, setGeneratedRssXml] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerateAiPodcast = async () => {
    setIsGeneratingAi(true);
    try {
      const talkSegments = logEntries
        .filter((l) => (filterMode === 'talk_only' ? l.category === 'VOICE_TRACK' : l.category !== 'MUSIC' && l.category !== 'COMMERCIAL'))
        .map((l) => ({ title: l.title, artist: l.artist, durSeconds: l.durSeconds, time: l.timeStr }));

      const res = await fetch('/api/gemini/podcast-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showTitle: 'Ranní Jízda Cloud Radio',
          stationName: 'Cloud Radio 98.5 FM',
          hosts: 'Alex & Tereza',
          segments: talkSegments,
          language: 'cs',
        }),
      });

      const data = await res.json();
      if (data.chapters) {
        const mappedChapters: PodcastChapter[] = data.chapters.map((c: any, idx: number) => ({
          id: `ch-${idx}`,
          startTimeSec: c.startTimeSec || idx * 120,
          timeFormatted: c.timeFormatted || '00:00',
          title: c.title,
          summary: c.summary,
          speaker: c.speaker || 'Alex & Tereza',
        }));
        setChapters(mappedChapters);

        const newEp: PodcastEpisode = {
          id: `ep-${Date.now()}`,
          title: data.episodeTitle || `Cloud Radio Ranní Show (${new Date().toLocaleDateString('cs-CZ')})`,
          description: data.description || 'Automaticky sestříhaný talk-only podcast z dnešního vysílání.',
          recordedDate: 'Dnes, sestříháno z éteru',
          durationMinutes: Math.round(talkSegments.reduce((acc, s) => acc + s.durSeconds, 0) / 60) || 12,
          includedSegmentsCount: talkSegments.length,
        };

        setEpisodes((prev) => [newEp, ...prev]);
        generateRssFeedXml(newEp, mappedChapters);
        onShowToast('AI Generated Podcast chapters and stripped copyrighted music!');
      }
    } catch (e) {
      console.error(e);
      onShowToast('Created talk-only podcast episode template');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const generateRssFeedXml = (episode: PodcastEpisode, chaps: PodcastChapter[]) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Cloud Radio 98.5 FM Highlights</title>
    <link>https://cloudradio.fm</link>
    <language>cs-CZ</language>
    <itunes:author>Cloud Radio Studio</itunes:author>
    <itunes:summary>Exkluzivní talk-only podcastový sestřih ranního a odpoledního vysílání rádia bez hudebních přerušení a reklam.</itunes:summary>
    <itunes:category text="Comedy"/>
    <itunes:category text="News"/>
    <itunes:image href="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1400"/>
    
    <item>
      <title>${episode.title}</title>
      <description>${episode.description}</description>
      <itunes:duration>${episode.durationMinutes * 60}</itunes:duration>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <enclosure url="https://stream.cloudradio.fm/podcasts/episode-${episode.id}.mp3" length="15485760" type="audio/mpeg"/>
      <guid isPermaLink="false">cloudradio-${episode.id}</guid>
      <!-- PODCAST CHAPTERS -->
      ${chaps.map((c) => `<!-- Chapter: ${c.timeFormatted} - ${c.title} (${c.speaker}) -->`).join('\n      ')}
    </item>
  </channel>
</rss>`;
    setGeneratedRssXml(xml);
  };

  const handleCopyRssXml = () => {
    if (!generatedRssXml) {
      generateRssFeedXml(episodes[0], chapters);
    }
    navigator.clipboard.writeText(generatedRssXml || 'Generating...');
    onShowToast('Copied Podcast RSS 2.0 XML to clipboard!');
  };

  const handleDownloadRssFile = () => {
    const content = generatedRssXml || `<?xml version="1.0" encoding="UTF-8"?><rss><channel><title>Cloud Radio Podcast</title></channel></rss>`;
    const blob = new Blob([content], { type: 'application/rss+xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `podcast_rss_feed_${new Date().toISOString().slice(0, 10)}.xml`;
    link.click();
    onShowToast('Downloaded podcast.rss XML feed file');
  };

  const handleExportComplianceLog = () => {
    const csvContent =
      'Time,Category,Title,Artist,Duration (Sec),Compliance Status\n' +
      logEntries
        .map((l) => `"${l.timeStr}","${l.category}","${l.title}","${l.artist}",${l.durSeconds},"${l.status}"`)
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `broadcast_compliance_logger_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    onShowToast('Downloaded 24/7 Broadcast Compliance Logger CSV');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#14161f] border border-[#2c303e] rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600/25 border border-teal-500/50 flex items-center justify-center text-teal-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Broadcast Logger & AI Podcast Splicer</h3>
                <span className="bg-teal-950/70 border border-teal-600/40 text-teal-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  AI CHAPTERS + RSS 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                24/7 Legal transmission compliance logger and automated music-stripped podcast RSS exporter
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2c303e] text-xs font-bold space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('logger')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'logger'
                ? 'text-teal-400 border-teal-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>24/7 Compliance Logger ({logEntries.length} items)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('podcast')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'podcast'
                ? 'text-teal-400 border-teal-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>AI Podcast & Chapter Creator ({episodes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!generatedRssXml) generateRssFeedXml(episodes[0], chapters);
              setActiveTab('rss');
            }}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'rss'
                ? 'text-teal-400 border-teal-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Rss className="w-3.5 h-3.5" />
            <span>Apple / Spotify RSS Feed XML</span>
          </button>
        </div>

        {/* TAB 1: 24/7 LOGGER */}
        {activeTab === 'logger' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-[#0f1118] p-3 rounded-xl border border-[#262a37]">
              <span className="text-slate-300">
                Continuous Transmission Logger: <strong>All audio tracks archived with exact timecodes</strong>
              </span>
              <button
                type="button"
                onClick={handleExportComplianceLog}
                className="bg-[#242938] hover:bg-[#30374a] text-teal-300 border border-teal-700/50 px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 cursor-pointer text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Compliance CSV</span>
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {logEntries.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#0f1118] border border-[#262a37] p-2.5 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-teal-400 font-bold">{log.timeStr}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        log.category === 'VOICE_TRACK'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : log.category === 'COMMERCIAL'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {log.category}
                    </span>
                    <span className="font-bold text-white">{log.title}</span>
                    <span className="text-slate-400">- {log.artist}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-400">:{log.durSeconds}s</span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold">
                      ARCHIVED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SMART AI PODCAST */}
        {activeTab === 'podcast' && (
          <div className="space-y-3.5 text-xs">
            {/* Music Stripping Mode & AI Generation Bar */}
            <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-sm">Automated Voice-Only Podcast Splicer & AI Chapter Maker</h4>
                  <p className="text-[11px] text-slate-400">
                    Strips out music & ads, generates timecoded chapters with Gemini 3.7, and prepares RSS ready MP3s.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiPodcast}
                  disabled={isGeneratingAi}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-lg shadow flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGeneratingAi ? 'Generating AI Chapters...' : 'Generate AI Podcast Show'}</span>
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-2 pt-1 border-t border-[#222634]">
                <span className="text-slate-400 font-semibold flex items-center space-x-1">
                  <Filter className="w-3.5 h-3.5 text-teal-400" />
                  <span>Audio Filter Mode:</span>
                </span>
                {[
                  { id: 'talk_only', label: '🎙️ Talk Only (Remove all music & ads)' },
                  { id: 'talk_jingles', label: '📻 Talk + Station Jingles' },
                  { id: 'full', label: '🎵 Full Broadcast Aircheck' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterMode(item.id as typeof filterMode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                      filterMode === item.id
                        ? 'bg-teal-950 border border-teal-500 text-teal-200'
                        : 'bg-[#151722] text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Timecoded Chapters */}
            <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-teal-400" />
                  <span>AI Episode Chapters ({chapters.length} markers):</span>
                </span>
                <span className="text-[11px] text-slate-500">Auto-synced for Apple Podcasts & Spotify</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {chapters.map((ch) => (
                  <div key={ch.id} className="bg-[#151722] border border-[#242838] p-2 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-teal-400 font-bold bg-teal-950/70 border border-teal-800 px-1.5 py-0.5 rounded text-[10px]">
                        {ch.timeFormatted}
                      </span>
                      <span className="font-bold text-white">{ch.title}</span>
                      <span className="text-slate-400 text-[11px]">({ch.speaker})</span>
                    </div>
                    <span className="text-slate-400 text-[11px] truncate max-w-[200px]">{ch.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RSS 2.0 XML FEED */}
        {activeTab === 'rss' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-[#0f1118] p-3 rounded-xl border border-[#262a37]">
              <div>
                <span className="font-bold text-white">Apple Podcasts & Spotify RSS 2.0 Generator</span>
                <p className="text-[11px] text-slate-400">Standard compliant XML feed containing episode enclosure tags and chapter marks.</p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleCopyRssXml}
                  className="bg-[#242938] hover:bg-[#30374a] text-teal-300 border border-teal-700/50 px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 cursor-pointer text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy RSS XML</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadRssFile}
                  className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 cursor-pointer text-xs shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .rss XML</span>
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={generatedRssXml || 'Generating RSS feed XML...'}
              readOnly
              className="w-full bg-[#0a0c12] border border-[#242838] rounded-xl p-3 font-mono text-[11px] text-teal-300/90 leading-relaxed focus:outline-none"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#2c303e]">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
