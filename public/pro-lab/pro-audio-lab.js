(function () {
  'use strict';
  const OVXPRO_VERSION = '1.0.0-alpha.5';
  const OVXPRO_STORE = 'openvox.prolab.settings.v1';
  const OVXPRO_PRESETS = 'openvox.prolab.presets.v1';
  const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const DEFAULTS = {
    language: 'en',
    inputDeviceId: '',
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
    sampleRate: 48000,
    latencyHint: 'interactive',
    preGain: 0,
    highpassEnabled: true,
    highpassFrequency: 70,
    highpassQ: 0.707,
    lowpassEnabled: true,
    lowpassFrequency: 16000,
    lowpassQ: 0.707,
    notchEnabled: false,
    notchFrequency: 50,
    notchQ: 18,
    gateEnabled: true,
    gateThreshold: -52,
    gateAttack: 0.008,
    gateRelease: 0.18,
    gateHold: 0.045,
    gateRange: -72,
    compressorEnabled: true,
    compressorThreshold: -20,
    compressorKnee: 18,
    compressorRatio: 3,
    compressorAttack: 0.008,
    compressorRelease: 0.18,
    eqEnabled: true,
    lowShelfFrequency: 140,
    lowShelfGain: 0,
    presenceFrequency: 3200,
    presenceQ: 1,
    presenceGain: 0,
    airFrequency: 10000,
    airGain: 0,
    reverbEnabled: false,
    reverbMix: 0.08,
    reverbSeconds: 1.4,
    reverbDecay: 2.4,
    delayEnabled: false,
    delayTime: 0.18,
    delayFeedback: 0.18,
    delayMix: 0.08,
    limiterEnabled: true,
    limiterThreshold: -1,
    limiterRelease: 0.08,
    postGain: 0,
    monitor: false,
    monitorGain: -18,
    fftSize: 8192,
    smoothing: 0.72,
    minDecibels: -100,
    maxDecibels: -10,
    windowType: 'hann',
    referenceA4: 440,
    tunerMinHz: 65,
    tunerMaxHz: 1400,
    yinThreshold: 0.12,
    metronomeBpm: 90,
    metronomeBeats: 4,
    metronomeSubdivision: 1,
    metronomeSwing: 0,
    metronomeVolume: -12,
    metronomeAccent: true,
    toneWave: 'sine',
    toneFrequency: 440,
    toneVolume: -24,
    toneCents: 0,
    droneRoot: 48,
    droneShape: '1,5,8',
    droneVolume: -28,
    recordingBitrate: 192000,
    recordingMime: 'auto',
    spectrogramSpeed: 2,
    visualizerFps: 45
  };
  const I18N = {
    en: {
      title: 'Pro Audio Lab',
      subtitle: 'Advanced local audio tools',
      input: 'Input',
      dsp: 'DSP',
      instruments: 'Instruments',
      visual: 'Visualizers',
      offline: 'File Analyzer',
      presets: 'Presets',
      diagnostics: 'Diagnostics',
      start: 'Start microphone',
      stop: 'Stop microphone',
      record: 'Record processed',
      stopRecord: 'Stop recording',
      refresh: 'Refresh devices',
      device: 'Input device',
      constraints: 'Browser processing',
      echo: 'Echo cancellation',
      noise: 'Noise suppression',
      agc: 'Auto gain control',
      sampleRate: 'Requested sample rate',
      channels: 'Channels',
      latency: 'Latency hint',
      signal: 'Signal chain',
      gain: 'Pre gain',
      highpass: 'High-pass filter',
      lowpass: 'Low-pass filter',
      notch: 'Notch filter',
      gate: 'Noise gate',
      compressor: 'Compressor',
      equalizer: 'Tone shaping EQ',
      reverb: 'Reverb',
      delay: 'Delay',
      limiter: 'Safety limiter',
      postGain: 'Post gain',
      monitor: 'Input monitor',
      spectrum: 'Spectrum',
      scope: 'Oscilloscope',
      spectrogram: 'Spectrogram',
      tuner: 'Precision tuner',
      metronome: 'Metronome',
      tone: 'Tone generator',
      drone: 'Drone / chord',
      keyboard: 'Reference keyboard',
      bpm: 'Tempo',
      beats: 'Beats per bar',
      subdivision: 'Subdivision',
      swing: 'Swing',
      volume: 'Volume',
      wave: 'Waveform',
      frequency: 'Frequency',
      cents: 'Fine tune',
      root: 'Root MIDI',
      shape: 'Intervals',
      play: 'Play',
      pause: 'Stop',
      analyze: 'Analyze audio file',
      chooseFile: 'Choose audio file',
      savePreset: 'Save current preset',
      exportPreset: 'Export settings',
      importPreset: 'Import settings',
      reset: 'Reset',
      close: 'Close',
      statusIdle: 'Idle',
      statusLive: 'Microphone active',
      unsupported: 'Not supported',
      supported: 'Supported',
      copy: 'Copy report',
      download: 'Download',
      peak: 'Peak',
      rms: 'RMS',
      centroid: 'Spectral centroid',
      rolloff: '85% rolloff',
      flatness: 'Spectral flatness',
      dominants: 'Dominant frequencies',
      duration: 'Duration',
      sampleRateDetected: 'Sample rate',
      channelsDetected: 'Channels',
      settings: 'Instrument settings'
    },
    uk: {
      title: 'Pro Audio Lab',
      subtitle: 'Розширені локальні аудіоінструменти',
      input: 'Вхід',
      dsp: 'DSP',
      instruments: 'Інструменти',
      visual: 'Візуалізація',
      offline: 'Аналіз файлу',
      presets: 'Пресети',
      diagnostics: 'Діагностика',
      start: 'Увімкнути мікрофон',
      stop: 'Вимкнути мікрофон',
      record: 'Записати оброблений звук',
      stopRecord: 'Зупинити запис',
      refresh: 'Оновити пристрої',
      device: 'Вхідний пристрій',
      constraints: 'Обробка браузером',
      echo: 'Ехоподавлення',
      noise: 'Шумоподавлення',
      agc: 'Автопідсилення',
      sampleRate: 'Бажана частота дискретизації',
      channels: 'Канали',
      latency: 'Режим затримки',
      signal: 'Ланцюг сигналу',
      gain: 'Вхідне підсилення',
      highpass: 'Фільтр високих частот',
      lowpass: 'Фільтр низьких частот',
      notch: 'Режекторний фільтр',
      gate: 'Шумовий гейт',
      compressor: 'Компресор',
      equalizer: 'Еквалізація тону',
      reverb: 'Реверберація',
      delay: 'Затримка',
      limiter: 'Захисний лімітер',
      postGain: 'Вихідне підсилення',
      monitor: 'Моніторинг входу',
      spectrum: 'Спектр',
      scope: 'Осцилограф',
      spectrogram: 'Спектрограма',
      tuner: 'Точний тюнер',
      metronome: 'Метроном',
      tone: 'Генератор тону',
      drone: 'Дрон / акорд',
      keyboard: 'Еталонна клавіатура',
      bpm: 'Темп',
      beats: 'Долей у такті',
      subdivision: 'Поділ долі',
      swing: 'Свінг',
      volume: 'Гучність',
      wave: 'Форма хвилі',
      frequency: 'Частота',
      cents: 'Точне налаштування',
      root: 'Коренева MIDI-нота',
      shape: 'Інтервали',
      play: 'Запустити',
      pause: 'Зупинити',
      analyze: 'Проаналізувати аудіофайл',
      chooseFile: 'Вибрати аудіофайл',
      savePreset: 'Зберегти поточний пресет',
      exportPreset: 'Експортувати налаштування',
      importPreset: 'Імпортувати налаштування',
      reset: 'Скинути',
      close: 'Закрити',
      statusIdle: 'Очікування',
      statusLive: 'Мікрофон активний',
      unsupported: 'Не підтримується',
      supported: 'Підтримується',
      copy: 'Копіювати звіт',
      download: 'Завантажити',
      peak: 'Пік',
      rms: 'RMS',
      centroid: 'Спектральний центроїд',
      rolloff: '85% спад',
      flatness: 'Спектральна пласкість',
      dominants: 'Домінантні частоти',
      duration: 'Тривалість',
      sampleRateDetected: 'Частота дискретизації',
      channelsDetected: 'Канали',
      settings: 'Налаштування інструментів'
    },
    de: {
      title: 'Pro Audio Lab',
      subtitle: 'Erweiterte lokale Audiowerkzeuge',
      input: 'Eingang',
      dsp: 'DSP',
      instruments: 'Instrumente',
      visual: 'Visualisierung',
      offline: 'Dateianalyse',
      presets: 'Presets',
      diagnostics: 'Diagnose',
      start: 'Mikrofon starten',
      stop: 'Mikrofon stoppen',
      record: 'Verarbeitet aufnehmen',
      stopRecord: 'Aufnahme stoppen',
      refresh: 'Geräte aktualisieren',
      device: 'Eingabegerät',
      constraints: 'Browser-Verarbeitung',
      echo: 'Echounterdrückung',
      noise: 'Rauschunterdrückung',
      agc: 'Automatische Verstärkung',
      sampleRate: 'Gewünschte Abtastrate',
      channels: 'Kanäle',
      latency: 'Latenzmodus',
      signal: 'Signalkette',
      gain: 'Vorverstärkung',
      highpass: 'Hochpassfilter',
      lowpass: 'Tiefpassfilter',
      notch: 'Kerbfilter',
      gate: 'Noise Gate',
      compressor: 'Kompressor',
      equalizer: 'Klang-EQ',
      reverb: 'Hall',
      delay: 'Delay',
      limiter: 'Schutz-Limiter',
      postGain: 'Nachverstärkung',
      monitor: 'Eingangsmonitor',
      spectrum: 'Spektrum',
      scope: 'Oszilloskop',
      spectrogram: 'Spektrogramm',
      tuner: 'Präzisionstuner',
      metronome: 'Metronom',
      tone: 'Tongenerator',
      drone: 'Drone / Akkord',
      keyboard: 'Referenztastatur',
      bpm: 'Tempo',
      beats: 'Schläge pro Takt',
      subdivision: 'Unterteilung',
      swing: 'Swing',
      volume: 'Lautstärke',
      wave: 'Wellenform',
      frequency: 'Frequenz',
      cents: 'Feinstimmung',
      root: 'Grundton MIDI',
      shape: 'Intervalle',
      play: 'Start',
      pause: 'Stopp',
      analyze: 'Audiodatei analysieren',
      chooseFile: 'Audiodatei wählen',
      savePreset: 'Aktuelles Preset speichern',
      exportPreset: 'Einstellungen exportieren',
      importPreset: 'Einstellungen importieren',
      reset: 'Zurücksetzen',
      close: 'Schließen',
      statusIdle: 'Bereit',
      statusLive: 'Mikrofon aktiv',
      unsupported: 'Nicht unterstützt',
      supported: 'Unterstützt',
      copy: 'Bericht kopieren',
      download: 'Herunterladen',
      peak: 'Peak',
      rms: 'RMS',
      centroid: 'Spektraler Schwerpunkt',
      rolloff: '85% Rolloff',
      flatness: 'Spektrale Flachheit',
      dominants: 'Dominante Frequenzen',
      duration: 'Dauer',
      sampleRateDetected: 'Abtastrate',
      channelsDetected: 'Kanäle',
      settings: 'Instrumenteinstellungen'
    }
  };
  const BUILTIN_PRESETS = {
    'Clean Vocal': {
      highpassEnabled: true,
      highpassFrequency: 75,
      lowpassEnabled: true,
      lowpassFrequency: 16500,
      notchEnabled: false,
      gateEnabled: true,
      gateThreshold: -55,
      gateAttack: 0.006,
      gateRelease: 0.16,
      compressorEnabled: true,
      compressorThreshold: -22,
      compressorRatio: 2.6,
      compressorKnee: 20,
      lowShelfGain: -1,
      presenceGain: 1.5,
      airGain: 1,
      limiterEnabled: true,
      postGain: 1
    },
    'Polished Vocal': {
      highpassEnabled: true,
      highpassFrequency: 80,
      lowpassEnabled: true,
      lowpassFrequency: 18000,
      gateEnabled: true,
      gateThreshold: -58,
      compressorEnabled: true,
      compressorThreshold: -24,
      compressorRatio: 3,
      lowShelfGain: -1.5,
      presenceGain: 2,
      airGain: 2.5,
      reverbEnabled: true,
      reverbMix: 0.07,
      reverbSeconds: 1.25,
      reverbDecay: 2.6,
      limiterEnabled: true,
      limiterThreshold: -1
    },
    'Noisy Room': {
      highpassEnabled: true,
      highpassFrequency: 95,
      lowpassEnabled: true,
      lowpassFrequency: 12500,
      notchEnabled: true,
      notchFrequency: 50,
      notchQ: 22,
      gateEnabled: true,
      gateThreshold: -43,
      gateAttack: 0.004,
      gateRelease: 0.12,
      gateRange: -78,
      compressorEnabled: true,
      compressorThreshold: -24,
      compressorRatio: 3.8
    },
    'Choir Rehearsal': {
      highpassEnabled: true,
      highpassFrequency: 60,
      lowpassEnabled: true,
      lowpassFrequency: 17500,
      gateEnabled: true,
      gateThreshold: -60,
      gateRelease: 0.24,
      compressorEnabled: true,
      compressorThreshold: -18,
      compressorRatio: 2,
      presenceGain: 1,
      airGain: 1.5,
      reverbEnabled: true,
      reverbMix: 0.1,
      reverbSeconds: 1.8,
      reverbDecay: 2.8,
      limiterEnabled: true,
      fftSize: 16384,
      smoothing: 0.82
    },
    'Low Voice': {
      highpassEnabled: true,
      highpassFrequency: 45,
      lowpassEnabled: true,
      lowpassFrequency: 12000,
      gateThreshold: -58,
      compressorThreshold: -24,
      compressorRatio: 2.5,
      tunerMinHz: 45,
      tunerMaxHz: 700
    },
    'Bright Soprano': {
      highpassEnabled: true,
      highpassFrequency: 110,
      lowpassEnabled: true,
      lowpassFrequency: 19000,
      gateThreshold: -58,
      compressorThreshold: -20,
      compressorRatio: 2.2,
      tunerMinHz: 120,
      tunerMaxHz: 1800
    },
    'Raw Measurement': {
      highpassEnabled: false,
      lowpassEnabled: false,
      notchEnabled: false,
      gateEnabled: false,
      compressorEnabled: false,
      preGain: 0,
      postGain: 0,
      smoothing: 0.2,
      fftSize: 16384
    },
    'Speech Monitor': {
      highpassEnabled: true,
      highpassFrequency: 85,
      lowpassEnabled: true,
      lowpassFrequency: 11000,
      gateEnabled: true,
      gateThreshold: -50,
      compressorEnabled: true,
      compressorThreshold: -26,
      compressorRatio: 4,
      monitorGain: -22
    }
  };
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }
  function gainToDb(v) {
    return v <= 0 ? -120 : 20 * Math.log10(v);
  }
  function midiToFrequency(m, a4 = 440) {
    return a4 * Math.pow(2, (m - 69) / 12);
  }
  function frequencyToMidi(f, a4 = 440) {
    return 69 + 12 * Math.log2(f / a4);
  }
  function noteLabel(m) {
    const n = Math.round(m);
    return NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
  }
  function formatHz(v) {
    return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 1 : 2) + ' kHz' : v.toFixed(v < 100 ? 1 : 0) + ' Hz';
  }
  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  function notifySupportOpportunity() {
    try {
      window.dispatchEvent(new CustomEvent('openvox:support-opportunity'));
    } catch {}
  }
  function saveBlob(blob, name) {
    if (location.protocol === 'file:') {
      const r = new FileReader();
      r.onload = () => {
        const a = document.createElement('a');
        a.href = String(r.result || '');
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        notifySupportOpportunity();
      };
      r.readAsDataURL(blob);
      return;
    }
    const u = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    notifySupportOpportunity();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  function deepMerge(base, extra) {
    const out = { ...base };
    if (extra && typeof extra === 'object') for (const k of Object.keys(extra)) if (k in out) out[k] = extra[k];
    return out;
  }
  function loadJSON(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  }
  function downloadJSON(value, name) {
    saveBlob(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }), name);
  }
  class EventBus {
    constructor() {
      this.map = new Map();
    }
    on(name, fn) {
      if (!this.map.has(name)) this.map.set(name, new Set());
      this.map.get(name).add(fn);
      return () => this.map.get(name)?.delete(fn);
    }
    emit(name, data) {
      this.map.get(name)?.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }
  class ProAudioEngine {
    constructor(settings, bus) {
      this.s = settings;
      this.bus = bus;
      this.ctx = null;
      this.stream = null;
      this.source = null;
      this.nodes = {};
      this.analyser = null;
      this.recDest = null;
      this.recorder = null;
      this.recordChunks = [];
      this.loop = 0;
      this.gateUrl = '';
      this.localGate = false;
      this.reverbSignature = '';
      this.pitch = { frequency: 0, note: '—', cents: 0, confidence: 0 };
    }
    async devices() {
      if (!navigator.mediaDevices?.enumerateDevices) return [];
      return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
    }
    async createGate() {
      this.localGate =
        location.protocol === 'file:' ||
        new URLSearchParams(location.search).has('localAudioFallback') ||
        !this.ctx?.audioWorklet ||
        typeof AudioWorkletNode === 'undefined';
      if (this.localGate) return;
      const code = `class OpenVoxProGate extends AudioWorkletProcessor{constructor(){super();this.threshold=.0025;this.attack=.008;this.release=.18;this.hold=.045;this.range=.00025;this.env=0;this.gain=1;this.holdFrames=0;this.enabled=true;this.port.onmessage=e=>Object.assign(this,e.data||{})}process(inputs,outputs){const input=inputs[0],output=outputs[0];if(!input||!input[0]||!output||!output[0])return true;const channels=Math.min(input.length,output.length);const frames=input[0].length;for(let i=0;i<frames;i++){let a=0;for(let c=0;c<channels;c++)a=Math.max(a,Math.abs(input[c][i]||0));this.env=.985*this.env+.015*a;const open=!this.enabled||this.env>=this.threshold;if(open)this.holdFrames=Math.floor(this.hold*sampleRate);else if(this.holdFrames>0)this.holdFrames--;const target=open||this.holdFrames>0?1:this.range;const time=target>this.gain?this.attack:this.release;const coef=Math.exp(-1/Math.max(1,time*sampleRate));this.gain=target+(this.gain-target)*coef;for(let c=0;c<channels;c++)output[c][i]=(input[c][i]||0)*this.gain}return true}}registerProcessor('openvox-pro-gate',OpenVoxProGate);`;
      this.gateUrl = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
      await this.ctx.audioWorklet.addModule(this.gateUrl);
    }
    async start() {
      await this.stop();
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('getUserMedia unavailable');
      const s = this.s;
      const supported = navigator.mediaDevices.getSupportedConstraints?.() || {};
      const audio = {
        deviceId: s.inputDeviceId ? { exact: s.inputDeviceId } : undefined,
        channelCount: { ideal: Number(s.channelCount) || 1 },
        sampleRate: { ideal: Number(s.sampleRate) || 48000 },
        echoCancellation: supported.echoCancellation ? !!s.echoCancellation : undefined,
        noiseSuppression: supported.noiseSuppression ? !!s.noiseSuppression : undefined,
        autoGainControl: supported.autoGainControl ? !!s.autoGainControl : undefined
      };
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video: false
      });
      this.ctx = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: s.latencyHint || 'interactive',
        sampleRate: Number(s.sampleRate) || undefined
      });
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      await this.createGate();
      this.source = this.ctx.createMediaStreamSource(this.stream);
      const pre = this.ctx.createGain(),
        hp = this.ctx.createBiquadFilter(),
        lp = this.ctx.createBiquadFilter(),
        notch = this.ctx.createBiquadFilter(),
        gate = this.localGate
          ? (() => {
              const channels = Math.max(1, Math.min(2, Number(s.channelCount) || 1)),
                node = this.ctx.createScriptProcessor(1024, channels, channels),
                cfg = {
                  threshold: 0.0025,
                  attack: 0.008,
                  release: 0.18,
                  hold: 0.045,
                  range: 0.00025,
                  enabled: true
                },
                state = { env: 0, gain: 1, holdFrames: 0 };
              node.port = { postMessage: (d) => Object.assign(cfg, d || {}) };
              node.onaudioprocess = (e) => {
                const ch = Math.min(e.inputBuffer.numberOfChannels, e.outputBuffer.numberOfChannels),
                  frames = e.inputBuffer.length,
                  rate = this.ctx?.sampleRate || 48000;
                for (let i = 0; i < frames; i++) {
                  let a = 0;
                  for (let c = 0; c < ch; c++) a = Math.max(a, Math.abs(e.inputBuffer.getChannelData(c)[i] || 0));
                  state.env = 0.985 * state.env + 0.015 * a;
                  const open = !cfg.enabled || state.env >= cfg.threshold;
                  if (open) state.holdFrames = Math.floor(cfg.hold * rate);
                  else if (state.holdFrames > 0) state.holdFrames--;
                  const target = open || state.holdFrames > 0 ? 1 : cfg.range,
                    time = target > state.gain ? cfg.attack : cfg.release,
                    coef = Math.exp(-1 / Math.max(1, time * rate));
                  state.gain = target + (state.gain - target) * coef;
                  for (let c = 0; c < ch; c++)
                    e.outputBuffer.getChannelData(c)[i] = (e.inputBuffer.getChannelData(c)[i] || 0) * state.gain;
                }
              };
              return node;
            })()
          : new AudioWorkletNode(this.ctx, 'openvox-pro-gate'),
        lowShelf = this.ctx.createBiquadFilter(),
        presence = this.ctx.createBiquadFilter(),
        air = this.ctx.createBiquadFilter(),
        comp = this.ctx.createDynamicsCompressor(),
        post = this.ctx.createGain(),
        dry = this.ctx.createGain(),
        sum = this.ctx.createGain(),
        convolver = this.ctx.createConvolver(),
        reverbWet = this.ctx.createGain(),
        delay = this.ctx.createDelay(2),
        delayFeedback = this.ctx.createGain(),
        delayWet = this.ctx.createGain(),
        limiter = this.ctx.createDynamicsCompressor(),
        an = this.ctx.createAnalyser(),
        monitor = this.ctx.createGain(),
        rec = this.ctx.createMediaStreamDestination();
      hp.type = 'highpass';
      lp.type = 'lowpass';
      notch.type = 'notch';
      lowShelf.type = 'lowshelf';
      presence.type = 'peaking';
      air.type = 'highshelf';
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.003;
      this.nodes = {
        pre,
        hp,
        lp,
        notch,
        lowShelf,
        presence,
        air,
        gate,
        comp,
        post,
        dry,
        sum,
        convolver,
        reverbWet,
        delay,
        delayFeedback,
        delayWet,
        limiter,
        monitor
      };
      this.analyser = an;
      this.recDest = rec;
      this.source
        .connect(pre)
        .connect(hp)
        .connect(lp)
        .connect(notch)
        .connect(lowShelf)
        .connect(presence)
        .connect(air)
        .connect(gate)
        .connect(comp)
        .connect(post);
      post.connect(dry).connect(sum);
      post.connect(convolver).connect(reverbWet).connect(sum);
      post.connect(delay);
      delay.connect(delayWet).connect(sum);
      delay.connect(delayFeedback).connect(delay);
      sum.connect(limiter).connect(an);
      an.connect(rec);
      an.connect(monitor).connect(this.ctx.destination);
      this.apply();
      this.startLoop();
      this.bus.emit('engine', {
        active: true,
        sampleRate: this.ctx.sampleRate,
        label: this.stream.getAudioTracks()[0]?.label || '',
        mode: this.localGate ? 'local-fallback' : 'audio-worklet'
      });
    }
    updateReverbImpulse() {
      if (!this.ctx || !this.nodes.convolver) return;
      const seconds = clamp(Number(this.s.reverbSeconds) || 1.4, 0.1, 8);
      const decay = clamp(Number(this.s.reverbDecay) || 2.4, 0.2, 8);
      const signature = `${this.ctx.sampleRate}:${seconds.toFixed(3)}:${decay.toFixed(3)}`;
      if (signature === this.reverbSignature) return;
      const length = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
      const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
      let seed = 0x5f3759df;
      const random = () => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          const envelope = Math.pow(1 - i / length, decay);
          data[i] = (random() * 2 - 1) * envelope;
        }
      }
      this.nodes.convolver.buffer = impulse;
      this.reverbSignature = signature;
    }
    apply() {
      if (!this.ctx || !this.nodes.pre) return;
      const s = this.s,
        n = this.nodes,
        t = this.ctx.currentTime;
      n.pre.gain.setTargetAtTime(dbToGain(s.preGain), t, 0.015);
      n.hp.frequency.setTargetAtTime(s.highpassEnabled ? s.highpassFrequency : 10, t, 0.015);
      n.hp.Q.setTargetAtTime(s.highpassQ, t, 0.015);
      n.lp.frequency.setTargetAtTime(
        s.lowpassEnabled ? s.lowpassFrequency : Math.min(22000, this.ctx.sampleRate * 0.48),
        t,
        0.015
      );
      n.lp.Q.setTargetAtTime(s.lowpassQ, t, 0.015);
      n.notch.frequency.setTargetAtTime(s.notchFrequency, t, 0.015);
      n.notch.Q.setTargetAtTime(s.notchEnabled ? s.notchQ : 0.0001, t, 0.015);
      n.lowShelf.frequency.setTargetAtTime(s.lowShelfFrequency, t, 0.015);
      n.lowShelf.gain.setTargetAtTime(s.eqEnabled ? s.lowShelfGain : 0, t, 0.015);
      n.presence.frequency.setTargetAtTime(s.presenceFrequency, t, 0.015);
      n.presence.Q.setTargetAtTime(s.presenceQ, t, 0.015);
      n.presence.gain.setTargetAtTime(s.eqEnabled ? s.presenceGain : 0, t, 0.015);
      n.air.frequency.setTargetAtTime(s.airFrequency, t, 0.015);
      n.air.gain.setTargetAtTime(s.eqEnabled ? s.airGain : 0, t, 0.015);
      n.gate.port.postMessage({
        enabled: !!s.gateEnabled,
        threshold: dbToGain(s.gateThreshold),
        attack: s.gateAttack,
        release: s.gateRelease,
        hold: s.gateHold,
        range: dbToGain(s.gateRange)
      });
      n.comp.threshold.setTargetAtTime(s.compressorEnabled ? s.compressorThreshold : 0, t, 0.015);
      n.comp.knee.setTargetAtTime(s.compressorEnabled ? s.compressorKnee : 0, t, 0.015);
      n.comp.ratio.setTargetAtTime(s.compressorEnabled ? s.compressorRatio : 1, t, 0.015);
      n.comp.attack.setTargetAtTime(s.compressorAttack, t, 0.015);
      n.comp.release.setTargetAtTime(s.compressorRelease, t, 0.015);
      this.updateReverbImpulse();
      n.reverbWet.gain.setTargetAtTime(s.reverbEnabled ? clamp(Number(s.reverbMix), 0, 1) : 0, t, 0.015);
      n.delay.delayTime.setTargetAtTime(clamp(Number(s.delayTime), 0, 2), t, 0.015);
      n.delayFeedback.gain.setTargetAtTime(s.delayEnabled ? clamp(Number(s.delayFeedback), 0, 0.92) : 0, t, 0.015);
      n.delayWet.gain.setTargetAtTime(s.delayEnabled ? clamp(Number(s.delayMix), 0, 1) : 0, t, 0.015);
      n.limiter.threshold.setTargetAtTime(s.limiterEnabled ? s.limiterThreshold : 0, t, 0.015);
      n.limiter.ratio.setTargetAtTime(s.limiterEnabled ? 20 : 1, t, 0.015);
      n.limiter.release.setTargetAtTime(s.limiterRelease, t, 0.015);
      n.post.gain.setTargetAtTime(dbToGain(s.postGain), t, 0.015);
      n.monitor.gain.setTargetAtTime(s.monitor ? dbToGain(s.monitorGain) : 0, t, 0.015);
      this.analyser.fftSize = Number(s.fftSize);
      this.analyser.smoothingTimeConstant = Number(s.smoothing);
      this.analyser.minDecibels = Number(s.minDecibels);
      this.analyser.maxDecibels = Number(s.maxDecibels);
    }
    startLoop() {
      cancelAnimationFrame(this.loop);
      const draw = () => {
        if (!this.analyser || !this.ctx) return;
        const time = new Float32Array(this.analyser.fftSize),
          freq = new Float32Array(this.analyser.frequencyBinCount);
        this.analyser.getFloatTimeDomainData(time);
        this.analyser.getFloatFrequencyData(freq);
        let sum = 0,
          peak = 0;
        for (const v of time) {
          sum += v * v;
          peak = Math.max(peak, Math.abs(v));
        }
        const rms = Math.sqrt(sum / time.length);
        const pitch = yinPitch(
          time,
          this.ctx.sampleRate,
          this.s.tunerMinHz,
          this.s.tunerMaxHz,
          this.s.yinThreshold,
          this.s.referenceA4
        );
        this.pitch = pitch || {
          frequency: 0,
          note: '—',
          cents: 0,
          confidence: 0
        };
        this.bus.emit('frame', {
          time,
          freq,
          rms,
          peak,
          pitch: this.pitch,
          sampleRate: this.ctx.sampleRate,
          fftSize: this.analyser.fftSize
        });
        this.loop = requestAnimationFrame(draw);
      };
      this.loop = requestAnimationFrame(draw);
    }
    async startRecording() {
      if (!this.recDest) throw new Error('Start microphone first');
      if (this.recorder?.state === 'recording') return;
      let mime = '';
      if (this.s.recordingMime !== 'auto' && MediaRecorder.isTypeSupported(this.s.recordingMime))
        mime = this.s.recordingMime;
      else
        mime =
          ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find((v) =>
            MediaRecorder.isTypeSupported(v)
          ) || '';
      this.recordChunks = [];
      this.recorder = new MediaRecorder(
        this.recDest.stream,
        mime
          ? {
              mimeType: mime,
              audioBitsPerSecond: Number(this.s.recordingBitrate)
            }
          : { audioBitsPerSecond: Number(this.s.recordingBitrate) }
      );
      this.recorder.ondataavailable = (e) => e.data.size && this.recordChunks.push(e.data);
      this.recorder.start(250);
      this.bus.emit('recording', true);
    }
    stopRecording() {
      return new Promise((resolve, reject) => {
        if (!this.recorder || this.recorder.state !== 'recording') return reject(new Error('No recording'));
        const r = this.recorder;
        r.onstop = () => {
          const type = r.mimeType || this.recordChunks[0]?.type || 'audio/webm',
            blob = new Blob(this.recordChunks, { type });
          this.recordChunks = [];
          this.recorder = null;
          this.bus.emit('recording', false);
          resolve({ blob, type });
        };
        r.onerror = () => reject(new Error('Recording failed'));
        r.stop();
      });
    }
    async stop() {
      cancelAnimationFrame(this.loop);
      if (this.recorder?.state === 'recording')
        try {
          this.recorder.stop();
        } catch {}
      Object.values(this.nodes).forEach((n) => {
        try {
          n.disconnect();
        } catch {}
      });
      try {
        this.source?.disconnect();
      } catch {}
      try {
        this.analyser?.disconnect();
      } catch {}
      this.stream?.getTracks().forEach((t) => t.stop());
      if (this.ctx && this.ctx.state !== 'closed') await this.ctx.close();
      if (this.gateUrl) URL.revokeObjectURL(this.gateUrl);
      this.ctx = null;
      this.stream = null;
      this.source = null;
      this.nodes = {};
      this.analyser = null;
      this.recDest = null;
      this.gateUrl = '';
      this.reverbSignature = '';
      this.bus.emit('engine', { active: false, sampleRate: 0, label: '' });
    }
  }
  function yinPitch(buffer, sampleRate, minHz, maxHz, threshold, a4) {
    const n = buffer.length,
      minTau = Math.max(2, Math.floor(sampleRate / maxHz)),
      maxTau = Math.min(n >> 1, Math.floor(sampleRate / minHz)),
      diff = new Float32Array(maxTau + 1),
      cmnd = new Float32Array(maxTau + 1);
    for (let tau = minTau; tau <= maxTau; tau++) {
      let sum = 0;
      for (let i = 0; i < n - maxTau; i++) {
        const d = buffer[i] - buffer[i + tau];
        sum += d * d;
      }
      diff[tau] = sum;
    }
    let run = 0;
    cmnd[0] = 1;
    for (let tau = 1; tau <= maxTau; tau++) {
      run += diff[tau];
      cmnd[tau] = run ? (diff[tau] * tau) / run : 1;
    }
    let tau = -1;
    for (let t = minTau; t <= maxTau; t++) {
      if (cmnd[t] < threshold) {
        while (t + 1 <= maxTau && cmnd[t + 1] < cmnd[t]) t++;
        tau = t;
        break;
      }
    }
    if (tau < 0) {
      let best = 1;
      for (let t = minTau; t <= maxTau; t++)
        if (cmnd[t] < best) {
          best = cmnd[t];
          tau = t;
        }
      if (best > 0.45) return null;
    }
    let better = tau;
    if (tau > 1 && tau < maxTau) {
      const s0 = cmnd[tau - 1],
        s1 = cmnd[tau],
        s2 = cmnd[tau + 1],
        den = 2 * (2 * s1 - s2 - s0);
      if (Math.abs(den) > 1e-9) better = tau + (s2 - s0) / den;
    }
    const frequency = sampleRate / better;
    if (!Number.isFinite(frequency) || frequency < minHz || frequency > maxHz) return null;
    const midi = frequencyToMidi(frequency, a4),
      nearest = Math.round(midi),
      cents = (midi - nearest) * 100;
    return {
      frequency,
      note: noteLabel(nearest),
      cents,
      confidence: clamp(1 - cmnd[tau], 0, 1),
      midi
    };
  }
  class Metronome {
    constructor(getContext, settings, bus) {
      this.getContext = getContext;
      this.s = settings;
      this.bus = bus;
      this.timer = 0;
      this.next = 0;
      this.count = 0;
      this.running = false;
    }
    async start() {
      const ctx = await this.getContext();
      this.running = true;
      this.next = ctx.currentTime + 0.05;
      this.count = 0;
      this.timer = setInterval(() => this.schedule(ctx), 25);
      this.schedule(ctx);
      this.bus.emit('metronome', true);
    }
    schedule(ctx) {
      if (!this.running) return;
      const beat = 60 / this.s.metronomeBpm,
        sub = beat / this.s.metronomeSubdivision;
      while (this.next < ctx.currentTime + 0.12) {
        const beatIndex = Math.floor(this.count / this.s.metronomeSubdivision) % this.s.metronomeBeats,
          subIndex = this.count % this.s.metronomeSubdivision,
          isAccent = this.s.metronomeAccent && beatIndex === 0 && subIndex === 0;
        let when = this.next;
        if (this.s.metronomeSwing > 0 && this.s.metronomeSubdivision >= 2 && this.count % 2 === 1)
          when += sub * (this.s.metronomeSwing / 100) * 0.32;
        this.click(ctx, when, isAccent, subIndex === 0);
        this.next += sub;
        this.count++;
      }
    }
    click(ctx, when, accent, main) {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.frequency.value = accent ? 1760 : main ? 1320 : 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(dbToGain(this.s.metronomeVolume) * (accent ? 1 : 0.65), when + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.045);
      osc.connect(gain).connect(ctx.destination);
      osc.start(when);
      osc.stop(when + 0.055);
    }
    stop() {
      this.running = false;
      clearInterval(this.timer);
      this.timer = 0;
      this.bus.emit('metronome', false);
    }
  }
  class ToneBank {
    constructor(getContext, settings, bus) {
      this.getContext = getContext;
      this.s = settings;
      this.bus = bus;
      this.tone = null;
      this.drone = [];
    }
    async toneStart() {
      this.toneStop();
      const ctx = await this.getContext(),
        osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = this.s.toneWave;
      osc.frequency.value = this.s.toneFrequency * Math.pow(2, this.s.toneCents / 1200);
      gain.gain.value = dbToGain(this.s.toneVolume);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      this.tone = { osc, gain };
      this.bus.emit('tone', true);
    }
    toneStop() {
      if (this.tone) {
        try {
          this.tone.osc.stop();
        } catch {}
        try {
          this.tone.osc.disconnect();
          this.tone.gain.disconnect();
        } catch {}
        this.tone = null;
      }
      this.bus.emit('tone', false);
    }
    updateTone() {
      if (this.tone) {
        this.tone.osc.type = this.s.toneWave;
        this.tone.osc.frequency.setTargetAtTime(
          this.s.toneFrequency * Math.pow(2, this.s.toneCents / 1200),
          this.tone.osc.context.currentTime,
          0.01
        );
        this.tone.gain.gain.setTargetAtTime(dbToGain(this.s.toneVolume), this.tone.osc.context.currentTime, 0.01);
      }
    }
    async droneStart() {
      this.droneStop();
      const ctx = await this.getContext(),
        intervals = String(this.s.droneShape)
          .split(',')
          .map((v) => Number(v.trim()))
          .filter(Number.isFinite);
      for (const semis of intervals) {
        const osc = ctx.createOscillator(),
          gain = ctx.createGain(),
          midi = Number(this.s.droneRoot) + semis;
        osc.type = 'sine';
        osc.frequency.value = midiToFrequency(midi, this.s.referenceA4);
        gain.gain.value = dbToGain(this.s.droneVolume) / Math.max(1, Math.sqrt(intervals.length));
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        this.drone.push({ osc, gain });
      }
      this.bus.emit('drone', true);
    }
    droneStop() {
      for (const n of this.drone) {
        try {
          n.osc.stop();
          n.osc.disconnect();
          n.gain.disconnect();
        } catch {}
      }
      this.drone = [];
      this.bus.emit('drone', false);
    }
    async pingMidi(midi, duration = 0.7) {
      const ctx = await this.getContext(),
        osc = ctx.createOscillator(),
        gain = ctx.createGain(),
        now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.value = midiToFrequency(midi, this.s.referenceA4);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    }
  }
  function fftRadix2Real(input, size, cosTable, sinTable) {
    const re = new Float64Array(size),
      im = new Float64Array(size);
    const n = Math.min(size, input.length);
    for (let i = 0; i < n; i++) re[i] = input[i];
    let j = 0;
    for (let i = 1; i < size; i++) {
      let bit = size >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i];
        re[i] = re[j];
        re[j] = t;
      }
    }
    for (let len = 2; len <= size; len <<= 1) {
      const half = len >> 1,
        step = size / len;
      for (let i = 0; i < size; i += len)
        for (let k = 0; k < half; k++) {
          const idx = k * step,
            c = cosTable[idx],
            s = sinTable[idx],
            p = i + k,
            q = p + half,
            tr = re[q] * c - im[q] * s,
            ti = re[q] * s + im[q] * c;
          re[q] = re[p] - tr;
          im[q] = im[p] - ti;
          re[p] += tr;
          im[p] += ti;
        }
    }
    const mag = new Float64Array(size >> 1);
    for (let i = 0; i < mag.length; i++) mag[i] = Math.hypot(re[i], im[i]);
    return mag;
  }
  function spectralFeatures(samples, sampleRate, size, windowType) {
    const lib = window.OVX_DSP_LIBRARY;
    if (!lib) throw new Error('DSP library unavailable');
    const supported = lib.sizes.includes(size) ? size : 8192,
      windowTable = lib.getWindow(windowType, supported),
      segment = new Float64Array(supported);
    for (let i = 0; i < supported; i++) segment[i] = (samples[i] || 0) * windowTable[i];
    const tw = lib.getTwiddle(supported),
      mag = fftRadix2Real(segment, supported, tw.cos, tw.sin);
    let total = 0,
      weighted = 0,
      geo = 0;
    const bins = [];
    for (let i = 1; i < mag.length; i++) {
      const v = mag[i] + 1e-12,
        totalF = (i * sampleRate) / supported;
      total += v;
      weighted += v * totalF;
      geo += Math.log(v);
      bins.push({ i, v, f: totalF });
    }
    const centroid = total ? weighted / total : 0;
    let accum = 0,
      rolloff = 0;
    for (const b of bins) {
      accum += b.v;
      if (accum >= total * 0.85) {
        rolloff = b.f;
        break;
      }
    }
    const arithmetic = total / Math.max(1, bins.length),
      flatness = arithmetic ? Math.exp(geo / Math.max(1, bins.length)) / arithmetic : 0;
    bins.sort((a, b) => b.v - a.v);
    const dominants = [];
    for (const b of bins) {
      if (dominants.every((d) => Math.abs(d.f - b.f) > 35)) {
        dominants.push(b);
        if (dominants.length === 8) break;
      }
    }
    return {
      centroid,
      rolloff,
      flatness,
      dominants: dominants.map((v) => ({ frequency: v.f, magnitude: v.v }))
    };
  }
  function analyzeBuffer(audioBuffer, settings) {
    const channels = audioBuffer.numberOfChannels,
      length = audioBuffer.length,
      mix = new Float64Array(length);
    for (let c = 0; c < channels; c++) {
      const data = audioBuffer.getChannelData(c);
      for (let i = 0; i < length; i++) mix[i] += data[i] / channels;
    }
    let sum = 0,
      peak = 0,
      zero = 0;
    for (let i = 0; i < length; i++) {
      const v = mix[i];
      sum += v * v;
      peak = Math.max(peak, Math.abs(v));
      if (i && Math.sign(v) !== Math.sign(mix[i - 1])) zero++;
    }
    const rms = Math.sqrt(sum / Math.max(1, length)),
      size = [32768, 16384, 8192, 4096, 2048, 1024].find((n) => n <= length) || 1024,
      features = spectralFeatures(mix, audioBuffer.sampleRate, size, settings.windowType);
    return {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels,
      rms,
      peak,
      crest: rms ? peak / rms : 0,
      zeroCrossingRate: zero / audioBuffer.duration,
      features
    };
  }
  const LAB_CSS = `
:host{all:initial;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#e6edff;--b:#030712;--s:#0a1226;--s2:#101c36;--line:rgba(190,205,240,.15);--gold:#c8a96e;--gold2:#efd59d;--muted:#a8b5cf;--blue:#6ea8ff;--green:#6ee7b7;--red:#fb7185;--r:18px}.fab{position:fixed;right:22px;bottom:84px;z-index:2147483000;width:58px;height:58px;border-radius:20px;border:1px solid rgba(200,169,110,.35);background:linear-gradient(145deg,#19213b,#0a1022);color:var(--gold2);box-shadow:0 20px 60px rgba(0,0,0,.55),0 0 32px rgba(200,169,110,.14);display:grid;place-items:center;cursor:pointer;transition:.2s}.fab:hover{transform:translateY(-3px) scale(1.03)}.fab svg{width:27px;height:27px}.overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(0,2,10,.72);backdrop-filter:blur(16px);display:none;align-items:stretch;justify-content:flex-end}.overlay.open{display:flex}.panel{width:min(1180px,100vw);height:100vh;background:linear-gradient(180deg,#050a16,#081127 55%,#050914);border-left:1px solid var(--line);box-shadow:-28px 0 90px rgba(0,0,0,.45);display:grid;grid-template-rows:auto auto 1fr;overflow:hidden}.head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:12px}.mark{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:rgba(200,169,110,.12);border:1px solid rgba(200,169,110,.28);color:var(--gold2)}.mark svg{width:23px}.brand h2{font-size:17px;margin:0;color:#fff}.brand p{font-size:11px;margin:3px 0 0;color:var(--muted)}.head-actions{display:flex;align-items:center;gap:8px}.status{font-size:11px;padding:7px 11px;border:1px solid var(--line);border-radius:999px;color:var(--muted)}.status.live{color:var(--green);border-color:rgba(110,231,183,.3);background:rgba(110,231,183,.08)}button,select,input{font:inherit}.ib{width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:#0c1730;color:var(--muted);display:grid;place-items:center;cursor:pointer}.ib svg{width:17px}.tabs{display:flex;gap:5px;padding:10px 16px;overflow-x:auto;border-bottom:1px solid var(--line);scrollbar-width:thin}.tab{border:0;border-radius:999px;background:transparent;color:var(--muted);padding:9px 13px;font-size:11px;font-weight:700;white-space:nowrap;cursor:pointer}.tab.active{background:rgba(200,169,110,.15);color:var(--gold2)}.body{overflow:auto;padding:18px}.page{display:none}.page.active{display:block}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px}.card{grid-column:span 6;background:rgba(10,18,38,.78);border:1px solid var(--line);border-radius:var(--r);padding:16px;box-shadow:0 16px 48px rgba(0,0,0,.16)}.card.full{grid-column:1/-1}.card.third{grid-column:span 4}.card h3{margin:0 0 13px;font-size:13px;color:#f7f9ff}.field{margin:0 0 13px}.field:last-child{margin-bottom:0}.label{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10.5px;color:var(--muted);margin-bottom:6px}.label b{color:var(--gold2);font-weight:650}.row{display:flex;align-items:center;gap:9px}.row.wrap{flex-wrap:wrap}select,input[type=number],input[type=text]{width:100%;min-height:38px;background:#060d1d;color:#edf2ff;border:1px solid var(--line);border-radius:11px;padding:8px 10px;outline:none}input[type=range]{width:100%;accent-color:var(--gold)}input[type=checkbox]{accent-color:var(--gold);width:17px;height:17px}.toggle{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--muted)}.btn{border:1px solid var(--line);background:#0d1933;color:#e8efff;border-radius:999px;min-height:39px;padding:9px 14px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px}.btn svg{width:15px;height:15px;flex:0 0 auto}.btn.primary{background:linear-gradient(135deg,var(--gold2),var(--gold));color:#211708;border-color:transparent}.btn.danger{color:#fecdd3;border-color:rgba(251,113,133,.3);background:rgba(251,113,133,.08)}.btn:disabled{opacity:.45;cursor:not-allowed}.meter{height:8px;border-radius:999px;background:#030817;overflow:hidden;border:1px solid var(--line)}.meter span{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--green),var(--gold),var(--red));transition:width .06s}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.metric{background:#060d1d;border:1px solid var(--line);border-radius:12px;padding:10px}.metric span{display:block;font-size:9px;color:var(--muted)}.metric strong{display:block;margin-top:4px;font-size:14px;color:#fff}.canvas-wrap{background:#030817;border:1px solid var(--line);border-radius:14px;overflow:hidden;min-height:220px;position:relative}.canvas-wrap canvas{width:100%;height:220px;display:block}.tuner{display:grid;place-items:center;padding:22px 8px}.tuner-note{font-size:58px;line-height:1;font-weight:800;letter-spacing:-.05em;background:linear-gradient(120deg,#fff0c7,var(--gold),#9abfff);-webkit-background-clip:text;color:transparent}.tuner-hz{font-size:12px;color:var(--muted);margin-top:8px}.tuner-bar{width:min(420px,100%);height:16px;border-radius:999px;background:linear-gradient(90deg,rgba(251,113,133,.35),rgba(200,169,110,.35) 50%,rgba(110,231,183,.35));position:relative;margin-top:18px}.tuner-dot{position:absolute;top:50%;width:20px;height:20px;border-radius:50%;background:#fff0c7;box-shadow:0 0 20px rgba(232,208,160,.7);transform:translate(-50%,-50%);left:50%}.keyboard{display:flex;overflow-x:auto;padding:8px;background:#020611;border:1px solid var(--line);border-radius:14px}.key{position:relative;flex:0 0 42px;height:130px;background:#f7f4ec;border:1px solid #9ba2b0;border-radius:0 0 7px 7px;color:#111;display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;font-size:9px;cursor:pointer}.key.black{height:82px;flex-basis:30px;margin:0 -15px;z-index:2;background:#111827;color:#dce6ff;border-color:#27334b}.preset-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:9px}.preset{padding:12px;border:1px solid var(--line);border-radius:13px;background:#071126;color:#dfe8ff;text-align:left;cursor:pointer}.preset strong{display:block;font-size:11px}.preset small{display:block;color:var(--muted);font-size:9px;margin-top:5px}.diag{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}.diag-item{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid var(--line);border-radius:11px;background:#060d1d;font-size:10.5px}.ok{color:var(--green)}.bad{color:var(--red)}.analysis-result{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:9px;margin-top:14px}.analysis-cell{padding:12px;border-radius:12px;border:1px solid var(--line);background:#060d1d}.analysis-cell span{font-size:9px;color:var(--muted);display:block}.analysis-cell strong{font-size:14px;margin-top:5px;display:block}.freq-list{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.freq-chip{border:1px solid var(--line);border-radius:999px;padding:6px 9px;font-size:10px;color:var(--gold2)}.toast{position:fixed;right:24px;bottom:94px;z-index:2147483003;padding:11px 14px;border-radius:12px;background:#101a31;border:1px solid var(--line);color:#eaf0ff;font-size:11px;box-shadow:0 18px 60px rgba(0,0,0,.4);opacity:0;transform:translateY(10px);pointer-events:none;transition:.2s}.toast.show{opacity:1;transform:none}@media(max-width:760px){.fab{display:none}.body{padding:10px}.grid{display:block}.card{margin-bottom:10px;padding:13px;border-radius:15px}.metrics{grid-template-columns:repeat(2,1fr)}.head{padding:10px 12px;gap:8px}.head .status{display:none}.panel{width:100vw}.brand{gap:8px;min-width:0}.mark{width:32px;height:32px;border-radius:11px}.mark svg{width:17px;height:17px}.brand h2{font-size:14px}.brand p{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}.head-actions{gap:5px}.head-actions select{min-height:32px!important;padding:5px 7px;font-size:10px}.ib{width:32px;height:32px}.ib svg{width:14px;height:14px}.tabs{padding:7px 8px}.tab{padding:7px 9px;font-size:10px}.btn{min-height:36px;padding:8px 11px;font-size:10px}.btn svg{width:13px;height:13px}.canvas-wrap canvas{height:170px}.canvas-wrap{min-height:170px}.tuner-note{font-size:46px}.keyboard{padding:6px}.key{flex-basis:36px;height:112px}.key.black{height:70px;flex-basis:26px;margin:0 -13px}.toast{right:12px;left:12px;bottom:16px;text-align:center}.label{font-size:10px}.metric strong{font-size:12px}}
`;
  function icon(name) {
    const paths = {
      lab: '<path d="M9 3h6M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3"/><path d="M8.5 14h7"/>',
      close: '<path d="M6 6l12 12M18 6L6 18"/>',
      mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3"/>',
      save: '<path d="M4 4h14l2 2v14H4z"/><path d="M8 4v6h8V4M8 20v-6h8v6"/>',
      download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
      upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
      play: '<path d="M8 5v14l11-7z"/>',
      stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
      refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.lab}</svg>`;
  }
  class OpenVoxProLab {
    constructor() {
      this.settings = deepMerge(DEFAULTS, loadJSON(OVXPRO_STORE, {}));
      this.presets = loadJSON(OVXPRO_PRESETS, {});
      this.bus = new EventBus();
      this.engine = new ProAudioEngine(this.settings, this.bus);
      this.utilityCtx = null;
      this.metronome = new Metronome(() => this.context(), this.settings, this.bus);
      this.tones = new ToneBank(() => this.context(), this.settings, this.bus);
      this.host = null;
      this.shadow = null;
      this.activeTab = 'input';
      this.engineActive = false;
      this.recording = false;
      this.lastFrame = null;
      this.visualFrame = 0;
      this.toastTimer = 0;
    }
    async context() {
      if (this.engine.ctx) return this.engine.ctx;
      if (!this.utilityCtx || this.utilityCtx.state === 'closed')
        this.utilityCtx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      if (this.utilityCtx.state === 'suspended') await this.utilityCtx.resume();
      return this.utilityCtx;
    }
    t(k) {
      return I18N[this.settings.language]?.[k] || I18N.en[k] || k;
    }
    mount() {
      if (document.getElementById('openvox-pro-lab-host')) return;
      this.host = document.createElement('div');
      this.host.id = 'openvox-pro-lab-host';
      document.body.appendChild(this.host);
      this.shadow = this.host.attachShadow({ mode: 'open' });
      this.render();
      this.bindBus();
      this.refreshDevices();
    }
    render() {
      const t = (k) => this.t(k);
      this.shadow.innerHTML = `<style>${LAB_CSS}</style><button class="fab" id="ovxpro-fab" aria-label="${t('title')}">${icon('lab')}</button><div class="overlay" id="ovxpro-overlay"><div class="panel"><div class="head"><div class="brand"><div class="mark">${icon('lab')}</div><div><h2>${t('title')}</h2><p>${t('subtitle')} · ${OVXPRO_VERSION}</p></div></div><div class="head-actions"><span class="status" id="ovxpro-status">${t('statusIdle')}</span><select id="ovxpro-language" style="width:auto;min-height:36px"><option value="en">EN</option><option value="uk">UK</option><option value="de">DE</option></select><button class="ib" id="ovxpro-close" aria-label="${t('close')}">${icon('close')}</button></div></div><div class="tabs">${[
        ['input', t('input')],
        ['dsp', t('dsp')],
        ['instruments', t('instruments')],
        ['visual', t('visual')],
        ['offline', t('offline')],
        ['presets', t('presets')],
        ['diagnostics', t('diagnostics')]
      ]
        .map(
          ([id, label]) =>
            `<button class="tab ${id === this.activeTab ? 'active' : ''}" data-tab="${id}">${label}</button>`
        )
        .join(
          ''
        )}</div><div class="body">${this.pageInput()}${this.pageDSP()}${this.pageInstruments()}${this.pageVisual()}${this.pageOffline()}${this.pagePresets()}${this.pageDiagnostics()}</div></div></div><div class="toast" id="ovxpro-toast"></div>`;
      this.q('#ovxpro-language').value = this.settings.language;
      this.bind();
    }
    q(sel) {
      return this.shadow.querySelector(sel);
    }
    qa(sel) {
      return [...this.shadow.querySelectorAll(sel)];
    }
    field(label, key, type = 'range', opts = {}) {
      const s = this.settings,
        v = s[key],
        min = opts.min ?? 0,
        max = opts.max ?? 100,
        step = opts.step ?? 1,
        suffix = opts.suffix ?? '';
      if (type === 'check')
        return `<label class="toggle"><input data-key="${key}" type="checkbox" ${v ? 'checked' : ''}><span>${label}</span></label>`;
      if (type === 'select')
        return `<div class="field"><div class="label"><span>${label}</span></div><select data-key="${key}">${opts.options.map(([a, b]) => `<option value="${a}" ${String(v) === String(a) ? 'selected' : ''}>${b}</option>`).join('')}</select></div>`;
      if (type === 'number' || type === 'text')
        return `<div class="field"><div class="label"><span>${label}</span></div><input data-key="${key}" type="${type}" value="${v}" ${type === 'number' ? `min="${min}" max="${max}" step="${step}"` : ''}></div>`;
      return `<div class="field"><div class="label"><span>${label}</span><b data-value-for="${key}">${v}${suffix}</b></div><input data-key="${key}" type="range" value="${v}" min="${min}" max="${max}" step="${step}" data-suffix="${suffix}"></div>`;
    }
    pageInput() {
      const t = (k) => this.t(k);
      return `<section class="page ${this.activeTab === 'input' ? 'active' : ''}" data-page="input"><div class="grid"><div class="card full"><h3>${t('input')}</h3><div class="row wrap"><button class="btn primary" id="ovxpro-start">${icon('mic')}<span>${t('start')}</span></button><button class="btn danger" id="ovxpro-stop">${icon('stop')}<span>${t('stop')}</span></button><button class="btn" id="ovxpro-refresh">${icon('refresh')}<span>${t('refresh')}</span></button><button class="btn" id="ovxpro-record">${t('record')}</button></div><div class="meter" style="margin-top:14px"><span id="ovxpro-meter"></span></div><div class="metrics"><div class="metric"><span>RMS</span><strong id="ovxpro-rms">—</strong></div><div class="metric"><span>${t('peak')}</span><strong id="ovxpro-peak">—</strong></div><div class="metric"><span>Pitch</span><strong id="ovxpro-pitch">—</strong></div><div class="metric"><span>Sample rate</span><strong id="ovxpro-rate">—</strong></div></div></div><div class="card">${this.field(t('device'), 'inputDeviceId', 'select', { options: [['', 'Default device']] })}<div class="row" style="margin-top:8px">${this.field(t('echo'), 'echoCancellation', 'check')}${this.field(t('noise'), 'noiseSuppression', 'check')}${this.field(t('agc'), 'autoGainControl', 'check')}</div></div><div class="card">${this.field(
        t('sampleRate'),
        'sampleRate',
        'select',
        {
          options: [
            [32000, '32 kHz'],
            [44100, '44.1 kHz'],
            [48000, '48 kHz'],
            [88200, '88.2 kHz'],
            [96000, '96 kHz']
          ]
        }
      )}${this.field(t('channels'), 'channelCount', 'select', {
        options: [
          [1, 'Mono'],
          [2, 'Stereo']
        ]
      })}${this.field(t('latency'), 'latencyHint', 'select', {
        options: [
          ['interactive', 'Interactive'],
          ['balanced', 'Balanced'],
          ['playback', 'Playback']
        ]
      })}</div></div></section>`;
    }
    pageDSP() {
      const t = (k) => this.t(k);
      return `<section class="page ${this.activeTab === 'dsp' ? 'active' : ''}" data-page="dsp"><div class="grid"><div class="card third"><h3>${t('gain')}</h3>${this.field('Pre gain', 'preGain', 'range', { min: -24, max: 24, step: 0.5, suffix: ' dB' })}${this.field('Post gain', 'postGain', 'range', { min: -24, max: 24, step: 0.5, suffix: ' dB' })}${this.field(t('monitor'), 'monitor', 'check')}${this.field('Monitor level', 'monitorGain', 'range', { min: -60, max: 0, step: 1, suffix: ' dB' })}</div><div class="card third"><h3>${t('highpass')}</h3>${this.field('Enabled', 'highpassEnabled', 'check')}${this.field('Cutoff', 'highpassFrequency', 'range', { min: 20, max: 500, step: 1, suffix: ' Hz' })}${this.field('Q', 'highpassQ', 'range', { min: 0.1, max: 12, step: 0.05 })}</div><div class="card third"><h3>${t('lowpass')}</h3>${this.field('Enabled', 'lowpassEnabled', 'check')}${this.field('Cutoff', 'lowpassFrequency', 'range', { min: 2000, max: 22000, step: 100, suffix: ' Hz' })}${this.field('Q', 'lowpassQ', 'range', { min: 0.1, max: 12, step: 0.05 })}</div><div class="card third"><h3>${t('notch')}</h3>${this.field('Enabled', 'notchEnabled', 'check')}${this.field('Frequency', 'notchFrequency', 'range', { min: 40, max: 400, step: 1, suffix: ' Hz' })}${this.field('Q', 'notchQ', 'range', { min: 1, max: 40, step: 0.5 })}</div><div class="card third"><h3>${t('gate')}</h3>${this.field('Enabled', 'gateEnabled', 'check')}${this.field('Threshold', 'gateThreshold', 'range', { min: -90, max: -10, step: 1, suffix: ' dB' })}${this.field('Attack', 'gateAttack', 'range', { min: 0.001, max: 0.1, step: 0.001, suffix: ' s' })}${this.field('Release', 'gateRelease', 'range', { min: 0.02, max: 1, step: 0.01, suffix: ' s' })}${this.field('Hold', 'gateHold', 'range', { min: 0, max: 0.5, step: 0.005, suffix: ' s' })}${this.field('Closed level', 'gateRange', 'range', { min: -96, max: -20, step: 1, suffix: ' dB' })}</div><div class="card third"><h3>${t('compressor')}</h3>${this.field('Enabled', 'compressorEnabled', 'check')}${this.field('Threshold', 'compressorThreshold', 'range', { min: -80, max: 0, step: 1, suffix: ' dB' })}${this.field('Knee', 'compressorKnee', 'range', { min: 0, max: 40, step: 1, suffix: ' dB' })}${this.field('Ratio', 'compressorRatio', 'range', { min: 1, max: 20, step: 0.1 })}${this.field('Attack', 'compressorAttack', 'range', { min: 0, max: 1, step: 0.001, suffix: ' s' })}${this.field('Release', 'compressorRelease', 'range', { min: 0.01, max: 1, step: 0.01, suffix: ' s' })}</div><div class="card third"><h3>${t('equalizer')}</h3>${this.field('Enabled', 'eqEnabled', 'check')}${this.field('Low shelf frequency', 'lowShelfFrequency', 'range', { min: 40, max: 500, step: 1, suffix: ' Hz' })}${this.field('Low shelf gain', 'lowShelfGain', 'range', { min: -18, max: 18, step: 0.5, suffix: ' dB' })}${this.field('Presence frequency', 'presenceFrequency', 'range', { min: 500, max: 8000, step: 10, suffix: ' Hz' })}${this.field('Presence Q', 'presenceQ', 'range', { min: 0.2, max: 12, step: 0.1 })}${this.field('Presence gain', 'presenceGain', 'range', { min: -18, max: 18, step: 0.5, suffix: ' dB' })}${this.field('Air frequency', 'airFrequency', 'range', { min: 5000, max: 18000, step: 100, suffix: ' Hz' })}${this.field('Air gain', 'airGain', 'range', { min: -18, max: 18, step: 0.5, suffix: ' dB' })}</div><div class="card third"><h3>${t('reverb')}</h3>${this.field('Enabled', 'reverbEnabled', 'check')}${this.field('Wet mix', 'reverbMix', 'range', { min: 0, max: 0.6, step: 0.01 })}${this.field('Decay time', 'reverbSeconds', 'range', { min: 0.1, max: 8, step: 0.05, suffix: ' s' })}${this.field('Decay shape', 'reverbDecay', 'range', { min: 0.2, max: 8, step: 0.1 })}<h3 style="margin-top:18px">${t('delay')}</h3>${this.field('Enabled', 'delayEnabled', 'check')}${this.field('Time', 'delayTime', 'range', { min: 0, max: 2, step: 0.005, suffix: ' s' })}${this.field('Feedback', 'delayFeedback', 'range', { min: 0, max: 0.92, step: 0.01 })}${this.field('Wet mix', 'delayMix', 'range', { min: 0, max: 0.6, step: 0.01 })}</div><div class="card third"><h3>${t('limiter')}</h3>${this.field('Enabled', 'limiterEnabled', 'check')}${this.field('Ceiling', 'limiterThreshold', 'range', { min: -12, max: 0, step: 0.1, suffix: ' dB' })}${this.field('Release', 'limiterRelease', 'range', { min: 0.02, max: 0.5, step: 0.005, suffix: ' s' })}<p class="hint">Final protection before monitoring and processed recording.</p></div><div class="card full"><h3>Analysis engine</h3><div class="grid"> <div class="card third">${this.field(
        'FFT size',
        'fftSize',
        'select',
        {
          options: [
            [1024, '1024'],
            [2048, '2048'],
            [4096, '4096'],
            [8192, '8192'],
            [16384, '16384'],
            [32768, '32768']
          ]
        }
      )}${this.field('Smoothing', 'smoothing', 'range', { min: 0, max: 0.99, step: 0.01 })}</div><div class="card third">${this.field('Minimum dB', 'minDecibels', 'range', { min: -140, max: -30, step: 1, suffix: ' dB' })}${this.field('Maximum dB', 'maxDecibels', 'range', { min: -40, max: 0, step: 1, suffix: ' dB' })}</div><div class="card third">${this.field('Reference A4', 'referenceA4', 'range', { min: 400, max: 480, step: 0.1, suffix: ' Hz' })}${this.field('YIN threshold', 'yinThreshold', 'range', { min: 0.03, max: 0.4, step: 0.005 })}</div></div></div></div></section>`;
    }
    pageInstruments() {
      const t = (k) => this.t(k);
      const keys = Array.from({ length: 25 }, (_, i) => 48 + i)
        .map(
          (m) =>
            `<button class="key ${[1, 3, 6, 8, 10].includes(m % 12) ? 'black' : ''}" data-midi="${m}">${noteLabel(m)}</button>`
        )
        .join('');
      return `<section class="page ${this.activeTab === 'instruments' ? 'active' : ''}" data-page="instruments"><div class="grid"><div class="card third"><h3>${t('metronome')}</h3>${this.field(t('bpm'), 'metronomeBpm', 'range', { min: 20, max: 300, step: 1 })}${this.field(
        t('beats'),
        'metronomeBeats',
        'select',
        {
          options: [
            [2, '2'],
            [3, '3'],
            [4, '4'],
            [5, '5'],
            [6, '6'],
            [7, '7'],
            [9, '9'],
            [12, '12']
          ]
        }
      )}${this.field(t('subdivision'), 'metronomeSubdivision', 'select', {
        options: [
          [1, '1'],
          [2, '2'],
          [3, '3'],
          [4, '4']
        ]
      })}${this.field(t('swing'), 'metronomeSwing', 'range', { min: 0, max: 100, step: 1, suffix: '%' })}${this.field(t('volume'), 'metronomeVolume', 'range', { min: -60, max: 0, step: 1, suffix: ' dB' })}<div class="row"><button class="btn primary" id="ovxpro-metro-play">${t('play')}</button><button class="btn" id="ovxpro-metro-stop">${t('pause')}</button></div></div><div class="card third"><h3>${t('tone')}</h3>${this.field(
        t('wave'),
        'toneWave',
        'select',
        {
          options: [
            ['sine', 'Sine'],
            ['triangle', 'Triangle'],
            ['sawtooth', 'Sawtooth'],
            ['square', 'Square']
          ]
        }
      )}${this.field(t('frequency'), 'toneFrequency', 'range', { min: 20, max: 4000, step: 0.1, suffix: ' Hz' })}${this.field(t('cents'), 'toneCents', 'range', { min: -100, max: 100, step: 1, suffix: ' ct' })}${this.field(t('volume'), 'toneVolume', 'range', { min: -60, max: -3, step: 1, suffix: ' dB' })}<div class="row"><button class="btn primary" id="ovxpro-tone-play">${t('play')}</button><button class="btn" id="ovxpro-tone-stop">${t('pause')}</button></div></div><div class="card third"><h3>${t('drone')}</h3>${this.field(t('root'), 'droneRoot', 'range', { min: 24, max: 84, step: 1 })}${this.field(t('shape'), 'droneShape', 'text')}${this.field(t('volume'), 'droneVolume', 'range', { min: -60, max: -6, step: 1, suffix: ' dB' })}<div class="row"><button class="btn primary" id="ovxpro-drone-play">${t('play')}</button><button class="btn" id="ovxpro-drone-stop">${t('pause')}</button></div></div><div class="card full"><h3>${t('keyboard')}</h3><div class="keyboard">${keys}</div></div></div></section>`;
    }
    pageVisual() {
      const t = (k) => this.t(k);
      return `<section class="page ${this.activeTab === 'visual' ? 'active' : ''}" data-page="visual"><div class="grid"><div class="card full"><h3>${t('tuner')}</h3><div class="tuner"><div class="tuner-note" id="ovxpro-tuner-note">—</div><div class="tuner-hz" id="ovxpro-tuner-hz">0.00 Hz · 0 ct</div><div class="tuner-bar"><span class="tuner-dot" id="ovxpro-tuner-dot"></span></div></div></div><div class="card"><h3>${t('spectrum')}</h3><div class="canvas-wrap"><canvas id="ovxpro-spectrum" width="900" height="300"></canvas></div></div><div class="card"><h3>${t('scope')}</h3><div class="canvas-wrap"><canvas id="ovxpro-scope" width="900" height="300"></canvas></div></div><div class="card full"><h3>${t('spectrogram')}</h3><div class="canvas-wrap"><canvas id="ovxpro-spectrogram" width="1200" height="320"></canvas></div></div></div></section>`;
    }
    pageOffline() {
      const t = (k) => this.t(k);
      return `<section class="page ${this.activeTab === 'offline' ? 'active' : ''}" data-page="offline"><div class="grid"><div class="card full"><h3>${t('offline')}</h3><div class="row wrap"><label class="btn primary">${icon('upload')}<span>${t('chooseFile')}</span><input id="ovxpro-file" type="file" accept="audio/*" hidden></label>${this.field(
        'Window',
        'windowType',
        'select',
        {
          options: [
            ['hann', 'Hann'],
            ['hamming', 'Hamming'],
            ['blackman', 'Blackman'],
            ['blackmanHarris', 'Blackman-Harris'],
            ['flattop', 'Flat-top']
          ]
        }
      )}</div><div id="ovxpro-analysis" class="analysis-result"></div><div id="ovxpro-dominants" class="freq-list"></div></div></div></section>`;
    }
    pagePresets() {
      const t = (k) => this.t(k),
        built = Object.keys(BUILTIN_PRESETS)
          .map(
            (n) =>
              `<button class="preset" data-preset="${n}"><strong>${n}</strong><small>Built-in DSP profile</small></button>`
          )
          .join(''),
        custom = Object.keys(this.presets)
          .map(
            (n) =>
              `<button class="preset" data-custom-preset="${n}"><strong>${n}</strong><small>Local custom preset</small></button>`
          )
          .join('');
      return `<section class="page ${this.activeTab === 'presets' ? 'active' : ''}" data-page="presets"><div class="grid"><div class="card full"><h3>Factory presets</h3><div class="preset-list">${built}</div></div><div class="card full"><h3>Custom presets</h3><div class="row wrap"><input id="ovxpro-preset-name" type="text" placeholder="My vocal setup" style="max-width:280px"><button class="btn primary" id="ovxpro-save-preset">${t('savePreset')}</button><button class="btn" id="ovxpro-export">${icon('download')}<span>${t('exportPreset')}</span></button><label class="btn">${icon('upload')}<span>${t('importPreset')}</span><input id="ovxpro-import" type="file" accept="application/json,.json" hidden></label><button class="btn danger" id="ovxpro-reset">${t('reset')}</button></div><div class="preset-list" style="margin-top:14px">${custom || '<span style="color:var(--muted);font-size:11px">No custom presets yet.</span>'}</div></div></div></section>`;
    }
    pageDiagnostics() {
      const t = (k) => this.t(k),
        checks = this.diagnostics();
      return `<section class="page ${this.activeTab === 'diagnostics' ? 'active' : ''}" data-page="diagnostics"><div class="grid"><div class="card full"><h3>${t('diagnostics')}</h3><div class="diag">${checks.map((c) => `<div class="diag-item"><span>${c.name}</span><strong class="${c.ok ? 'ok' : 'bad'}">${c.value}</strong></div>`).join('')}</div><div class="row wrap" style="margin-top:14px"><button class="btn" id="ovxpro-copy-diag">${t('copy')}</button></div></div></div></section>`;
    }
    diagnostics() {
      const yes = (v) => (v ? this.t('supported') : this.t('unsupported'));
      return [
        {
          name: 'Secure context',
          ok: isSecureContext,
          value: yes(isSecureContext)
        },
        {
          name: 'Web Audio API',
          ok: !!(window.AudioContext || window.webkitAudioContext),
          value: yes(!!(window.AudioContext || window.webkitAudioContext))
        },
        {
          name: 'AudioWorklet',
          ok: 'AudioWorkletNode' in window,
          value: yes('AudioWorkletNode' in window)
        },
        {
          name: 'getUserMedia',
          ok: !!navigator.mediaDevices?.getUserMedia,
          value: yes(!!navigator.mediaDevices?.getUserMedia)
        },
        {
          name: 'MediaRecorder',
          ok: 'MediaRecorder' in window,
          value: yes('MediaRecorder' in window)
        },
        {
          name: 'WebAssembly',
          ok: 'WebAssembly' in window,
          value: yes('WebAssembly' in window)
        },
        {
          name: 'IndexedDB',
          ok: 'indexedDB' in window,
          value: yes('indexedDB' in window)
        },
        {
          name: 'Web MIDI',
          ok: !!navigator.requestMIDIAccess,
          value: yes(!!navigator.requestMIDIAccess)
        },
        {
          name: 'Cross-origin isolated',
          ok: crossOriginIsolated,
          value: String(crossOriginIsolated)
        },
        {
          name: 'CPU threads',
          ok: true,
          value: String(navigator.hardwareConcurrency || '—')
        },
        {
          name: 'Device memory',
          ok: true,
          value: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : '—'
        },
        { name: 'Platform', ok: true, value: navigator.platform || '—' }
      ];
    }
    bind() {
      this.q('#ovxpro-fab').onclick = () => this.q('#ovxpro-overlay').classList.add('open');
      this.q('#ovxpro-close').onclick = () => this.q('#ovxpro-overlay').classList.remove('open');
      this.q('#ovxpro-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'ovxpro-overlay') this.q('#ovxpro-overlay').classList.remove('open');
      });
      this.qa('.tab').forEach(
        (b) =>
          (b.onclick = () => {
            this.activeTab = b.dataset.tab;
            this.qa('.tab').forEach((x) => x.classList.toggle('active', x === b));
            this.qa('.page').forEach((x) => x.classList.toggle('active', x.dataset.page === this.activeTab));
            if (this.activeTab === 'diagnostics') this.refreshDiagnostics();
          })
      );
      this.q('#ovxpro-language').onchange = (e) => {
        this.settings.language = e.target.value;
        this.persist();
        this.render();
        this.bindBus();
        this.refreshDevices();
      };
      this.qa('[data-key]').forEach((el) => {
        const update = () => {
          const key = el.dataset.key;
          let val =
            el.type === 'checkbox'
              ? el.checked
              : el.type === 'range' || el.type === 'number'
                ? Number(el.value)
                : el.value;
          this.settings[key] = val;
          const out = this.q(`[data-value-for="${key}"]`);
          if (out) out.textContent = `${val}${el.dataset.suffix || ''}`;
          this.persist();
          this.engine.apply();
          this.tones.updateTone();
        };
        el.addEventListener('input', update);
        el.addEventListener('change', update);
      });
      this.q('#ovxpro-start').onclick = () => this.startEngine();
      this.q('#ovxpro-stop').onclick = () => this.engine.stop();
      this.q('#ovxpro-refresh').onclick = () => this.refreshDevices();
      this.q('#ovxpro-record').onclick = () => this.toggleRecording();
      this.q('#ovxpro-metro-play').onclick = () => this.metronome.start();
      this.q('#ovxpro-metro-stop').onclick = () => this.metronome.stop();
      this.q('#ovxpro-tone-play').onclick = () => this.tones.toneStart();
      this.q('#ovxpro-tone-stop').onclick = () => this.tones.toneStop();
      this.q('#ovxpro-drone-play').onclick = () => this.tones.droneStart();
      this.q('#ovxpro-drone-stop').onclick = () => this.tones.droneStop();
      this.qa('[data-midi]').forEach((k) => (k.onclick = () => this.tones.pingMidi(Number(k.dataset.midi))));
      this.q('#ovxpro-file').onchange = (e) => e.target.files?.[0] && this.analyzeFile(e.target.files[0]);
      this.qa('[data-preset]').forEach(
        (p) => (p.onclick = () => this.applyPreset(BUILTIN_PRESETS[p.dataset.preset], p.dataset.preset))
      );
      this.qa('[data-custom-preset]').forEach(
        (p) => (p.onclick = () => this.applyPreset(this.presets[p.dataset.customPreset], p.dataset.customPreset))
      );
      this.q('#ovxpro-save-preset').onclick = () => this.savePreset();
      this.q('#ovxpro-export').onclick = () =>
        downloadJSON(
          {
            type: 'OpenVoxProLabSettings',
            version: OVXPRO_VERSION,
            settings: this.settings
          },
          `openvox-pro-settings-${Date.now()}.json`
        );
      this.q('#ovxpro-import').onchange = (e) => e.target.files?.[0] && this.importSettings(e.target.files[0]);
      this.q('#ovxpro-reset').onclick = () => {
        this.settings = deepMerge(DEFAULTS, {});
        this.persist();
        this.render();
        this.bindBus();
        this.refreshDevices();
        this.toast('Settings reset');
      };
      this.q('#ovxpro-copy-diag').onclick = () =>
        navigator.clipboard
          ?.writeText(
            this.diagnostics()
              .map((v) => `${v.name}: ${v.value}`)
              .join('\n')
          )
          .then(() => this.toast('Copied'));
    }
    bindBus() {
      if (this._busBound) return;
      this._busBound = true;
      this.bus.on('engine', (s) => {
        this.engineActive = s.active;
        const status = this.q('#ovxpro-status');
        if (status) {
          status.textContent = s.active ? this.t('statusLive') : this.t('statusIdle');
          status.classList.toggle('live', s.active);
        }
        const rate = this.q('#ovxpro-rate');
        if (rate) rate.textContent = s.sampleRate ? `${s.sampleRate} Hz` : '—';
      });
      this.bus.on('frame', (f) => {
        this.lastFrame = f;
        this.updateMeters(f);
        this.drawVisuals(f);
      });
      this.bus.on('recording', (v) => {
        this.recording = v;
        const b = this.q('#ovxpro-record');
        if (b) b.textContent = v ? this.t('stopRecord') : this.t('record');
      });
    }
    async refreshDevices() {
      const select = this.q('[data-key="inputDeviceId"]');
      if (!select) return;
      try {
        const devices = await this.engine.devices(),
          current = this.settings.inputDeviceId;
        select.innerHTML =
          '<option value="">Default device</option>' +
          devices.map((d, i) => `<option value="${d.deviceId}">${d.label || `Microphone ${i + 1}`}</option>`).join('');
        select.value = current;
      } catch (e) {
        this.toast(e.message);
      }
    }
    async startEngine() {
      try {
        await this.engine.start();
        await this.refreshDevices();
        this.toast('Microphone started');
      } catch (e) {
        this.toast(e.message || String(e));
      }
    }
    async toggleRecording() {
      try {
        if (!this.recording) {
          await this.engine.startRecording();
          return;
        }
        const { blob, type } = await this.engine.stopRecording(),
          ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        saveBlob(blob, `openvox-pro-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`);
      } catch (e) {
        this.toast(e.message);
      }
    }
    updateMeters(f) {
      const rms = this.q('#ovxpro-rms'),
        peak = this.q('#ovxpro-peak'),
        pitch = this.q('#ovxpro-pitch'),
        meter = this.q('#ovxpro-meter'),
        tn = this.q('#ovxpro-tuner-note'),
        th = this.q('#ovxpro-tuner-hz'),
        dot = this.q('#ovxpro-tuner-dot');
      if (rms) rms.textContent = `${gainToDb(f.rms).toFixed(1)} dB`;
      if (peak) peak.textContent = `${gainToDb(f.peak).toFixed(1)} dB`;
      if (pitch) pitch.textContent = f.pitch.frequency ? `${f.pitch.note} · ${f.pitch.frequency.toFixed(1)} Hz` : '—';
      if (meter) meter.style.width = `${clamp(((gainToDb(f.rms) + 80) / 80) * 100, 0, 100)}%`;
      if (tn) tn.textContent = f.pitch.note || '—';
      if (th)
        th.textContent = f.pitch.frequency
          ? `${f.pitch.frequency.toFixed(2)} Hz · ${f.pitch.cents >= 0 ? '+' : ''}${f.pitch.cents.toFixed(1)} ct · ${Math.round(f.pitch.confidence * 100)}%`
          : '0.00 Hz · 0 ct';
      if (dot) dot.style.left = `${clamp(50 + f.pitch.cents / 2, 0, 100)}%`;
    }
    drawVisuals(f) {
      if (this.activeTab !== 'visual') return;
      const fps = clamp(Number(this.settings.visualizerFps) || 45, 10, 60),
        now = performance.now();
      if (this._lastVisual && now - this._lastVisual < 1000 / fps) return;
      this._lastVisual = now;
      this.drawScope(f);
      this.drawSpectrum(f);
      this.drawSpectrogram(f);
    }
    ctx2d(id) {
      const c = this.q(id);
      return c ? { c, x: c.getContext('2d') } : null;
    }
    drawScope(f) {
      const o = this.ctx2d('#ovxpro-scope');
      if (!o) return;
      const { c, x } = o,
        w = c.width,
        h = c.height;
      x.fillStyle = '#030817';
      x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(200,169,110,.18)';
      x.beginPath();
      x.moveTo(0, h / 2);
      x.lineTo(w, h / 2);
      x.stroke();
      x.strokeStyle = '#e8d0a0';
      x.lineWidth = 2;
      x.beginPath();
      for (let i = 0; i < f.time.length; i += Math.max(1, Math.floor(f.time.length / w))) {
        const px = (i / (f.time.length - 1)) * w,
          py = h / 2 - f.time[i] * h * 0.42;
        if (i === 0) x.moveTo(px, py);
        else x.lineTo(px, py);
      }
      x.stroke();
    }
    drawSpectrum(f) {
      const o = this.ctx2d('#ovxpro-spectrum');
      if (!o) return;
      const { c, x } = o,
        w = c.width,
        h = c.height;
      x.fillStyle = '#030817';
      x.fillRect(0, 0, w, h);
      const ny = f.sampleRate / 2,
        min = 20,
        max = Math.min(20000, ny),
        logMin = Math.log10(min),
        logMax = Math.log10(max);
      x.strokeStyle = '#6ea8ff';
      x.lineWidth = 2;
      x.beginPath();
      for (let i = 1; i < f.freq.length; i++) {
        const hz = (i * f.sampleRate) / f.fftSize;
        if (hz < min || hz > max) continue;
        const px = ((Math.log10(hz) - logMin) / (logMax - logMin)) * w,
          db = f.freq[i],
          py =
            h -
            clamp((db - this.settings.minDecibels) / (this.settings.maxDecibels - this.settings.minDecibels), 0, 1) * h;
        if (i === 1) x.moveTo(px, py);
        else x.lineTo(px, py);
      }
      x.stroke();
    }
    drawSpectrogram(f) {
      const o = this.ctx2d('#ovxpro-spectrogram');
      if (!o) return;
      const { c, x } = o,
        w = c.width,
        h = c.height,
        shift = Math.max(1, Number(this.settings.spectrogramSpeed) || 2);
      const img = x.getImageData(shift, 0, w - shift, h);
      x.putImageData(img, 0, 0);
      x.fillStyle = '#020611';
      x.fillRect(w - shift, 0, shift, h);
      const bins = f.freq.length,
        maxBin = Math.floor(Math.min(20000, f.sampleRate / 2) / (f.sampleRate / f.fftSize));
      for (let y = 0; y < h; y++) {
        const idx = Math.floor((1 - y / (h - 1)) * maxBin),
          db = f.freq[idx] ?? -120,
          n = clamp((db + 110) / 90, 0, 1),
          r = Math.floor(255 * Math.pow(n, 1.6)),
          g = Math.floor(180 * Math.pow(n, 0.9)),
          b = Math.floor(255 * (1 - n * 0.55));
        x.fillStyle = `rgb(${r},${g},${b})`;
        x.fillRect(w - shift, y, shift, 1);
      }
    }
    async analyzeFile(file) {
      const out = this.q('#ovxpro-analysis'),
        dom = this.q('#ovxpro-dominants');
      out.innerHTML = '<div class="analysis-cell"><span>Status</span><strong>Analyzing…</strong></div>';
      dom.innerHTML = '';
      try {
        const ctx = await this.context(),
          buf = await ctx.decodeAudioData(await file.arrayBuffer()),
          r = analyzeBuffer(buf, this.settings),
          t = (k) => this.t(k);
        out.innerHTML = [
          [t('duration'), `${r.duration.toFixed(2)} s`],
          [t('sampleRateDetected'), `${r.sampleRate} Hz`],
          [t('channelsDetected'), String(r.channels)],
          [t('rms'), `${gainToDb(r.rms).toFixed(2)} dBFS`],
          [t('peak'), `${gainToDb(r.peak).toFixed(2)} dBFS`],
          ['Crest factor', r.crest.toFixed(2)],
          [t('centroid'), formatHz(r.features.centroid)],
          [t('rolloff'), formatHz(r.features.rolloff)],
          [t('flatness'), r.features.flatness.toFixed(4)],
          ['Zero crossings', `${r.zeroCrossingRate.toFixed(1)}/s`]
        ]
          .map(([a, b]) => `<div class="analysis-cell"><span>${a}</span><strong>${b}</strong></div>`)
          .join('');
        dom.innerHTML = r.features.dominants
          .map((v) => `<span class="freq-chip">${formatHz(v.frequency)}</span>`)
          .join('');
      } catch (e) {
        out.innerHTML = `<div class="analysis-cell"><span>Error</span><strong>${e.message}</strong></div>`;
      }
    }
    applyPreset(preset, name) {
      Object.assign(this.settings, preset);
      this.persist();
      this.engine.apply();
      this.render();
      this.bindBus();
      this.refreshDevices();
      this.toast(`Preset: ${name}`);
    }
    savePreset() {
      const name = this.q('#ovxpro-preset-name').value.trim();
      if (!name) return this.toast('Enter preset name');
      this.presets[name] = { ...this.settings };
      localStorage.setItem(OVXPRO_PRESETS, JSON.stringify(this.presets));
      this.render();
      this.bindBus();
      this.refreshDevices();
      this.toast('Preset saved');
    }
    async importSettings(file) {
      try {
        const data = JSON.parse(await file.text()),
          value = data.settings || data;
        this.settings = deepMerge(this.settings, value);
        this.persist();
        this.render();
        this.bindBus();
        this.refreshDevices();
        this.toast('Settings imported');
      } catch (e) {
        this.toast(e.message);
      }
    }
    refreshDiagnostics() {
      const p = this.q('[data-page="diagnostics"]');
      if (!p) return;
      const active = this.activeTab;
      this.render();
      this.activeTab = active;
      this.qa('.tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === active));
      this.qa('.page').forEach((x) => x.classList.toggle('active', x.dataset.page === active));
      this.bindBus();
      this.refreshDevices();
    }
    persist() {
      localStorage.setItem(OVXPRO_STORE, JSON.stringify(this.settings));
    }
    toast(msg) {
      const el = this.q('#ovxpro-toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
    }
  }
  window.OpenVoxProLab = OpenVoxProLab;
  let openVoxProLabInstance = null;
  const mountOpenVoxProLab = () => {
    try {
      if (!openVoxProLabInstance) {
        openVoxProLabInstance = new OpenVoxProLab();
        openVoxProLabInstance.mount();
      }
      return openVoxProLabInstance;
    } catch (error) {
      console.error('OpenVox Pro Lab:', error);
      return null;
    }
  };
  window.openOpenVoxProLab = (tab = 'input') => {
    const instance = mountOpenVoxProLab();
    if (!instance || !instance.shadow) return;
    instance.activeTab = tab;
    instance.qa('.tab').forEach((node) => node.classList.toggle('active', node.dataset.tab === tab));
    instance.qa('.page').forEach((node) => node.classList.toggle('active', node.dataset.page === tab));
    const overlay = instance.q('#ovxpro-overlay');
    if (overlay) overlay.classList.add('open');
  };
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', mountOpenVoxProLab, { once: true });
  } else {
    mountOpenVoxProLab();
  }
})();
