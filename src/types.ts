export interface QueueItem {
  id: string;
  time: string;
  title: string;
  artist: string;
  intro: string;
  dur: string;
  durSeconds: number;
  elapsedSeconds?: number;
  type: string;
  color?: string;
  isLive: boolean;
  audioUrl?: string | null;
  category: 'MUSIC' | 'JINGLE' | 'SPONSOR' | 'VOICE_TRACK' | 'BUMPER' | 'LOCAL' | 'NEWS';
  year?: string;
  bpm?: number;
  key?: string;          // e.g. "Am", "C", "F#m"
  camelotKey?: string;   // e.g. "8A", "8B", "11B"
  energyLevel?: number;  // 1 to 10
  energy?: 'LOW' | 'MED' | 'HIGH';
  waveformPeaks?: number[];
  // Cue & Segue Timing Points (in seconds)
  cueIn?: number;      // Start point (skip silence at beginning)
  introSec?: number;   // Talk-over ramp limit (where vocals start)
  hookIn?: number;     // Hook preview start
  hookOut?: number;    // Hook preview end
  segueSec?: number;   // Mix point (incoming track starts playing)
  fadeSec?: number;    // Outgoing track fades to silence
}

export interface LibrarySong {
  id: string;
  title: string;
  artist: string;
  dur: string;
  durSeconds: number;
  type: string;
  category: 'MUSIC' | 'JINGLE' | 'SPONSOR' | 'VOICE_TRACK' | 'BUMPER' | 'LOCAL' | 'NEWS';
  audioUrl?: string | null;
  album?: string;
  year?: string;
  bpm?: number;
  key?: string;
  camelotKey?: string;
  energyLevel?: number;
  energy?: 'LOW' | 'MED' | 'HIGH';
  waveformPeaks?: number[];
  cueIn?: number;
  introSec?: number;
  hookIn?: number;
  hookOut?: number;
  segueSec?: number;
  fadeSec?: number;
}

export interface CustomPlaylist {
  id: number;
  name: string;
  desc: string;
  tracks: LibrarySong[];
}

export interface CartItem {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  color: 'blue' | 'purple' | 'green' | 'amber' | 'rose' | 'teal';
  soundType: 'jingle1' | 'jingle2' | 'sponsor' | 'sweeper' | 'laser' | 'airhorn' | 'chime' | 'scratch' | 'news';
  audioUrl?: string | null;
}

export type AutomationMode = 'auto' | 'assist' | 'manual';

export interface MixerChannelState {
  talk: number;
  playout: number;
  elements: number;
  carts: number;
  pgm: number;
}

export interface BroadcastSettings {
  stationName: string;
  frequency: string;
  crossfadeSec: number;
  icecastPush: boolean;
  encoderBitrate: string;
  autoCue: boolean;
  cushionEnabled: boolean;
  cushionSec: number;
  masterVolume: number;
  studioProfile: string;
}

export interface ProgramClockSlot {
  minute: number;
  category: string;
  description: string;
  color: string;
}

export interface ProgramClock {
  id: string;
  name: string;
  hourRange: string;
  slots: ProgramClockSlot[];
}

// --- 1. SEGUE & CUE EDITOR TYPES ---
export interface SegueTransition {
  outgoingTrack: QueueItem;
  incomingTrack: QueueItem;
  outgoingFadeDuration: number;
  incomingStartOffset: number;
  crossfadeCurve: 'linear' | 'exponential' | 's-curve';
}

// --- 2. AI VOICE TRACK TYPES ---
export interface AiVoiceTrackConfig {
  type: 'backsell' | 'weather_traffic' | 'promo' | 'hour_opener';
  presenterName: string;
  language: 'cs' | 'en';
  tone: 'upbeat' | 'chill' | 'punchy' | 'morning' | 'night';
  customTopic: string;
  targetSeconds: number;
  ttsVoice: string;
  ttsRate: number;
  ttsPitch: number;
}

