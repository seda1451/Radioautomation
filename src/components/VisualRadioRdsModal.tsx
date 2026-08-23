import React, { useState, useRef } from 'react';
import { Radio, Share2, Download, Sparkles, Copy, Check, X, Smartphone, Globe } from 'lucide-react';
import { QueueItem, RdsDabMetadata } from '../types';

interface VisualRadioRdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: QueueItem | null;
  stationName: string;
  frequency: string;
  onShowToast: (msg: string) => void;
}

export const VisualRadioRdsModal: React.FC<VisualRadioRdsModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  stationName,
  frequency,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'rds_dab' | 'social_card'>('rds_dab');

  const [rdsData, setRdsData] = useState<RdsDabMetadata>({
    psName: 'CLOUD 98',
    radioText: `${currentTrack?.artist || 'TOP ARTIST'} - ${currentTrack?.title || 'CURRENT HIT'} [CLOUD RADIO 98.5 FM]`,
    radioTextPlus: {
      itemTitle: currentTrack?.title || 'Hit Track',
      itemArtist: currentTrack?.artist || 'Star Artist',
      showName: 'Morning Drive with Alex',
      stationPhone: '+420 800 123 456',
      stationWebsite: 'www.cloudradio.fm',
    },
    dabDlsText: `NOW PLAYING: ${currentTrack?.artist || 'Artist'} - ${currentTrack?.title || 'Song'} on ${stationName}`,
    ptyCode: 10, // Pop Music
    piCode: '20FB',
    tpActive: true,
    taActive: false,
  });

  // Social Post Generator State
  const [socialCaption, setSocialCaption] = useState('');
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [copied, setCopied] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const handleGenerateSocialPost = async () => {
    setIsGeneratingSocial(true);
    try {
      const res = await fetch('/api/gemini/social-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle: currentTrack?.title || 'Great Music Hit',
          trackArtist: currentTrack?.artist || 'Featured Artist',
          stationName,
          showName: rdsData.radioTextPlus.showName,
          language: 'cs',
        }),
      });
      const data = await res.json();
      setSocialCaption(data.postText || '');
      onShowToast('Generated Social Media Post copy with Gemini 3.7');
    } catch (e) {
      console.error(e);
      setSocialCaption(`🔥 PRÁVĚ HRAJEME: ${currentTrack?.artist} - ${currentTrack?.title} na vlnách ${stationName}! Nalaďte se s námi.`);
    } finally {
      setIsGeneratingSocial(false);
    }
  };

  const handleCopyCaption = () => {
    if (!socialCaption) return;
    navigator.clipboard.writeText(socialCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('Copied post caption to clipboard');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#161820] border border-[#2c303e] rounded-xl p-6 w-full max-w-3xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">RDS, DAB+ & Visual Radio Hub</h3>
              <p className="text-[11px] text-slate-400">
                Car radio display simulator (RT+ & DLS) and instant Social Media Now Playing card generator
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#2c303e] text-xs font-bold space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('rds_dab')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'rds_dab'
                ? 'text-sky-400 border-sky-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>RDS RT+ & DAB+ DLS Display</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('social_card');
              if (!socialCaption) handleGenerateSocialPost();
            }}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'social_card'
                ? 'text-sky-400 border-sky-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Visual Radio & Social Media Post</span>
          </button>
        </div>

        {/* TAB 1: RDS & DAB+ */}
        {activeTab === 'rds_dab' && (
          <div className="space-y-4 text-xs">
            {/* Realistic Car Radio LCD Screen Display */}
            <div className="bg-[#0b141a] border-2 border-[#1c2c36] rounded-xl p-4 shadow-inner space-y-3 font-mono">
              <div className="flex justify-between items-center text-[#4ade80] text-[11px] border-b border-[#1c2c36] pb-2">
                <span className="font-bold tracking-widest">{frequency} • FM STEREO RDS</span>
                <div className="flex items-center space-x-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${rdsData.tpActive ? 'bg-[#15803d] text-white' : 'text-slate-600'}`}>TP</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${rdsData.taActive ? 'bg-[#b91c1c] text-white animate-pulse' : 'text-slate-600'}`}>TA</span>
                  <span className="text-slate-400">PI: {rdsData.piCode}</span>
                </div>
              </div>

              {/* Station PS Name (8 characters) */}
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black tracking-widest text-[#22c55e]">
                  {rdsData.psName}
                </div>
                <div className="text-[#38bdf8] text-xs font-sans">
                  PTY: Pop Music (Code 10)
                </div>
              </div>

              {/* RadioText Scrolling Line (64 chars) */}
              <div className="bg-[#04080c] border border-[#16232c] p-2.5 rounded text-[#38bdf8] text-sm tracking-wide overflow-x-auto whitespace-nowrap">
                {currentTrack?.artist} - {currentTrack?.title} • {stationName} • {rdsData.radioTextPlus.showName}
              </div>

              {/* DAB+ DLS Dynamic Label */}
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>DAB+ DLS: {rdsData.dabDlsText}</span>
                <span className="text-emerald-400 font-bold">128 kbps AAC+</span>
              </div>
            </div>

            {/* RDS RT+ Metadata Tags Table */}
            <div className="grid grid-cols-2 gap-3 bg-[#101217] border border-[#2c303e] rounded-lg p-3.5">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">PS Name (8 chars)</label>
                <input
                  type="text"
                  maxLength={8}
                  value={rdsData.psName}
                  onChange={(e) => setRdsData((p) => ({ ...p, psName: e.target.value.toUpperCase() }))}
                  className="w-full bg-[#161820] border border-[#2c303e] rounded p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Current Show Name</label>
                <input
                  type="text"
                  value={rdsData.radioTextPlus.showName}
                  onChange={(e) =>
                    setRdsData((p) => ({
                      ...p,
                      radioTextPlus: { ...p.radioTextPlus, showName: e.target.value },
                    }))
                  }
                  className="w-full bg-[#161820] border border-[#2c303e] rounded p-2 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOCIAL CARD & POST */}
        {activeTab === 'social_card' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              {/* Visual Radio Card Graphic Preview */}
              <div
                ref={cardRef}
                className="bg-gradient-to-br from-[#1e1b4b] via-[#0f172a] to-[#1e293b] border-2 border-indigo-500/40 rounded-xl p-5 shadow-2xl flex flex-col justify-between aspect-square relative overflow-hidden"
              >
                <div className="flex justify-between items-center relative z-10">
                  <div className="bg-red-600 text-white font-black text-[10px] tracking-widest px-2 py-0.5 rounded-full flex items-center space-x-1 shadow">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>ON AIR NOW</span>
                  </div>
                  <span className="font-bold text-slate-300 text-[11px] font-mono">{frequency}</span>
                </div>

                <div className="space-y-2 relative z-10">
                  <span className="text-[11px] font-bold text-indigo-400 tracking-wider uppercase">
                    {rdsData.radioTextPlus.showName}
                  </span>
                  <h2 className="text-xl font-black text-white leading-tight">
                    {currentTrack?.title || 'Top Radio Hit'}
                  </h2>
                  <p className="text-sm font-semibold text-slate-300">
                    {currentTrack?.artist || 'Featured Artist'}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-indigo-900/50 text-[10px] text-slate-400 relative z-10">
                  <span className="font-bold text-white tracking-wider">{stationName}</span>
                  <span className="font-mono text-indigo-300">stream.cloudradio.fm</span>
                </div>
              </div>

              {/* AI Generated Social Post Copy */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sky-400">AI Social Media Caption:</span>
                  <button
                    type="button"
                    onClick={handleGenerateSocialPost}
                    disabled={isGeneratingSocial}
                    className="text-[11px] text-sky-300 hover:text-white flex items-center space-x-1 cursor-pointer bg-sky-950/40 border border-sky-800/40 px-2 py-1 rounded"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isGeneratingSocial ? 'Writing...' : 'Re-generate'}</span>
                  </button>
                </div>

                <textarea
                  rows={7}
                  value={socialCaption}
                  onChange={(e) => setSocialCaption(e.target.value)}
                  className="w-full bg-[#101217] border border-[#2c303e] rounded p-2.5 text-xs text-white leading-relaxed"
                />

                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Caption Copied!' : 'Copy Caption for Instagram / Facebook'}</span>
                </button>
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
