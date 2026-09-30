# XAUUSD Liquidity Intelligence — Premium UI v1.2

Update ini menambahkan UI premium yang lebih siap desktop maupun Android:

- Candlestick chart SVG asli dari candle OANDA (wick, body, grid, live price line), tanpa chart random.
- Signal Tree 6 node: live feed, trend alignment, liquidity sweep, displacement, FVG context, session filter.
- Panel market context: bid, ask, spread, trend, session, ATR, risk/reward, tick age.
- Signal Journal in-memory untuk audit evaluasi signal terbaru.
- Layout responsive untuk layar kecil dan Android WebView.
- WebSocket live tetap memakai OANDA backend; API key tidak pernah masuk APK.

## Jalankan
```bash
cp .env.example .env
npm install
npm run typecheck
npm run dev
```
Buka `http://localhost:8787`.

## Build Android Studio
Backend harus di-deploy lebih dahulu ke HTTPS, misalnya `https://api.example.com`. Lalu:
```bash
VITE_API_BASE_URL=https://api.example.com npm run build
npm run android:add       # sekali saja
npm run android:sync
npm run android:open
```
Di Android Studio: **Build → Generate Signed Bundle / APK**. WebSocket publik harus tersedia sebagai `wss://api.example.com/ws`; secret OANDA hanya berada di backend.

## Catatan journal
Journal saat ini adalah audit trail memori proses dan akan hilang ketika server restart. Untuk production, simpan ke PostgreSQL/SQLite dengan retention policy dan tambahkan autentikasi pengguna.

## Peringatan
Signal LONG/SHORT/WAIT adalah output riset deterministik, bukan jaminan profit atau nasihat investasi. Validasi dengan backtest, spread/slippage, paper trading, out-of-sample test, dan kontrol risiko independen sebelum penggunaan live.
