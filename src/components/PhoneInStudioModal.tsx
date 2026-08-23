import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  Mic,
  MessageSquare,
  Sparkles,
  Play,
  Square,
  Volume2,
  VolumeX,
  ShieldAlert,
  Clock,
  User,
  MapPin,
  Tag,
  CheckCircle2,
  X,
  Plus,
  Send,
  Radio,
  FileAudio,
  Scissors,
  ArrowRight,
  Sliders,
  Smile,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PhoneLine, WhatsAppVoiceMessage, QueueItem } from '../types';
import { audioEngine } from '../services/audioEngine';

interface PhoneInStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneLines: PhoneLine[];
  onUpdatePhoneLines: (lines: PhoneLine[]) => void;
  whatsAppMessages: WhatsAppVoiceMessage[];
  onUpdateWhatsAppMessages: (msgs: WhatsAppVoiceMessage[]) => void;
  onInjectTrackToPlaylist: (item: Partial<QueueItem>) => void;
  onShowToast: (msg: string) => void;
  isProfanityBufferActive: boolean;
}

export const PhoneInStudioModal: React.FC<PhoneInStudioModalProps> = ({
  isOpen,
  onClose,
  phoneLines,
  onUpdatePhoneLines,
  whatsAppMessages,
  onUpdateWhatsAppMessages,
  onInjectTrackToPlaylist,
  onShowToast,
  isProfanityBufferActive,
}) => {
  const [activeTab, setActiveTab] = useState<'lines' | 'whatsapp' | 'dialer'>('lines');
  const [selectedLineId, setSelectedLineId] = useState<string>(phoneLines[0]?.id || 'line-1');
  const [selectedWaId, setSelectedWaId] = useState<string>(whatsAppMessages[0]?.id || 'wa-1');
  const [dialPadNumber, setDialPadNumber] = useState('');
  const [isPlayingWaAudio, setIsPlayingWaAudio] = useState<string | null>(null);
  const [isPlayingCallerVoice, setIsPlayingCallerVoice] = useState(false);

  // Quick form for screener
  const currentLine = phoneLines.find((l) => l.id === selectedLineId) || phoneLines[0];
  const currentWa = whatsAppMessages.find((w) => w.id === selectedWaId) || whatsAppMessages[0];

  if (!isOpen) return null;

  // Change line status
  const handleSetLineStatus = (lineId: string, status: PhoneLine['status']) => {
    const updated = phoneLines.map((l) => {
      if (l.id === lineId) {
        if (status === 'ON_AIR') {
          audioEngine.playPhoneCallerVoice(`Dobrý den, tady ${l.callerName || 'volající'}. Slyšíme se ve studiu?`);
          onShowToast(`🎙️ Linka #${l.lineNumber} (${l.callerName}) PŘEPNUTA ŽIVĚ DO ÉTERU (ON-AIR)!`);
        }
        return { ...l, status };
      }
      // Only one line ON_AIR at a time usually
      if (status === 'ON_AIR' && l.status === 'ON_AIR') {
        return { ...l, status: 'ON_HOLD' as const };
      }
      return l;
    });
    onUpdatePhoneLines(updated);
  };

  const handleSimulateIncomingCall = (lineNum = 2) => {
    const callerNames = ['Michal z Ostravy', 'Jana z Pardubic', 'Tomáš z Hradce', 'Lenka z Liberce'];
    const topics = ['Ranní soutěž o lístky', 'Hlášení kolony na D1', 'Názor na ranní téma', 'Pozdrav kolegům v práci'];
    const randomName = callerNames[Math.floor(Math.random() * callerNames.length)];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const updated = phoneLines.map((l) => {
      if (l.lineNumber === lineNum) {
        return {
          ...l,
          callerName: randomName,
          callerPhone: `+420 7${Math.floor(10000000 + Math.random() * 89999999)}`,
          callerLocation: randomName.split(' z ')[1] || 'ČR',
          topic: randomTopic,
          screenerNotes: 'Čeká na screening před vpuštěním do vysílání.',
          status: 'RINGING' as const,
          callDurationSec: 0,
          screenerRating: 4,
        };
      }
      return l;
    });

    onUpdatePhoneLines(updated);
    audioEngine.playPhoneRinging(2);
    onShowToast(`📞 PŘÍCHOZÍ HOVOR na Lince #${lineNum}: ${randomName} (${randomTopic})`);
  };

  const handleDropCall = (lineId: string) => {
    const updated = phoneLines.map((l) => {
      if (l.id === lineId) {
        return {
          ...l,
          callerName: 'Volná linka',
          callerPhone: '---',
          callerLocation: '---',
          topic: 'Žádný aktivní hovor',
          screenerNotes: '',
          status: 'IDLE' as const,
          callDurationSec: 0,
          screenerRating: undefined,
        };
      }
      return l;
    });
    onUpdatePhoneLines(updated);
    onShowToast('📴 Hovor byl ukončen a linka uvolněna.');
  };

  const handleDialKey = (key: string) => {
    setDialPadNumber((prev) => prev + key);
    audioEngine.playDtmfTone(key);
  };

  const handleAiTranscribeWa = async (msgId: string) => {
    const target = whatsAppMessages.find((m) => m.id === msgId);
    if (!target) return;

    const updatedLoading = whatsAppMessages.map((m) =>
      m.id === msgId ? { ...m, isAiTranscribing: true } : m
    );
    onUpdateWhatsAppMessages(updatedLoading);

    try {
      const res = await fetch('/api/gemini/transcribe-voice-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: target.senderName,
          topicTag: target.topicTag,
          simulatedAudioLength: target.durationSec,
        }),
      });
      const data = await res.json();

      const updated = whatsAppMessages.map((m) => {
        if (m.id === msgId) {
          return {
            ...m,
            transcription: data.transcription || m.transcription,
            sentiment: data.sentiment || m.sentiment,
            status: 'TRANSCRIBED' as const,
            isAiTranscribing: false,
          };
        }
        return m;
      });

      onUpdateWhatsAppMessages(updated);
      onShowToast(`✨ Hlasová zpráva od ${target.senderName} byla přepsána přes Gemini Speech-to-Text!`);
    } catch {
      onShowToast('⚠️ Chyba při přepisu hlasovky, ponechán původní záznam.');
    }
  };

  const handleInjectWaToPlaylist = (msg: WhatsAppVoiceMessage) => {
    const newTrack: Partial<QueueItem> = {
      id: `wa-voice-${Date.now()}`,
      title: `WhatsApp: ${msg.senderName} (${msg.topicTag})`,
      artist: `Posluchač (${msg.senderCity})`,
      dur: `0:${msg.durationSec < 10 ? '0' : ''}${msg.durationSec}`,
      durSeconds: msg.durationSec,
      intro: '0:02',
      type: 'VOICE_TRACK',
      category: 'VOICE_TRACK',
      isLive: false,
    };

    onInjectTrackToPlaylist(newTrack);

    const updated = whatsAppMessages.map((m) =>
      m.id === msg.id ? { ...m, status: 'QUEUED' as const } : m
    );
    onUpdateWhatsAppMessages(updated);
    onShowToast(`📥 Hlasová zpráva od ${msg.senderName} byla zařazena jako další prvek do playlistu!`);
  };

  const handleAirNowWa = (msg: WhatsAppVoiceMessage) => {
    if (isPlayingWaAudio === msg.id) {
      audioEngine.stopTtsOnAir();
      setIsPlayingWaAudio(null);
      return;
    }

    setIsPlayingWaAudio(msg.id);
    audioEngine.playCallerOnAir(
      msg.transcription,
      { callerName: msg.senderName, duckPlayout: true },
      () => {
        onShowToast(`🎙️ Hlasovka od ${msg.senderName} hraje živě do éteru (Playout ducked)!`);
      },
      () => {
        setIsPlayingWaAudio(null);
        const updated = whatsAppMessages.map((m) =>
          m.id === msg.id ? { ...m, status: 'AIRED' as const } : m
        );
        onUpdateWhatsAppMessages(updated);
        onShowToast(`✅ Hlasovka od ${msg.senderName} dohrála, playout obnoven.`);
      }
    );
  };

  const handleSimulateNewWa = () => {
    const cities = ['Brno', 'Ostrava', 'České Budějovice', 'Karlovy Vary', 'Zlín'];
    const names = ['Klára V.', 'Martin D.', 'Radek S.', 'Barbora T.'];
    const topics = ['Dopravní radar', 'Reakce na ranní téma', 'Hudební přání', 'Soutěžní tip'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    const newMsg: WhatsAppVoiceMessage = {
      id: `wa-${Date.now()}`,
      senderName: name,
      senderPhone: `+420 7${Math.floor(10000000 + Math.random() * 89999999)}`,
      senderCity: city,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationSec: Math.floor(8 + Math.random() * 14),
      status: 'NEW',
      transcription: 'Čeká na AI Speech-to-Text přepis...',
      sentiment: 'POSITIVE',
      topicTag: topic,
      waveformPeaks: Array.from({ length: 24 }, () => Math.floor(20 + Math.random() * 80)),
    };

    onUpdateWhatsAppMessages([newMsg, ...whatsAppMessages]);
    onShowToast(`💬 Nová WhatsApp hlasová zpráva od ${name} (${city})!`);
  };

  const getStatusBadge = (status: PhoneLine['status']) => {
    switch (status) {
      case 'ON_AIR':
        return 'bg-red-600 text-white font-extrabold animate-pulse border-red-400';
      case 'READY_ON_AIR':
        return 'bg-emerald-600 text-white font-bold border-emerald-400';
      case 'RINGING':
        return 'bg-amber-500 text-slate-950 font-bold animate-bounce border-amber-300';
      case 'SCREENING':
        return 'bg-blue-600 text-white border-blue-400';
      case 'ON_HOLD':
        return 'bg-amber-600/80 text-amber-100 border-amber-500';
      case 'BUSY':
        return 'bg-purple-600/80 text-purple-100 border-purple-500';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div id="phonein-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div id="phonein-modal-container" className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  VoIP Phone-In Studio & WhatsApp Voice Inbox
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SIP v2.0 • 4 Linky
                </span>
                {isProfanityBufferActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> 7s DUMP Chráněno
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400 border border-slate-600">
                    DUMP neaktivní
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Telefonní call-screener pro živé hovory, fronta linek a WhatsApp hlasovky s AI přepisem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSimulateIncomingCall(2)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-sm"
              title="Simulovat příchozí hovor do studia"
            >
              <PhoneIncoming className="w-3.5 h-3.5" />
              + Simulovat hovor
            </button>
            <button
              onClick={handleSimulateNewWa}
              className="px-3 py-1.5 rounded-lg bg-teal-600/80 hover:bg-teal-600 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-sm"
              title="Simulovat novou WhatsApp hlasovku"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              + Simulovat WhatsApp
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center border-b border-slate-700/60 bg-slate-900/90 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('lines')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'lines'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            Telefonní linky & Screener desk ({phoneLines.filter((l) => l.status !== 'IDLE').length} aktivní)
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'whatsapp'
                ? 'border-teal-500 text-teal-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Voice Inbox ({whatsAppMessages.length} zpráv)
          </button>
          <button
            onClick={() => setActiveTab('dialer')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'dialer'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            DTMF Dialpad & SIP Hybrid Nastavení
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* TAB 1: PHONE LINES & SCREENER */}
          {activeTab === 'lines' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 4 PHONE LINES MATRIX (LEFT) */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Stav telefonních linek (SIP Console):
                </h3>

                {phoneLines.map((line) => {
                  const isSelected = selectedLineId === line.id;
                  const isOnAir = line.status === 'ON_AIR';
                  return (
                    <div
                      key={line.id}
                      onClick={() => setSelectedLineId(line.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isOnAir
                          ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/50 shadow-lg'
                          : isSelected
                          ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/40'
                          : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isOnAir ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-700 text-slate-200'
                          }`}>
                            L{line.lineNumber}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-2">
                              {line.callerName}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span>{line.callerPhone}</span>
                              {line.callerLocation && <span>• 📍 {line.callerLocation}</span>}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] border uppercase ${getStatusBadge(line.status)}`}>
                          {line.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 font-medium bg-slate-900/60 p-2 rounded-lg mb-3">
                        💬 <span className="text-slate-400">Téma:</span> {line.topic}
                      </div>

                      {/* QUICK ACTION BUTTONS PER LINE */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-700/60">
                        {line.status === 'RINGING' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetLineStatus(line.id, 'SCREENING');
                            }}
                            className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                          >
                            <PhoneCall className="w-3 h-3" /> Zvednout & Screenovat
                          </button>
                        )}

                        {line.status === 'SCREENING' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetLineStatus(line.id, 'READY_ON_AIR');
                            }}
                            className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Připravit na On-Air
                          </button>
                        )}

                        {line.status === 'READY_ON_AIR' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetLineStatus(line.id, 'ON_AIR');
                            }}
                            className="flex-1 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase flex items-center justify-center gap-1 animate-pulse"
                          >
                            <Radio className="w-3 h-3" /> PUSTIT ŽIVĚ ON-AIR
                          </button>
                        )}

                        {line.status === 'ON_AIR' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetLineStatus(line.id, 'ON_HOLD');
                            }}
                            className="flex-1 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                          >
                            <Clock className="w-3 h-3" /> Přepnout na Hold
                          </button>
                        )}

                        {line.status !== 'IDLE' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDropCall(line.id);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-700 hover:bg-red-700 text-slate-300 hover:text-white font-bold text-xs"
                            title="Zavěsit / Ukončit hovor"
                          >
                            <PhoneOff className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SCREENER DESK DETAIL (RIGHT) */}
              <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700 rounded-xl p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Screener Desk: Linka #{currentLine.lineNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] border uppercase ${getStatusBadge(currentLine.status)}`}>
                          {currentLine.status}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Záznamník a instrukce pro moderátora před vstupem do živého vysílání
                      </p>
                    </div>
                    {currentLine.status === 'ON_AIR' ? (
                      <div className="px-3 py-1 bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-lg animate-pulse shadow-md">
                        🔴 LIVE ON-AIR
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSetLineStatus(currentLine.id, 'ON_AIR')}
                        disabled={currentLine.status === 'IDLE'}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Radio className="w-3.5 h-3.5" /> Pustit do vysílání
                      </button>
                    )}
                  </div>

                  {/* FORM FIELDS */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Jméno volajícího:</label>
                      <input
                        type="text"
                        value={currentLine.callerName}
                        onChange={(e) => {
                          const updated = phoneLines.map((l) =>
                            l.id === currentLine.id ? { ...l, callerName: e.target.value } : l
                          );
                          onUpdatePhoneLines(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Město / Lokalita:</label>
                      <input
                        type="text"
                        value={currentLine.callerLocation}
                        onChange={(e) => {
                          const updated = phoneLines.map((l) =>
                            l.id === currentLine.id ? { ...l, callerLocation: e.target.value } : l
                          );
                          onUpdatePhoneLines(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Téma příspěvku do éteru:</label>
                    <input
                      type="text"
                      value={currentLine.topic}
                      onChange={(e) => {
                        const updated = phoneLines.map((l) =>
                          l.id === currentLine.id ? { ...l, topic: e.target.value } : l
                        );
                        onUpdatePhoneLines(updated);
                      }}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                      placeholder="O čem chce volající mluvit..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Poznámky screenera pro moderátora (interní):
                    </label>
                    <textarea
                      rows={3}
                      value={currentLine.screenerNotes}
                      onChange={(e) => {
                        const updated = phoneLines.map((l) =>
                          l.id === currentLine.id ? { ...l, screenerNotes: e.target.value } : l
                        );
                        onUpdatePhoneLines(updated);
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      placeholder="např. Volající je velmi vtipný, má historku k ranní anketě. Bez vulgarit."
                    />
                  </div>

                  {/* CALLER VOICE TEST SIMULATOR */}
                  <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Náslech hlasu volajícího (PFL / CUE)</div>
                        <div className="text-[11px] text-slate-400">Telefonní pásmová propust 300Hz–3.4kHz</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        audioEngine.playPhoneCallerVoice(
                          `Ahoj rádio! Tady ${currentLine.callerName}. Chci říct pár slov k vašemu tématu: ${currentLine.topic}.`
                        );
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" /> Přehrát test hovoru
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Hovor prochází 7s Profanity Delay bufferem pro bezpečnost před vulgarismy.</span>
                  </div>
                  <button
                    onClick={() => handleDropCall(currentLine.id)}
                    className="px-4 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-700 text-xs font-bold flex items-center gap-1.5"
                  >
                    <PhoneOff className="w-3.5 h-3.5" /> Zavěsit linku
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP VOICE INBOX */}
          {activeTab === 'whatsapp' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* WHATSAPP LIST (LEFT) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Příchozí hlasové zprávy (+420 777 985 985):
                  </h3>
                  <button
                    onClick={handleSimulateNewWa}
                    className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Přijmout novou
                  </button>
                </div>

                {whatsAppMessages.map((msg) => {
                  const isSelected = selectedWaId === msg.id;
                  const isPlaying = isPlayingWaAudio === msg.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedWaId(msg.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isPlaying
                          ? 'bg-teal-950/40 border-teal-400 ring-2 ring-teal-500/50 shadow-md'
                          : isSelected
                          ? 'bg-slate-800 border-teal-500 ring-1 ring-teal-500/40'
                          : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-teal-600/30 text-teal-300 border border-teal-500/40 flex items-center justify-center font-bold text-xs">
                            {msg.senderName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-white">{msg.senderName}</span>
                            <span className="text-xs text-slate-400 ml-1.5">📍 {msg.senderCity}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{msg.timestamp}</span>
                      </div>

                      {/* SIMULATED WAVEFORM BARS */}
                      <div className="flex items-center gap-0.5 h-6 my-2 bg-slate-900/60 px-2 rounded-lg">
                        {msg.waveformPeaks.map((peak, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 rounded-full transition-all ${
                              isPlaying ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'
                            }`}
                            style={{ height: `${Math.max(15, peak)}%` }}
                          />
                        ))}
                        <span className="text-[10px] font-mono text-teal-300 ml-2">
                          0:{msg.durationSec < 10 ? '0' : ''}{msg.durationSec}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
                        <span className="text-slate-300 font-medium">🏷️ {msg.topicTag}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          msg.status === 'AIRED'
                            ? 'bg-slate-700 text-slate-300'
                            : msg.status === 'QUEUED'
                            ? 'bg-indigo-600/80 text-white'
                            : 'bg-teal-600/80 text-white'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* WHATSAPP DETAIL & ACTIONS (RIGHT) */}
              <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700 rounded-xl p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Hlasová zpráva: {currentWa.senderName}</span>
                        <span className="text-xs text-slate-400">({currentWa.senderCity})</span>
                      </h4>
                      <p className="text-xs text-slate-400">Čas doručení: {currentWa.timestamp} • Tel: {currentWa.senderPhone}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAiTranscribeWa(currentWa.id)}
                        disabled={currentWa.isAiTranscribing}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${currentWa.isAiTranscribing ? 'animate-spin' : ''}`} />
                        {currentWa.isAiTranscribing ? 'Přepisuji...' : 'Gemini AI Přepis'}
                      </button>
                    </div>
                  </div>

                  {/* AUDIO PLAY & TRIM TOOLBAR */}
                  <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAirNowWa(currentWa)}
                          className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                            isPlayingWaAudio === currentWa.id
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-teal-600 hover:bg-teal-500 text-white'
                          }`}
                        >
                          {isPlayingWaAudio === currentWa.id ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-white" /> Zastavit On-Air
                            </>
                          ) : (
                            <>
                              <Radio className="w-3.5 h-3.5" /> Pustit živě do vysílání (Ducked)
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            audioEngine.playCallerOnAir(currentWa.transcription, { duckPlayout: false });
                          }}
                          className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" /> Pouze CUE náslech
                        </button>
                      </div>

                      <button
                        onClick={() => handleInjectWaToPlaylist(currentWa)}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Zařadit do Playlistu
                      </button>
                    </div>

                    <div className="text-xs font-semibold text-slate-300">
                      Přepis hlasové zprávy (Text-to-Speech Ready):
                    </div>
                    <textarea
                      rows={3}
                      value={currentWa.transcription}
                      onChange={(e) => {
                        const updated = whatsAppMessages.map((m) =>
                          m.id === currentWa.id ? { ...m, transcription: e.target.value } : m
                        );
                        onUpdateWhatsAppMessages(updated);
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-medium focus:outline-none focus:border-teal-500 leading-relaxed"
                    />
                  </div>

                  {/* SENTIMENT & CATEGORY */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl">
                      <div className="text-[11px] text-slate-400 mb-1">Nálada / Emoce (Sentiment):</div>
                      <span className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
                        😊 {currentWa.sentiment}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl">
                      <div className="text-[11px] text-slate-400 mb-1">Tématický tag:</div>
                      <span className="text-xs font-bold text-white">
                        🏷️ {currentWa.topicTag}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Hlasovka může být zařazena do playlistu nebo ihned odpálena moderátorem.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIALPAD & SIP HYBRID */}
          {activeTab === 'dialer' && (
            <div className="max-w-md mx-auto bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4">
              <div className="text-center">
                <h4 className="font-bold text-white text-base">Studio SIP Dialpad</h4>
                <p className="text-xs text-slate-400">Vytáčení odchozího hovoru přes SIP Telco Trunk</p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-center">
                <span className="font-mono text-xl font-bold tracking-widest text-emerald-400">
                  {dialPadNumber || '+420 '}
                </span>
              </div>

              {/* DIAL KEYS 3x4 */}
              <div className="grid grid-cols-3 gap-2.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleDialKey(key)}
                    className="py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-xl border border-slate-700 text-lg font-bold text-white transition-all shadow-sm flex items-center justify-center cursor-pointer"
                  >
                    {key}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDialPadNumber('')}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl"
                >
                  Vymazat
                </button>
                <button
                  onClick={() => {
                    handleSimulateIncomingCall(3);
                    onShowToast(`📞 Vytáčím číslo ${dialPadNumber} na lince #3...`);
                  }}
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg"
                >
                  <Phone className="w-4 h-4" /> VYTISNOUT HOVOR
                </button>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>VoIP Audio Engine připraven • 4x nezávislý SIP kanál s izolací ozvěny (AEC).</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-colors"
          >
            Zavřít Phone-In studio
          </button>
        </div>

      </div>
    </div>
  );
};
