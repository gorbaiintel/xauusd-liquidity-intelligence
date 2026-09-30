import https from 'node:https';
import { EventEmitter } from 'node:events';
import type { Candle, FeedState } from '../shared/types.js';

type OandaResponse = { candles?: Array<{ time: string; complete?: boolean; volume: number; mid: { o: string; h: string; l: string; c: string } }> };

export class OandaFeed extends EventEmitter {
  private candles: Candle[] = [];
  private stream?: import('node:stream').Readable;
  private lastTick: number | null = null;
  private lastFrame: number | null = null;
  private bid: number | null = null;
  private ask: number | null = null;
  private error?: string;
  private reconnectTimer?: NodeJS.Timeout;
  constructor(private readonly instrument: 'XAU_USD') { super(); }
  private host() { return process.env.OANDA_ENV === 'live' ? 'api-fxtrade.oanda.com' : 'api-fxpractice.oanda.com'; }
  private token() { const token = process.env.OANDA_ACCESS_TOKEN; const id = process.env.OANDA_ACCOUNT_ID; if (!token || !id || token.startsWith('replace')) throw new Error('OANDA_ACCOUNT_ID dan OANDA_ACCESS_TOKEN wajib diisi'); return { token, id }; }
  private request(path: string): Promise<OandaResponse> { return new Promise((resolve, reject) => { let auth; try { auth = this.token(); } catch (e) { reject(e); return; } const req = https.request({ hostname: this.host(), path, headers: { Authorization: `Bearer ${auth.token}`, Accept: 'application/json' } }, res => { let body = ''; res.setEncoding('utf8'); res.on('data', chunk => body += chunk); res.on('end', () => res.statusCode && res.statusCode < 300 ? resolve(JSON.parse(body) as OandaResponse) : reject(new Error(`OANDA HTTP ${res.statusCode}: ${body.slice(0, 300)}`))); }); req.on('error', reject); req.end(); }); }
  async start() { await this.loadHistory(); this.connectStream(); }
  private async loadHistory() { const data = await this.request(`/v3/instruments/${this.instrument}/candles?granularity=M1&count=300&price=M`); this.candles = (data.candles ?? []).map(x => ({ time: Date.parse(x.time), open: +x.mid.o, high: +x.mid.h, low: +x.mid.l, close: +x.mid.c, volume: x.volume, complete: x.complete })); this.error = undefined; this.emit('update'); }
  private connectStream() { let auth; try { auth = this.token(); } catch (e) { this.error = String((e as Error).message); this.emit('update'); return; } const req = https.get({ hostname: this.host(), path: `/v3/accounts/${auth.id}/pricing/stream?instruments=${this.instrument}`, headers: { Authorization: `Bearer ${auth.token}`, Accept: 'application/octet-stream' } }, res => { this.stream = res; let buffer = ''; res.setEncoding('utf8'); res.on('data', chunk => { buffer += chunk; const lines = buffer.split('\n'); buffer = lines.pop() ?? ''; for (const line of lines) if (line.trim()) this.handleFrame(line); }); res.on('end', () => this.scheduleReconnect(new Error('OANDA stream closed'))); res.on('error', e => this.scheduleReconnect(e)); }); req.on('error', e => this.scheduleReconnect(e)); }
  private handleFrame(line: string) { try { const frame = JSON.parse(line) as { type?: string; bids?: Array<{ price: string }>; asks?: Array<{ price: string }>; time?: string }; this.lastFrame = Date.now(); if (frame.type !== 'PRICE' || !frame.bids?.[0] || !frame.asks?.[0]) { this.emit('update'); return; } this.bid = +frame.bids[0].price; this.ask = +frame.asks[0].price; const price = (this.bid + this.ask) / 2; const time = frame.time ? Date.parse(frame.time) : Date.now(); this.lastTick = time; this.upsertTick(time, price); this.error = undefined; this.emit('update'); } catch { /* OANDA may send non-JSON keepalive bytes; liveness is still tracked by frames */ } }
  private upsertTick(time: number, price: number) { const minute = Math.floor(time / 60000) * 60000; const current = this.candles.at(-1); if (!current || current.time !== minute) { this.candles.push({ time: minute, open: price, high: price, low: price, close: price, volume: 1, complete: false }); if (this.candles.length > 500) this.candles.shift(); return; } current.high = Math.max(current.high, price); current.low = Math.min(current.low, price); current.close = price; current.volume += 1; current.complete = false; }
  private scheduleReconnect(error: Error) { this.error = error.message; this.stream = undefined; this.emit('update'); clearTimeout(this.reconnectTimer); this.reconnectTimer = setTimeout(() => this.connectStream(), 3000); }
  onUpdate(fn: () => void) { this.on('update', fn); }
  getCandles() { return this.candles; }
  state(): FeedState { const now = Date.now(); return { connected: !!this.lastFrame && now - this.lastFrame < 65000, source: 'OANDA pricing stream', instrument: this.instrument, lastTickAt: this.lastTick, lastFrameAt: this.lastFrame, streamQuiet: !!this.lastFrame && now - this.lastFrame > 15000, bid: this.bid, ask: this.ask, spread: this.bid !== null && this.ask !== null ? this.ask - this.bid : null, ...(this.error ? { error: this.error } : {}) }; }
}
