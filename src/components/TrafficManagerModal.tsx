import React, { useState } from 'react';
import { DollarSign, X, Check, Plus, Download, Sparkles, Clock, FileSpreadsheet, PlayCircle } from 'lucide-react';
import { CommercialCampaign, AsRunLogItem } from '../types';

interface TrafficManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCommercialToQueue: (clientName: string, title: string, durSec: number) => void;
  onShowToast: (msg: string) => void;
}

export const TrafficManagerModal: React.FC<TrafficManagerModalProps> = ({
  isOpen,
  onClose,
  onInsertCommercialToQueue,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'asrun' | 'ai_copy'>('campaigns');

  const [campaigns, setCampaigns] = useState<CommercialCampaign[]>([
    {
      id: 'c1',
      clientName: 'Apex Motor Group',
      spotTitle: 'Summer SUV Zero Percent Event',
      category: 'AUTO',
      durationSec: 30,
      scheduledWindows: ['08:15 AM', '05:15 PM'],
      targetPlaysPerDay: 4,
      playedCount: 2,
      active: true,
      ratePerPlay: 45.0,
    },
    {
      id: 'c2',
      clientName: 'City Artisan Coffee',
      spotTitle: 'Cold Brew Drive-Thru Promo',
      category: 'FOOD',
      durationSec: 20,
      scheduledWindows: ['07:45 AM', '09:15 AM'],
      targetPlaysPerDay: 6,
      playedCount: 4,
      active: true,
      ratePerPlay: 30.0,
    },
    {
      id: 'c3',
      clientName: 'Metro Arena Concerts',
      spotTitle: 'Weekend Music Festival Weekend Pass',
      category: 'EVENTS',
      durationSec: 30,
      scheduledWindows: ['04:45 PM', '07:15 PM'],
      targetPlaysPerDay: 5,
      playedCount: 1,
      active: true,
      ratePerPlay: 50.0,
    },
  ]);

  const [asRunLogs, setAsRunLogs] = useState<AsRunLogItem[]>([
    {
      id: 'ar-1',
      timestamp: '08:15:02 AM',
      clientName: 'Apex Motor Group',
      spotTitle: 'Summer SUV Zero Percent Event',
      durationSec: 30,
      status: 'BROADCAST_VERIFIED',
      commercialId: 'c1',
    },
    {
      id: 'ar-2',
      timestamp: '07:45:00 AM',
      clientName: 'City Artisan Coffee',
      spotTitle: 'Cold Brew Drive-Thru Promo',
      durationSec: 20,
      status: 'BROADCAST_VERIFIED',
      commercialId: 'c2',
    },
  ]);

  // AI Copywriter State
  const [clientInput, setClientInput] = useState('');
  const [productInput, setProductInput] = useState('');
  const [aiGeneratedScript, setAiGeneratedScript] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  if (!isOpen) return null;

  const handleGenerateAiSpot = async () => {
    if (!clientInput.trim()) {
      onShowToast('Please enter client name');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/gemini/traffic-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientInput,
          product: productInput || 'Radio promotional event',
          targetSec: 30,
          language: 'cs',
        }),
      });
      const data = await res.json();
      setAiGeneratedScript(data.adScript || 'Tento pořad vám přináší ' + clientInput);
      onShowToast('Sponsor script generated with Gemini 3.7');
    } catch (e) {
      console.error(e);
      setAiGeneratedScript(`Tento pořad vám přináší ${clientInput}. Využijte naši speciální nabídku ještě dnes!`);
      onShowToast('Loaded radio ad template');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleInsertCampaign = (c: CommercialCampaign) => {
    onInsertCommercialToQueue(c.clientName, c.spotTitle, c.durationSec);
    // Add to As-Run log
    const nowStr = new Date().toLocaleTimeString();
    setAsRunLogs((prev) => [
      {
        id: `ar-${Date.now()}`,
        timestamp: nowStr,
        clientName: c.clientName,
        spotTitle: c.spotTitle,
        durationSec: c.durationSec,
        status: 'BROADCAST_VERIFIED',
        commercialId: c.id,
      },
      ...prev,
    ]);
    // Increment count
    setCampaigns((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, playedCount: item.playedCount + 1 } : item))
    );
    onShowToast(`Commercial spot "${c.clientName}" inserted to On-Air Log`);
  };

  const handleExportCsv = () => {
    const headers = 'Timestamp,Client Name,Spot Title,Duration (Sec),Status,Billing Code\n';
    const rows = asRunLogs
      .map(
        (log) =>
          `"${log.timestamp}","${log.clientName}","${log.spotTitle}",${log.durationSec},"${log.status}","${log.commercialId}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `radio_traffic_asrun_log_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    onShowToast('Exported As-Run Compliance CSV Report');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#161820] border border-[#2c303e] rounded-xl p-6 w-full max-w-2xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Commercial Traffic & Sponsor Manager</h3>
              <p className="text-[11px] text-slate-400">
                Sponsor campaigns, Top-of-Hour hard sync triggers, and verified As-Run compliance logs
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#2c303e] text-xs font-bold space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'campaigns'
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <span>Active Commercial Campaigns ({campaigns.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('asrun')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'asrun'
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>As-Run Compliance Log ({asRunLogs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai_copy')}
            className={`pb-2 transition cursor-pointer border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'ai_copy'
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Ad Copywriter</span>
          </button>
        </div>

        {/* TAB 1: CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-3 text-xs">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#101217] border border-[#2c303e] hover:border-amber-500/50 p-3 rounded-lg flex items-center justify-between transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{c.clientName}</span>
                      <span className="bg-amber-950/60 border border-amber-800 text-amber-300 text-[10px] px-1.5 py-0.2 rounded">
                        {c.category}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">:{c.durationSec}s spot</span>
                    </div>
                    <div className="text-slate-300 text-[11px]">{c.spotTitle}</div>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                      <span>
                        Daily Target: <strong className="text-white">{c.playedCount} / {c.targetPlaysPerDay}</strong>
                      </span>
                      <span>Rate: <strong>${c.ratePerPlay}/play</strong></span>
                      <span>Windows: {c.scheduledWindows.join(', ')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInsertCampaign(c)}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded font-bold text-xs shadow flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Insert On-Air</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AS-RUN LOG */}
        {activeTab === 'asrun' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-[#101217] p-2.5 rounded-lg border border-[#2c303e]">
              <span className="text-slate-300">
                Verified On-Air Broadcasts: <strong>{asRunLogs.length} spots recorded</strong>
              </span>
              <button
                type="button"
                onClick={handleExportCsv}
                className="bg-[#2a2f3d] hover:bg-[#383f52] text-amber-300 border border-amber-800/40 px-3 py-1 rounded font-bold flex items-center space-x-1.5 cursor-pointer text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Billing CSV</span>
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5">
              {asRunLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#101217] border border-[#2c303e] p-2.5 rounded flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-amber-400 font-bold">{log.timestamp}</span>
                    <span className="font-bold text-white">{log.clientName}</span>
                    <span className="text-slate-400">- {log.spotTitle}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-400">:{log.durationSec}s</span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                      VERIFIED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AI AD COPYWRITER */}
        {activeTab === 'ai_copy' && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Client Name</label>
                <input
                  type="text"
                  value={clientInput}
                  onChange={(e) => setClientInput(e.target.value)}
                  placeholder="např. Autosalon Nova, Pekárna U Zvonu..."
                  className="w-full bg-[#101217] border border-[#2c303e] rounded p-2 text-gray-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Product / Promo Offer</label>
                <input
                  type="text"
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  placeholder="např. Sleva 20% na letní pneumatiky, víkendová degustace..."
                  className="w-full bg-[#101217] border border-[#2c303e] rounded p-2 text-gray-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAiSpot}
              disabled={isGeneratingAi}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded shadow flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingAi ? 'Generating Ad with Gemini...' : 'Generate Broadcast Radio Ad Copy'}</span>
            </button>

            {aiGeneratedScript && (
              <div className="bg-[#101217] border border-[#2c303e] rounded-lg p-3 space-y-2">
                <span className="font-bold text-amber-400">Generated Spoken Commercial Spot:</span>
                <textarea
                  rows={3}
                  value={aiGeneratedScript}
                  onChange={(e) => setAiGeneratedScript(e.target.value)}
                  className="w-full bg-[#161820] border border-[#2c303e] rounded p-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    onInsertCommercialToQueue(clientInput || 'New Sponsor', 'Radio Spot', 30);
                    onShowToast(`Inserted AI sponsor spot "${clientInput}" into Log`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-bold text-xs cursor-pointer"
                >
                  Schedule this Spot into Playout
                </button>
              </div>
            )}
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
