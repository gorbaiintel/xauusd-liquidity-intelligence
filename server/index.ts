import 'dotenv/config';
import express from 'express'; import cors from 'cors'; import { WebSocketServer, WebSocket } from 'ws'; import http from 'node:http'; import { OandaFeed } from './oandaFeed.js'; import { analyze } from './signalTree.js';
const app = express(); app.use(cors()); app.use(express.json()); const server = http.createServer(app); const wss = new WebSocketServer({ server, path: '/ws' }); const feed = new OandaFeed('XAU_USD'); const clients = new Set<WebSocket>();
function snapshot() { const candles = feed.getCandles(); const candle = candles.at(-1); if (!candle) return null; const signal = analyze(candles); signal.metrics.spread = feed.state().spread ?? 0; return { candle, candles, signal, feed: feed.state() }; }
let lastBroadcast = 0; feed.onUpdate(() => { const data = snapshot(); if (!data || Date.now() - lastBroadcast < 250) return; lastBroadcast = Date.now(); const msg = JSON.stringify(data); clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); }); });
wss.on('connection', ws => { clients.add(ws); const data = snapshot(); if (data) ws.send(JSON.stringify(data)); ws.on('close', () => clients.delete(ws)); });
app.get('/api/health', (_req, res) => res.json(feed.state())); app.get('/api/snapshot', (_req, res) => { const data = snapshot(); data ? res.json(data) : res.status(503).json({ error: 'Menunggu data OANDA live' }); });
feed.start().catch(error => console.error('OANDA startup:', error)); const port = Number(process.env.PORT || 8787); server.listen(port, () => console.log(`XAUUSD server listening on ${port}`));
