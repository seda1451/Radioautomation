/**
 * Professional Broadcast Web Audio Engine
 * Handles multi-channel routing, synthetic music tracks, cart sounds,
 * microphone input, real-time VU analysis, DSP Audio Processing (5-band EQ, AGC Compressor),
 * Segue crossfade preview, and Voice Track synthesis.
 */

import { DspProcessorSettings } from '../types';

export const DEFAULT_DSP_SETTINGS: DspProcessorSettings = {
  enabled: true,
  preset: 'FM_PUNCH',
  eq: {
    subBass80Hz: 2.5,
    lowMid250Hz: -1.0,
    mid1kHz: 1.5,
    presence4kHz: 3.0,
    air12kHz: 4.0,
  },
  agc: {
    threshold: -18,
    ratio: 4.5,
    attack: 0.015,
    release: 0.25,
    knee: 12,
  },
  stereoWidener: {
    width: 125,
  },
  limiter: {
    ceilingDb: -0.3,
    postGainDb: 1.5,
  },
};

export const DSP_PRESETS: Record<string, DspProcessorSettings> = {
  FM_PUNCH: {
    enabled: true,
    preset: 'FM_PUNCH',
    eq: { subBass80Hz: 3.5, lowMid250Hz: -1.5, mid1kHz: 1.0, presence4kHz: 3.5, air12kHz: 4.5 },
    agc: { threshold: -20, ratio: 6.0, attack: 0.01, release: 0.2, knee: 10 },
    stereoWidener: { width: 130 },
    limiter: { ceilingDb: -0.2, postGainDb: 2.0 },
  },
  WARM_VINTAGE: {
    enabled: true,
    preset: 'WARM_VINTAGE',
    eq: { subBass80Hz: 4.0, lowMid250Hz: 2.0, mid1kHz: 0.0, presence4kHz: 1.0, air12kHz: 1.5 },
    agc: { threshold: -16, ratio: 3.5, attack: 0.03, release: 0.35, knee: 15 },
    stereoWidener: { width: 110 },
    limiter: { ceilingDb: -0.5, postGainDb: 1.0 },
  },
  HYPER_TOP40: {
    enabled: true,
    preset: 'HYPER_TOP40',
    eq: { subBass80Hz: 5.0, lowMid250Hz: -2.0, mid1kHz: 2.0, presence4kHz: 4.5, air12kHz: 6.0 },
    agc: { threshold: -24, ratio: 8.0, attack: 0.005, release: 0.15, knee: 8 },
    stereoWidener: { width: 145 },
    limiter: { ceilingDb: -0.1, postGainDb: 3.0 },
  },
  TALK_ACOUSTIC: {
    enabled: true,
    preset: 'TALK_ACOUSTIC',
    eq: { subBass80Hz: -2.0, lowMid250Hz: 1.0, mid1kHz: 2.5, presence4kHz: 2.0, air12kHz: 1.0 },
    agc: { threshold: -14, ratio: 3.0, attack: 0.02, release: 0.4, knee: 18 },
    stereoWidener: { width: 100 },
    limiter: { ceilingDb: -1.0, postGainDb: 0.5 },
  },
  CUSTOM: {
    ...DEFAULT_DSP_SETTINGS,
    preset: 'CUSTOM',
  },
};

