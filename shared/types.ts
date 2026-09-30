export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number; complete?: boolean };
export type SignalDecision = 'LONG' | 'SHORT' | 'WAIT';
export type SignalNode = { id: string; label: string; passed: boolean; score: number; detail: string };
export type Signal = { decision: SignalDecision; score: number; reasons: string[]; gates: Record<string, boolean>; tree: SignalNode[]; metrics: { atr: number; spread: number; trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; session: string; riskReward: number }; generatedAt: number };
export type FeedState = { connected: boolean; source: string; instrument: 'XAU_USD'; lastTickAt: number | null; lastFrameAt: number | null; streamQuiet: boolean; bid: number | null; ask: number | null; spread: number | null; error?: string };
export type Snapshot = { candle: Candle; candles: Candle[]; signal: Signal; feed: FeedState };
