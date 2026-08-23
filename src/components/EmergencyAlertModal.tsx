import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Radio,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  CloudLightning,
  Waves,
  Car,
  Biohazard,
  CheckCircle2,
  X,
  History,
  Info,
  Layers,
  Settings,
  Flame,
  Globe,
} from 'lucide-react';
import { EmergencyAlert, EasState, EmergencySeverity, EmergencySource } from '../types';
import { audioEngine } from '../services/audioEngine';

interface EmergencyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  easState: EasState;
  onStartAlertBroadcast: (alert: EmergencyAlert) => void;
  onCancelAlertBroadcast: () => void;
  onShowToast: (msg: string) => void;
}

const PRESET_ALERTS: EmergencyAlert[] = [
  {
    id: 'preset-chmu-storm',
    capIdentifier: 'CZ-CHMU-20260822-001',
    sender: 'chmu.cz/vystrahy',
    sent: new Date().toISOString(),
    status: 'ACTUAL',
    msgType: 'ALERT',
    scope: 'PUBLIC',
    event: 'Extrémní bouřky s krupobitím a nárazy větru',
    eventCode: 'SVR',
    urgency: 'IMMEDIATE',
    severity: 'EXTREME',
    certainty: 'OBSERVED',
    headline: 'VÝSTRAHA ČHMÚ: Extrémně silné bouřky a kroupy přes 3 cm (Praha & Středočeský kraj)',
    description: 'Český hydrometeorologický ústav vydává výstrahu s nejvyšším stupněm nebezpečí. Postupuje intenzivní bouřkový systém s krupobitím a nárazy větru přes 90 km/h.',
    instruction: 'Nezdržujte se v blízkosti stromů a stožárů, zaparkujte vozidla pod přístřešek a nevycházejte z budov.',
    areaDesc: 'Hlavní město Praha, Středočeský kraj, Plzeňský kraj',
    effective: new Date().toISOString(),
    expires: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    source: 'CHMU',
    toneType: 'DUAL_TONE_EAS',
    duckingLevelPct: 0,
    ttsVoiceText: 'Pozor! Mimořádné vysílání. Český hydrometeorologický ústav vydal výstrahu nejvyššího stupně před extrémními bouřkami pro Prahu a Středočeský kraj. Hrozí krupobití, nárazy větru a bleskové záplavy. Zůstaňte v bezpečí uvnitř budov a sledujte naše vysílání.',
    broadcastLanguage: 'cs',
  },
  {
    id: 'preset-chmu-flood',
    capIdentifier: 'CZ-CHMU-20260822-002',
    sender: 'hydro.chmu.cz',
    sent: new Date().toISOString(),
    status: 'ACTUAL',
    msgType: 'ALERT',
    scope: 'PUBLIC',
    event: 'Povodňové ohrožení – 3. stupeň SPA (Extrémní nebezpečí)',
    eventCode: 'FLW',
    urgency: 'IMMEDIATE',
    severity: 'EXTREME',
    certainty: 'OBSERVED',
    headline: 'POVODŇOVÁ VÝSTRAHA: Dosažení 3. stupně SPA na povodí Berounky a Sázavy',
    description: 'V důsledku intenzivních srážek došlo k překročení úrovně 3. stupně povodňové aktivity. Hrozí rozlití vody z koryt a zaplavení přilehlých komunikací a obytných zón.',
    instruction: 'Připravte se na možnou evakuaci, odstavte vozidla z dosahu toků a vypněte přívod elektřiny v suterénech.',
    areaDesc: 'Povodí Berounky, Sázavy a dolní Vltavy',
    effective: new Date().toISOString(),
    expires: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    source: 'HYDROMET',
    toneType: 'ATTENTION_SIREN',
    duckingLevelPct: 5,
    ttsVoiceText: 'Důležité upozornění pro všechny obyvatele v povodí Berounky a Sázavy. Hladina řek dosáhla třetího stupně povodňové aktivity – stavu ohrožení. Nepřibližujte se k rozvodněným tokům, zabezpečte majetek a respektujte pokyny hasičů a policie.',
    broadcastLanguage: 'cs',
  },
  {
    id: 'preset-ndic-d1-crash',
    capIdentifier: 'CZ-NDIC-20260822-003',
    sender: 'dopravniinfo.cz',
    sent: new Date().toISOString(),
    status: 'ACTUAL',
    msgType: 'ALERT',
    scope: 'PUBLIC',
    event: 'Mimořádná dopravní kalamita – Hromadná nehoda D1',
    eventCode: 'TRF',
    urgency: 'IMMEDIATE',
    severity: 'SEVERE',
    certainty: 'OBSERVED',
    headline: 'DOPRAVNÍ VÝSTRAHA NDIC: Úplná uzavírka dálnice D1 na km 52 v obou směrech',
    description: 'Hromadná nehoda více než 15 vozidel a kamionů. Na místě zasahují záchranářské vrtulníky a složky IZS. Tvoří se kolona o délce 18 km.',
    instruction: 'Sjeďte z dálnice na exitu 34 nebo 49 na objízdnou trasu. Vytvářejte záchranářskou uličku.',
    areaDesc: 'Dálnice D1 km 45–60 (obousměrně)',
    effective: new Date().toISOString(),
    expires: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    source: 'NDIC_TRAFFIC',
    toneType: 'DUAL_TONE_EAS',
    duckingLevelPct: 10,
    ttsVoiceText: 'Mimořádné dopravní varování pro řidiče. Dálnice D1 je na padesátém druhém kilometru po hromadné nehodě zcela neprůjezdná v obou směrech. Na místě zasahují záchranáři. Žádáme řidiče v koloně o vytvoření záchranářské uličky a využití objízdných tras.',
    broadcastLanguage: 'cs',
  },
  {
    id: 'preset-hzs-hazmat',
    capIdentifier: 'CZ-IZS-20260822-004',
    sender: 'hzscr.cz/varovani',
    sent: new Date().toISOString(),
    status: 'ACTUAL',
    msgType: 'ALERT',
    scope: 'PUBLIC',
    event: 'Únik nebezpečných látek do ovzduší (Chemický poplach)',
    eventCode: 'EVI',
    urgency: 'IMMEDIATE',
    severity: 'EXTREME',
    certainty: 'OBSERVED',
    headline: 'CHEMICKÝ POPLACH IZS: Únik chlóru z průmyslového areálu – Zákaz větrání',
    description: 'Hasičský záchranný sbor vyhlásil 3. stupeň poplachu. Oblak nebezpečné chemické látky se šíří severozápadním směrem.',
    instruction: 'Nevycházejte ven, zavřete a utěsněte okna a dveře, vypněte rekuperaci a klimatizaci.',
    areaDesc: 'Průmyslová zóna a přilehlé obytné čtvrti (Poloměr 5 km)',
    effective: new Date().toISOString(),
    expires: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    source: 'IZS_CR',
    toneType: 'ATTENTION_SIREN',
    duckingLevelPct: 0,
    ttsVoiceText: 'Naléhavá výzva Hasičského záchranného sboru. V okolí průmyslového areálu došlo k úniku nebezpečné látky do ovzduší. Všichni obyvatelé v okruhu pěti kilometrů musí okamžitě vstoupit do uzavřených budov, pevně uzavřít okna a vypnout veškerou ventilaci. Vyčkejte dalších pokynů.',
    broadcastLanguage: 'cs',
  },
  {
    id: 'preset-rwt-test',
    capIdentifier: 'CZ-EAS-TEST-005',
    sender: 'cloudradio.fm/eas',
    sent: new Date().toISOString(),
    status: 'TEST',
    msgType: 'ALERT',
    scope: 'PUBLIC',
    event: 'Pravidelný technický test varovného systému (RWT)',
    eventCode: 'RWT',
    urgency: 'PAST',
    severity: 'TEST',
    certainty: 'OBSERVED',
    headline: 'TECHNICKÝ TEST: Pravidelná týdenní zkouška nouzového vysílacího systému EAS / CAP',
    description: 'Toto je pouze plánovaná zkouška systému krizového varování obyvatelstva v digitálním a FM vysílání. Není vyžadována žádná akce.',
    instruction: 'Pokračujte v běžné činnosti, jedná se pouze o technický test.',
    areaDesc: 'Celoplošné vysílání stanice',
    effective: new Date().toISOString(),
    expires: new Date(Date.now() + 1800 * 1000).toISOString(),
    source: 'INTERNAL_STATION',
    toneType: 'SAME_FSK_HEADER',
    duckingLevelPct: 15,
    ttsVoiceText: 'Toto je plánovaný technický test varovného vysílacího systému. V případě skutečného nebezpečí nebo mimořádné události by byl tento signál následován oficiálními pokyny pro záchranu životů a zdraví. Toto byl pouze test.',
    broadcastLanguage: 'cs',
  },
];

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  isOpen,
  onClose,
  easState,
  onStartAlertBroadcast,
  onCancelAlertBroadcast,
  onShowToast,
}) => {
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert>(PRESET_ALERTS[0]);
  const [activeTab, setActiveTab] = useState<'presets' | 'ai_generator' | 'manual_cap' | 'history'>('presets');

  // AI Generator Form State
  const [aiEventType, setAiEventType] = useState('Blesková povodeň a rozvodnění řek');
  const [aiRegion, setAiRegion] = useState('Jihočeský kraj a Šumava');
  const [aiSeverity, setAiSeverity] = useState<EmergencySeverity>('EXTREME');
  const [aiSource, setAiSource] = useState<EmergencySource>('CHMU');
  const [aiCustomNotes, setAiCustomNotes] = useState('Přívalový déšť přes 70 mm za hodinu, zatopené sklepy a silnice');
  const [aiLanguage, setAiLanguage] = useState<'cs' | 'en'>('cs');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Audio tone previewing
  const [isPreviewingTone, setIsPreviewingTone] = useState(false);
  const [isVoiceTesting, setIsVoiceTesting] = useState(false);

  if (!isOpen) return null;

  const handleGenerateAiAlert = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/gemini/eas-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: aiEventType,
          region: aiRegion,
          severity: aiSeverity,
          source: aiSource,
          customNotes: aiCustomNotes,
          language: aiLanguage,
          stationName: 'Cloud Radio 98.5 FM',
        }),
      });
      const data = await res.json();
      const generatedAlert: EmergencyAlert = {
        id: `ai-alert-${Date.now()}`,
        capIdentifier: data.capIdentifier || `CZ-CAP-${Date.now()}`,
        sender: data.sender || 'chmu.cz/vystrahy',
        sent: new Date().toISOString(),
        status: data.status || 'ACTUAL',
        msgType: data.msgType || 'ALERT',
        scope: data.scope || 'PUBLIC',
        event: data.event || aiEventType,
        eventCode: data.eventCode || (aiSeverity === 'EXTREME' ? 'SVR' : 'EAS'),
        urgency: data.urgency || 'IMMEDIATE',
        severity: data.severity || aiSeverity,
        certainty: data.certainty || 'OBSERVED',
        headline: data.headline || `${aiEventType} - ${aiRegion}`,
        description: data.description || '',
        instruction: data.instruction || '',
        areaDesc: data.areaDesc || aiRegion,
        effective: data.effective || new Date().toISOString(),
        expires: data.expires || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        source: data.source || aiSource,
        toneType: aiSeverity === 'EXTREME' ? 'DUAL_TONE_EAS' : 'ATTENTION_SIREN',
        duckingLevelPct: 0,
        ttsVoiceText: data.ttsVoiceText || '',
        broadcastLanguage: aiLanguage,
      };

      setSelectedAlert(generatedAlert);
      setActiveTab('manual_cap');
      onShowToast('✨ Oficiální CAP výstraha byla vygenerována pomocí Gemini AI!');
    } catch {
      onShowToast('⚠️ Chyba při generování, použit lokální nouzový protokol');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handlePreviewTone = (toneType: string) => {
    if (isPreviewingTone) return;
    setIsPreviewingTone(true);
    if (toneType === 'DUAL_TONE_EAS') {
      audioEngine.playEasDualTone(2.5, () => setIsPreviewingTone(false));
    } else if (toneType === 'ATTENTION_SIREN') {
      audioEngine.playEmergencySiren(2.5, () => setIsPreviewingTone(false));
    } else if (toneType === 'SAME_FSK_HEADER') {
      audioEngine.playSameHeaderBursts(2, () => setIsPreviewingTone(false));
    } else {
      setIsPreviewingTone(false);
    }
  };

  const handleTestVoiceText = () => {
    if (isVoiceTesting) {
      audioEngine.stopTtsOnAir();
      setIsVoiceTesting(false);
      return;
    }
    setIsVoiceTesting(true);
    audioEngine.playTtsOnAir(
      selectedAlert.ttsVoiceText,
      {
        lang: selectedAlert.broadcastLanguage === 'cs' ? 'cs-CZ' : 'en-US',
        rate: 0.95,
        duckDepth: 0.1,
      },
      () => {},
      () => setIsVoiceTesting(false)
    );
  };

  const handleTriggerLiveOverride = () => {
    onStartAlertBroadcast(selectedAlert);
    onShowToast(`🚨 MIMOŘÁDNÉ VYSÍLÁNÍ AKTIVOVÁNO: ${selectedAlert.headline}`);
  };

  const getSeverityBadge = (sev: EmergencySeverity) => {
    switch (sev) {
      case 'EXTREME':
        return 'bg-red-600/90 text-white border-red-500 font-bold';
      case 'SEVERE':
        return 'bg-amber-600/90 text-white border-amber-500 font-semibold';
      case 'MODERATE':
        return 'bg-yellow-500/90 text-slate-950 border-yellow-400';
      case 'TEST':
        return 'bg-sky-600/90 text-white border-sky-400';
      default:
        return 'bg-slate-700 text-slate-200 border-slate-600';
    }
  };

  return (
    <div id="emergency-alert-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div id="emergency-alert-modal-container" className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* TOP STATUS HEADER WITH EMERGENCY STROBE */}
        <div id="eas-modal-header" className={`px-6 py-4 border-b flex items-center justify-between transition-colors ${
          easState.isBroadcastingAlert
            ? 'bg-red-950/80 border-red-700 animate-pulse'
            : 'bg-slate-800/80 border-slate-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl flex items-center justify-center ${
              easState.isBroadcastingAlert
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 animate-bounce'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Emergency Alert System (EAS / CAP)
                </h2>
                {easState.isBroadcastingAlert ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-red-600 text-white tracking-wider animate-pulse shadow-sm">
                    🔴 ON-AIR OVERRIDE ACTIVE
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    🟢 Systém připraven
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Krizové vysílání • Protokol CAP v1.2 • Přímé varování ČHMÚ & IZS ČR s prioritním přerušením programu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {easState.isBroadcastingAlert && (
              <button
                id="btn-eas-panic-abort"
                onClick={onCancelAlertBroadcast}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-md flex items-center gap-2 animate-pulse"
              >
                <Square className="w-4 h-4 fill-white" />
                UKONČIT VÝSTRAHU (RESTORE PLAYOUT)
              </button>
            )}
            <button
              id="btn-close-eas-modal"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ON-AIR ACTIVE BANNER (IF TRANSMITTING) */}
        {easState.isBroadcastingAlert && easState.activeAlert && (
          <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <Radio className="w-5 h-5 animate-spin" />
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-red-200">
                  PRIORITNÍ PŘERUŠENÍ VYSÍLÁNÍ • HUDBA ZTLUMENA NA {easState.activeAlert.duckingLevelPct}%
                </div>
                <div className="font-bold text-sm">
                  {easState.activeAlert.headline}
                </div>
              </div>
            </div>
            <div className="text-xs font-mono bg-red-800/80 px-3 py-1.5 rounded-lg border border-red-500">
              Trvání: {easState.alertElapsedSec}s
            </div>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex items-center border-b border-slate-700/60 bg-slate-900/90 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'presets'
                ? 'border-rose-500 text-rose-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudLightning className="w-4 h-4" />
            Oficiální ČHMÚ / IZS šablony ({PRESET_ALERTS.length})
          </button>
          <button
            onClick={() => setActiveTab('ai_generator')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'ai_generator'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Gemini AI CAP Generátor
          </button>
          <button
            onClick={() => setActiveTab('manual_cap')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'manual_cap'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Nouzový scénář & Zvukový přenos
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Protokol odvysílaných relací ({easState.history.length})
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: PRESET OFFICIAL ALERTS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Vyberte ověřené hlášení ze státního systému varování:</h3>
                  <p className="text-xs text-slate-400">Připravené krizové scénáře pro bleskové nasazení do éteru bez zdržení</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PRESET_ALERTS.map((alert) => {
                  const isSelected = selectedAlert.id === alert.id;
                  return (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {alert.source === 'CHMU' && <CloudLightning className="w-4 h-4 text-amber-400" />}
                          {alert.source === 'HYDROMET' && <Waves className="w-4 h-4 text-cyan-400" />}
                          {alert.source === 'NDIC_TRAFFIC' && <Car className="w-4 h-4 text-orange-400" />}
                          {alert.source === 'IZS_CR' && <Biohazard className="w-4 h-4 text-red-400" />}
                          {alert.source === 'INTERNAL_STATION' && <Radio className="w-4 h-4 text-blue-400" />}
                          <span className="text-xs font-mono font-bold text-slate-300">
                            {alert.source} • {alert.eventCode}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] border uppercase ${getSeverityBadge(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white mb-1.5 line-clamp-1">
                        {alert.headline}
                      </h4>
                      <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                        {alert.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">
                        <span className="flex items-center gap-1">
                          📍 {alert.areaDesc}
                        </span>
                        <span className="text-rose-400 font-mono font-medium">
                          Znělka: {alert.toneType}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GEMINI AI GENERATOR */}
          {activeTab === 'ai_generator' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div className="text-xs text-indigo-200 space-y-1">
                  <span className="font-bold text-white">Gemini 3.7 CAP Krizový Asistent:</span>
                  <p>
                    Zadejte situaci, region nebo podrobnosti mimořádné události. Umělá inteligence vygeneruje
                    standardizovaný CAP XML/JSON balíček s autoritativním rozhlasovým textem pro okamžité odvysílání.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Typ mimořádné události:</label>
                  <input
                    type="text"
                    value={aiEventType}
                    onChange={(e) => setAiEventType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="např. Silná vichřice, Požár lesa, Kalamita na D8..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Zasažená oblast / Region:</label>
                  <input
                    type="text"
                    value={aiRegion}
                    onChange={(e) => setAiRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="např. Liberecký kraj, Krkonoše, okres Příbram..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Stupeň závažnosti (Severity):</label>
                  <select
                    value={aiSeverity}
                    onChange={(e) => setAiSeverity(e.target.value as EmergencySeverity)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EXTREME">EXTREME (Extrémní nebezpečí pro život a zdraví)</option>
                    <option value="SEVERE">SEVERE (Vysoký stupeň nebezpečí)</option>
                    <option value="MODERATE">MODERATE (Mírné nebezpečí / Upozornění)</option>
                    <option value="TEST">TEST (Cvičení / Technický test)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Vydávající orgán (Zdroj):</label>
                  <select
                    value={aiSource}
                    onChange={(e) => setAiSource(e.target.value as EmergencySource)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CHMU">ČHMÚ (Český hydrometeorologický ústav)</option>
                    <option value="IZS_CR">IZS ČR / HZS (Hasičský záchranný sbor)</option>
                    <option value="NDIC_TRAFFIC">NDIC (Národní dopravní informační centrum)</option>
                    <option value="HYDROMET">Povodňová komise a Povodí</option>
                    <option value="PČR">Policie České republiky</option>
                    <option value="INTERNAL_STATION">Interní relace stanice</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Doplňující informace / Instrukce pro obyvatele:</label>
                  <textarea
                    rows={2}
                    value={aiCustomNotes}
                    onChange={(e) => setAiCustomNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="např. Nepřibližovat se k oknům, očekávat výpadky elektřiny..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Jazyk hlášení:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAiLanguage('cs')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        aiLanguage === 'cs'
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      🇨🇿 Čeština (ČHMÚ / IZS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiLanguage('en')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        aiLanguage === 'en'
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      🇬🇧 English (EAS / International)
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-generate-ai-alert"
                  onClick={handleGenerateAiAlert}
                  disabled={isAiGenerating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
                  {isAiGenerating ? 'Generuji oficiální CAP výstrahu...' : 'Vygenerovat CAP výstrahu a rozhlasový skript'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL CAP & AUDIO CUSTOMIZATION */}
          {(activeTab === 'manual_cap' || activeTab === 'presets') && (
            <div className="space-y-4 pt-2 border-t border-slate-700/60">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400" />
                  Konfigurace vybrané výstrahy k odvysílání
                </h3>
                <span className="text-xs font-mono text-slate-400">CAP ID: {selectedAlert.capIdentifier}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tone type selector */}
                <div className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-slate-300">Znělka / Výstražný tón:</label>
                  <select
                    value={selectedAlert.toneType}
                    onChange={(e) => setSelectedAlert({ ...selectedAlert, toneType: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="DUAL_TONE_EAS">🔊 EAS Dual Tone (853 Hz + 1050 Hz)</option>
                    <option value="ATTENTION_SIREN">🚨 Civil Defense Siren (Sweep)</option>
                    <option value="SAME_FSK_HEADER">📡 SAME Digital FSK Header</option>
                    <option value="VOICE_ONLY">🎙️ Pouze hlasové hlášení</option>
                  </select>
                  <button
                    onClick={() => handlePreviewTone(selectedAlert.toneType)}
                    disabled={isPreviewingTone}
                    className="w-full py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {isPreviewingTone ? 'Přehrávám tón...' : 'Vyzkoušet znělku'}
                  </button>
                </div>

                {/* Playout Ducking depth */}
                <div className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Úroveň ztlumení hudby (Ducking):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={5}
                      value={selectedAlert.duckingLevelPct}
                      onChange={(e) => setSelectedAlert({ ...selectedAlert, duckingLevelPct: Number(e.target.value) })}
                      className="w-full accent-rose-500"
                    />
                    <span className="text-xs font-mono font-bold text-rose-400 w-12 text-right">
                      {selectedAlert.duckingLevelPct === 0 ? 'MUTE (0%)' : `${selectedAlert.duckingLevelPct}%`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedAlert.duckingLevelPct === 0
                      ? 'Úplné umlčení hudebního vysílání pro krizové zprávy'
                      : 'Hudba poběží tiše v pozadí pod mluveným slovem'}
                  </p>
                </div>

                {/* Severity & Language */}
                <div className="p-3.5 bg-slate-800/70 border border-slate-700 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-slate-300">Závažnost & Jazyk:</label>
                  <div className="flex gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs border uppercase flex-1 text-center font-bold ${getSeverityBadge(selectedAlert.severity)}`}>
                      {selectedAlert.severity}
                    </span>
                    <span className="px-2.5 py-1 rounded text-xs bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                      {selectedAlert.broadcastLanguage === 'cs' ? '🇨🇿 CS' : '🇬🇧 EN'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Platnost do: {new Date(selectedAlert.expires).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* On-Air Speech Script Box */}
              <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-rose-400" />
                    Rozhlasový hlasový text pro on-air vysílání (Text-to-Speech):
                  </label>
                  <button
                    onClick={handleTestVoiceText}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isVoiceTesting
                        ? 'bg-amber-600 text-white animate-pulse'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    {isVoiceTesting ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-white" /> Zastavit hlas
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Náslech hlasu
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={selectedAlert.ttsVoiceText}
                  onChange={(e) => setSelectedAlert({ ...selectedAlert, ttsVoiceText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 font-medium focus:outline-none focus:border-rose-500 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Doporučená dikce: Naléhavý, autoritativní a zřetelný projev</span>
                  <span className="font-mono">{selectedAlert.ttsVoiceText.length} znaků</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY & AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Záznam odvysílaných nouzových relací (EAS Audit Log):</h3>
              {easState.history.length === 0 ? (
                <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-700/60 text-slate-400 text-xs">
                  Doposud nebyla odvysílána žádná krizová hlášení ani plánované testy.
                </div>
              ) : (
                <div className="space-y-2">
                  {easState.history.map((item) => (
                    <div key={item.id} className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-300">{item.timestamp}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] border uppercase ${getSeverityBadge(item.severity)}`}>
                            {item.severity}
                          </span>
                          <span className="text-xs font-semibold text-white">{item.event}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Oblast: {item.area} • Zdroj: {item.source} • Trvání: {item.durationSec}s
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER - BIG ON-AIR OVERRIDE TRIGGER */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-500" />
            <span>Spuštění okamžitě ztlumí hudbu na {selectedAlert.duckingLevelPct}%, odvysílá znělku a hlasovou výstrahu.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-colors"
            >
              Zavřít panel
            </button>
            <button
              id="btn-trigger-eas-live-override"
              onClick={handleTriggerLiveOverride}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-xl shadow-red-950/60 flex items-center gap-2 border border-red-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              🔴 VYSLAT DO ÉTERU (LIVE OVERRIDE)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