// --- 3. MUSIC SCHEDULING & ROTATION RULES ---
export interface SchedulingRules {
  artistSeparationMin: number; // e.g. 45 min
  titleSeparationMin: number;  // e.g. 180 min
  maxConsecutiveFast: number;  // e.g. 3
  maxConsecutiveSlow: number;  // e.g. 2
  formatBalance: {
    hitsPercent: number;
    recurrentPercent: number;
    freshPercent: number;
    goldPercent: number;
  };
  enforceDayparting: boolean;
}

export interface RuleViolation {
  id: string;
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  position: number;
  ruleType: 'ARTIST_SEPARATION' | 'TEMPO_CLASH' | 'CATEGORY_IMBALANCE' | 'REPEAT_SONG';
  message: string;
  severity: 'warning' | 'error';
}

// --- 4. TRAFFIC & COMMERCIAL SPOTS ---
export interface CommercialCampaign {
  id: string;
  clientName: string;
  spotTitle: string;
  category: 'RETAIL' | 'AUTO' | 'FOOD' | 'EVENTS' | 'FINANCE';
  durationSec: number;
  scheduledWindows: string[]; // e.g. ["05:15 PM", "05:45 PM"]
  targetPlaysPerDay: number;
  playedCount: number;
  audioUrl?: string | null;
  active: boolean;
  ratePerPlay: number;
}

export interface AsRunLogItem {
  id: string;
  timestamp: string;
  clientName: string;
  spotTitle: string;
  durationSec: number;
  status: 'BROADCAST_VERIFIED' | 'DISCREPANCY';
  commercialId: string;
}

// --- 5. DSP AUDIO PROCESSOR ---
export interface DspProcessorSettings {
  enabled: boolean;
  preset: 'FM_PUNCH' | 'WARM_VINTAGE' | 'HYPER_TOP40' | 'TALK_ACOUSTIC' | 'CUSTOM';
  // 5-band EQ (dB gains: -12dB to +12dB)
  eq: {
    subBass80Hz: number;
    lowMid250Hz: number;
    mid1kHz: number;
    presence4kHz: number;
    air12kHz: number;
  };
  // Multiband AGC Compressor
  agc: {
    threshold: number; // -30dB to 0dB
    ratio: number;     // 1:1 to 20:1
    attack: number;    // 0.001 to 0.1s
    release: number;   // 0.05 to 1.0s
    knee: number;      // 0 to 40
  };
  // Stereo Enhancer
  stereoWidener: {
    width: number;     // 100% to 200%
  };
  // Limiter / Peak Ceiling
  limiter: {
    ceilingDb: number; // -0.5dB
    postGainDb: number;
  };
}

// --- 6. LISTENER ANALYTICS & STUDIO CHAT ---
export interface ListenerStats {
  currentListeners: number;
  peakToday: number;
  averageListeningTimeMin: number;
  bandwidthMbps: number;
  streamHealth: 'EXCELLENT' | 'GOOD' | 'WARNING';
  topLocations: { city: string; country: string; count: number; flag: string }[];
  hourlyHistory: { hour: string; listeners: number }[];
}

export interface ListenerMessage {
  id: string;
  sender: string;
  location: string;
  timestamp: string;
  message: string;
  type: 'SHOUTOUT' | 'REQUEST' | 'CONTEST_ENTRY' | 'FEEDBACK';
  requestedSong?: {
    title: string;
    artist: string;
  };
  status: 'NEW' | 'READ' | 'QUEUED' | 'STARRED';
}

// --- 7. MORNING SHOW DUO & STUDIO CALLER SIMULATOR ---
export interface DialogueLine {
  id: string;
  speaker: 'host1' | 'host2' | 'caller';
  speakerName: string;
  text: string;
  emotion?: 'happy' | 'laughing' | 'curious' | 'surprised' | 'teasing' | 'neutral';
  suggestedDurationSec: number;
  voiceGender?: 'male' | 'female';
}

export interface MorningDuoScript {
  topic: string;
  host1Name: string;
  host2Name: string;
  callerName?: string;
  mode: 'morning_duo' | 'listener_call' | 'quiz_game';
  dialogue: DialogueLine[];
  totalDurationSec: number;
}

