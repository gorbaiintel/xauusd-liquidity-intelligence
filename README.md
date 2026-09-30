# XAUUSD Liquidity Intelligence — Pro

Aplikasi ini hanya untuk **XAUUSD spot** dan menggunakan data resmi akun OANDA. Tidak ada harga random, mock candle, atau fallback sintetis.

## Yang ditambahkan pada versi pro
- OANDA Pricing **stream** untuk bid/ask real-time, bukan polling harga buatan.
- Riwayat 300 candle M1 dari OANDA, lalu candle berjalan diperbarui oleh tick stream.
- Reconnect otomatis dan indikator `lastFrameAt`, `streamQuiet`, bid, ask, spread.
- Signal Tree fail-closed: live data → trend alignment → liquidity sweep → displacement → FVG → session filter → risk gate.
- Setiap node memiliki status, skor, dan alasan yang bisa diaudit.
- Frontend menampilkan LONG/SHORT/WAIT, score, spread, ATR, session, dan status stream.
- Android tetap aman: API key OANDA hanya di backend; APK tidak pernah menyimpan token.

## Menjalankan lokal
```bash
cp .env.example .env
# isi OANDA_ENV, OANDA_ACCOUNT_ID, OANDA_ACCESS_TOKEN
npm install
npm run typecheck
npm run dev
```
Buka `http://localhost:8787`. Akun Practice disarankan untuk validasi awal. Instrumen harus tersedia di akun sebagai `XAU_USD`.

## Deploy untuk APK
Deploy backend pada URL HTTPS publik (misalnya `https://api.example.com`), lalu build frontend dengan `VITE_API_BASE_URL=https://api.example.com`. Jangan memasukkan token OANDA ke Vite, Capacitor, atau APK.

```bash
VITE_API_BASE_URL=https://api.example.com npm run build
npm run android:add       # sekali
npm run android:sync
npm run android:open
```
Di Android Studio gunakan **Build → Generate Signed Bundle / APK**. Backend harus mengizinkan origin aplikasi dan endpoint WebSocket `/ws` harus tersedia melalui TLS (`wss://`).

## Batasan dan validasi
Signal ini adalah engine deterministik untuk riset, bukan jaminan akurasi, rekomendasi, atau nasihat investasi. Sebelum live trading, tambahkan backtest candle historis, spread/slippage, news filter, session rules yang tervalidasi, journal, paper trading, monitoring, rate-limit, dan test out-of-sample. Jangan gunakan output otomatis untuk mengeksekusi order tanpa kontrol risiko terpisah.
