import https from 'node:https';
import { EventEmitter } from 'node:events';
import type { Candle, FeedState } from '../shared/types.js';
export class OandaFeed extends EventEmitter {
  private candles: Candle[] = []; private timer?: NodeJS.Timeout; private lastTick: number | null = null; private error?: string;
  constructor(private instrument: 'XAU_USD') { super(); }
  private base() { return process.env.OANDA_ENV === 'live' ? 'api-fxtrade.oanda.com' : 'api-fxpractice.oanda.com'; }
  private request(path: string): Promise<any> { return new Promise((resolve, reject) => { const token = process.env.OANDA_ACCESS_TOKEN; const id = process.env.OANDA_ACCOUNT_ID; if (!token || !id || token.startsWith('replace')) return reject(new Error('OANDA_ACCOUNT_ID and OANDA_ACCESS_TOKEN are required')); const req = https.request({ hostname: this.base(), path, headers: { Authorization: `Bearer ${token}` } }, r => { let body = ''; r.on('data', x => body += x); r.on('end', () => r.statusCode && r.statusCode < 300 ? resolve(JSON.parse(body)) : reject(new Error(`OANDA HTTP ${r.statusCode}: ${body}`))); }); req.on('error', reject); req.end(); }); }
  async start() { await this.poll(); this.timer = setInterval(() => this.poll().catch(e => { this.error = String(e.message); this.emit('update'); }), 5000); }
  private async poll() { const q = `/v3/instruments/${this.instrument}/candles?granularity=M1&count=300&price=M`; const data = await this.request(q); this.candles = (data.candles || []).filter((x: any) => x.complete !== false).map((x: any) => ({ time: Date.parse(x.time), open: +x.mid.o, high: +x.mid.h, low: +x.mid.l, close: +x.mid.c, volume: x.volume })); this.lastTick = Date.now(); this.error = undefined; this.emit('update'); }
  onUpdate(fn: () => void) { this.on('update', fn); }
  getCandles() { return this.candles; }
  state(): FeedState { return { connected: this.candles.length > 0 && !!this.lastTick, source: 'OANDA REST live candles', instrument: this.instrument, lastTickAt: this.lastTick, ...(this.error ? { error: this.error } : {}) }; }
}
