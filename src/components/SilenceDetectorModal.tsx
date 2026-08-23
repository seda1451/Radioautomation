import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Play, Radio, VolumeX, CheckCircle, RefreshCw, X, Sliders } from 'lucide-react';
import { SilenceDetectorConfig, SilenceDetectorState } from '../types';
import { audioEngine } from '../services/audioEngine';

interface SilenceDetectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onTriggerEmergencyRecovery: () => void;
}

export const SilenceDetectorModal: React.FC<SilenceDetectorModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onTriggerEmergencyRecovery,
}) => {
  const [config, setConfig] = useState<SilenceDetectorConfig>({
    enabled: true,
    thresholdDb: -42,
    triggerDelaySec: 5,
    autoFailoverEnabled: true,
    backupSource: 'EMERGENCY_ROTATION',
  });

  const [state, setState] = useState<SilenceDetectorState>({
    currentRmsDb: -14.2,
    isSilent: 0,
    alarmActive: false,
    failoverTriggered: false,
    lastAlarmTime: null,
    recoveryCount: 0,
  });

  // Real-time audio silence monitor loop
  useEffect(() => {
    let silenceTimer = 0;
    const interval = setInterval(() => {
      if (!config.enabled) return;

      const levels = audioEngine.getLiveMeterLevels();
      const pgm = levels.pgm;

      // Approximate current dB
      const approxDb = pgm > 0 ? -48 + (pgm / 100) * 44 : -75;

      if (approxDb < config.thresholdDb) {
        silenceTimer += 0.5;
        const isAlarm = silenceTimer >= config.triggerDelaySec;

        setState((prev) => {
          const nowStr = new Date().toLocaleTimeString();
          if (isAlarm && !prev.alarmActive && config.autoFailoverEnabled && !prev.failoverTriggered) {
            // Auto failover action!
            audioEngine.triggerEmergencyFailover();
            onTriggerEmergencyRecovery();
            return {
              ...prev,
              currentRmsDb: approxDb,
              isSilent: Math.round(silenceTimer),
              alarmActive: true,
              failoverTriggered: true,
              lastAlarmTime: nowStr,
              recoveryCount: prev.recoveryCount + 1,
            };
          }

          return {
            ...prev,
            currentRmsDb: approxDb,
            isSilent: Math.round(silenceTimer),
            alarmActive: isAlarm,
          };
        });
      } else {
        silenceTimer = 0;
        setState((prev) => ({
          ...prev,
          currentRmsDb: approxDb,
          isSilent: 0,
          alarmActive: false,
          failoverTriggered: false,
        }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [config, onTriggerEmergencyRecovery]);

  if (!isOpen) return null;

  const handleSimulateSilence = () => {
    audioEngine.pausePlayout();
    onShowToast('Simulating main transmitter audio silence...');
  };

  const handleManualFailover = () => {
    audioEngine.triggerEmergencyFailover();
    onTriggerEmergencyRecovery();
    setState((prev) => ({
      ...prev,
      failoverTriggered: true,
      recoveryCount: prev.recoveryCount + 1,
      lastAlarmTime: new Date().toLocaleTimeString(),
    }));
    onShowToast('Emergency backup playlist & sweeper loop initiated');
  };

  const handleResetAlarm = () => {
    audioEngine.resumePlayout();
    setState((prev) => ({
      ...prev,
      alarmActive: false,
      failoverTriggered: false,
      isSilent: 0,
    }));
    onShowToast('Silence detector alarm reset to normal standby');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#161820] border border-[#2c303e] rounded-xl p-6 w-full max-w-2xl shadow-2xl space-y-4 text-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2c303e] pb-3">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                state.alarmActive
                  ? 'bg-red-600/30 border-red-500 text-red-400 animate-pulse'
                  : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {state.alarmActive ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Silence Detector & Auto-Failover Monitor</h3>
              <p className="text-[11px] text-slate-400">
                24/7 Transmitter audio health, dead-air detection, and instant emergency backup playout
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            state.alarmActive
              ? 'bg-red-950/80 border-red-500 text-white shadow-lg animate-pulse'
              : 'bg-[#101217] border-[#2c303e] text-gray-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-4 h-4 rounded-full ${
                state.alarmActive ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
            <div>
              <div className="font-bold text-sm">
                {state.alarmActive
                  ? `CRITICAL: DEAD-AIR SILENCE DETECTED (${state.isSilent}s)`
                  : 'TRANSMITTER AUDIO HEALTHY & ON-AIR'}
              </div>
              <div className="text-[11px] text-slate-400">
                Current RMS: <strong className="font-mono text-white">{state.currentRmsDb.toFixed(1)} dB</strong> |
                Threshold: <strong className="font-mono text-slate-300">{config.thresholdDb} dB</strong>
              </div>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-slate-300">Recoveries: {state.recoveryCount}</div>
            {state.lastAlarmTime && (
              <div className="text-[10px] text-slate-400">Last trigger: {state.lastAlarmTime}</div>
            )}
          </div>
        </div>

        {/* Silence Countdown Meter */}
        <div className="bg-[#101217] border border-[#2c303e] rounded-lg p-3 space-y-2 text-xs">
          <div className="flex justify-between font-bold">
            <span className="text-slate-400">Dead-Air Silence Countdown:</span>
            <span className={state.isSilent > 0 ? 'text-red-400 font-mono' : 'text-emerald-400 font-mono'}>
              {state.isSilent}s / {config.triggerDelaySec}s limit
            </span>
          </div>

          <div className="w-full h-3 bg-[#1e2230] rounded-full overflow-hidden border border-[#2c303e]">
            <div
              className={`h-full transition-all duration-300 ${
                state.isSilent >= config.triggerDelaySec ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, (state.isSilent / config.triggerDelaySec) * 100)}%` }}
            />
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-3 gap-3 text-xs bg-[#101217] border border-[#2c303e] rounded-lg p-3.5">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Silence dB Threshold</label>
            <select
              value={config.thresholdDb}
              onChange={(e) => setConfig((p) => ({ ...p, thresholdDb: parseInt(e.target.value, 10) }))}
              className="w-full bg-[#161820] border border-[#2c303e] rounded px-2.5 py-1.5 text-gray-200"
            >
              <option value={-36}>-36 dB (Strict)</option>
              <option value={-42}>-42 dB (Standard FM)</option>
              <option value={-48}>-48 dB (Relaxed)</option>
              <option value={-54}>-54 dB (Quiet Studio)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Trigger Delay Limit</label>
            <select
              value={config.triggerDelaySec}
              onChange={(e) => setConfig((p) => ({ ...p, triggerDelaySec: parseInt(e.target.value, 10) }))}
              className="w-full bg-[#161820] border border-[#2c303e] rounded px-2.5 py-1.5 text-gray-200"
            >
              <option value={3}>3 Seconds (Immediate)</option>
              <option value={5}>5 Seconds (Recommended)</option>
              <option value={8}>8 Seconds (Extended)</option>
              <option value={12}>12 Seconds (Late Night)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Auto-Failover Action</label>
            <select
              value={config.backupSource}
              onChange={(e) => setConfig((p) => ({ ...p, backupSource: e.target.value as any }))}
              className="w-full bg-[#161820] border border-[#2c303e] rounded px-2.5 py-1.5 text-gray-200"
            >
              <option value="EMERGENCY_ROTATION">Emergency Music Rotation</option>
              <option value="SWEPPER_LOOP">Station Sweeper + Jingle Loop</option>
              <option value="ICECAST_RELAY">Icecast Secondary Relay</option>
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2c303e]">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleSimulateSilence}
              className="bg-amber-950/60 border border-amber-700/50 hover:bg-amber-900 text-amber-300 px-3 py-1.5 rounded font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Simulate Silence</span>
            </button>
            <button
              type="button"
              onClick={handleManualFailover}
              className="bg-red-950/60 border border-red-700/50 hover:bg-red-900 text-red-300 px-3 py-1.5 rounded font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Force Failover</span>
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleResetAlarm}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold text-xs shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Reset to Standby</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
