import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'node:http';
import { OandaFeed } from './oandaFeed.js';
import { analyze } from './signalTree.js';

const app = express(); app.use(cors()); app.use(express.json());
const server = http.createServer(app); const wss = new WebSocketServer({ server, path: '/ws' });
const feed = new OandaFeed('XAU_USD');
let clients = new Set<WebSocket>();
function snapshot() { const candles = feed.getCandles(); const candle = candles.at(-1); return candle ? { candle, candles, signal: analyze(candles), feed: feed.state() } : null; }
feed.onUpdate(() => { const data = snapshot(); if (!data) return; const msg = JSON.stringify(data); clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); }); });
wss.on('connection', ws => { clients.add(ws); const data = snapshot(); if (data) ws.send(JSON.stringify(data)); ws.on('close', () => clients.delete(ws)); });
app.get('/api/health', (_req, res) => res.json(feed.state()));
app.get('/api/snapshot', (_req, res) => { const data = snapshot(); data ? res.json(data) : res.status(503).json({ error: 'Waiting for OANDA data' }); });
feed.start().catch(err => console.error('OANDA feed failed:', err));
const port = Number(process.env.PORT || 8787); server.listen(port, () => console.log(`XAUUSD server listening on ${port}`));