// --- 8. SILENCE DETECTOR & AUTO-FAILOVER ---
export interface SilenceDetectorConfig {
  enabled: boolean;
  thresholdDb: number; // e.g. -45 dB
  triggerDelaySec: number; // e.g. 5 seconds
  autoFailoverEnabled: boolean;
  backupSource: 'EMERGENCY_ROTATION' | 'SWEPPER_LOOP' | 'ICECAST_RELAY';
}

export interface SilenceDetectorState {
  currentRmsDb: number;
  isSilent: number; // 0 to triggerDelaySec
  alarmActive: boolean;
  failoverTriggered: boolean;
  lastAlarmTime: string | null;
  recoveryCount: number;
}

// --- 9. MULTITRACK VOICE TRACKER & DUCKING ---
export interface VoiceTrackerState {
  isRecording: boolean;
  recordedBlob: Blob | null;
  recordedAudioUrl: string | null;
  durationSec: number;
  bedVolumeDucking: number; // e.g. 0.2 (20% volume while talking)
  voiceGainDb: number;
  trimStartSec: number;
  trimEndSec: number;
  normalizeVoice: boolean;
}

// --- 10. RDS, DAB+ & VISUAL RADIO ---
export interface RdsDabMetadata {
  psName: string; // 8 chars e.g. "CLOUD 98"
  radioText: string; // 64 chars
  radioTextPlus: {
    itemTitle: string;
    itemArtist: string;
    showName: string;
    stationPhone: string;
    stationWebsite: string;
  };
  dabDlsText: string; // 128 chars Dynamic Label Segment
  ptyCode: number; // e.g. 10 (Pop Music), 1 (News), 3 (Info)
  piCode: string; // Hex e.g. "20FB"
  tpActive: boolean; // Traffic Program
  taActive: boolean; // Traffic Announcement
}

// --- 11. 24/7 BROADCAST LOGGER & PODCAST CREATOR ---
export interface BroadcastLogEntry {
  id: string;
  timeStr: string;
  category: 'MUSIC' | 'VOICE_TRACK' | 'COMMERCIAL' | 'JINGLE' | 'NEWS';
  title: string;
  artist: string;
  durSeconds: number;
  status: 'AIRED' | 'SCHEDULED';
  audioArchived: boolean;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  recordedDate: string;
  durationMinutes: number;
  includedSegmentsCount: number;
  downloadUrl?: string;
  audioBlob?: Blob;
}

// --- 12. BROADCAST SOUNDBOARD & FX SYNTHESIZER ---
export interface FxSynthPreset {
  id: string;
  name: string;
  type: 'LASER_SWEEP' | 'SUB_DROP' | 'WHITE_WHOOSH' | 'RADIO_STING' | 'VINYL_BRAKE' | 'CHIME_FANFARE';
  color: string;
  durationSec: number;
  baseFreqHz: number;
  modFreqHz: number;
  decaySec: number;
  noiseAmount: number;
}

// --- 13. PROFANITY DELAY ("DUMP") SYSTEM ---
export interface ProfanityDelayConfig {
  bufferDurationSec: number; // 5s, 7s, 10s, 15s
  autoFillCartType: 'sweeper' | 'jingle1' | 'jingle2' | 'station_id';
  coughMuteGain: number; // 0
  autoReArm: boolean;
}

export interface DumpIncident {
  id: string;
  timestamp: string;
  reason: string;
  secondsDumped: number;
  fillerTriggered: string;
}

export interface ProfanityDelayState {
  isArmed: boolean;
  delayBufferSec: number;      // Current filled buffer duration (e.g. 7.0s)
  targetBufferSec: number;     // Configured target (e.g. 7.0s)
  isDumping: boolean;
  dumpCount: number;
  lastDumpTimestamp: string | null;
  history: DumpIncident[];
}

// --- 14. ICECAST / WEBRTC STREAMING ENCODER ---
export interface IcecastEncoderConfig {
  serverUrl: string;           // e.g. "stream.cloudradio.fm:8000"
  mountPoint: string;          // e.g. "/live.mp3"
  format: 'MP3' | 'AAC' | 'OPUS' | 'FLAC';
  bitrateKbps: 128 | 192 | 256 | 320;
  sampleRate: 44100 | 48000;
  channels: 'stereo' | 'mono';
  stationName: string;
  genre: string;
  streamDescription: string;
  isPublic: boolean;
  adminPassword?: string;
}