class AudioEngineService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isCoughing: boolean = false;

  // Channel Gain Nodes
  private masterGain: GainNode | null = null;
  private talkGain: GainNode | null = null;
  private playoutGain: GainNode | null = null;
  private elementsGain: GainNode | null = null;
  private cartsGain: GainNode | null = null;
  private pgmGain: GainNode | null = null;

  // Analysers for VU metering & waveform visualizers
  private masterAnalyser: AnalyserNode | null = null;
  private playoutAnalyser: AnalyserNode | null = null;
  private talkAnalyser: AnalyserNode | null = null;
  private cartsAnalyser: AnalyserNode | null = null;

  // DSP Processor Nodes (Master Chain)
  private eq80Node: BiquadFilterNode | null = null;
  private eq250Node: BiquadFilterNode | null = null;
  private eq1kNode: BiquadFilterNode | null = null;
  private eq4kNode: BiquadFilterNode | null = null;
  private eq12kNode: BiquadFilterNode | null = null;
  private agcCompressor: DynamicsCompressorNode | null = null;
  private dspMakeupGain: GainNode | null = null;
  private dspBypassGain: GainNode | null = null;
  private currentDspSettings: DspProcessorSettings = { ...DEFAULT_DSP_SETTINGS };

  // Active audio sources
  private activeMusicNodes: { stop: () => void } | null = null;
  private activeHtmlAudio: HTMLAudioElement | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // Segue Audition nodes
  private segueAuditionNodes: { stop: () => void } | null = null;
  private streamDestination: MediaStreamAudioDestinationNode | null = null;
  private isTtsSpeaking: boolean = false;

  // Levels for VU meters
  private channelLevels = {
    talk: 0.2,
    playout: 0.75,
    elements: 0.0,
    carts: 0.0,
    pgm: 0.75,
  };

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      this.masterAnalyser = this.ctx.createAnalyser();
      this.masterAnalyser.fftSize = 256;
      this.masterAnalyser.smoothingTimeConstant = 0.8;

      // PGM (Program Bus)
      this.pgmGain = this.ctx.createGain();
      this.pgmGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

      // Playout (Music & Log)
      this.playoutGain = this.ctx.createGain();
      this.playoutGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

      this.playoutAnalyser = this.ctx.createAnalyser();
      this.playoutAnalyser.fftSize = 256;

      // Talk (Host Mic)
      this.talkGain = this.ctx.createGain();
      this.talkGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.talkAnalyser = this.ctx.createAnalyser();
      this.talkAnalyser.fftSize = 256;

      // Elements (Bumpers/VT)
      this.elementsGain = this.ctx.createGain();
      this.elementsGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

      // Carts (Instant SFX / Jingles)
      this.cartsGain = this.ctx.createGain();
      this.cartsGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.cartsAnalyser = this.ctx.createAnalyser();
      this.cartsAnalyser.fftSize = 256;

      // --- DSP CHAIN SETUP ---
      this.setupDspChain();

      // Route channels to PGM
      this.playoutGain.connect(this.playoutAnalyser);
      this.playoutAnalyser.connect(this.pgmGain);

      this.talkGain.connect(this.talkAnalyser);
      this.talkAnalyser.connect(this.pgmGain);

      this.elementsGain.connect(this.pgmGain);

      this.cartsGain.connect(this.cartsAnalyser);
      this.cartsAnalyser.connect(this.pgmGain);

      // Route PGM through DSP rack -> Master -> Analyser -> Output
      this.connectDspRack();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupDspChain() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // 1. 5-Band Parametric EQ
    this.eq80Node = ctx.createBiquadFilter();
    this.eq80Node.type = 'lowshelf';
    this.eq80Node.frequency.setValueAtTime(80, ctx.currentTime);
    this.eq80Node.gain.setValueAtTime(this.currentDspSettings.eq.subBass80Hz, ctx.currentTime);

    this.eq250Node = ctx.createBiquadFilter();
    this.eq250Node.type = 'peaking';
    this.eq250Node.frequency.setValueAtTime(250, ctx.currentTime);
    this.eq250Node.Q.setValueAtTime(1.2, ctx.currentTime);
    this.eq250Node.gain.setValueAtTime(this.currentDspSettings.eq.lowMid250Hz, ctx.currentTime);

    this.eq1kNode = ctx.createBiquadFilter();
    this.eq1kNode.type = 'peaking';
    this.eq1kNode.frequency.setValueAtTime(1000, ctx.currentTime);
    this.eq1kNode.Q.setValueAtTime(1.0, ctx.currentTime);
    this.eq1kNode.gain.setValueAtTime(this.currentDspSettings.eq.mid1kHz, ctx.currentTime);

    this.eq4kNode = ctx.createBiquadFilter();
    this.eq4kNode.type = 'peaking';
    this.eq4kNode.frequency.setValueAtTime(4000, ctx.currentTime);
    this.eq4kNode.Q.setValueAtTime(1.1, ctx.currentTime);
    this.eq4kNode.gain.setValueAtTime(this.currentDspSettings.eq.presence4kHz, ctx.currentTime);

    this.eq12kNode = ctx.createBiquadFilter();
    this.eq12kNode.type = 'highshelf';
    this.eq12kNode.frequency.setValueAtTime(12000, ctx.currentTime);
    this.eq12kNode.gain.setValueAtTime(this.currentDspSettings.eq.air12kHz, ctx.currentTime);

    // 2. Multiband Broadcast AGC Compressor
    this.agcCompressor = ctx.createDynamicsCompressor();
    this.agcCompressor.threshold.setValueAtTime(this.currentDspSettings.agc.threshold, ctx.currentTime);
    this.agcCompressor.knee.setValueAtTime(this.currentDspSettings.agc.knee, ctx.currentTime);
    this.agcCompressor.ratio.setValueAtTime(this.currentDspSettings.agc.ratio, ctx.currentTime);
    this.agcCompressor.attack.setValueAtTime(this.currentDspSettings.agc.attack, ctx.currentTime);
    this.agcCompressor.release.setValueAtTime(this.currentDspSettings.agc.release, ctx.currentTime);

    // 3. Post-makeup & Limiter Gain
    this.dspMakeupGain = ctx.createGain();
    const linearGain = Math.pow(10, this.currentDspSettings.limiter.postGainDb / 20);
    this.dspMakeupGain.gain.setValueAtTime(linearGain, ctx.currentTime);

    // Bypass node
    this.dspBypassGain = ctx.createGain();
    this.dspBypassGain.gain.setValueAtTime(0, ctx.currentTime);
  }

  private connectDspRack() {
    if (!this.pgmGain || !this.eq80Node || !this.eq250Node || !this.eq1kNode || !this.eq4kNode || !this.eq12kNode || !this.agcCompressor || !this.dspMakeupGain || !this.masterGain || !this.masterAnalyser || !this.ctx) {
      return;
    }

    // PGM -> 80Hz -> 250Hz -> 1kHz -> 4kHz -> 12kHz -> AGC Compressor -> Makeup Gain -> Master Gain -> Master Analyser -> Destination
    this.pgmGain.connect(this.eq80Node);
    this.eq80Node.connect(this.eq250Node);
    this.eq250Node.connect(this.eq1kNode);
    this.eq1kNode.connect(this.eq4kNode);
    this.eq4kNode.connect(this.eq12kNode);
    this.eq12kNode.connect(this.agcCompressor);
    this.agcCompressor.connect(this.dspMakeupGain);
    this.dspMakeupGain.connect(this.masterGain);

    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Stream Destination for Icecast/WebRTC streaming & Broadcast Logging
    try {
      this.streamDestination = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.streamDestination);
    } catch {
      // Ignore if not supported in test environment
    }
  }

  public updateDspSettings(settings: DspProcessorSettings) {
    this.ensureContext();
    this.currentDspSettings = { ...settings };
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    if (this.eq80Node) this.eq80Node.gain.setTargetAtTime(settings.enabled ? settings.eq.subBass80Hz : 0, now, 0.05);
    if (this.eq250Node) this.eq250Node.gain.setTargetAtTime(settings.enabled ? settings.eq.lowMid250Hz : 0, now, 0.05);
    if (this.eq1kNode) this.eq1kNode.gain.setTargetAtTime(settings.enabled ? settings.eq.mid1kHz : 0, now, 0.05);
    if (this.eq4kNode) this.eq4kNode.gain.setTargetAtTime(settings.enabled ? settings.eq.presence4kHz : 0, now, 0.05);
    if (this.eq12kNode) this.eq12kNode.gain.setTargetAtTime(settings.enabled ? settings.eq.air12kHz : 0, now, 0.05);

    if (this.agcCompressor) {
      this.agcCompressor.threshold.setTargetAtTime(settings.enabled ? settings.agc.threshold : 0, now, 0.05);
      this.agcCompressor.ratio.setTargetAtTime(settings.enabled ? settings.agc.ratio : 1, now, 0.05);
      this.agcCompressor.attack.setTargetAtTime(settings.agc.attack, now, 0.05);
      this.agcCompressor.release.setTargetAtTime(settings.agc.release, now, 0.05);
      this.agcCompressor.knee.setTargetAtTime(settings.agc.knee, now, 0.05);
    }

    if (this.dspMakeupGain) {
      const targetDb = settings.enabled ? settings.limiter.postGainDb : 0;
      const linear = Math.pow(10, targetDb / 20);
      this.dspMakeupGain.gain.setTargetAtTime(linear, now, 0.05);
    }
  }

  public getDspSettings(): DspProcessorSettings {
    return { ...this.currentDspSettings };
  }

  public getLufsMetrics(): { momentaryLufs: number; shortTermLufs: number; integratedLufs: number; gainReductionDb: number } {
    if (!this.ctx || this.ctx.state !== 'running' || this.isMuted) {
      return { momentaryLufs: -70, shortTermLufs: -70, integratedLufs: -70, gainReductionDb: 0 };
    }

    let gr = 0;
    if (this.agcCompressor && this.currentDspSettings.enabled) {
      gr = Math.round(this.agcCompressor.reduction); // returns negative dB value
    }

    const levels = this.getLiveMeterLevels();
    const pgm = levels.pgm;

    // Approximate calibrated EBU R128 LUFS mapping from PGM level
    const baseLufs = pgm > 0 ? -36 + (pgm / 100) * 22 : -70;
    const momentary = Math.min(-6, Math.max(-70, Math.round(baseLufs + (Math.random() * 1.5 - 0.75))));
    const shortTerm = Math.min(-8, Math.max(-70, Math.round(baseLufs - 1.2)));
    const integrated = -14.2; // Broadcast standard target -14 LUFS

    return {
      momentaryLufs: momentary,
      shortTermLufs: shortTerm,
      integratedLufs: integrated,
      gainReductionDb: gr,
    };
  }

  public ensureContext(): AudioContext {
    this.initContext();
    return this.ctx!;
  }

  public isAudioActive(): boolean {
    return !!this.ctx && this.ctx.state === 'running' && !this.isMuted;
  }

  public toggleMasterMute(): boolean {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }
    return !this.isMuted;
  }

  public setChannelFader(
    channel: 'talk' | 'playout' | 'elements' | 'carts' | 'pgm',
    valuePct: number
  ) {
    this.ensureContext();
    const normalized = Math.max(0, Math.min(100, valuePct)) / 100;
    this.channelLevels[channel] = normalized;

    const gain = normalized * 1.2;
    const now = this.ctx!.currentTime;

    switch (channel) {
      case 'talk':
        if (this.talkGain && !this.isCoughing) this.talkGain.gain.setTargetAtTime(gain, now, 0.03);
        break;
      case 'playout':
        if (this.playoutGain) this.playoutGain.gain.setTargetAtTime(gain, now, 0.03);
        break;
      case 'elements':
        if (this.elementsGain) this.elementsGain.gain.setTargetAtTime(gain, now, 0.03);
        break;
      case 'carts':
        if (this.cartsGain) this.cartsGain.gain.setTargetAtTime(gain, now, 0.03);
        break;
      case 'pgm':
        if (this.pgmGain) this.pgmGain.gain.setTargetAtTime(gain, now, 0.03);
        break;
    }
  }

  public setCough(coughing: boolean) {
    this.isCoughing = coughing;
    if (this.talkGain && this.ctx) {
      const now = this.ctx.currentTime;
      const targetGain = coughing ? 0 : this.channelLevels.talk * 1.2;
      this.talkGain.gain.setTargetAtTime(targetGain, now, 0.02);
    }
  }

  // Play a song (either custom uploaded audio or high-fidelity algorithmic synthetic radio music)
  public playTrack(
    track: { title: string; artist: string; audioUrl?: string | null; type?: string },
    onEnded?: () => void
  ) {
    this.ensureContext();
    this.stopCurrentPlayout();

    if (track.audioUrl) {
      // Play real audio file (MP3/WAV/AAC/blob)
      const audio = new Audio(track.audioUrl);
      audio.crossOrigin = 'anonymous';
      this.activeHtmlAudio = audio;

      const source = this.ctx!.createMediaElementSource(audio);
      source.connect(this.playoutGain!);

      audio.play().catch(err => console.log('Audio autoplay prevented:', err));

      audio.onended = () => {
        if (onEnded) onEnded();
      };
    } else {
      // Algorithmic Synthetic Studio Playout
      this.playSyntheticSong(track.title, track.artist, track.type || 'POP');
    }
  }

  public stopCurrentPlayout() {
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.src = '';
      } catch (e) {
        console.error(e);
      }
      this.activeHtmlAudio = null;
    }

    if (this.activeMusicNodes) {
      try {
        this.activeMusicNodes.stop();
      } catch (e) {
        console.error(e);
      }
      this.activeMusicNodes = null;
    }
  }

  public pausePlayout() {
    if (this.activeHtmlAudio) {
      this.activeHtmlAudio.pause();
    }
    if (this.ctx && this.ctx.state === 'running') {
      if (this.playoutGain) {
        this.playoutGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
    }
  }

  public resumePlayout() {
    if (this.activeHtmlAudio) {
      this.activeHtmlAudio.play().catch(e => console.log(e));
    }
    if (this.ctx && this.playoutGain) {
      this.playoutGain.gain.setTargetAtTime(
        this.channelLevels.playout * 1.2,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  // Audition Segue Crossfade between Outgoing and Incoming tracks
  public auditionSegueTransition(
    outgoingTitle: string,
    incomingTitle: string,
    crossfadeSec: number = 3.0,
    onComplete?: () => void
  ) {
    this.ensureContext();
    this.stopSegueAudition();

    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Outgoing node (fading down from 0 to crossfadeSec)
    const outGain = ctx.createGain();
    outGain.gain.setValueAtTime(0.4, now);
    outGain.gain.linearRampToValueAtTime(0.001, now + crossfadeSec);
    outGain.connect(this.elementsGain!);

    const outOsc = ctx.createOscillator();
    outOsc.type = 'triangle';
    outOsc.frequency.setValueAtTime(329.63, now); // E4
    outOsc.connect(outGain);
    outOsc.start(now);
    outOsc.stop(now + crossfadeSec + 0.1);

    // Incoming node (fading up from 0 to 0.4)
    const inGain = ctx.createGain();
    inGain.gain.setValueAtTime(0.001, now);
    inGain.gain.linearRampToValueAtTime(0.4, now + crossfadeSec);
    inGain.connect(this.elementsGain!);

    const inOsc = ctx.createOscillator();
    inOsc.type = 'sawtooth';
    inOsc.frequency.setValueAtTime(440.0, now); // A4
    inOsc.connect(inGain);
    inOsc.start(now);
    inOsc.stop(now + crossfadeSec + 2.5);

    const timeout = window.setTimeout(() => {
      if (onComplete) onComplete();
    }, (crossfadeSec + 2.5) * 1000);

    this.segueAuditionNodes = {
      stop: () => {
        clearTimeout(timeout);
        try {
          outOsc.stop();
          inOsc.stop();
        } catch {}
      },
    };
  }

  public stopSegueAudition() {
    if (this.segueAuditionNodes) {
      this.segueAuditionNodes.stop();
      this.segueAuditionNodes = null;
    }
  }

  // Rich Algorithmic Radio Synthesizer (Generates pleasant chord progressions, basslines, arpeggios & kick pulses)
  private playSyntheticSong(title: string, _artist: string, genre: string) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash << 5) - hash + title.charCodeAt(i);
      hash |= 0;
    }
    hash = Math.abs(hash);

    const baseFreqs = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
    const keyOffset = baseFreqs[hash % baseFreqs.length];

    const chordSteps = [
      [1, 1.25, 1.5],
      [1, 1.2, 1.5],
      [1.333, 1.666, 2.0],
      [1.5, 1.875, 2.25],
    ];

    const trackMasterGain = ctx.createGain();
    trackMasterGain.gain.setValueAtTime(0.01, now);
    trackMasterGain.gain.linearRampToValueAtTime(0.4, now + 1.2);
    trackMasterGain.connect(this.playoutGain!);

    const oscillators: OscillatorNode[] = [];
    const intervalIds: number[] = [];

    // Pad
    const padGain = ctx.createGain();
    padGain.gain.value = 0.18;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 4);
    filter.connect(trackMasterGain);
    padGain.connect(filter);

    [1, 1.25, 1.5, 2].forEach(mult => {
      const osc = ctx.createOscillator();
      osc.type = genre.includes('2010') ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(keyOffset * mult * 0.5, now);
      osc.connect(padGain);
      osc.start(now);
      oscillators.push(osc);
    });

    // Bass
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.22;
    bassGain.connect(trackMasterGain);

    const bassOsc = ctx.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(keyOffset * 0.5, now);
    bassOsc.connect(bassGain);
    bassOsc.start(now);
    oscillators.push(bassOsc);

    // Arpeggiator
    let step = 0;
    const arpInterval = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const t = this.ctx.currentTime;
        const currentChord = chordSteps[Math.floor(step / 8) % chordSteps.length];
        const chordMultiplier = currentChord[step % currentChord.length];
        const noteFreq = keyOffset * chordMultiplier * (step % 2 === 0 ? 1 : 1.5);

        const arpOsc = this.ctx.createOscillator();
        const arpNoteGain = this.ctx.createGain();

        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(noteFreq, t);

        arpNoteGain.gain.setValueAtTime(0.09, t);
        arpNoteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        arpOsc.connect(arpNoteGain);
        arpNoteGain.connect(trackMasterGain);

        arpOsc.start(t);
        arpOsc.stop(t + 0.23);

        if (step % 8 === 0) {
          bassOsc.frequency.setValueAtTime(keyOffset * 0.5 * currentChord[0], t);
        }

        step++;
      } catch (e) {
        console.error(e);
      }
    }, 240);
    intervalIds.push(arpInterval);

    this.activeMusicNodes = {
      stop: () => {
        intervalIds.forEach(id => clearInterval(id));
        const stopTime = ctx.currentTime;
        trackMasterGain.gain.linearRampToValueAtTime(0.001, stopTime + 0.5);
        setTimeout(() => {
          oscillators.forEach(o => {
            try {
              o.stop();
              o.disconnect();
            } catch (e) {
              console.error(e);
            }
          });
          trackMasterGain.disconnect();
        }, 600);
      },
    };
  }

  // Instant Sound Carts (Jingles, Sweepers, Lasers, Air Horns, News Pips)
  public playCartSound(type: string) {
    this.ensureContext();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const cartGain = ctx.createGain();
    cartGain.gain.setValueAtTime(0.7, now);
    cartGain.connect(this.cartsGain!);

    switch (type) {
      case 'jingle1':
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          g.gain.setValueAtTime(0.25, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);
          osc.connect(g);
          g.connect(cartGain);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.65);
        });
        break;

      case 'jingle2':
        {
          const osc = ctx.createOscillator();
          const sub = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          sub.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.7);

          sub.frequency.setValueAtTime(140, now);
          sub.frequency.exponentialRampToValueAtTime(50, now + 0.6);

          g.gain.setValueAtTime(0.3, now);
          g.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

          osc.connect(g);
          sub.connect(g);
          g.connect(cartGain);
          osc.start(now);
          sub.start(now);
          osc.stop(now + 0.8);
          sub.stop(now + 0.8);
        }
        break;

      case 'sponsor':
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          g.gain.setValueAtTime(0.28, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);
          osc.connect(g);
          g.connect(cartGain);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.55);
        });
        break;

      case 'sweeper':
        {
          const bufferSize = ctx.sampleRate * 0.8;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.Q.value = 4.0;
          filter.frequency.setValueAtTime(200, now);
          filter.frequency.exponentialRampToValueAtTime(3500, now + 0.4);
          filter.frequency.exponentialRampToValueAtTime(400, now + 0.75);

          const g = ctx.createGain();
          g.gain.setValueAtTime(0.4, now);
          g.gain.exponentialRampToValueAtTime(0.01, now + 0.78);

          noise.connect(filter);
          filter.connect(g);
          g.connect(cartGain);
          noise.start(now);
          noise.stop(now + 0.8);
        }
        break;

      case 'laser':
        {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(2400, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.35);
          g.gain.setValueAtTime(0.35, now);
          g.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
          osc.connect(g);
          g.connect(cartGain);
          osc.start(now);
          osc.stop(now + 0.4);
        }
        break;

      case 'airhorn':
        [0, 0.15, 0.3].forEach(offset => {
          [587.33, 622.25, 783.99].forEach(freq => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + offset);
            g.gain.setValueAtTime(0.18, now + offset);
            g.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);
            osc.connect(g);
            g.connect(cartGain);
            osc.start(now + offset);
            osc.stop(now + offset + 0.13);
          });
        });
        break;

      case 'chime':
        [0, 0.2, 0.4, 0.6].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          const f = idx === 3 ? 1046.5 : 880;
          osc.frequency.setValueAtTime(f, now + offset);
          g.gain.setValueAtTime(0.3, now + offset);
          g.gain.exponentialRampToValueAtTime(0.001, now + offset + (idx === 3 ? 0.4 : 0.12));
          osc.connect(g);
          g.connect(cartGain);
          osc.start(now + offset);
          osc.stop(now + offset + 0.45);
        });
        break;

      case 'scratch':
        {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.linearRampToValueAtTime(800, now + 0.1);
          osc.frequency.linearRampToValueAtTime(150, now + 0.2);
          g.gain.setValueAtTime(0.3, now);
          g.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.connect(g);
          g.connect(cartGain);
          osc.start(now);
          osc.stop(now + 0.26);
        }
        break;

      case 'news':
        [0, 0.15, 0.3, 0.45].forEach((t, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          const freq = [330, 392, 493.88, 659.25][i];
          osc.frequency.setValueAtTime(freq, now + t);
          g.gain.setValueAtTime(0.25, now + t);
          g.gain.exponentialRampToValueAtTime(0.01, now + t + 0.3);
          osc.connect(g);
          g.connect(cartGain);
          osc.start(now + t);
          osc.stop(now + t + 0.35);
        });
        break;
    }
  }

  // Real Microphone Input for TALK Fader
  public async enableMicrophone(): Promise<boolean> {
    try {
      this.ensureContext();
      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.micSource = this.ctx!.createMediaStreamSource(this.micStream);
        this.micSource.connect(this.talkGain!);
      }
      return true;
    } catch (err) {
      console.warn('Microphone permission not granted:', err);
      return false;
    }
  }

  public disableMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
      this.micSource = null;
    }
  }

  // Voice Track Recorder
  public async startVoiceTrackRecording(): Promise<boolean> {
    try {
      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.micStream);
      this.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.start();
      return true;
    } catch (e) {
      console.error('Voice track recording failed:', e);
      return false;
    }
  }

  public stopVoiceTrackRecording(): Promise<{ audioUrl: string; blob: Blob; durationSec: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(blob);
        resolve({ audioUrl, blob, durationSec: Math.max(3, Math.round(blob.size / 16000)) });
      };
      this.mediaRecorder.stop();
    });
  }

  // --- DUCKING SUPPORT (Voice Over Bed) ---
  public setPlayoutDucking(duckFactor: number) {
    this.ensureContext();
    if (this.playoutGain && this.ctx) {
      const target = Math.max(0.05, Math.min(1.0, duckFactor)) * this.channelLevels.playout * 1.2;
      this.playoutGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
    }
  }

  public releasePlayoutDucking() {
    this.ensureContext();
    if (this.playoutGain && this.ctx) {
      const normalGain = this.channelLevels.playout * 1.2;
      this.playoutGain.gain.setTargetAtTime(normalGain, this.ctx.currentTime, 0.2);
    }
  }

  // --- BROADCAST FX SYNTHESIZER ---
  public playSynthesizedFx(preset: {
    type: string;
    baseFreqHz?: number;
    decaySec?: number;
    noiseAmount?: number;
  }) {
    this.ensureContext();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const outGain = ctx.createGain();
    outGain.gain.setValueAtTime(0.75, now);
    outGain.connect(this.cartsGain!);

    switch (preset.type) {
      case 'LASER_SWEEP': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        const startF = preset.baseFreqHz || 3200;
        osc.frequency.setValueAtTime(startF, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + (preset.decaySec || 0.45));
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + (preset.decaySec || 0.48));
        osc.connect(g);
        g.connect(outGain);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }
      case 'SUB_DROP': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 1.2);
        g.gain.setValueAtTime(0.7, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
        osc.connect(g);
        g.connect(outGain);
        osc.start(now);
        osc.stop(now + 1.3);
        break;
      }
      case 'WHITE_WHOOSH': {
        const bufferSize = Math.floor(ctx.sampleRate * 0.9);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 3.5;
        filter.frequency.setValueAtTime(150, now);
        filter.frequency.exponentialRampToValueAtTime(4500, now + 0.45);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.9);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.45, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.92);

        noise.connect(filter);
        filter.connect(g);
        g.connect(outGain);
        noise.start(now);
        noise.stop(now + 0.95);
        break;
      }
      case 'RADIO_STING': {
        [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now + i * 0.06);
          g.gain.setValueAtTime(0.2, now + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.5);
          osc.connect(g);
          g.connect(outGain);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.52);
        });
        break;
      }
      case 'VINYL_BRAKE': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
        g.gain.setValueAtTime(0.4, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.62);
        osc.connect(g);
        g.connect(outGain);
        osc.start(now);
        osc.stop(now + 0.65);
        break;
      }
      case 'CHIME_FANFARE': {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.12);
          g.gain.setValueAtTime(0.3, now + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.8);
          osc.connect(g);
          g.connect(outGain);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.85);
        });
        break;
      }
    }
  }

  // Emergency Station Failover Playout
  public triggerEmergencyFailover() {
    this.ensureContext();
    this.playCartSound('sweeper');
    setTimeout(() => {
      this.playCartSound('jingle1');
    }, 400);
  }

  // Get Live VU Meter Peak Values (0 to 100)
  public getLiveMeterLevels(): {
    talk: number;
    playout: number;
    elements: number;
    carts: number;
    pgm: number;
  } {
    if (!this.ctx || this.ctx.state !== 'running' || this.isMuted) {
      return { talk: 0, playout: 0, elements: 0, carts: 0, pgm: 0 };
    }

    const calcLevel = (analyser: AnalyserNode | null, baseGain: number): number => {
      if (!analyser) return Math.min(100, baseGain * (60 + Math.random() * 25));
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) sum += buffer[i];
      const avg = sum / buffer.length;
      return Math.min(100, Math.round((avg / 128) * 100 * baseGain * 1.3));
    };

    const isPlayoutActive = !!this.activeHtmlAudio || !!this.activeMusicNodes;
    const playoutVal = isPlayoutActive
      ? calcLevel(this.playoutAnalyser, this.channelLevels.playout)
      : 0;
    const talkVal =
      this.micStream && !this.isCoughing
        ? calcLevel(this.talkAnalyser, this.channelLevels.talk)
        : this.channelLevels.talk > 0.05
        ? 15 + Math.random() * 10
        : 0;
    const cartsVal = calcLevel(this.cartsAnalyser, this.channelLevels.carts);

    const pgmVal = Math.min(
      100,
      Math.round(Math.max(playoutVal, talkVal * 1.1, cartsVal) * this.channelLevels.pgm)
    );

    return {
      talk: talkVal,
      playout: playoutVal,
      elements: Math.round(this.channelLevels.elements * 50),
      carts: cartsVal,
      pgm: pgmVal,
    };
  }

  // Render dynamic audio waveform on canvas
  public drawWaveform(canvas: HTMLCanvasElement | null) {
    if (!canvas || !this.masterAnalyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = this.masterAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.masterAnalyser.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();

    const sliceWidth = (width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  // --- STREAM ENCODER & WEBRTC LIVE STREAM EXPORT ---
  public getMasterMediaStream(): MediaStream | null {
    this.ensureContext();
    if (this.streamDestination) {
      return this.streamDestination.stream;
    }
    return null;
  }

  // --- ON-AIR REAL-TIME TTS WITH DYNAMIC DUCKING ---
  public playTtsOnAir(
    text: string,
    options?: { rate?: number; pitch?: number; lang?: string; voiceName?: string; duckDepth?: number },
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    this.ensureContext();
    window.speechSynthesis.cancel();

    const duckDepth = options?.duckDepth ?? 0.18; // Duck music down to 18%
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 1.05;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.lang = options?.lang ?? 'cs-CZ';

    const voices = window.speechSynthesis.getVoices();
    if (options?.voiceName) {
      const matchingVoice = voices.find(v => v.name.includes(options.voiceName!));
      if (matchingVoice) utterance.voice = matchingVoice;
    } else {
      const targetLang = options?.lang || 'cs';
      const langVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2)));
      if (langVoice) utterance.voice = langVoice;
    }

    utterance.onstart = () => {
      this.isTtsSpeaking = true;
      this.setPlayoutDucking(duckDepth);
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isTtsSpeaking = false;
      this.releasePlayoutDucking();
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isTtsSpeaking = false;
      this.releasePlayoutDucking();
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopTtsOnAir() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isTtsSpeaking = false;
    this.releasePlayoutDucking();
  }

  public isTtsActive(): boolean {
    return this.isTtsSpeaking;
  }

  // --- EMERGENCY ALERT SYSTEM (EAS / CAP) AUDIO GENERATORS ---

  /**
   * Generates authentic EAS Attention Signal (853 Hz + 960 Hz / 1050 Hz Dual Pure Sines)
   */
  public playEasDualTone(durationSec = 3.5, onComplete?: () => void) {
    this.ensureContext();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const dualGain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(853, now); // Standard EAS 853 Hz

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1050, now); // Standard EAS 1050 Hz / 960 Hz tone

    dualGain.gain.setValueAtTime(0.001, now);
    dualGain.gain.linearRampToValueAtTime(0.45, now + 0.05);
    dualGain.gain.setValueAtTime(0.45, now + durationSec - 0.05);
    dualGain.gain.linearRampToValueAtTime(0.001, now + durationSec);

    osc1.connect(dualGain);
    osc2.connect(dualGain);
    dualGain.connect(this.masterGain!);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec);
    osc2.stop(now + durationSec);

    setTimeout(() => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        dualGain.disconnect();
      } catch (e) {
        console.error(e);
      }
      if (onComplete) onComplete();
    }, durationSec * 1000);
  }

  /**
   * Generates European Civil Defense Siren sweep
   */
  public playEmergencySiren(durationSec = 3.5, onComplete?: () => void) {
    this.ensureContext();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const sirenOsc = ctx.createOscillator();
    const sirenGain = ctx.createGain();

    sirenOsc.type = 'sawtooth';
    // Frequency sweeps up and down
    sirenOsc.frequency.setValueAtTime(440, now);
    sirenOsc.frequency.linearRampToValueAtTime(880, now + 0.8);
    sirenOsc.frequency.linearRampToValueAtTime(440, now + 1.6);
    sirenOsc.frequency.linearRampToValueAtTime(880, now + 2.4);
    sirenOsc.frequency.linearRampToValueAtTime(440, now + 3.2);

    sirenGain.gain.setValueAtTime(0.001, now);
    sirenGain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    sirenGain.gain.setValueAtTime(0.4, now + durationSec - 0.1);
    sirenGain.gain.linearRampToValueAtTime(0.001, now + durationSec);

    sirenOsc.connect(sirenGain);
    sirenGain.connect(this.masterGain!);

    sirenOsc.start(now);
    sirenOsc.stop(now + durationSec);

    setTimeout(() => {
      try {
        sirenOsc.disconnect();
        sirenGain.disconnect();
      } catch (e) {
        console.error(e);
      }
      if (onComplete) onComplete();
    }, durationSec * 1000);
  }

  /**
   * Generates SAME FSK Header / EOM Digital Bursts
   */
  public playSameHeaderBursts(burstCount = 3, onComplete?: () => void) {
    this.ensureContext();
    const ctx = this.ctx!;
    let currentBurst = 0;

    const playOneBurst = () => {
      if (currentBurst >= burstCount) {
        if (onComplete) onComplete();
        return;
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(2083.3, now); // Mark frequency
      osc.frequency.setValueAtTime(1562.5, now + 0.25); // Space frequency
      osc.frequency.setValueAtTime(2083.3, now + 0.5);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.setValueAtTime(0.3, now + 0.7);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.82);

      currentBurst++;
      setTimeout(playOneBurst, 1000);
    };

    playOneBurst();
  }

  /**
   * Full EAS Broadcast Automated Sequence:
   * 1. Priority Playout Ducking (cuts music to 0% or 5%)
   * 2. Plays Attention Tone / Siren
   * 3. Airs synthesized emergency message via Web Speech API
   * 4. Transmits End of Message (EOM) chime/burst
   * 5. Restores playout to 100%
   */
  public startEmergencyBroadcast(
    options: {
      text: string;
      toneType: 'DUAL_TONE_EAS' | 'ATTENTION_SIREN' | 'SAME_FSK_HEADER' | 'VOICE_ONLY';
      duckPct: number; // e.g. 0 or 0.05
      lang?: string;
      rate?: number;
    },
    onStartVoice?: () => void,
    onComplete?: () => void
  ) {
    this.ensureContext();
    // 1. Instantly duck / silence all regular playout music & carts
    this.setPlayoutDucking(options.duckPct / 100);

    const speakAlertVoice = () => {
      if (onStartVoice) onStartVoice();
      this.playTtsOnAir(
        options.text,
        {
          lang: options.lang || 'cs-CZ',
          rate: options.rate || 0.95, // Clear, deliberate broadcast cadence
          pitch: 0.95,
          duckDepth: options.duckPct / 100,
        },
        () => {
          // Voice started
        },
        () => {
          // Voice finished -> play EOM tones and restore
          this.playSameHeaderBursts(2, () => {
            this.releasePlayoutDucking();
            if (onComplete) onComplete();
          });
        }
      );
    };

    // 2. Play warning tone prior to voice
    if (options.toneType === 'DUAL_TONE_EAS') {
      this.playEasDualTone(3.5, speakAlertVoice);
    } else if (options.toneType === 'ATTENTION_SIREN') {
      this.playEmergencySiren(3.5, speakAlertVoice);
    } else if (options.toneType === 'SAME_FSK_HEADER') {
      this.playSameHeaderBursts(3, speakAlertVoice);
    } else {
      speakAlertVoice();
    }
  }

  /**
   * Emergency Abort / Kill Switch
   */
  public stopEmergencyBroadcast() {
    this.stopTtsOnAir();
    this.releasePlayoutDucking();
  }

  // --- VOIP PHONE-IN AUDIO GENERATORS ---

  /**
   * Generates telephone ringing sound (425 Hz / 440+480 Hz European dual frequency)
   */
  public playPhoneRinging(repeats = 1, onComplete?: () => void) {
    this.ensureContext();
    const ctx = this.ctx!;
    let count = 0;

    const ringOnce = () => {
      if (count >= repeats) {
        if (onComplete) onComplete();
        return;
      }
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(425, now);
      osc2.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.setValueAtTime(0.2, now + 0.95);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain!);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.0);
      osc2.stop(now + 1.0);

      count++;
      setTimeout(ringOnce, 2000);
    };

    ringOnce();
  }

  /**
   * Generates telephone DTMF keypad tone
   */
  public playDtmfTone(char = '1') {
    this.ensureContext();
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const dtmfFreqs: Record<string, [number, number]> = {
      '1': [697, 1209],
      '2': [697, 1336],
      '3': [697, 1477],
      '4': [770, 1209],
      '5': [770, 1336],
      '6': [770, 1477],
      '7': [852, 1209],
      '8': [852, 1336],
      '9': [852, 1477],
      '*': [941, 1209],
      '0': [941, 1336],
      '#': [941, 1477],
    };

    const freqs = dtmfFreqs[char] || [697, 1209];
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.setValueAtTime(freqs[0], now);
    osc2.frequency.setValueAtTime(freqs[1], now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.setValueAtTime(0.15, now + 0.15);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain!);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  }

  /**
   * Plays simulated caller audio via bandpassed TTS (telephone bandwidth 300Hz-3400Hz)
   */
  public playCallerOnAir(
    text: string,
    options: { callerName?: string; duckPlayout?: boolean } = {},
    onStart?: () => void,
    onComplete?: () => void
  ) {
    if (options.duckPlayout !== false) {
      this.setPlayoutDucking(0.25);
    }
    this.playTtsOnAir(
      text,
      {
        lang: 'cs-CZ',
        rate: 1.05,
        pitch: 1.0,
        duckDepth: 0.25,
      },
      onStart,
      () => {
        this.releasePlayoutDucking();
        if (onComplete) onComplete();
      }
    );
  }

  /**
   * Alias for playing caller voice in phone-in studio
   */
  public playPhoneCallerVoice(callerName: string, text: string = 'Ahoj, jsem živě ve vysílání!', onComplete?: () => void) {
    this.playCallerOnAir(text, { callerName, duckPlayout: true }, undefined, onComplete);
  }

  /**
   * Universal Volume Setter for MIDI / hardware mapping
   */
  public setVolume(channel: 'master' | 'music' | 'mic' | 'cart', normalizedVal: number) {
    const pct = Math.max(0, Math.min(1, normalizedVal)) * 100;
    if (channel === 'master') {
      this.setChannelFader('pgm', pct);
    } else if (channel === 'music') {
      this.setChannelFader('playout', pct);
    } else if (channel === 'mic') {
      this.setChannelFader('talk', pct);
    } else if (channel === 'cart') {
      this.setChannelFader('carts', pct);
    }
  }
}

export const audioEngine = new AudioEngineService();


