class OpenVoxAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frameSize = 2048;
    this.buffer = new Float32Array(this.frameSize);
    this.offset = 0;
    this.prevInput = 0;
    this.prevOutput = 0;
    this.noiseFloor = 0.008;
    this.gateMultiplier = 1.8;
    this.processingMode = 'vocal';
    this.processedEnergy = 0;
    this.analysisEnergy = 0;
    this.gateEnvelope = 1;
    this.port.onmessage = (event) => {
      const data = event.data || {};
      if (typeof data.noiseFloor === 'number') this.noiseFloor = Math.max(0.0001, data.noiseFloor);
      if (typeof data.gateMultiplier === 'number') this.gateMultiplier = Math.max(1, data.gateMultiplier);
      if (typeof data.processingMode === 'string') this.processingMode = data.processingMode;
    };
  }

  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];
    if (!input) return true;

    for (let i = 0; i < input.length; i++) {
      const raw = input[i];
      const highPassed = raw - this.prevInput + 0.995 * this.prevOutput;
      this.prevInput = raw;
      this.prevOutput = highPassed;

      let sample = this.processingMode === 'raw' ? raw : highPassed;
      const analysisSample = this.processingMode === 'raw' ? raw : highPassed;

      if (this.processingMode !== 'raw') {
        const modeStrength = this.processingMode === 'noisy' ? 1.35 : this.processingMode === 'custom' ? 1.0 : 0.85;
        const threshold = this.noiseFloor * this.gateMultiplier * modeStrength;
        const abs = Math.abs(highPassed);
        const normalized = Math.max(0, Math.min(1, (abs - threshold * 0.35) / Math.max(threshold * 0.9, 1e-6)));
        const targetGate = this.processingMode === 'noisy' ? normalized * normalized : Math.sqrt(normalized);
        const coefficient = targetGate > this.gateEnvelope ? 0.32 : 0.045;
        this.gateEnvelope += (targetGate - this.gateEnvelope) * coefficient;
        sample = highPassed * this.gateEnvelope;
      }

      if (output) output[i] = sample;
      this.processedEnergy += sample * sample;
      this.analysisEnergy += analysisSample * analysisSample;
      this.buffer[this.offset++] = sample;

      if (this.offset >= this.frameSize) {
        const frame = this.buffer.slice();
        this.port.postMessage({
          type: 'frame',
          frame,
          rms: Math.sqrt(this.processedEnergy / this.frameSize),
          inputRms: Math.sqrt(this.analysisEnergy / this.frameSize)
        }, [frame.buffer]);
        this.offset = 0;
        this.processedEnergy = 0;
        this.analysisEnergy = 0;
      }
    }
    return true;
  }
}

registerProcessor('openvox-audio-processor', OpenVoxAudioProcessor);
