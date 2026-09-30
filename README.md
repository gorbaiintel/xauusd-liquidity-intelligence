# XAUUSD Liquidity Intelligence

Full-stack starter khusus **XAUUSD spot** dengan data live OANDA, WebSocket ke UI, dan signal tree deterministik berbasis candle M1. Tidak ada `Math.random`, harga hardcoded, atau fallback mock. `WAIT` adalah hasil valid ketika gate belum terpenuhi; sistem tidak menjanjikan signal akurat atau profit.

## Setup OANDA
1. Buat akun OANDA Practice/Live dan token API.
2. Salin `.env.example` menjadi `.env`.
3. Isi `OANDA_ACCOUNT_ID`, `OANDA_ACCESS_TOKEN`, dan gunakan `OANDA_ENV=practice` untuk testing.
4. Pastikan akun/instrumen mendukung `XAU_USD`.

## Jalankan
```bash
npm install
npm run dev
```
Buka `http://localhost:8787`. Server mengambil candle live dari endpoint OANDA dan melakukan polling 5 detik. Untuk production, gunakan streaming pricing OANDA sesuai lisensi/limit akun dan jangan expose token ke APK.

## Android Studio / APK
```bash
npm run android:add      # sekali saja
npm run android:sync
npm run android:open
```
Di Android Studio pilih Build > Generate App Bundle/APK. Untuk device production, deploy API HTTPS dan ubah URL WebSocket di frontend menjadi URL API publik; secret OANDA wajib tetap di backend.

## Arsitektur signal tree
Data OANDA → candle M1 → trend SMA20/SMA50 → ATR/range → displacement → liquidity sweep → risk/data gates → LONG/SHORT/WAIT. Ini kerangka analitik, bukan nasihat investasi. Tambahkan backtest, spread filter, news/session filter, audit journal, dan validasi out-of-sample sebelum digunakan.
