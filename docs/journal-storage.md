# Persisted signal journal

Signal Journal sekarang disimpan secara persisten di SQLite, bukan lagi di memory proses.

## Konfigurasi
Tambahkan ke `.env` bila perlu:

```env
JOURNAL_DB_PATH=./data/xauusd.sqlite
```

Database dibuat otomatis saat server start. Folder `data/` dan file SQLite tidak di-commit karena dapat berisi data operasional.

## Perubahan perilaku
- Journal bertahan setelah server restart.
- Endpoint `GET /api/journal` membaca maksimum 200 entri terakhir.
- WebSocket snapshot membawa maksimum 50 entri terakhir.
- Record dideduplikasi berdasarkan candle, keputusan, dan score.
- Retensi otomatis dibatasi hingga 200 entri.

## Instalasi dan migrasi
Jika memakai clone terbaru:

```bash
npm install
npm run typecheck
npm run dev
```

Jika ada journal lama yang masih berada di memory, journal tersebut tidak dapat dipulihkan karena sebelumnya tidak pernah ditulis ke storage. Semua evaluasi baru akan tersimpan ke SQLite.

Untuk production multi-instance, gunakan PostgreSQL terkelola sebagai pengganti SQLite atau pastikan hanya satu instance menulis file database.
