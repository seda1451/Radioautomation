import React, { useState, useEffect } from 'react';
import { RadioTower, Wifi, WifiOff, Activity, Users, Disc, Send, Copy, Download, X, Check, Play, Square, Settings, Volume2 } from 'lucide-react';
import { IcecastEncoderConfig, IcecastEncoderState, QueueItem } from '../types';
import { audioEngine } from '../services/audioEngine';

interface IcecastWebRtcEncoderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: IcecastEncoderConfig;
  state: IcecastEncoderState;
  currentTrack: QueueItem | null;
  onUpdateConfig: (config: IcecastEncoderConfig) => void;
  onToggleStreaming: () => void;
  onShowToast: (msg: string) => void;
}

export const IcecastWebRtcEncoderModal: React.FC<IcecastWebRtcEncoderModalProps> = ({
  isOpen,
  onClose,
  config,
  state,
  currentTrack,
  onUpdateConfig,
  onToggleStreaming,
  onShowToast,
}) => {
  const [serverUrl, setServerUrl] = useState(config.serverUrl);
  const [mountPoint, setMountPoint] = useState(config.mountPoint);
  const [format, setFormat] = useState(config.format);
  const [bitrate, setBitrate] = useState(config.bitrateKbps);
  const [stationName, setStationName] = useState(config.stationName);
  const [genre, setGenre] = useState(config.genre);

  // Dynamic ICY metadata
  const [customMetadata, setCustomMetadata] = useState(
    currentTrack ? `${currentTrack.artist} - ${currentTrack.title}` : 'Cloud Radio 98.5 FM - Live Stream'
  );

  // Aircheck recording state
  const [isRecordingAircheck, setIsRecordingAircheck] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  useEffect(() => {
    if (currentTrack) {
      setCustomMetadata(`${currentTrack.artist} - ${currentTrack.title}`);
    }
  }, [currentTrack]);

  if (!isOpen) return null;

  const handlePushIcyMetadata = () => {
    onShowToast(`📻 ICY Metadata Pushed: "${customMetadata}"`);
  };

  const handleCopyStreamUrl = () => {
    const fullUrl = `https://${serverUrl}${mountPoint}`;
    navigator.clipboard.writeText(fullUrl);
    onShowToast(`Copied stream URL: ${fullUrl}`);
  };

  const handleToggleAircheckRecord = () => {
    if (isRecordingAircheck && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecordingAircheck(false);
      onShowToast('Stopped Aircheck Stream Recording');
    } else {
      const stream = audioEngine.getMasterMediaStream();
      if (!stream) {
        onShowToast('Audio engine stream not active');
        return;
      }
      try {
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `CloudRadio_Aircheck_${new Date().toISOString().slice(0, 10)}.webm`;
          a.click();
          onShowToast('Downloaded broadcast aircheck stream recording!');
        };
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecordingAircheck(true);
        onShowToast('🔴 Recording live master broadcast stream...');
      } catch (err) {
        console.error(err);
        onShowToast('Recording error in browser');
      }
    }
  };

  const handleSaveConfig = () => {
    onUpdateConfig({
      ...config,
      serverUrl,
      mountPoint,
      format,
      bitrateKbps: bitrate,
      stationName,
      genre,
    });
    onClose();
    onShowToast('Streaming encoder configuration saved');
  };

  const formatUptime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#14161f] border border-[#2c303e] rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              state.isStreaming
                ? 'bg-emerald-600/25 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <RadioTower className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Icecast / SHOUTcast & WebRTC Live Streaming Encoder</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                  state.isStreaming
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 animate-pulse'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}>
                  {state.isStreaming ? 'STREAMING ON-AIR LIVE' : 'ENCODER STANDBY'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Direct Web Audio master bus encoder with real-time ICY metadata push and listener telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-4 gap-2.5 text-xs">
          <div className="bg-[#0f1118] border border-[#262a37] p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Listeners</span>
              <Users className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {state.connectedListeners.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">Peak today: {state.peakListenersToday}</div>
          </div>

          <div className="bg-[#0f1118] border border-[#262a37] p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Bitrate / Codec</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {bitrate} kbps
            </div>
            <div className="text-[10px] text-slate-500">{format} 48kHz Stereo</div>
          </div>

          <div className="bg-[#0f1118] border border-[#262a37] p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Stream Uptime</span>
              <Wifi className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {state.isStreaming ? formatUptime(state.uptimeSeconds) : '00:00:00'}
            </div>
            <div className="text-[10px] text-slate-500">Buffer: {state.bufferHealthPct}%</div>
          </div>

          <div className="bg-[#0f1118] border border-[#262a37] p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Data Out / CPU</span>
              <RadioTower className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-400 font-mono">
              {(state.bytesSentTotal / (1024 * 1024)).toFixed(1)} MB
            </div>
            <div className="text-[10px] text-slate-500">CPU Load: {state.encoderCpuPercent}%</div>
          </div>
        </div>

        {/* Master Control: Start/Stop Streaming Button & Live Aircheck Recorder */}
        <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onToggleStreaming}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 cursor-pointer shadow-lg transition ${
                state.isStreaming
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
              }`}
            >
              {state.isStreaming ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
              <span>{state.isStreaming ? 'DISCONNECT & STOP STREAM' : 'START ICECAST STREAM'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleAircheckRecord}
              className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer border transition ${
                isRecordingAircheck
                  ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                  : 'bg-[#181b24] hover:bg-[#222634] border-[#2f3547] text-gray-300'
              }`}
            >
              {isRecordingAircheck ? <Square className="w-4 h-4 text-red-400" /> : <Download className="w-4 h-4 text-sky-400" />}
              <span>{isRecordingAircheck ? 'STOP AIRCHECK REC' : 'REC AIRCHECK TO FILE'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyStreamUrl}
              className="bg-[#181b24] hover:bg-[#222634] border border-[#2f3547] px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 flex items-center space-x-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Copy Direct Stream URL</span>
            </button>
          </div>
        </div>

        {/* Dynamic ICY Metadata Real-Time Pusher */}
        <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Disc className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dynamic ICY Metadata (Now Playing Text sent to Winamp / TuneIn / Web Players):</span>
            </span>
            <span className="text-[11px] text-slate-500">Instant push to connected clients</span>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={customMetadata}
              onChange={(e) => setCustomMetadata(e.target.value)}
              className="flex-1 bg-[#151722] border border-[#242838] rounded-lg px-3 py-2 text-gray-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handlePushIcyMetadata}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5 cursor-pointer transition shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Push ICY Title</span>
            </button>
          </div>
        </div>

        {/* Server & Encoder Configuration */}
        <div className="bg-[#0f1118] border border-[#262a37] rounded-xl p-3.5 space-y-3 text-xs">
          <div className="font-bold text-white flex items-center space-x-1.5">
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Streaming Server & Endpoint Configuration:</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Icecast / Relay Host</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full bg-[#151722] border border-[#242838] rounded-lg px-2.5 py-1.5 text-gray-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Mount Point</label>
              <input
                type="text"
                value={mountPoint}
                onChange={(e) => setMountPoint(e.target.value)}
                className="w-full bg-[#151722] border border-[#242838] rounded-lg px-2.5 py-1.5 text-gray-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Audio Bitrate & Codec</label>
              <select
                value={bitrate}
                onChange={(e) => setBitrate(parseInt(e.target.value, 10) as typeof bitrate)}
                className="w-full bg-[#151722] border border-[#242838] rounded-lg px-2.5 py-1.5 text-gray-200 font-mono"
              >
                <option value={128}>128 kbps (Standard Mobile Web)</option>
                <option value={192}>192 kbps (High Quality HQ)</option>
                <option value={256}>256 kbps (Premium DAB+ Quality)</option>
                <option value={320}>320 kbps (Audiophile Studio Master)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-[#2c303e]">
          <div className="text-[11px] text-slate-400">
            Stream feeds all connected Web players, Mobile apps, and Icecast relays in real time.
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Encoder Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