export interface IcecastEncoderState {
  isConnected: boolean;
  isStreaming: boolean;
  encoderCpuPercent: number;
  currentBitrateKbps: number;
  connectedListeners: number;
  peakListenersToday: number;
  uptimeSeconds: number;
  bytesSentTotal: number;
  bufferHealthPct: number;
  currentTrackMetadata: {
    artist: string;
    title: string;
    showName: string;
  };
  log: string[];
}

// --- 15. PODCAST CHAPTERS & RSS FEED ---
export interface PodcastChapter {
  id: string;
  startTimeSec: number;
  timeFormatted: string; // e.g. "00:00", "03:45"
  title: string;
  summary: string;
  speaker: string;
}

export interface PodcastRssMetadata {
  title: string;
  author: string;
  email: string;
  description: string;
  language: string;
  category: string;
  coverImageUrl: string;
  feedUrl: string;
  websiteUrl: string;
}

// --- 16. CAMELOT HARMONIC KEY INFO ---
export interface CamelotHarmonicKey {
  code: string;      // e.g. "8A"
  musicalKey: string;// e.g. "A minor"
  relativeCode: string; // "8B" (C major)
  boostCode: string;    // "9A" (E minor - Energy Boost)
  dropCode: string;     // "7A" (D minor - Energy Drop)
}

// --- 17. EMERGENCY ALERT SYSTEM (EAS / CAP & ČHMÚ) ---
export type EmergencySeverity = 'EXTREME' | 'SEVERE' | 'MODERATE' | 'MINOR' | 'TEST';
export type EmergencyUrgency = 'IMMEDIATE' | 'EXPECTED' | 'FUTURE' | 'PAST';
export type EmergencyCertainty = 'OBSERVED' | 'LIKELY' | 'POSSIBLE' | 'UNLIKELY';
export type EmergencySource = 'CHMU' | 'IZS_CR' | 'NDIC_TRAFFIC' | 'HYDROMET' | 'PČR' | 'INTERNAL_STATION';

export interface EmergencyAlert {
  id: string;
  capIdentifier: string;
  sender: string;
  sent: string;
  status: 'ACTUAL' | 'EXERCISE' | 'TEST' | 'DRAFT';
  msgType: 'ALERT' | 'UPDATE' | 'CANCEL';
  scope: 'PUBLIC' | 'RESTRICTED' | 'PRIVATE';
  event: string;
  eventCode: string; // e.g. "SVR" (Severe Storm), "FLW" (Flood Warning), "EVI" (Evacuation), "RWT" (Test)
  urgency: EmergencyUrgency;
  severity: EmergencySeverity;
  certainty: EmergencyCertainty;
  headline: string;
  description: string;
  instruction: string;
  areaDesc: string;
  effective: string;
  expires: string;
  source: EmergencySource;
  toneType: 'DUAL_TONE_EAS' | 'ATTENTION_SIREN' | 'SAME_FSK_HEADER' | 'VOICE_ONLY';
  duckingLevelPct: number; // e.g. 0% (total mute) or 10%
  ttsVoiceText: string;
  broadcastLanguage: 'cs' | 'en';
}

export interface EasState {
  isBroadcastingAlert: boolean;
  activeAlert: EmergencyAlert | null;
  alertElapsedSec: number;
  autoDuckMaster: boolean;
  history: {
    id: string;
    timestamp: string;
    event: string;
    severity: EmergencySeverity;
    area: string;
    source: string;
    durationSec: number;
    status: 'COMPLETED' | 'INTERRUPTED' | 'SCHEDULED_TEST';
  }[];
}

// --- 18. VOIP SIP PHONE-IN & WHATSAPP VOICE INBOX ---
export type PhoneLineStatus = 'IDLE' | 'RINGING' | 'ON_HOLD' | 'SCREENING' | 'READY_ON_AIR' | 'ON_AIR' | 'BUSY';

