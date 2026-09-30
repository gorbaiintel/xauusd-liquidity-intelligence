import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'node:http';
import { mkdir } from 'node:fs/promises';
import { OandaFeed } from './oandaFeed.js';
import { analyze } from './signalTree.js';
import { JournalStore } from './journalStore.js';

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const feed = new OandaFeed('XAU_USD');
const journalStore = new JournalStore();
const clients = new Set<WebSocket>();
let lastBroadcast = 0;
let journalWriteKey = '';

async function snapshot() {
  const candles = feed.getCandles();
  const candle = candles.at(-1);
  if (!candle) return null;
  const signal = analyze(candles);
  const state = feed.state();
  signal.metrics.spread = state.spread ?? 0;
  return { candle, candles, signal, feed: state, journal: await journalStore.recent(50) };
}

async function broadcast() {
  const data = await snapshot();
  if (!data || Date.now() - lastBroadcast < 250) return;
  const journalKey = `${data.candle.time}:${data.signal.decision}:${data.signal.score}`;
  if (journalKey !== journalWriteKey) {
    journalWriteKey = journalKey;
    await journalStore.record(data.candle.time, data.signal, data.candle.close);
    data.journal = await journalStore.recent(50);
  }
  lastBroadcast = Date.now();
  const message = JSON.stringify(data);
  clients.forEach(client => { if (client.readyState === WebSocket.OPEN) client.send(message); });
}

wss.on('connection', async ws => {
  clients.add(ws);
  const data = await snapshot();
  if (data) ws.send(JSON.stringify(data));
  ws.on('close', () => clients.delete(ws));
});

app.get('/api/health', (_req, res) => res.json(feed.state()));
app.get('/api/journal', async (_req, res) => res.json(await journalStore.recent(200)));
app.get('/api/snapshot', async (_req, res) => { const data = await snapshot(); data ? res.json(data) : res.status(503).json({ error: 'Menunggu data OANDA live' }); });

async function start() {
  const dbPath = process.env.JOURNAL_DB_PATH || './data/xauusd.sqlite';
  await mkdir(dbPath.includes('/') ? dbPath.slice(0, dbPath.lastIndexOf('/')) : '.', { recursive: true });
  await journalStore.open();
  feed.onUpdate(() => { void broadcast().catch(error => console.error('Broadcast:', error)); });
  await feed.start();
  const port = Number(process.env.PORT || 8787);
  server.listen(port, () => console.log(`XAUUSD server listening on ${port}`));
}

start().catch(error => { console.error('Startup failed:', error); process.exitCode = 1; });
process.once('SIGTERM', () => { void journalStore.close(); server.close(); });
process.once('SIGINT', () => { void journalStore.close(); server.close(); });
