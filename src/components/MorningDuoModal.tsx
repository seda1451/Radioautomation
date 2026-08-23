import React, { useState, useEffect } from 'react';
import { Users, PhoneCall, Sparkles, Volume2, X, Check, Play, Square, RefreshCw, MessageSquare } from 'lucide-react';
import { QueueItem, DialogueLine, MorningDuoScript } from '../types';
import { audioEngine } from '../services/audioEngine';

interface MorningDuoModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextTrack: QueueItem | null;
  onInsertDialogueToQueue: (title: string, durationSec: number) => void;
  onShowToast: (msg: string) => void;
}

export const MorningDuoModal: React.FC<MorningDuoModalProps> = ({
  isOpen,
  onClose,
  nextTrack,
  onInsertDialogueToQueue,
  onShowToast,
}) => {
  const [mode, setMode] = useState<'morning_duo' | 'listener_call' | 'quiz_game'>('morning_duo');
  const [topic, setTopic] = useState('Ranní káva, vstávání a dnešní počasí');
  const [host1Name, setHost1Name] = useState('Alex');
  const [host2Name, setHost2Name] = useState('Tereza');
  const [callerName, setCallerName] = useState('Petr z Brna');
  const [language, setLanguage] = useState<'cs' | 'en'>('cs');

  const [isLoading, setIsLoading] = useState(false);
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([]);
  const [totalDuration, setTotalDuration] = useState(25);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (isOpen && dialogueLines.length === 0) {
      handleGenerateDuoScript();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateDuoScript = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/morning-duo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          topic,
          host1Name,
          host2Name,
          callerName,
          language,
          stationName: 'Cloud Radio 98.5 FM',
          nextTrack,
        }),
      });

      const data: MorningDuoScript = await res.json();
      if (data.dialogue && data.dialogue.length > 0) {
        setDialogueLines(data.dialogue);
        setTotalDuration(data.totalDurationSec || 25);
        onShowToast(`Generated ${mode === 'listener_call' ? 'Phone-In' : 'Morning Show'} script with Gemini 3.7`);
      }
    } catch (e) {
      console.error(e);
      onShowToast('Loaded radio conversation script');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuditionDialogue = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onShowToast('Speech Synthesis not supported in this browser');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentLineIndex(-1);
      audioEngine.releasePlayoutDucking();
      return;
    }

    if (dialogueLines.length === 0) return;

    window.speechSynthesis.cancel();
    setIsPlaying(true);
    audioEngine.setPlayoutDucking(0.2); // Duck music during dialogue

    let idx = 0;
    const playNext = () => {
      if (idx >= dialogueLines.length) {
        setIsPlaying(false);
        setCurrentLineIndex(-1);
        audioEngine.releasePlayoutDucking();
        onShowToast('Dialogue audition finished');
        return;
      }

      setCurrentLineIndex(idx);
      const line = dialogueLines[idx];
      const utterance = new SpeechSynthesisUtterance(line.text);

      // Select distinct voice characteristics
      if (voices.length > 0) {
        const csVoices = voices.filter(v => v.lang.startsWith('cs'));
        const enVoices = voices.filter(v => v.lang.startsWith('en'));
        const pool = language === 'cs' && csVoices.length > 0 ? csVoices : enVoices.length > 0 ? enVoices : voices;

        if (line.speaker === 'host1') {
          utterance.voice = pool[0];
          utterance.pitch = 0.95;
          utterance.rate = 1.1;
        } else if (line.speaker === 'host2') {
          utterance.voice = pool.length > 1 ? pool[1] : pool[0];
          utterance.pitch = 1.25;
          utterance.rate = 1.05;
        } else {
          // Caller voice (slightly faster, filtered pitch)
          utterance.voice = pool.length > 2 ? pool[2] : pool[0];
          utterance.pitch = 1.1;
          utterance.rate = 1.0;
        }
      }

      utterance.onend = () => {
        idx++;
        setTimeout(playNext, 250); // Natural pause between speakers
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentLineIndex(-1);
        audioEngine.releasePlayoutDucking();
      };

      window.speechSynthesis.speak(utterance);
    };

    playNext();
  };

  const handleInsertToPlayout = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      audioEngine.releasePlayoutDucking();
    }

    const titlePrefix = mode === 'listener_call' ? `CALL: ${callerName}` : `DUO: ${host1Name} & ${host2Name}`;
    const mins = Math.floor(totalDuration / 60);
    const secs = totalDuration % 60;
    const durStr = `${mins}:${String(secs).padStart(2, '0')}`;

    onInsertDialogueToQueue(`${titlePrefix} (${durStr})`, totalDuration);
    onClose();
    onShowToast(`Inserted dialogue track into On-Air Log (${durStr})`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#161820] border border-[#2c303e] rounded-xl p-6 w-full max-w-3xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-600/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AI Co-Host Studio & Listener Phone-In</h3>
              <p className="text-[11px] text-slate-400">
                Two-person morning show banter, witty banter, and live listener contest phone-ins
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isPlaying) window.speechSynthesis.cancel();
              audioEngine.releasePlayoutDucking();
              onClose();
            }}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { id: 'morning_duo', label: 'Morning Show Duo (Alex & Tereza)', icon: Users },
            { id: 'listener_call', label: 'Listener Phone-In Caller', icon: PhoneCall },
            { id: 'quiz_game', label: 'Morning Quiz / Contest Game', icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const isSel = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id as typeof mode)}
                className={`py-2 px-3 rounded-lg border text-center font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                  isSel
                    ? 'bg-pink-950/60 border-pink-500 text-white shadow'
                    : 'bg-[#101217] border-[#2c303e] text-slate-400 hover:text-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-pink-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Lead Host</label>
            <input
              type="text"
              value={host1Name}
              onChange={(e) => setHost1Name(e.target.value)}
              className="w-full bg-[#101217] border border-[#2c303e] rounded px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Co-Host</label>
            <input
              type="text"
              value={host2Name}
              onChange={(e) => setHost2Name(e.target.value)}
              className="w-full bg-[#101217] border border-[#2c303e] rounded px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              {mode === 'listener_call' ? 'Caller Name' : 'Language'}
            </label>
            {mode === 'listener_call' ? (
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                className="w-full bg-[#101217] border border-[#2c303e] rounded px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-pink-500"
              />
            ) : (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'cs' | 'en')}
                className="w-full bg-[#101217] border border-[#2c303e] rounded px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-pink-500"
              >
                <option value="cs">Čeština (Czech)</option>
                <option value="en">English (US/UK)</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Topic / Premise</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#101217] border border-[#2c303e] rounded px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Script Dialogue Lines Box */}
        <div className="bg-[#101217] border border-[#2c303e] rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-pink-400 flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Multi-Speaker Dialogue Flow ({dialogueLines.length} turns, ~{totalDuration}s)</span>
            </span>
            <button
              type="button"
              onClick={handleGenerateDuoScript}
              disabled={isLoading}
              className="text-[11px] text-pink-300 hover:text-white flex items-center space-x-1 cursor-pointer bg-pink-950/40 border border-pink-800/40 px-2.5 py-1 rounded"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Generating with Gemini...' : 'Re-generate Dialogue'}</span>
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {dialogueLines.map((line, idx) => {
              const isSpeaking = currentLineIndex === idx;
              const isHost1 = line.speaker === 'host1';
              const isHost2 = line.speaker === 'host2';
              const isCaller = line.speaker === 'caller';

              return (
                <div
                  key={line.id || idx}
                  className={`p-2.5 rounded-lg border transition ${
                    isSpeaking
                      ? 'bg-pink-950/70 border-pink-400 text-white shadow-md'
                      : isHost1
                      ? 'bg-[#181b24] border-blue-900/40 text-gray-200'
                      : isHost2
                      ? 'bg-[#1e1724] border-pink-900/40 text-gray-200'
                      : 'bg-[#1e2219] border-emerald-900/40 text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                    <span
                      className={
                        isHost1
                          ? 'text-blue-400'
                          : isHost2
                          ? 'text-pink-400'
                          : 'text-emerald-400 flex items-center space-x-1'
                      }
                    >
                      {isCaller && <PhoneCall className="w-3 h-3 inline mr-1" />}
                      {line.speakerName || (isHost1 ? host1Name : isHost2 ? host2Name : callerName)}
                    </span>
                    <span className="text-[10px] text-slate-500">:{line.suggestedDurationSec}s</span>
                  </div>
                  <p className="text-xs leading-relaxed font-sans">{line.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Audition Button & Insert */}
        <div className="flex justify-between items-center pt-2 border-t border-[#2c303e]">
          <button
            type="button"
            onClick={handleAuditionDialogue}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow transition ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                : 'bg-[#252836] hover:bg-[#313547] text-pink-300'
            }`}
          >
            {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Stop Dialogue' : 'Audition Live Conversation'}</span>
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                if (isPlaying) window.speechSynthesis.cancel();
                audioEngine.releasePlayoutDucking();
                onClose();
              }}
              className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsertToPlayout}
              className="bg-pink-600 hover:bg-pink-500 text-white px-5 py-2 rounded font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Insert Co-Host Link into Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
