import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, X, Check, Activity } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface VoiceTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertVoiceTrack: (trackData: { title: string; artist: string; dur: string; durSeconds: number; audioUrl: string }) => void;
  onShowToast: (msg: string) => void;
}

export const VoiceTrackModal: React.FC<VoiceTrackModalProps> = ({
  isOpen,
  onClose,
  onInsertVoiceTrack,
  onShowToast,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [vtTitle, setVtTitle] = useState('Live Host Voice Track');
  const [hostName, setHostName] = useState('Studio Host On-Air');
  const timerRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  if (!isOpen) return null;

  const handleStartRecording = async () => {
    const success = await audioEngine.startVoiceTrackRecording();
    if (success) {
      setIsRecording(true);
      setRecordedAudioUrl(null);
      onShowToast('Recording Voice Track live via microphone...');
    } else {
      onShowToast('Could not access microphone. Please grant browser permissions.');
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording) return;
    try {
      const result = await audioEngine.stopVoiceTrackRecording();
      setIsRecording(false);
      setRecordedAudioUrl(result.audioUrl);
      onShowToast(`Voice Track recorded (${recordingDuration}s)`);
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const handleTogglePreview = () => {
    if (!recordedAudioUrl) return;
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(recordedAudioUrl);
      audioPreviewRef.current.onended = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleConfirmInsert = () => {
    if (!recordedAudioUrl) {
      onShowToast('Please record a voice track first');
      return;
    }

    const mins = Math.floor(recordingDuration / 60);
    const secs = recordingDuration % 60;
    const durStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    onInsertVoiceTrack({
      title: vtTitle || 'Voice Track Link',
      artist: hostName || 'Live Host',
      dur: durStr || '0:15',
      durSeconds: Math.max(3, recordingDuration),
      audioUrl: recordedAudioUrl,
    });

    onClose();
    onShowToast('Voice Track inserted into live On-Air log!');
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#1a1c23] border border-[#2c303e] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <Mic className="w-5 h-5 text-blue-500" />
            <span>Voice Track Recorder & Linker</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Track Label / Segment</label>
              <input
                type="text"
                value={vtTitle}
                onChange={(e) => setVtTitle(e.target.value)}
                className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Host / DJ Name</label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Record Visualizer Panel */}
          <div className="bg-[#121316] border border-[#2c303e] rounded-xl p-6 text-center flex flex-col items-center justify-center space-y-3">
            {isRecording ? (
              <div className="relative">
                <span className="w-16 h-16 rounded-full bg-red-600/30 animate-ping absolute inset-0"></span>
                <button
                  onClick={handleStopRecording}
                  className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg relative z-10 glow-red cursor-pointer hover:bg-red-500 transition"
                  title="Click to Stop Recording"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartRecording}
                className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg cursor-pointer transition glow-blue"
                title="Click to Start Live Recording"
              >
                <Mic className="w-7 h-7" />
              </button>
            )}

            <div className="font-mono text-2xl font-bold text-white tracking-widest">
              {Math.floor(recordingDuration / 60)}:
              {recordingDuration % 60 < 10 ? '0' : ''}
              {recordingDuration % 60}
            </div>

            <div className="text-slate-400 text-[11px]">
              {isRecording
                ? 'Recording in progress... Speak into your microphone'
                : recordedAudioUrl
                ? 'Recording complete! You can preview or insert it.'
                : 'Click the blue microphone button to begin voice tracking'}
            </div>

            {recordedAudioUrl && !isRecording && (
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={handleTogglePreview}
                  className="bg-[#232631] hover:bg-[#2c303e] text-blue-400 border border-[#2c303e] px-4 py-1.5 rounded font-bold flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isPlayingPreview ? 'Stop Preview' : 'Play Preview'}</span>
                </button>
                <button
                  onClick={handleStartRecording}
                  className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
                >
                  Re-record
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-[#2c303e]">
          <button
            onClick={onClose}
            className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmInsert}
            disabled={!recordedAudioUrl || isRecording}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded font-bold shadow flex items-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Insert Voice Track</span>
          </button>
        </div>
      </div>
    </div>
  );
};
