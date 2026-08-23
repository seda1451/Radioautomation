import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Radio,
  Keyboard,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Activity,
  Zap,
  Volume2,
  Mic,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { MidiMapping, KeyboardShortcut, MidiDeviceStatus } from '../types';

interface HardwareMidiModalProps {
  isOpen: boolean;
  onClose: () => void;
  midiMappings: MidiMapping[];
  onUpdateMidiMappings: (mappings: MidiMapping[]) => void;
  keyboardShortcuts: KeyboardShortcut[];
  onUpdateKeyboardShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  onShowToast: (msg: string) => void;
  onTriggerAction: (action: string, value?: number) => void;
}

export const HardwareMidiModal: React.FC<HardwareMidiModalProps> = ({
  isOpen,
  onClose,
  midiMappings,
  onUpdateMidiMappings,
  keyboardShortcuts,
  onUpdateKeyboardShortcuts,
  onShowToast,
  onTriggerAction,
}) => {
  const [activeTab, setActiveTab] = useState<'midi' | 'shortcuts' | 'monitor'>('midi');
  const [deviceStatus, setDeviceStatus] = useState<MidiDeviceStatus>({
    connected: false,
    deviceName: null,
    manufacturer: null,
    lastReceivedEvent: null,
  });

  const [learningMappingId, setLearningMappingId] = useState<string | null>(null);
  const [liveMidiLogs, setLiveMidiLogs] = useState<{ id: string; time: string; text: string; raw: string }[]>([]);

  // Initialize Web MIDI API
  const initMidi = useCallback(async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).requestMIDIAccess) {
      setDeviceStatus({
        connected: false,
        deviceName: 'Web MIDI API není tímto prohlížečem podporováno',
        manufacturer: 'Simulovaný režim',
        lastReceivedEvent: null,
      });
      return;
    }

    try {
      const midiAccess = await (navigator as any).requestMIDIAccess({ sysex: false });
      const inputs = Array.from(midiAccess.inputs.values()) as any[];

      if (inputs.length > 0) {
        const firstDevice = inputs[0];
        setDeviceStatus({
          connected: true,
          deviceName: firstDevice.name || 'USB MIDI Kontroler',
          manufacturer: firstDevice.manufacturer || 'Generické MIDI',
          lastReceivedEvent: 'Připojeno',
        });

        // Attach listener to all inputs
        inputs.forEach((input) => {
          input.onmidimessage = (event: any) => {
            const [status, number, value] = event.data;
            const channel = (status & 0x0f) + 1;
            const isNote = (status & 0xf0) === 0x90;
            const isCC = (status & 0xf0) === 0xb0;
            const typeStr = isNote ? 'NOTE' : isCC ? 'CC' : 'SYS';

            const logEntry = {
              id: `midi-${Date.now()}-${Math.random()}`,
              time: new Date().toLocaleTimeString(),
              text: `Ch${channel} ${typeStr} #${number} Val: ${value}`,
              raw: `[0x${status.toString(16).toUpperCase()}, 0x${number.toString(16).toUpperCase()}, 0x${value.toString(16).toUpperCase()}]`,
            };

            setLiveMidiLogs((prev) => [logEntry, ...prev.slice(0, 19)]);
            setDeviceStatus((prev) => ({ ...prev, lastReceivedEvent: logEntry.text }));

            // If learning mode is on
            if (learningMappingId) {
              const updated = midiMappings.map((m) => {
                if (m.id === learningMappingId) {
                  return {
                    ...m,
                    type: (isCC ? 'cc' : 'note') as any,
                    channel,
                    number,
                  };
                }
                return m;
              });
              onUpdateMidiMappings(updated);
              setLearningMappingId(null);
              onShowToast(`🎯 Namapováno: Ch${channel} ${typeStr} #${number}`);
              return;
            }

            // Normal Trigger
            const matched = midiMappings.find(
              (m) => m.channel === channel && m.number === number && ((m.type === 'cc' && isCC) || (m.type === 'note' && isNote))
            );
            if (matched) {
              onTriggerAction(matched.action, isCC ? value / 127 : value > 0 ? 1 : 0);
            }
          };
        });
      } else {
        setDeviceStatus({
          connected: false,
          deviceName: 'Žádný fyzický MIDI kontroler nenalezen (připojte USB kontroler)',
          manufacturer: 'Připojte např. Korg nanoKONTROL, Launchpad, Stream Deck',
          lastReceivedEvent: null,
        });
      }
    } catch {
      setDeviceStatus({
        connected: false,
        deviceName: 'Přístup k Web MIDI byl zamítnut',
        manufacturer: 'Zkontrolujte oprávnění prohlížeče',
        lastReceivedEvent: null,
      });
    }
  }, [learningMappingId, midiMappings, onShowToast, onTriggerAction, onUpdateMidiMappings]);

  useEffect(() => {
    if (isOpen) {
      initMidi();
    }
  }, [isOpen, initMidi]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetName: 'korg' | 'streamdeck' | 'launchpad') => {
    let newMappings: MidiMapping[] = [];

    if (presetName === 'korg') {
      newMappings = [
        { id: 'm-1', action: 'FADER_MASTER', label: 'Master Fader', category: 'FADER', type: 'cc', channel: 1, number: 0 },
        { id: 'm-2', action: 'FADER_MUSIC', label: 'Playout Music Fader', category: 'FADER', type: 'cc', channel: 1, number: 1 },
        { id: 'm-3', action: 'FADER_MIC', label: 'Mikrofon Host Fader', category: 'FADER', type: 'cc', channel: 1, number: 2 },
        { id: 'm-4', action: 'FADER_CARTS', label: 'Zvuková banka Fader', category: 'FADER', type: 'cc', channel: 1, number: 3 },
        { id: 'm-5', action: 'FADER_PHONE', label: 'VoIP Phone Line Fader', category: 'FADER', type: 'cc', channel: 1, number: 4 },
        { id: 'm-6', action: 'MIC_MUTE_TOGGLE', label: 'MIC ON / Mute', category: 'BUTTON', type: 'note', channel: 1, number: 48 },
        { id: 'm-7', action: 'DUMP_PROFANITY', label: 'DUMP (Profanity Delay)', category: 'SAFETY', type: 'note', channel: 1, number: 49 },
        { id: 'm-8', action: 'PLAY_NEXT', label: 'Start / Next Track', category: 'BUTTON', type: 'note', channel: 1, number: 50 },
        { id: 'm-9', action: 'CART_1', label: 'Cart Pad 1 (Jingle)', category: 'CART', type: 'note', channel: 1, number: 64 },
        { id: 'm-10', action: 'CART_2', label: 'Cart Pad 2 (Sweeper)', category: 'CART', type: 'note', channel: 1, number: 65 },
        { id: 'm-11', action: 'CART_3', label: 'Cart Pad 3 (Airhorn)', category: 'CART', type: 'note', channel: 1, number: 66 },
        { id: 'm-12', action: 'CART_4', label: 'Cart Pad 4 (Laser)', category: 'CART', type: 'note', channel: 1, number: 67 },
        { id: 'm-13', action: 'TA_TRIGGER', label: 'RDS TA Dopravní hlášení', category: 'BUTTON', type: 'note', channel: 1, number: 51 },
      ];
      onShowToast('🎛️ Načten profil pro Korg nanoKONTROL2 / Studio!');
    } else if (presetName === 'streamdeck') {
      newMappings = [
        { id: 'm-sd-1', action: 'PLAY_NEXT', label: 'Start / Next Track', category: 'BUTTON', type: 'note', channel: 1, number: 1 },
        { id: 'm-sd-2', action: 'MIC_MUTE_TOGGLE', label: 'MIC ON / OFF (Červené)', category: 'BUTTON', type: 'note', channel: 1, number: 2 },
        { id: 'm-sd-3', action: 'DUMP_PROFANITY', label: 'DUMP Kill Buffer', category: 'SAFETY', type: 'note', channel: 1, number: 3 },
        { id: 'm-sd-4', action: 'TA_TRIGGER', label: 'RDS TA Traffic Flag', category: 'BUTTON', type: 'note', channel: 1, number: 4 },
        { id: 'm-sd-5', action: 'CART_1', label: 'Cart #1 Znělka', category: 'CART', type: 'note', channel: 1, number: 5 },
        { id: 'm-sd-6', action: 'CART_2', label: 'Cart #2 Sweeper', category: 'CART', type: 'note', channel: 1, number: 6 },
        { id: 'm-sd-7', action: 'CART_3', label: 'Cart #3 Spustit Zprávy', category: 'CART', type: 'note', channel: 1, number: 7 },
        { id: 'm-sd-8', action: 'EAS_ALERT_OPEN', label: 'EAS Krizové vysílání', category: 'SAFETY', type: 'note', channel: 1, number: 8 },
      ];
      onShowToast('🎛️ Načten profil pro Elgato Stream Deck (MIDI plugin)!');
    } else {
      newMappings = [
        { id: 'm-lp-1', action: 'CART_1', label: 'Cart #1', category: 'CART', type: 'note', channel: 1, number: 36 },
        { id: 'm-lp-2', action: 'CART_2', label: 'Cart #2', category: 'CART', type: 'note', channel: 1, number: 37 },
        { id: 'm-lp-3', action: 'CART_3', label: 'Cart #3', category: 'CART', type: 'note', channel: 1, number: 38 },
        { id: 'm-lp-4', action: 'CART_4', label: 'Cart #4', category: 'CART', type: 'note', channel: 1, number: 39 },
        { id: 'm-lp-5', action: 'CART_5', label: 'Cart #5', category: 'CART', type: 'note', channel: 1, number: 40 },
        { id: 'm-lp-6', action: 'CART_6', label: 'Cart #6', category: 'CART', type: 'note', channel: 1, number: 41 },
        { id: 'm-lp-7', action: 'CART_7', label: 'Cart #7', category: 'CART', type: 'note', channel: 1, number: 42 },
        { id: 'm-lp-8', action: 'CART_8', label: 'Cart #8', category: 'CART', type: 'note', channel: 1, number: 43 },
      ];
      onShowToast('🎛️ Načten profil pro Novation Launchpad (8 Cart Pads)!');
    }

    onUpdateMidiMappings(newMappings);
  };

  const handleSimulateMidiEvent = (mapping: MidiMapping) => {
    onTriggerAction(mapping.action, mapping.type === 'cc' ? 0.8 : 1);
    onShowToast(`⚡ Otestováno ovládání: ${mapping.label}`);
  };

  return (
    <div id="midi-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div id="midi-modal-container" className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Hardwarové mapování: Web MIDI & Klávesové zkratky
                </h2>
                {deviceStatus.connected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> MIDI PŘIPOJENO
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Web MIDI Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Fyzické ovládání mixpultu, faderů a jinglů přes USB MIDI kontrolery a klávesnici
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={initMidi}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
              title="Znovu prohledat USB zařízení"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Znovu načíst MIDI
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
            onClick={() => setActiveTab('midi')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'midi'
                ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Mapování MIDI ovladačů ({midiMappings.length})
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'shortcuts'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Klávesové zkratky ({keyboardShortcuts.length})
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'monitor'
                ? 'border-teal-500 text-teal-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Live MIDI Monitor & Diagnostika
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: MIDI MAPPINGS */}
          {activeTab === 'midi' && (
            <div className="space-y-6">
              
              {/* PRESETS BAR */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white mb-0.5">Rychlé šablony hardwaru:</div>
                  <div className="text-[11px] text-slate-400">Automatické přednastavení pro populární broadcast kontrolery</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyPreset('korg')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-xs font-bold text-white transition-colors"
                  >
                    Korg nanoKONTROL2
                  </button>
                  <button
                    onClick={() => handleApplyPreset('streamdeck')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-xs font-bold text-white transition-colors"
                  >
                    Elgato Stream Deck
                  </button>
                  <button
                    onClick={() => handleApplyPreset('launchpad')}
                    className="px-3 py-1.5 rounded-lg bg-teal-600/80 hover:bg-teal-600 text-xs font-bold text-white transition-colors"
                  >
                    Novation Launchpad
                  </button>
                </div>
              </div>

              {/* MAPPINGS TABLE */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-3">Funkce vysílacího studia</th>
                      <th className="p-3">Kategorie</th>
                      <th className="p-3">Typ</th>
                      <th className="p-3">Kanál</th>
                      <th className="p-3">CC / Note #</th>
                      <th className="p-3 text-right">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium">
                    {midiMappings.map((m) => {
                      const isLearning = learningMappingId === m.id;
                      return (
                        <tr key={m.id} className="hover:bg-slate-800/80 transition-colors">
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            {m.category === 'FADER' && <Sliders className="w-3.5 h-3.5 text-amber-400" />}
                            {m.category === 'SAFETY' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                            {m.category === 'CART' && <Zap className="w-3.5 h-3.5 text-teal-400" />}
                            {m.category === 'BUTTON' && <Play className="w-3.5 h-3.5 text-indigo-400" />}
                            <span>{m.label}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                              {m.category}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-[11px] uppercase text-indigo-300">
                              {m.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            Ch {m.channel}
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              #{m.number}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                if (isLearning) {
                                  setLearningMappingId(null);
                                } else {
                                  setLearningMappingId(m.id);
                                  onShowToast(`🎯 Čekám na stisk fyzického tlačítka / pohyb faderu pro: ${m.label}`);
                                }
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                                isLearning
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : 'bg-amber-600/80 hover:bg-amber-600 text-white'
                              }`}
                            >
                              {isLearning ? '⏳ Pohybujte prvkem...' : 'MIDI Learn'}
                            </button>
                            <button
                              onClick={() => handleSimulateMidiEvent(m)}
                              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs"
                              title="Vyzkoušet akci virtuálně"
                            >
                              Test
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
                <div className="text-xs font-bold text-white mb-1">Globální klávesové zkratky:</div>
                <p className="text-xs text-slate-400">
                  Umožňují bleskurychlé ovládání z běžné počítačové klávesnice přímo při moderování
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {keyboardShortcuts.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">{sc.label}</div>
                      <div className="text-xs text-slate-400 font-mono">{sc.action}</div>
                    </div>
                    <span className="px-3 py-1 bg-slate-900 border border-slate-600 rounded-lg font-mono font-bold text-amber-400 text-xs shadow-inner">
                      {sc.keyCombo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE MONITOR */}
          {activeTab === 'monitor' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Stav Web MIDI rozhraní:</div>
                  <div className="text-xs text-slate-400">
                    {deviceStatus.deviceName} • {deviceStatus.manufacturer}
                  </div>
                </div>
                <button
                  onClick={() => setLiveMidiLogs([])}
                  className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 font-semibold"
                >
                  Vymazat log
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 max-h-72 overflow-y-auto space-y-1.5">
                {liveMidiLogs.length === 0 ? (
                  <div className="text-slate-500 py-6 text-center">
                    Čekám na příchozí MIDI zprávy... (stiskněte pad nebo pohněte faderem)
                  </div>
                ) : (
                  liveMidiLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between border-b border-slate-900 pb-1">
                      <span className="text-slate-400">[{log.time}]</span>
                      <span className="font-bold text-emerald-300">{log.text}</span>
                      <span className="text-slate-500">{log.raw}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Web MIDI API 1.0 • Odezva &lt; 5ms s podporou duálního směrování a CUE sběrnice.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-colors"
          >
            Uložit a zavřít mapování
          </button>
        </div>

      </div>
    </div>
  );
};
