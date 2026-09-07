import { ResonatorBank } from './resonator.ts';
import type { Strike } from './resonator.ts';

declare const sampleRate: number;
declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  abstract process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean;
}
declare function registerProcessor(name: string, processor: typeof AudioWorkletProcessor): void;

class FieldResonator extends AudioWorkletProcessor {
  private readonly bank = new ResonatorBank(sampleRate);

  constructor() {
    super();
    this.port.onmessage = (message: MessageEvent<{ type: string; strike?: Strike }>) => {
      if (message.data.type === 'reset') this.bank.reset();
      if (message.data.type === 'strike' && message.data.strike) this.bank.strike(message.data.strike);
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const channels = outputs[0];
    if (channels?.[0] && channels[1]) this.bank.render(channels[0], channels[1]);
    return true;
  }
}

registerProcessor('field-resonator', FieldResonator);
