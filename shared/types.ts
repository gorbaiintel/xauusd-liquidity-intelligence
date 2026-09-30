export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type Signal = { decision: 'LONG' | 'SHORT' | 'WAIT'; score: number; reasons: string[]; gates: Record<string, boolean>; generatedAt: number };
export type FeedState = { connected: boolean; source: string; instrument: 'XAU_USD'; lastTickAt: number | null; error?: string };
export type Snapshot = { candle: Candle; candles: Candle[]; signal: Signal; feed: FeedState };
