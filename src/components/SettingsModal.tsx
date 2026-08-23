import React, { useState } from 'react';
import { Settings, X, Save, Radio, Shield, Sliders } from 'lucide-react';
import { BroadcastSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: BroadcastSettings;
  onClose: () => void;
  onSaveSettings: (newSettings: BroadcastSettings) => void;
  onShowToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSaveSettings,
  onShowToast,
}) => {
  const [form, setForm] = useState<BroadcastSettings>(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(form);
    onClose();
    onShowToast('Studio preferences saved successfully!');
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#1a1c23] border border-[#2c303e] rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-base text-white">Cloud Radio Automation Preferences</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preferences Form */}
        <div className="space-y-3.5 text-xs">
          {/* Station Call Sign */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Station Call Sign / Name</label>
            <input
              type="text"
              value={form.stationName}
              onChange={(e) => setForm({ ...form, stationName: e.target.value })}
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Broadcast Frequency */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Frequency & Slogan</label>
            <input
              type="text"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Crossfade Duration */}
          <div className="bg-[#121316] p-3 rounded-lg border border-[#2c303e] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-200">Auto-Segue Crossfade Time</div>
                <div className="text-[10px] text-slate-400">Duration of crossfade overlap when songs end</div>
              </div>
              <span className="font-mono font-bold text-blue-400 text-sm">{form.crossfadeSec}s</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={form.crossfadeSec}
              onChange={(e) => setForm({ ...form, crossfadeSec: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* ICEcast metadata */}
          <div className="flex items-center justify-between bg-[#121316] p-3 rounded-lg border border-[#2c303e]">
            <div>
              <div className="font-bold text-gray-200">ICEcast Stream Metadata Push</div>
              <div className="text-[10px] text-slate-400">Send live Artist & Title metadata to streaming servers</div>
            </div>
            <input
              type="checkbox"
              checked={form.icecastPush}
              onChange={(e) => setForm({ ...form, icecastPush: e.target.checked })}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          {/* Bitrate & Auto-cue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Stream Encoder Quality</label>
              <select
                value={form.encoderBitrate}
                onChange={(e) => setForm({ ...form, encoderBitrate: e.target.value })}
                className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
              >
                <option value="128kbps">128 kbps (MP3 Standard)</option>
                <option value="192kbps">192 kbps (AAC High)</option>
                <option value="320kbps">320 kbps (Studio Master)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Profanity Cushion Delay</label>
              <select
                value={form.cushionSec}
                onChange={(e) => setForm({ ...form, cushionSec: Number(e.target.value) })}
                className="w-full bg-[#121316] border border-[#2c303e] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
              >
                <option value="5">5 Seconds Buffer</option>
                <option value="7">7 Seconds (Standard)</option>
                <option value="10">10 Seconds Extended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-[#2c303e]">
          <button
            onClick={onClose}
            className="bg-[#232631] hover:bg-[#2c303e] text-gray-300 px-4 py-2 rounded font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer glow-blue"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
