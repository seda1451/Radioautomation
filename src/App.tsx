import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  INITIAL_PLAYLIST,
  INITIAL_LIBRARY,
  INITIAL_CUSTOM_PLAYLISTS,
  INITIAL_CARTS,
} from './data/initialState';
import {
  QueueItem,
  LibrarySong,
  CustomPlaylist,
  CartItem,
  AutomationMode,
  MixerChannelState,
  BroadcastSettings,
  ProgramClock,
  ProfanityDelayConfig,
  ProfanityDelayState,
  IcecastEncoderConfig,
  IcecastEncoderState,
  EmergencyAlert,
  EasState,
  PhoneLine,
  WhatsAppVoiceMessage,
  MidiMapping,
  KeyboardShortcut,
  RdsConfig,
  DabMotSlide,
} from './types';
import { audioEngine } from './services/audioEngine';

// Components
import { Header } from './components/Header';
import { OnAirBanner } from './components/OnAirBanner';
import { PlayoutLog } from './components/PlayoutLog';
import { StudioToolbar } from './components/StudioToolbar';
import { MixerPanel } from './components/MixerPanel';
import { LibraryPanel } from './components/LibraryPanel';
import { PlaylistsPanel } from './components/PlaylistsPanel';

// Core Modals
import { AddTrackModal } from './components/AddTrackModal';
import { EditTrackModal } from './components/EditTrackModal';
import { UploadModal } from './components/UploadModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { AddCartModal } from './components/AddCartModal';
import { ProgramSchedulerModal } from './components/ProgramSchedulerModal';
import { SettingsModal } from './components/SettingsModal';
import { Toast } from './components/Toast';

// Advanced Broadcast Feature Modals
import { VisualSegueEditorModal } from './components/VisualSegueEditorModal';
import { AiVoiceTrackModal } from './components/AiVoiceTrackModal';
import { MusicSchedulerModal } from './components/MusicSchedulerModal';
import { TrafficManagerModal } from './components/TrafficManagerModal';
import { DspProcessorModal } from './components/DspProcessorModal';
import { ListenerStudioModal } from './components/ListenerStudioModal';
import { ListenerPlayerModal } from './components/ListenerPlayerModal';

// 6 Next-Gen Radio Modals & Safety / Streaming Systems
import { MorningDuoModal } from './components/MorningDuoModal';
import { SilenceDetectorModal } from './components/SilenceDetectorModal';
import { MultitrackVoiceTrackerModal } from './components/MultitrackVoiceTrackerModal';
import { VisualRadioRdsModal } from './components/VisualRadioRdsModal';
import { BroadcastLoggerPodcastModal } from './components/BroadcastLoggerPodcastModal';
import { BroadcastSoundboardModal } from './components/BroadcastSoundboardModal';
import { ProfanityDelayModal } from './components/ProfanityDelayModal';
import { IcecastWebRtcEncoderModal } from './components/IcecastWebRtcEncoderModal';
import { EmergencyAlertModal } from './components/EmergencyAlertModal';
import { PhoneInStudioModal } from './components/PhoneInStudioModal';
import { HardwareMidiModal } from './components/HardwareMidiModal';
import { RdsDabSlideshowModal } from './components/RdsDabSlideshowModal';