export interface PhoneLine {
  id: string;
  lineNumber: number; // 1, 2, 3, 4
  callerName: string;
  callerPhone: string;
  callerLocation: string;
  topic: string;
  screenerNotes: string;
  status: PhoneLineStatus;
  callDurationSec: number;
  audioLevel: number; // 0..100
  gainLevel: number;  // 0..1.5
  isProfanityProtected: boolean;
  screenerRating?: number; // 1..5 stars
  avatarColor: string;
}

export type WhatsAppVoiceStatus = 'NEW' | 'TRANSCRIBED' | 'EDITED' | 'QUEUED' | 'AIRED';

export interface WhatsAppVoiceMessage {
  id: string;
  senderName: string;
  senderPhone: string;
  senderCity: string;
  timestamp: string;
  durationSec: number;
  audioUrl?: string | null;
  status: WhatsAppVoiceStatus;
  transcription: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'CRITICAL' | 'FUNNY' | 'EMOTIONAL';
  topicTag: string;
  trimStartSec?: number;
  trimEndSec?: number;
  waveformPeaks: number[];
  isAiTranscribing?: boolean;
}

// --- 19. HARDWARE MAPPING & WEB MIDI / STREAM DECK ---
export type MidiControlType = 'cc' | 'note';

export interface MidiMapping {
  id: string;
  action:
    | 'FADER_MASTER'
    | 'FADER_MUSIC'
    | 'FADER_MIC'
    | 'FADER_CARTS'
    | 'FADER_PHONE'
    | 'MIC_MUTE_TOGGLE'
    | 'MIC_COUGH'
    | 'DUMP_PROFANITY'
    | 'PLAY_NEXT'
    | 'PAUSE_PLAYOUT'
    | 'CART_1'
    | 'CART_2'
    | 'CART_3'
    | 'CART_4'
    | 'CART_5'
    | 'CART_6'
    | 'CART_7'
    | 'CART_8'
    | 'TA_TRIGGER'
    | 'EAS_ALERT_OPEN'
    | 'PHONE_LINE_1_AIR'
    | 'PHONE_LINE_2_AIR';
  label: string;
  category: 'FADER' | 'BUTTON' | 'CART' | 'PHONE' | 'SAFETY';
  type: MidiControlType;
  channel: number; // 1-16
  number: number;  // CC number or Note number (0-127)
  lastValue?: number;
}

export interface KeyboardShortcut {
  id: string;
  keyCombo: string; // e.g. "Space", "F1", "F2", "KeyM", "KeyD"
  label: string;
  action: string;
  category: 'PLAYOUT' | 'CARTS' | 'MIC_SAFETY' | 'PHONE';
}

export interface MidiDeviceStatus {
  connected: boolean;
  deviceName: string | null;
  manufacturer: string | null;
  lastReceivedEvent: string | null;
}

// --- 20. ADVANCED RDS / DAB+ DLS & MOT SLIDESHOW ---
export interface RdsConfig {
  piCode: string;       // e.g. "2098" (Czech Regional code)
  psName: string;       // Dynamic 8-char Programme Service name
  pty: string;          // Programme Type e.g. "Pop Music", "Current Affairs"
  rtText: string;       // RadioText 64 chars
  rtPlusArtist: string;
  rtPlusTitle: string;
  isTaActive: boolean;  // Traffic Announcement flag (switches car radios)
  isTpActive: boolean;  // Traffic Programme flag
  studioPhone: string;  // e.g. "+420 221 555 123"
  studioSms: string;    // e.g. "777 985 985"
  dabDlsText: string;   // Dynamic Label Segment (128 chars)
}

export type DabSlideType = 'NOW_PLAYING' | 'WEATHER' | 'TRAFFIC' | 'PROMO_CONTEST' | 'PRESENTER';

export interface DabMotSlide {
  id: string;
  type: DabSlideType;
  title: string;
  subtitle: string;
  imageUrl: string;
  accentColor: string;
  generatedAt: string;
  isActive: boolean;
  badge: string;
}