export default function App() {
  // --- STATE ---
  const [playlist, setPlaylist] = useState<QueueItem[]>(INITIAL_PLAYLIST);
  const [library, setLibrary] = useState<LibrarySong[]>(INITIAL_LIBRARY);
  const [customPlaylists, setCustomPlaylists] = useState<CustomPlaylist[]>(INITIAL_CUSTOM_PLAYLISTS);
  const [carts, setCarts] = useState<CartItem[]>(INITIAL_CARTS);

  const [activePlaylistName, setActivePlaylistName] = useState('Žádný vybraný playlist');
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayoutActive, setAutoPlayoutActive] = useState(true);
  const [automationMode, setAutomationMode] = useState<AutomationMode>('auto');
  const [sidebarTab, setSidebarTab] = useState<'mixer' | 'library' | 'playlists'>('mixer');

  const [audioActive, setAudioActive] = useState(true);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCoughActive, setIsCoughActive] = useState(false);
  const [cushionActive, setCushionActive] = useState(false);
  const [isEngaged, setIsEngaged] = useState(true);
  const [isCueActive, setIsCueActive] = useState(false);

  const [faders, setFaders] = useState<MixerChannelState>({
    talk: 20,
    playout: 75,
    elements: 0,
    carts: 0,
    pgm: 75,
  });

  const [meterLevels, setMeterLevels] = useState({
    talk: 0,
    playout: 0,
    elements: 0,
    carts: 0,
    pgm: 0,
  });

  const [settings, setSettings] = useState<BroadcastSettings>({
    stationName: 'Cloud Radio',
    frequency: '98.5 FM Prague & Web',
    crossfadeSec: 3.0,
    icecastPush: true,
    encoderBitrate: '320kbps',
    autoCue: true,
    cushionEnabled: false,
    cushionSec: 7,
    masterVolume: 85,
    studioProfile: 'Studio A — On Air Pro',
  });

  // Modals state
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [isEditTrackOpen, setIsEditTrackOpen] = useState(false);
  const [editingTrackIndex, setEditingTrackIndex] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<CustomPlaylist | null>(null);
  const [isAddCartOpen, setIsAddCartOpen] = useState(false);
  const [isProgramOpen, setIsProgramOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // New Advanced Feature Modals
  const [isSegueEditorOpen, setIsSegueEditorOpen] = useState(false);
  const [segueTrackIndex, setSegueTrackIndex] = useState<number>(0);
  const [isAiVoiceTrackOpen, setIsAiVoiceTrackOpen] = useState(false);
  const [isMusicSchedulerOpen, setIsMusicSchedulerOpen] = useState(false);
  const [isTrafficOpen, setIsTrafficOpen] = useState(false);
  const [isDspOpen, setIsDspOpen] = useState(false);
  const [isListenersOpen, setIsListenersOpen] = useState(false);
  const [isWebPlayerOpen, setIsWebPlayerOpen] = useState(false);

  // 6 Next-Gen Broadcast Module States
  const [isMorningDuoOpen, setIsMorningDuoOpen] = useState(false);
  const [isSilenceDetectorOpen, setIsSilenceDetectorOpen] = useState(false);
  const [isMultitrackOpen, setIsMultitrackOpen] = useState(false);
  const [isVisualRadioOpen, setIsVisualRadioOpen] = useState(false);
  const [isPodcastLoggerOpen, setIsPodcastLoggerOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);

  // Safety & Streaming Systems
  const [isProfanityDelayOpen, setIsProfanityDelayOpen] = useState(false);
  const [profanityConfig, setProfanityConfig] = useState<ProfanityDelayConfig>({
    bufferDurationSec: 7,
    autoFillCartType: 'sweeper',
    coughMuteGain: 0,
    autoReArm: true,
  });
  const [profanityState, setProfanityState] = useState<ProfanityDelayState>({
    isArmed: true,
    delayBufferSec: 7.0,
    isDumping: false,
    isCoughMuted: false,
    dumpCount: 0,
    history: [],
  });

  const [isEncoderOpen, setIsEncoderOpen] = useState(false);
  const [encoderConfig, setEncoderConfig] = useState<IcecastEncoderConfig>({
    serverUrl: 'icecast.cloudradio.fm:8000',
    mountPoint: '/live.mp3',
    format: 'MP3',
    bitrateKbps: 320,
    stationName: 'Cloud Radio 98.5 FM',
    genre: 'Top 40 / Pop / Dance',
    isPublic: true,
  });
  const [encoderState, setEncoderState] = useState<IcecastEncoderState>({
    isStreaming: true,
    connectedListeners: 1420,
    peakListenersToday: 2840,
    uptimeSeconds: 14520,
    bytesSentTotal: 184500000,
    bufferHealthPct: 100,
    encoderCpuPercent: 4.2,
  });

  // Emergency Alert System (EAS / CAP)
  const [isEasModalOpen, setIsEasModalOpen] = useState(false);
  const [easState, setEasState] = useState<EasState>({
    isBroadcastingAlert: false,
    activeAlert: null,
    alertElapsedSec: 0,
    autoDuckMaster: true,
    history: [
      {
        id: 'eas-hist-prev-test',
        timestamp: '12:00:15',
        event: 'Pravidelný technický test varovného systému (RWT)',
        severity: 'TEST',
        area: 'Celoplošné vysílání stanice',
        source: 'INTERNAL_STATION',
        durationSec: 18,
        status: 'COMPLETED',
      },
    ],
  });

  // EAS on-air timer
  useEffect(() => {
    let timer: number;
    if (easState.isBroadcastingAlert) {
      timer = window.setInterval(() => {
        setEasState((prev) => ({
          ...prev,
          alertElapsedSec: prev.alertElapsedSec + 1,
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [easState.isBroadcastingAlert]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // 18. VOIP SIP PHONE-IN & WHATSAPP STATE
  const [isPhoneInModalOpen, setIsPhoneInModalOpen] = useState(false);
  const [phoneLines, setPhoneLines] = useState<PhoneLine[]>([
    {
      id: 'line-1',
      lineNumber: 1,
      callerName: 'Pavel z Prahy',
      callerPhone: '+420 774 123 456',
      callerLocation: 'Praha 4',
      topic: 'Ranní anketa: Auta vs. MHD v centru',
      screenerNotes: 'Příjemný volající, výborný projev. Schváleno do éteru.',
      status: 'READY_ON_AIR',
      callDurationSec: 42,
      audioLevel: 75,
      gainLevel: 1.0,
      isProfanityProtected: true,
      screenerRating: 5,
      avatarColor: '#10b981',
    },
    {
      id: 'line-2',
      lineNumber: 2,
      callerName: 'Martina z Brna',
      callerPhone: '+420 608 987 654',
      callerLocation: 'Brno',
      topic: 'Dopravní hlášení: Nehoda na D1 km 194',
      screenerNotes: 'Svědkyně nehody, ověřeno.',
      status: 'ON_HOLD',
      callDurationSec: 18,
      audioLevel: 60,
      gainLevel: 1.0,
      isProfanityProtected: true,
      screenerRating: 4,
      avatarColor: '#3b82f6',
    },
    {
      id: 'line-3',
      lineNumber: 3,
      callerName: 'Volná linka',
      callerPhone: '---',
      callerLocation: '---',
      topic: 'Žádný aktivní hovor',
      screenerNotes: '',
      status: 'IDLE',
      callDurationSec: 0,
      audioLevel: 0,
      gainLevel: 1.0,
      isProfanityProtected: true,
      avatarColor: '#64748b',
    },
    {
      id: 'line-4',
      lineNumber: 4,
      callerName: 'Volná linka',
      callerPhone: '---',
      callerLocation: '---',
      topic: 'Žádný aktivní hovor',
      screenerNotes: '',
      status: 'IDLE',
      callDurationSec: 0,
      audioLevel: 0,
      gainLevel: 1.0,
      isProfanityProtected: true,
      avatarColor: '#64748b',
    },
  ]);

  const [whatsAppMessages, setWhatsAppMessages] = useState<WhatsAppVoiceMessage[]>([
    {
      id: 'wa-1',
      senderName: 'Petr Novák',
      senderPhone: '+420 739 555 111',
      senderCity: 'Hradec Králové',
      timestamp: '14:28',
      durationSec: 12,
      status: 'TRANSCRIBED',
      transcription: 'Čau rádio! Tady Petr z Hradce. Dneska hrajete parádní pecky, zvlášť ta nová Dua Lipa je absolutní nářez. Zdravím všechny v dílně!',
      sentiment: 'POSITIVE',
      topicTag: 'Pochvala & Pozdrav',
      waveformPeaks: [25, 45, 80, 95, 60, 40, 70, 85, 90, 65, 30, 20],
    },
    {
      id: 'wa-2',
      senderName: 'Lucie Králová',
      senderPhone: '+420 721 888 333',
      senderCity: 'Plzeň',
      timestamp: '14:25',
      durationSec: 9,
      status: 'NEW',
      transcription: 'Ahoj moderátoři, hlásím radar na výjezdu z Plzně na D5 směr Rozvadov. Mějte se fajn!',
      sentiment: 'POSITIVE',
      topicTag: 'Dopravní radar D5',
      waveformPeaks: [30, 50, 75, 80, 70, 60, 40, 30],
    },
  ]);

  // 19. HARDWARE & WEB MIDI STATE
  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);
  const [midiMappings, setMidiMappings] = useState<MidiMapping[]>([
    { id: 'm-1', action: 'FADER_MASTER', label: 'Master Fader', category: 'FADER', type: 'cc', channel: 1, number: 0 },
    { id: 'm-2', action: 'FADER_MUSIC', label: 'Playout Music Fader', category: 'FADER', type: 'cc', channel: 1, number: 1 },
    { id: 'm-3', action: 'FADER_MIC', label: 'Mikrofon Host Fader', category: 'FADER', type: 'cc', channel: 1, number: 2 },
    { id: 'm-4', action: 'FADER_CARTS', label: 'Zvuková banka Fader', category: 'FADER', type: 'cc', channel: 1, number: 3 },
    { id: 'm-5', action: 'MIC_MUTE_TOGGLE', label: 'MIC ON / Mute', category: 'BUTTON', type: 'note', channel: 1, number: 48 },
    { id: 'm-6', action: 'DUMP_PROFANITY', label: 'DUMP (Profanity Delay)', category: 'SAFETY', type: 'note', channel: 1, number: 49 },
    { id: 'm-7', action: 'PLAY_NEXT', label: 'Start / Next Track', category: 'BUTTON', type: 'note', channel: 1, number: 50 },
    { id: 'm-8', action: 'TA_TRIGGER', label: 'RDS TA Dopravní hlášení', category: 'BUTTON', type: 'note', channel: 1, number: 51 },
    { id: 'm-9', action: 'CART_1', label: 'Cart Pad 1 (Jingle)', category: 'CART', type: 'note', channel: 1, number: 64 },
    { id: 'm-10', action: 'CART_2', label: 'Cart Pad 2 (Sweeper)', category: 'CART', type: 'note', channel: 1, number: 65 },
    { id: 'm-11', action: 'CART_3', label: 'Cart Pad 3 (Airhorn)', category: 'CART', type: 'note', channel: 1, number: 66 },
    { id: 'm-12', action: 'CART_4', label: 'Cart Pad 4 (Laser)', category: 'CART', type: 'note', channel: 1, number: 67 },
  ]);

  const [keyboardShortcuts, setKeyboardShortcuts] = useState<KeyboardShortcut[]>([
    { id: 'sc-1', keyCombo: 'Space', label: 'Play / Next Track', action: 'PLAY_NEXT', category: 'PLAYOUT' },
    { id: 'sc-2', keyCombo: 'KeyM', label: 'Mikrofon ON / Mute', action: 'MIC_MUTE_TOGGLE', category: 'MIC_SAFETY' },
    { id: 'sc-3', keyCombo: 'KeyD', label: 'DUMP (Vymazat Profanity Buffer)', action: 'DUMP_PROFANITY', category: 'MIC_SAFETY' },
    { id: 'sc-4', keyCombo: 'KeyT', label: 'TA (Traffic Announcement Flag)', action: 'TA_TRIGGER', category: 'PLAYOUT' },
    { id: 'sc-5', keyCombo: 'F1..F8', label: 'Odpálení Cart Jinglů 1 až 8', action: 'CART_1..8', category: 'CARTS' },
  ]);

  // 20. ADVANCED RDS / DAB+ DLS & MOT SLIDESHOW STATE
  const [isRdsDabModalOpen, setIsRdsDabModalOpen] = useState(false);
  const [rdsConfig, setRdsConfig] = useState<RdsConfig>({
    piCode: '2098',
    psName: 'CLOUD_FM',
    pty: 'Pop Music',
    rtText: 'Cloud Radio Czech • Nejlepsi hudebni mix v eteru • Tel: 221 555 123',
    rtPlusArtist: 'Dua Lipa',
    rtPlusTitle: 'Levitating',
    isTaActive: false,
    isTpActive: true,
    studioPhone: '+420 221 555 123',
    studioSms: '+420 777 985 985',
    dabDlsText: 'Cloud Radio DAB+ Czech • Práve hrajeme: Dua Lipa - Levitating • Studio WhatsApp: 777 985 985',
  });

  const [dabSlides, setDabSlides] = useState<DabMotSlide[]>([
    {
      id: 'slide-1',
      type: 'NOW_PLAYING',
      title: 'Levitating',
      subtitle: 'Dua Lipa • Future Nostalgia',
      imageUrl: '',
      accentColor: '#6366f1',
      generatedAt: '14:30',
      isActive: true,
      badge: 'NOW PLAYING',
    },
    {
      id: 'slide-2',
      type: 'WEATHER',
      title: 'Počasí Praha & Střední Čechy',
      subtitle: '22°C • Polojasno, mírný vítr 12 km/h',
      imageUrl: '',
      accentColor: '#0ea5e9',
      generatedAt: '14:30',
      isActive: true,
      badge: 'METEO LIVE',
    },
    {
      id: 'slide-3',
      type: 'TRAFFIC',
      title: 'Doprava Expres',
      subtitle: 'D1 plynulá • Městský okruh zdržení 5 min',
      imageUrl: '',
      accentColor: '#f59e0b',
      generatedAt: '14:30',
      isActive: true,
      badge: 'RDS-TMC INFO',
    },
    {
      id: 'slide-4',
      type: 'PROMO_CONTEST',
      title: 'Vyhraj lístky na festival!',
      subtitle: 'Pošli WhatsApp na 777 985 985',
      imageUrl: '',
      accentColor: '#ec4899',
      generatedAt: '14:30',
      isActive: true,
      badge: 'ON-AIR SOUTĚŽ',
    },
  ]);


  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Streaming stats timer
  useEffect(() => {
    let timer: number;
    if (encoderState.isStreaming) {
      timer = window.setInterval(() => {
        setEncoderState((prev) => ({
          ...prev,
          uptimeSeconds: prev.uptimeSeconds + 1,
          bytesSentTotal: prev.bytesSentTotal + 40000,
          connectedListeners: Math.max(1200, prev.connectedListeners + Math.floor((Math.random() - 0.48) * 6)),
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [encoderState.isStreaming]);

  const handleTriggerProfanityDump = useCallback(() => {
    setProfanityState((prev) => ({
      ...prev,
      isDumping: true,
      delayBufferSec: 0,
      dumpCount: prev.dumpCount + 1,
      history: [
        {
          id: `dump-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          secondsDumped: profanityConfig.bufferDurationSec,
          reason: 'Emergency Host DUMP Triggered (Profanity Protection)',
          fillerTriggered: `Auto-Filler Stinger (${profanityConfig.autoFillCartType})`,
        },
        ...prev.history,
      ],
    }));

    // Auto re-arm buffer after 7 seconds
    setTimeout(() => {
      setProfanityState((prev) => ({
        ...prev,
        isDumping: false,
        delayBufferSec: profanityConfig.bufferDurationSec,
      }));
    }, 7000);
  }, [profanityConfig]);

  const handleToggleStreaming = useCallback(() => {
    setEncoderState((prev) => {
      const next = !prev.isStreaming;
      showToast(next ? '📻 Connected to Icecast relay & broadcasting live on-air!' : 'Stopped Icecast broadcast stream');
      return {
        ...prev,
        isStreaming: next,
      };
    });
  }, [showToast]);

  // EAS Broadcast Triggers
  const handleStartEmergencyAlert = useCallback((alert: EmergencyAlert) => {
    setEasState((prev) => ({
      ...prev,
      isBroadcastingAlert: true,
      activeAlert: alert,
      alertElapsedSec: 0,
    }));

    audioEngine.startEmergencyBroadcast(
      {
        text: alert.ttsVoiceText,
        toneType: alert.toneType,
        duckPct: alert.duckingLevelPct,
        lang: alert.broadcastLanguage === 'cs' ? 'cs-CZ' : 'en-US',
      },
      () => {
        showToast(`🎙️ Mluvené krizové hlášení běží on-air: ${alert.event}`);
      },
      () => {
        setEasState((prev) => {
          const duration = prev.alertElapsedSec;
          return {
            ...prev,
            isBroadcastingAlert: false,
            activeAlert: null,
            history: [
              {
                id: `eas-done-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                event: alert.event,
                severity: alert.severity,
                area: alert.areaDesc,
                source: alert.source,
                durationSec: duration || 25,
                status: 'COMPLETED',
              },
              ...prev.history,
            ],
          };
        });
        showToast('✅ Krizová relace odvysílána, pravidelný program byl plynule obnoven.');
      }
    );
  }, [showToast]);

  const handleCancelEmergencyAlert = useCallback(() => {
    audioEngine.stopEmergencyBroadcast();
    setEasState((prev) => {
      if (!prev.activeAlert) return prev;
      return {
        ...prev,
        isBroadcastingAlert: false,
        activeAlert: null,
        history: [
          {
            id: `eas-cancel-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            event: prev.activeAlert.event,
            severity: prev.activeAlert.severity,
            area: prev.activeAlert.areaDesc,
            source: prev.activeAlert.source,
            durationSec: prev.alertElapsedSec,
            status: 'INTERRUPTED',
          },
          ...prev.history,
        ],
      };
    });
    showToast('🛑 Krizové vysílání bylo manuálně přerušeno operátorem.');
  }, [showToast]);


  // Current track & remaining time
  const currentLiveTrack = playlist.find((item) => item.isLive) || playlist[0] || null;
  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(
    currentLiveTrack ? currentLiveTrack.durSeconds : 0
  );

  const liveTrackIndex = currentLiveTrack ? playlist.indexOf(currentLiveTrack) : 0;
  const nextTrack1 = playlist[liveTrackIndex + 1] || playlist[0] || null;
  const nextTrack2 = playlist[liveTrackIndex + 2] || playlist[1] || null;

  // --- AUDIO INITIALIZATION ---
  const startTrackAudio = useCallback(
    (track: QueueItem) => {
      if (!audioActive) return;
      audioEngine.playTrack(track, () => {
        if (autoPlayoutActive) {
          handleSkipSong();
        }
      });
    },
    [audioActive, autoPlayoutActive]
  );

  // Skip Song Function
  const handleSkipSong = useCallback(() => {
    setPlaylist((prev) => {
      const currentIdx = prev.findIndex((i) => i.isLive);
      if (currentIdx !== -1 && currentIdx < prev.length - 1) {
        const updated = prev.map((item, idx) => {
          if (idx === currentIdx) {
            return { ...item, isLive: false, type: 'PLAYED', color: 'text-gray-500' };
          }
          if (idx === currentIdx + 1) {
            return { ...item, isLive: true, type: 'ON AIR', color: 'text-red-400' };
          }
          return item;
        });

        const nextTrack = updated[currentIdx + 1];
        setTimeRemainingSec(nextTrack.durSeconds);
        startTrackAudio(nextTrack);
        showToast(`Now Playing: ${nextTrack.title}`);
        return updated;
      } else {
        showToast('End of On-Air Playout Queue reached');
        return prev;
      }
    });
  }, [startTrackAudio, showToast]);

  // Initial Audio Start on mount
  useEffect(() => {
    if (currentLiveTrack && isPlaying && audioActive) {
      startTrackAudio(currentLiveTrack);
    }
  }, []);

  // 1-SECOND TIMER
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying && autoPlayoutActive) {
        setTimeRemainingSec((prev) => {
          if (prev <= 1) {
            handleSkipSong();
            return 180;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, autoPlayoutActive, handleSkipSong]);

  // 60FPS VU METER LOOP
  useEffect(() => {
    let animId: number;
    const updateVU = () => {
      const levels = audioEngine.getLiveMeterLevels();
      setMeterLevels(levels);
      animId = requestAnimationFrame(updateVU);
    };
    animId = requestAnimationFrame(updateVU);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Toggle TA (Traffic Announcement)
  const handleToggleTa = useCallback(() => {
    setRdsConfig((prev) => {
      const nextTa = !prev.isTaActive;
      showToast(
        nextTa
          ? '🚗 RDS TA (Traffic Announcement) AKTIVOVÁNO! Autorádia přepínají na dopravu.'
          : '✅ RDS TA vypnuto, autorádia se vrátila k hudbě.'
      );
      return { ...prev, isTaActive: nextTa };
    });
  }, [showToast]);

  // --- HANDLERS ---
  const handleToggleAudio = () => {
    const active = audioEngine.toggleMasterMute();
    setAudioActive(active);
    showToast(active ? 'Master Audio Playout Engine: ON' : 'Master Audio Playout Muted');
  };

  const handleToggleMic = useCallback(async () => {
    if (!isMicActive) {
      const granted = await audioEngine.enableMicrophone();
      if (granted) {
        setIsMicActive(true);
        showToast('Host Microphone Connected (Talk Channel Live)');
      } else {
        showToast('Microphone access denied by browser');
      }
    } else {
      audioEngine.disableMicrophone();
      setIsMicActive(false);
      showToast('Host Microphone Deactivated');
    }
  }, [isMicActive, showToast]);

  const handleUpdateFader = useCallback((channel: keyof MixerChannelState, val: number) => {
    setFaders((prev) => ({ ...prev, [channel]: val }));
    audioEngine.setChannelFader(channel, val);
  }, []);

  const handlePlayCart = useCallback((cart: CartItem) => {
    showToast(`Instant Cart Fired: ${cart.title} (${cart.subtitle})`);
    audioEngine.playCartSound(cart.soundType);
  }, [showToast]);

  // MIDI Action Dispatcher
  const handleTriggerMidiAction = useCallback(
    (action: string, value: number = 127) => {
      const pct = Math.round((value / 127) * 100);
      if (action === 'FADER_MASTER') {
        handleUpdateFader('pgm', pct);
      } else if (action === 'FADER_MUSIC') {
        handleUpdateFader('playout', pct);
      } else if (action === 'FADER_MIC') {
        handleUpdateFader('talk', pct);
      } else if (action === 'FADER_CARTS') {
        handleUpdateFader('carts', pct);
      } else if (action === 'MIC_MUTE_TOGGLE') {
        handleToggleMic();
      } else if (action === 'DUMP_PROFANITY') {
        handleTriggerProfanityDump();
      } else if (action === 'PLAY_NEXT') {
        handleSkipSong();
      } else if (action === 'TA_TRIGGER') {
        handleToggleTa();
      } else if (action.startsWith('CART_')) {
        const cartIndex = parseInt(action.replace('CART_', ''), 10) - 1;
        if (carts[cartIndex]) {
          handlePlayCart(carts[cartIndex]);
        }
      }
    },
    [carts, handleToggleMic, handleTriggerProfanityDump, handleSkipSong, handleToggleTa, handleUpdateFader, handlePlayCart]
  );

  // HOTKEYS (1-8 Carts, F1-F8, Space Play/Next, M Mic, D Dump, T TA, C Cough)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // F1 to F8 keys for carts
      if (e.key.startsWith('F') && e.key.length === 2) {
        const fNum = parseInt(e.key.replace('F', ''), 10);
        if (fNum >= 1 && fNum <= 8) {
          e.preventDefault();
          const targetCart = carts[fNum - 1];
          if (targetCart) handlePlayCart(targetCart);
          return;
        }
      }

      if (e.code >= 'Digit1' && e.code <= 'Digit8') {
        const keyNum = e.code.replace('Digit', '');
        const targetCart = carts.find((c) => c.key === keyNum) || carts[parseInt(keyNum, 10) - 1];
        if (targetCart) {
          e.preventDefault();
          handlePlayCart(targetCart);
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleSkipSong();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMic();
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleTriggerProfanityDump();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleToggleTa();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleTriggerCough();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carts, handleSkipSong, handleToggleMic, handleTriggerProfanityDump, handleToggleTa, handlePlayCart]);

  const handleToggleMasterPlay = () => {
    if (isPlaying) {
      audioEngine.pausePlayout();
      setIsPlaying(false);
      showToast('Playout Paused');
    } else {
      audioEngine.resumePlayout();
      setIsPlaying(true);
      showToast('Playout Resumed');
    }
  };

  const handleStopMasterPlay = () => {
    audioEngine.stopCurrentPlayout();
    setIsPlaying(false);
    showToast('Playout Stopped & Reset');
  };

  const handlePauseMasterPlay = () => {
    handleToggleMasterPlay();
  };

  const handleTriggerSegue = () => {
    setIsSegueEditorOpen(true);
  };

  const handleMoveQueueItem = (index: number, direction: number) => {
    const target = index + direction;
    if (target < 0 || target >= playlist.length) return;
    const copy = [...playlist];
    const item = copy.splice(index, 1)[0];
    copy.splice(target, 0, item);
    setPlaylist(copy);
    showToast('Playout queue order updated');
  };

  const handleRemoveQueueItem = (index: number) => {
    const item = playlist[index];
    const copy = playlist.filter((_, i) => i !== index);

    if (item.isLive && copy.length > 0) {
      copy[0].isLive = true;
      copy[0].type = 'ON AIR';
      copy[0].color = 'text-red-400';
      setTimeRemainingSec(copy[0].durSeconds);
      startTrackAudio(copy[0]);
    }
    setPlaylist(copy);
    showToast(`Removed "${item.title}" from queue`);
  };

  const handleSkipToTrack = (index: number) => {
    const updated = playlist.map((item, idx) => {
      if (idx === index) {
        return { ...item, isLive: true, type: 'ON AIR', color: 'text-red-400' };
      }
      if (item.isLive) {
        return { ...item, isLive: false, type: 'PLAYED', color: 'text-gray-500' };
      }
      return item;
    });

    const targetTrack = updated[index];
    setPlaylist(updated);
    setTimeRemainingSec(targetTrack.durSeconds);
    startTrackAudio(targetTrack);
    showToast(`Now On Air: ${targetTrack.title}`);
  };

  const handleCuePreview = (track: QueueItem) => {
    showToast(`Cue Pre-Listen Channel Active: ${track.title}`);
    audioEngine.playCartSound('jingle1');
  };

  const handleTriggerCough = () => {
    const nextCough = !isCoughActive;
    setIsCoughActive(nextCough);
    audioEngine.setCough(nextCough);
    showToast(nextCough ? 'Cough Active (Host Mic Muted)' : 'Cough Released (Host Mic Live)');
  };

  const handleTriggerRotators = () => {
    setPlaylist((prev) => {
      const liveItem = prev.find((i) => i.isLive) || prev[0];
      const otherItems = prev.filter((i) => i !== liveItem);
      for (let i = otherItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherItems[i], otherItems[j]] = [otherItems[j], otherItems[i]];
      }
      return [liveItem, ...otherItems];
    });
    showToast('Rotation Clocks Refreshed & Reshuffled');
  };

  const handleToggleCushion = () => {
    const next = !cushionActive;
    setCushionActive(next);
    showToast(next ? '7-Second Profanity Cushion Enabled' : 'Profanity Cushion Disabled');
  };

  const handleClearDumpBuffer = () => {
    showToast('Dump Buffer Activated: 7s Delayed Audio Dropped (Air Safe)');
    audioEngine.playCartSound('sweeper');
  };

  const handleTriggerTlc = () => {
    setIsDspOpen(true);
  };

  // Add Single Track
  const handleConfirmAddTrack = (item: Omit<QueueItem, 'id' | 'isLive'>) => {
    const newItem: QueueItem = {
      ...item,
      id: `track-${Date.now()}`,
      isLive: false,
    };
    setPlaylist((prev) => [...prev, newItem]);
  };

  // Edit Track
  const handleConfirmEditTrack = (index: number, updated: Partial<QueueItem>) => {
    setPlaylist((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], ...updated };
      }
      return copy;
    });
  };

  // Bulk Upload
  const handleConfirmBulkUpload = (newTracks: LibrarySong[]) => {
    setLibrary((prev) => [...newTracks, ...prev]);
    const newQueueItems: QueueItem[] = newTracks.map((t, idx) => ({
      id: `q-bulk-${Date.now()}-${idx}`,
      time: `5:${String(30 + idx * 3).padStart(2, '0')} PM`,
      title: t.title,
      artist: t.artist,
      intro: ':00',
      dur: t.dur,
      durSeconds: t.durSeconds,
      type: t.type,
      color: 'text-orange-400',
      isLive: false,
      category: 'LOCAL',
      audioUrl: t.audioUrl,
    }));
    setPlaylist((prev) => [...prev, ...newQueueItems]);
  };

  // Custom Playlists Load / Save / Delete
  const handleLoadPlaylist = (pl: CustomPlaylist) => {
    setActivePlaylistName(pl.name);
    const newQueue: QueueItem[] = pl.tracks.map((t, idx) => ({
      id: `pl-${Date.now()}-${idx}`,
      time: `5:${String(10 + idx * 3).padStart(2, '0')} PM`,
      title: t.title,
      artist: t.artist,
      intro: ':00',
      dur: t.dur,
      durSeconds: t.durSeconds,
      type: idx === 0 ? 'ON AIR' : 'CUSTOM PL',
      color: idx === 0 ? 'text-red-400' : 'text-teal-400',
      isLive: idx === 0,
      category: t.category,
      audioUrl: t.audioUrl,
    }));

    setPlaylist(newQueue);
    if (newQueue[0]) {
      setTimeRemainingSec(newQueue[0].durSeconds);
      startTrackAudio(newQueue[0]);
    }
    showToast(`Loaded Playlist "${pl.name}" onto On-Air Playout Queue!`);
  };

  const handleSavePlaylist = (data: { id?: number; name: string; desc: string; tracks: LibrarySong[] }) => {
    if (data.id && customPlaylists.some((p) => p.id === data.id)) {
      setCustomPlaylists((prev) =>
        prev.map((p) => (p.id === data.id ? { ...p, name: data.name, desc: data.desc, tracks: data.tracks } : p))
      );
    } else {
      setCustomPlaylists((prev) => [
        ...prev,
        { id: Date.now(), name: data.name, desc: data.desc, tracks: data.tracks },
      ]);
    }
  };

  const handleDeletePlaylist = (id: number) => {
    setCustomPlaylists((prev) => prev.filter((p) => p.id !== id));
    showToast('Playlist deleted');
  };

  // Insert AI Voice Track
  const handleInsertVoiceTrack = (vt: { title: string; artist: string; dur: string; durSeconds: number; audioUrl: string }) => {
    const newVtItem: QueueItem = {
      id: `vt-${Date.now()}`,
      time: '5:20 PM',
      title: vt.title,
      artist: vt.artist,
      intro: ':00',
      dur: vt.dur,
      durSeconds: vt.durSeconds,
      type: 'VOICE TRACK',
      color: 'text-purple-400',
      isLive: false,
      category: 'VOICE_TRACK',
      audioUrl: vt.audioUrl,
    };

    setPlaylist((prev) => {
      const liveIdx = prev.findIndex((i) => i.isLive);
      if (liveIdx !== -1) {
        const copy = [...prev];
        copy.splice(liveIdx + 1, 0, newVtItem);
        return copy;
      }
      return [...prev, newVtItem];
    });
  };

  // Insert Commercial Spot
  const handleInsertCommercialToQueue = (clientName: string, title: string, durSec: number) => {
    const newSpot: QueueItem = {
      id: `comm-${Date.now()}`,
      time: '5:25 PM',
      title: `SPONSOR: ${clientName} - ${title}`,
      artist: clientName,
      intro: ':00',
      dur: `0:${String(durSec).padStart(2, '0')}`,
      durSeconds: durSec,
      type: 'SPONSOR SPOT',
      color: 'text-amber-400',
      isLive: false,
      category: 'SPONSOR',
    };

    setPlaylist((prev) => {
      const liveIdx = prev.findIndex((i) => i.isLive);
      if (liveIdx !== -1) {
        const copy = [...prev];
        copy.splice(liveIdx + 1, 0, newSpot);
        return copy;
      }
      return [...prev, newSpot];
    });
  };

  // Save Segue & Cue parameters
  const handleSaveSegue = (outgoingUpdates: Partial<QueueItem>, incomingUpdates: Partial<QueueItem>) => {
    setPlaylist((prev) => {
      const copy = [...prev];
      const outIdx = segueTrackIndex;
      const inIdx = segueTrackIndex + 1;
      if (copy[outIdx]) {
        copy[outIdx] = { ...copy[outIdx], ...outgoingUpdates };
      }
      if (copy[inIdx]) {
        copy[inIdx] = { ...copy[inIdx], ...incomingUpdates };
      }
      return copy;
    });
  };

  // Queue requested song from live listener inbox
  const handleQueueRequestedSong = (title: string, artist: string) => {
    const newReq: QueueItem = {
      id: `req-${Date.now()}`,
      time: '5:40 PM',
      title: `${title} [LISTENER REQUEST]`,
      artist,
      intro: ':08',
      dur: '3:20',
      durSeconds: 200,
      type: 'LISTENER REQUEST',
      color: 'text-teal-400',
      isLive: false,
      category: 'MUSIC',
    };

    setPlaylist((prev) => {
      const liveIdx = prev.findIndex((i) => i.isLive);
      if (liveIdx !== -1) {
        const copy = [...prev];
        copy.splice(liveIdx + 2, 0, newReq);
        return copy;
      }
      return [...prev, newReq];
    });
  };

  // Apply Clock Format
  const handleApplyClockFormat = (clock: ProgramClock) => {
    setActivePlaylistName(clock.name);
    const generatedQueue: QueueItem[] = clock.slots.map((slot, idx) => ({
      id: `clock-${Date.now()}-${idx}`,
      time: `5:${String(slot.minute).padStart(2, '0')} PM`,
      title: slot.description,
      artist: slot.category,
      intro: ':00',
      dur: '3:20',
      durSeconds: 200,
      type: slot.category,
      color: 'text-indigo-300',
      isLive: idx === 0,
      category: slot.category.includes('SPONSOR') ? 'SPONSOR' : 'MUSIC',
    }));

    setPlaylist(generatedQueue);
    if (generatedQueue[0]) {
      setTimeRemainingSec(generatedQueue[0].durSeconds);
      startTrackAudio(generatedQueue[0]);
    }
  };

  const segueOutgoingTrack = playlist[segueTrackIndex] || currentLiveTrack;
  const segueIncomingTrack = playlist[segueTrackIndex + 1] || nextTrack1;

  return (
    <div className="bg-[#121316] text-gray-200 font-sans h-screen flex flex-col overflow-hidden select-none">
      {/* HEADER */}
      <Header
        settings={settings}
        audioActive={audioActive}
        onToggleAudio={handleToggleAudio}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProgram={() => setIsProgramOpen(true)}
        onOpenAiVoiceTrack={() => setIsAiVoiceTrackOpen(true)}
        onOpenTraffic={() => setIsTrafficOpen(true)}
        onOpenDsp={() => setIsDspOpen(true)}
        onOpenListeners={() => setIsListenersOpen(true)}
        onOpenWebPlayer={() => setIsWebPlayerOpen(true)}
        onOpenMorningDuo={() => setIsMorningDuoOpen(true)}
        onOpenSilenceDetector={() => setIsSilenceDetectorOpen(true)}
        onOpenMultitrack={() => setIsMultitrackOpen(true)}
        onOpenVisualRadio={() => setIsVisualRadioOpen(true)}
        onOpenPodcastLogger={() => setIsPodcastLoggerOpen(true)}
        onOpenSoundboard={() => setIsSoundboardOpen(true)}
        onOpenProfanityDelay={() => setIsProfanityDelayOpen(true)}
        onOpenEncoder={() => setIsEncoderOpen(true)}
        onOpenSegueEditor={() => setIsSegueEditorOpen(true)}
        onOpenScheduler={() => setIsMusicSchedulerOpen(true)}
        onOpenEas={() => setIsEasModalOpen(true)}
        onOpenPhoneIn={() => setIsPhoneInModalOpen(true)}
        onOpenMidi={() => setIsMidiModalOpen(true)}
        onOpenRdsDab={() => setIsRdsDabModalOpen(true)}
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        profanityState={profanityState}
        encoderState={encoderState}
        isEasAlertActive={easState.isBroadcastingAlert}
        activePhoneLinesCount={phoneLines.filter((l) => l.status === 'READY_ON_AIR' || l.status === 'ON_AIR' || l.status === 'RINGING').length}
        isTaActive={rdsConfig.isTaActive}
      />

      {/* EAS EMERGENCY OVERRIDE BANNER (WHEN ACTIVE ON-AIR) */}
      {easState.isBroadcastingAlert && easState.activeAlert && (
        <div id="eas-live-top-banner" className="bg-red-600 text-white px-4 py-2 flex items-center justify-between shadow-lg border-b-2 border-red-400 animate-pulse shrink-0 z-30">
          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 rounded bg-red-950 text-white font-black text-xs uppercase tracking-widest border border-red-500">
              🚨 EAS OVERRIDE ON-AIR ({easState.activeAlert.source})
            </span>
            <span className="font-bold text-xs sm:text-sm tracking-wide">
              {easState.activeAlert.headline}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono bg-red-800 px-2 py-1 rounded border border-red-500">
              {easState.alertElapsedSec}s • DUCK {easState.activeAlert.duckingLevelPct}%
            </span>
            <button
              onClick={handleCancelEmergencyAlert}
              className="px-3 py-1 rounded bg-black hover:bg-slate-900 text-white font-extrabold text-xs tracking-wider uppercase border border-red-400 shadow cursor-pointer"
            >
              UKONČIT VÝSTRAHU
            </button>
          </div>
        </div>
      )}

      {/* MAIN STUDIO LAYOUT */}

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / CENTER: PLAYOUT SECTION */}
        <main className="flex-1 flex flex-col border-r border-[#2c303e] bg-[#121316] overflow-hidden">
          {/* Top ON AIR & NEXT status banners */}
          <OnAirBanner
            currentTrack={currentLiveTrack}
            nextTrack1={nextTrack1}
            nextTrack2={nextTrack2}
            isPlaying={isPlaying}
            timeRemainingSec={timeRemainingSec}
            onSkipTrack={handleSkipSong}
          />

          {/* Playout Log Table & Transport */}
          <PlayoutLog
            playlist={playlist}
            isPlaying={isPlaying}
            autoPlayoutActive={autoPlayoutActive}
            automationMode={automationMode}
            activePlaylistName={activePlaylistName}
            onToggleAutoPlayout={() => {
              setAutoPlayoutActive(!autoPlayoutActive);
              showToast(
                !autoPlayoutActive
                  ? 'Automatic Playout Engine Started'
                  : 'Automatic Playout Paused'
              );
            }}
            onSetAutomationMode={(mode) => {
              setAutomationMode(mode);
              showToast(`Automation Mode: ${mode.toUpperCase()}`);
            }}
            onToggleMasterPlay={handleToggleMasterPlay}
            onStopMasterPlay={handleStopMasterPlay}
            onPauseMasterPlay={handlePauseMasterPlay}
            onSkipSong={handleSkipSong}
            onTriggerSegue={handleTriggerSegue}
            onMoveItem={handleMoveQueueItem}
            onRemoveItem={handleRemoveQueueItem}
            onSkipToTrack={handleSkipToTrack}
            onOpenEditModal={(index) => {
              setEditingTrackIndex(index);
              setIsEditTrackOpen(true);
            }}
            onOpenAddModal={() => setIsAddTrackOpen(true)}
            onOpenUploadModal={() => setIsUploadOpen(true)}
            onOpenProgramModal={() => setIsProgramOpen(true)}
            onOpenMusicScheduler={() => setIsMusicSchedulerOpen(true)}
            onOpenAiVoiceTrack={() => setIsAiVoiceTrackOpen(true)}
            onOpenSegueEditorForTrack={(idx) => {
              setSegueTrackIndex(idx);
              setIsSegueEditorOpen(true);
            }}
            onCuePreview={handleCuePreview}
            onShowToast={showToast}
          />

          {/* Broadcast Bottom Hardware Toolbar */}
          <StudioToolbar
            cushionActive={cushionActive}
            isEngaged={isEngaged}
            isCoughActive={isCoughActive}
            isCueActive={isCueActive}
            onToggleVoiceTrack={() => setIsAiVoiceTrackOpen(true)}
            onTriggerRotators={handleTriggerRotators}
            onOpenDistantVT={() => showToast('Distant VT Synchronizer Connected to Cloud Master')}
            onToggleCushion={handleToggleCushion}
            onToggleEngage={() => {
              setIsEngaged(!isEngaged);
              showToast(!isEngaged ? 'Engage Mode Active' : 'Engage Mode Standby');
            }}
            onClearDumpBuffer={handleClearDumpBuffer}
            onTriggerCough={handleTriggerCough}
            onTriggerSegue={() => {
              setSegueTrackIndex(liveTrackIndex);
              setIsSegueEditorOpen(true);
            }}
            onToggleCue={() => {
              setIsCueActive(!isCueActive);
              showToast(!isCueActive ? 'Cue Channel Active' : 'Cue Channel Off');
            }}
            onTriggerTlc={handleTriggerTlc}
            onOpenScheduler={() => setIsMusicSchedulerOpen(true)}
          />
        </main>

        {/* RIGHT: SIDEBAR TABS (MIXER / LIBRARY / PLAYLISTS) */}
        <aside className="w-96 bg-[#1a1c23] border-l border-[#2c303e] flex flex-col shrink-0">
          {/* Tab Navigation Header */}
          <div className="flex items-center border-b border-[#2c303e] px-4 py-2 space-x-6 text-sm font-bold bg-[#121316] shrink-0">
            <button
              onClick={() => setSidebarTab('mixer')}
              className={`pb-1 transition cursor-pointer border-b-2 ${
                sidebarTab === 'mixer'
                  ? 'text-white border-blue-500 font-extrabold'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              Mixer
            </button>
            <button
              onClick={() => setSidebarTab('library')}
              className={`pb-1 transition cursor-pointer border-b-2 ${
                sidebarTab === 'library'
                  ? 'text-white border-blue-500 font-extrabold'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              Library
            </button>
            <button
              onClick={() => setSidebarTab('playlists')}
              className={`pb-1 transition cursor-pointer border-b-2 ${
                sidebarTab === 'playlists'
                  ? 'text-white border-blue-500 font-extrabold'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              Playlists
            </button>
          </div>

          {/* TAB CONTENTS */}
          {sidebarTab === 'mixer' && (
            <MixerPanel
              faders={faders}
              meterLevels={meterLevels}
              carts={carts}
              currentTrackTitle={currentLiveTrack?.title || ''}
              onUpdateFader={handleUpdateFader}
              onPlayCart={handlePlayCart}
              onOpenAddCartModal={() => setIsAddCartOpen(true)}
            />
          )}

          {sidebarTab === 'library' && (
            <LibraryPanel
              library={library}
              onAddSongToQueue={(song) => {
                handleConfirmAddTrack({
                  time: '5:35 PM',
                  title: song.title,
                  artist: song.artist,
                  intro: ':00',
                  dur: song.dur,
                  durSeconds: song.durSeconds,
                  type: song.type,
                  color: 'text-emerald-400',
                  category: song.category,
                  audioUrl: song.audioUrl,
                });
                showToast(`Queued "${song.title}" from Library`);
              }}
              onOpenUploadModal={() => setIsUploadOpen(true)}
              onOpenAddTrackModal={() => setIsAddTrackOpen(true)}
              onPreviewSong={(song) => {
                showToast(`Previewing: ${song.title}`);
                audioEngine.playTrack(song);
              }}
            />
          )}

          {sidebarTab === 'playlists' && (
            <PlaylistsPanel
              playlists={customPlaylists}
              activePlaylistName={activePlaylistName}
              onLoadPlaylist={handleLoadPlaylist}
              onOpenCreateModal={() => {
                setEditingPlaylist(null);
                setIsCreatePlaylistOpen(true);
              }}
              onOpenEditModal={(pl) => {
                setEditingPlaylist(pl);
                setIsCreatePlaylistOpen(true);
              }}
              onDeletePlaylist={handleDeletePlaylist}
            />
          )}

          {/* Sidebar Bottom Quick Status Badges */}
          <div className="bg-[#121316] border-t border-[#2c303e] p-2 space-y-1 shrink-0 text-[10px] font-bold text-slate-400">
            {/* Top Row: Next-Gen Tools */}
            <div className="grid grid-cols-5 gap-1">
              <button
                onClick={() => setIsMorningDuoOpen(true)}
                className="bg-[#1a1c23] hover:bg-pink-950/60 border border-[#2c303e] hover:border-pink-700/60 py-1.5 rounded flex flex-col items-center justify-center transition cursor-pointer"
                title="AI Co-Host & Phone-in Studio"
              >
                <span className="text-pink-400">DUO SHOW</span>
              </button>
              <button
                onClick={() => setIsSilenceDetectorOpen(true)}
                className="bg-[#1a1c23] hover:bg-emerald-950/60 border border-[#2c303e] hover:border-emerald-700/60 py-1.5 rounded flex flex-col items-center justify-center transition cursor-pointer"
                title="Silence Detector & Auto-Failover"
              >
                <span className="text-emerald-400">SILENCE</span>
              </button>
              <button
                onClick={() => setIsMultitrackOpen(true)}
                className="bg-[#1a1c23] hover:bg-red-950/60 border border-[#2c303e] hover:border-red-700/60 py-1.5 rounded flex flex-col items-center justify-center transition cursor-pointer"
                title="Multitrack Voice Tracker"
              >
                <span className="text-red-400">AIRCHECK</span>
              </button>
              <button
                onClick={() => setIsVisualRadioOpen(true)}
                className="bg-[#1a1c23] hover:bg-sky-950/60 border border-[#2c303e] hover:border-sky-700/60 py-1.5 rounded flex flex-col items-center justify-center transition cursor-pointer"
                title="RDS & Visual Radio"
              >
                <span className="text-sky-400">RDS / DAB</span>
              </button>
              <button
                onClick={() => setIsSoundboardOpen(true)}
                className="bg-[#1a1c23] hover:bg-rose-950/60 border border-[#2c303e] hover:border-rose-700/60 py-1.5 rounded flex flex-col items-center justify-center transition cursor-pointer"
                title="Broadcast FX Soundboard"
              >
                <span className="text-rose-400">FX SYNTH</span>
              </button>
            </div>

            {/* Bottom Row: Core Systems */}
            <div className="grid grid-cols-5 gap-1">
              <button
                onClick={() => setIsTrafficOpen(true)}
                className="bg-[#1a1c23] hover:bg-amber-950/60 border border-[#2c303e] hover:border-amber-700/60 py-1.5 rounded flex flex-col items-center justify-center transition cursor-pointer"
              >
                <span className="text-amber-400">TRAFFIC</span>
              </button>
              <button
                onClick={() => setIsDspOpen(true)}
                className="bg-[#1a1c23] hover:bg-red-950/60 border border-[#2c303e] hover:border-red-700/60 py-1.5 rounded flex flex-col items-center justify-center transition cursor-pointer"
              >
                <span className="text-red-400">DSP RACK</span>
              </button>
              <button
                onClick={() => setIsListenersOpen(true)}
                className="bg-[#1a1c23] hover:bg-teal-950/60 border border-[#2c303e] hover:border-teal-700/60 py-1.5 rounded flex flex-col items-center justify-center transition cursor-pointer"
              >
                <span className="text-teal-400">LISTENERS</span>
              </button>
              <button
                onClick={() => setIsPodcastLoggerOpen(true)}
                className="bg-[#1a1c23] hover:bg-teal-950/60 border border-[#2c303e] hover:border-teal-700/60 py-1.5 rounded flex flex-col items-center justify-center transition cursor-pointer"
              >
                <span className="text-teal-300">PODCAST</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="bg-[#1a1c23] hover:bg-[#232631] border border-[#2c303e] py-1.5 rounded flex flex-col items-center justify-center transition cursor-pointer"
              >
                <span className="text-gray-300">SETTINGS</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* --- MODALS --- */}
      <AddTrackModal
        isOpen={isAddTrackOpen}
        onClose={() => setIsAddTrackOpen(false)}
        onConfirmAdd={handleConfirmAddTrack}
        onShowToast={showToast}
      />

      <EditTrackModal
        isOpen={isEditTrackOpen}
        item={editingTrackIndex !== null ? playlist[editingTrackIndex] : null}
        index={editingTrackIndex}
        onClose={() => setIsEditTrackOpen(false)}
        onConfirmEdit={handleConfirmEditTrack}
        onShowToast={showToast}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onConfirmBulkUpload={handleConfirmBulkUpload}
        onShowToast={showToast}
      />

      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        editingPlaylist={editingPlaylist}
        library={library}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onSavePlaylist={handleSavePlaylist}
        onShowToast={showToast}
      />

      <AddCartModal
        isOpen={isAddCartOpen}
        onClose={() => setIsAddCartOpen(false)}
        onConfirmAddCart={(newCart) => setCarts((prev) => [...prev, newCart])}
        onShowToast={showToast}
      />

      <ProgramSchedulerModal
        isOpen={isProgramOpen}
        onClose={() => setIsProgramOpen(false)}
        onApplyClockFormat={handleApplyClockFormat}
        onShowToast={showToast}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={(s) => setSettings(s)}
        onShowToast={showToast}
      />

      {/* --- ADVANCED 6 BROADCAST SYSTEM MODALS --- */}
      <VisualSegueEditorModal
        isOpen={isSegueEditorOpen}
        outgoingTrack={segueOutgoingTrack}
        incomingTrack={segueIncomingTrack}
        onClose={() => setIsSegueEditorOpen(false)}
        onSaveSegue={handleSaveSegue}
        onShowToast={showToast}
      />

      <AiVoiceTrackModal
        isOpen={isAiVoiceTrackOpen}
        currentTrack={currentLiveTrack}
        nextTrack={nextTrack1}
        onClose={() => setIsAiVoiceTrackOpen(false)}
        onInsertVoiceTrack={handleInsertVoiceTrack}
        onShowToast={showToast}
      />

      <MusicSchedulerModal
        isOpen={isMusicSchedulerOpen}
        library={library}
        currentPlaylist={playlist}
        onClose={() => setIsMusicSchedulerOpen(false)}
        onApplyGenerated24hLog={(genQueue) => {
          setPlaylist(genQueue);
          if (genQueue[0]) {
            setTimeRemainingSec(genQueue[0].durSeconds);
            startTrackAudio(genQueue[0]);
          }
        }}
        onShowToast={showToast}
      />

      <TrafficManagerModal
        isOpen={isTrafficOpen}
        onClose={() => setIsTrafficOpen(false)}
        onInsertCommercialToQueue={handleInsertCommercialToQueue}
        onShowToast={showToast}
      />

      <DspProcessorModal
        isOpen={isDspOpen}
        onClose={() => setIsDspOpen(false)}
        onShowToast={showToast}
      />

      <ListenerStudioModal
        isOpen={isListenersOpen}
        onClose={() => setIsListenersOpen(false)}
        onQueueRequestedSong={handleQueueRequestedSong}
        onShowToast={showToast}
      />

      <ListenerPlayerModal
        isOpen={isWebPlayerOpen}
        currentTrack={currentLiveTrack}
        onClose={() => setIsWebPlayerOpen(false)}
        onSubmitRequest={(sender, location, message, song) => {
          if (song) {
            handleQueueRequestedSong(song, 'Requested by listener');
          }
        }}
        onShowToast={showToast}
      />

      {/* 6 NEXT-GEN BROADCAST SYSTEM MODALS */}
      <MorningDuoModal
        isOpen={isMorningDuoOpen}
        onClose={() => setIsMorningDuoOpen(false)}
        nextTrack={nextTrack1}
        onInsertDialogueToQueue={(title, durSec) => {
          const mins = Math.floor(durSec / 60);
          const secs = durSec % 60;
          const durStr = `${mins}:${String(secs).padStart(2, '0')}`;
          handleConfirmAddTrack({
            time: '5:35 PM',
            title,
            artist: 'Morning Show Duo (AI Banter)',
            intro: ':00',
            dur: durStr,
            durSeconds: durSec,
            type: 'VOICE_TRACK',
            color: 'text-pink-400',
            category: 'VOICE_TRACK',
          });
        }}
        onShowToast={showToast}
      />

      <SilenceDetectorModal
        isOpen={isSilenceDetectorOpen}
        onClose={() => setIsSilenceDetectorOpen(false)}
        onShowToast={showToast}
        onTriggerEmergencyRecovery={() => {
          showToast('Emergency Recovery: Station jingle & backup rotation triggered');
          handleSkipSong();
        }}
      />

      <MultitrackVoiceTrackerModal
        isOpen={isMultitrackOpen}
        onClose={() => setIsMultitrackOpen(false)}
        outgoingTrack={currentLiveTrack}
        incomingTrack={nextTrack1}
        onInsertVoiceTrack={(vt) => {
          handleConfirmAddTrack({
            time: '5:35 PM',
            title: vt.title,
            artist: vt.artist,
            intro: ':00',
            dur: vt.dur,
            durSeconds: vt.durSeconds,
            type: 'VOICE_TRACK',
            color: 'text-red-400',
            category: 'VOICE_TRACK',
            audioUrl: vt.audioUrl,
          });
        }}
        onShowToast={showToast}
      />

      <VisualRadioRdsModal
        isOpen={isVisualRadioOpen}
        onClose={() => setIsVisualRadioOpen(false)}
        currentTrack={currentLiveTrack}
        stationName={settings.stationName}
        frequency={settings.frequency}
        onShowToast={showToast}
      />

      <BroadcastLoggerPodcastModal
        isOpen={isPodcastLoggerOpen}
        onClose={() => setIsPodcastLoggerOpen(false)}
        onShowToast={showToast}
      />

      <BroadcastSoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
        onShowToast={showToast}
      />

      <ProfanityDelayModal
        isOpen={isProfanityDelayOpen}
        onClose={() => setIsProfanityDelayOpen(false)}
        config={profanityConfig}
        state={profanityState}
        onUpdateConfig={(c) => setProfanityConfig(c)}
        onTriggerDump={handleTriggerProfanityDump}
        onShowToast={showToast}
      />

      <IcecastWebRtcEncoderModal
        isOpen={isEncoderOpen}
        onClose={() => setIsEncoderOpen(false)}
        config={encoderConfig}
        state={encoderState}
        currentTrack={currentLiveTrack}
        onUpdateConfig={(c) => setEncoderConfig(c)}
        onToggleStreaming={handleToggleStreaming}
        onShowToast={showToast}
      />

      <EmergencyAlertModal
        isOpen={isEasModalOpen}
        onClose={() => setIsEasModalOpen(false)}
        easState={easState}
        onStartAlertBroadcast={handleStartEmergencyAlert}
        onCancelAlertBroadcast={handleCancelEmergencyAlert}
        onShowToast={showToast}
      />

      {/* 18. VoIP Phone-In Studio & WhatsApp Voice Inbox */}
      <PhoneInStudioModal
        isOpen={isPhoneInModalOpen}
        onClose={() => setIsPhoneInModalOpen(false)}
        phoneLines={phoneLines}
        onUpdatePhoneLines={setPhoneLines}
        whatsAppMessages={whatsAppMessages}
        onUpdateWhatsAppMessages={setWhatsAppMessages}
        onInjectTrackToPlaylist={(item) => {
          handleConfirmAddTrack({
            time: '5:35 PM',
            title: item.title || 'WhatsApp Voice Track',
            artist: item.artist || 'Posluchač',
            intro: item.intro || ':00',
            dur: item.dur || '0:15',
            durSeconds: item.durSeconds || 15,
            type: item.type || 'LISTENER REQUEST',
            color: item.color || 'text-emerald-400',
            category: item.category || 'VOICE_TRACK',
            audioUrl: item.audioUrl,
          });
        }}
        onShowToast={showToast}
        isProfanityBufferActive={profanityState.isEngaged}
      />

      {/* 19. Hardware & Web MIDI Mapping */}
      <HardwareMidiModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        midiMappings={midiMappings}
        onUpdateMidiMappings={setMidiMappings}
        keyboardShortcuts={keyboardShortcuts}
        onUpdateKeyboardShortcuts={setKeyboardShortcuts}
        onTriggerAction={handleTriggerMidiAction}
        onShowToast={showToast}
      />

      {/* 20. Advanced RDS & DAB+ MOT Slideshow Generátor */}
      <RdsDabSlideshowModal
        isOpen={isRdsDabModalOpen}
        onClose={() => setIsRdsDabModalOpen(false)}
        rdsConfig={rdsConfig}
        onUpdateRdsConfig={setRdsConfig}
        slides={dabSlides}
        onUpdateSlides={setDabSlides}
        currentTrack={currentLiveTrack}
        onShowToast={showToast}
      />

      {/* NOTIFICATION TOAST */}

      <Toast message={toastMessage} />
    </div>
  );
}
