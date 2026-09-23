# Penambahan Kolom Sakit (S), Tanpa Keterangan (TK), dan Dinas Luar (DL)

## Deskripsi Fitur

Menambahkan tiga kolom baru pada tabel data absensi di halaman Rekap Harian:
- **Sakit (S)** - Untuk mencatat pegawai yang sakit
- **Tanpa Keterangan (TK)** - Untuk mencatat pegawai yang tidak hadir tanpa keterangan
- **Dinas Luar (DL)** - Untuk mencatat pegawai yang sedang dinas luar

## Perubahan yang Dilakukan

### 1. Update Interface `AbsensiRecord` (src/types.ts)

```typescript
export interface AbsensiRecord {
  id: string;
  pegawaiId: string;
  tanggal: string;
  datang?: string;
  pulang?: string;
  izinKeluar?: string;
  izinMasuk?: string;
  keteranganIzin?: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alpha';
  sakit?: string;              // Baru: Waktu sakit (S)
  tanpaKeterangan?: string;    // Baru: Tanpa keterangan (TK)
  dinasLuar?: string;          // Baru: Dinas luar (DL)
}
```

### 2. Update Tabel Rekap Harian (src/App.tsx)

Menambahkan tiga kolom baru pada header tabel:
- **Sakit (S)** - Warna orange
- **Tanpa Keterangan (TK)** - Warna red
- **Dinas Luar (DL)** - Warna indigo

```typescript
<thead className="bg-gray-50">
  <tr>
    <th>No</th>
    <th>Nama</th>
    <th>Status</th>
    <th>Datang</th>
    <th>Izin Keluar</th>
    <th>Izin Masuk</th>
    <th>Pulang</th>
    <th className="text-orange-700">Sakit (S)</th>        {/* Baru */}
    <th className="text-red-700">Tanpa Keterangan (TK)</th> {/* Baru */}
    <th className="text-indigo-700">Dinas Luar (DL)</th>    {/* Baru */}
    <th>Keterangan</th>
    <th>Aksi</th>
  </tr>
</thead>
```

### 3. Update Halaman Absensi (src/App.tsx)

#### a. Tambah Tipe Absensi Baru

```typescript
const [absenType, setAbsenType] = useState<
  'datang' | 'pulang' | 'izinKeluar' | 'izinMasuk' | 
  'sakit' | 'tanpaKeterangan' | 'dinasLuar'
>('datang');
```

#### b. Tambah Tombol Jenis Absensi

```typescript
{[
  { value: 'datang', label: 'Datang', icon: '🌅', ... },
  { value: 'pulang', label: 'Pulang', icon: '🌆', ... },
  { value: 'izinKeluar', label: 'Izin Keluar', icon: '🚶', ... },
  { value: 'izinMasuk', label: 'Izin Masuk', icon: '🏠', ... },
  { value: 'sakit', label: 'Sakit (S)', icon: '🤒', 
    gradient: 'linear-gradient(135deg, #fb923c20, #f97316 20)', 
    active: 'linear-gradient(135deg, #fb923c, #f97316)' },
  { value: 'tanpaKeterangan', label: 'Tanpa Ket. (TK)', icon: '❌', 
    gradient: 'linear-gradient(135deg, #ef444420, #dc262620)', 
    active: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  { value: 'dinasLuar', label: 'Dinas Luar (DL)', icon: '🚗', 
    gradient: 'linear-gradient(135deg, #6366f120, #4f46e520)', 
    active: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
].map(type => (
  // ... button rendering
))}
```

#### c. Update Fungsi `processAbsen`

```typescript
const processAbsen = useCallback((pegawaiId: string) => {
  // ... existing code ...
  
  if (absenType === 'datang') {
    record.datang = now;
    setMessage(`Absen Datang berhasil dicatat`);
  } else if (absenType === 'pulang') {
    record.pulang = now;
    setMessage(`Absen Pulang berhasil dicatat`);
  } else if (absenType === 'izinKeluar') {
    record.izinKeluar = now;
    record.keteranganIzin = keterangan;
    setMessage(`Izin Keluar berhasil dicatat`);
  } else if (absenType === 'izinMasuk') {
    record.izinMasuk = now;
    setMessage(`Izin Masuk berhasil dicatat`);
  } else if (absenType === 'sakit') {
    record.sakit = now;
    record.status = 'sakit';
    record.keteranganIzin = keterangan;
    setMessage(`Sakit (S) berhasil dicatat`);
  } else if (absenType === 'tanpaKeterangan') {
    record.tanpaKeterangan = now;
    record.status = 'alpha';
    setMessage(`Tanpa Keterangan (TK) berhasil dicatat`);
  } else if (absenType === 'dinasLuar') {
    record.dinasLuar = now;
    record.keteranganIzin = keterangan;
    setMessage(`Dinas Luar (DL) berhasil dicatat`);
  }
  
  // ... rest of the code ...
}, [absenType, keterangan, pegawai, audioEnabled]);
```

#### d. Update Form Keterangan

```typescript
{(absenType === 'izinKeluar' || absenType === 'sakit' || absenType === 'dinasLuar') && (
  <div className="mt-5 animate-fade-in-up">
    <label className="block text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wider">
      {absenType === 'izinKeluar' && 'Keterangan Izin'}
      {absenType === 'sakit' && 'Keterangan Sakit'}
      {absenType === 'dinasLuar' && 'Keterangan Dinas Luar'}
    </label>
    <textarea
      value={keterangan}
      onChange={e => setKeterangan(e.target.value)}
      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
      placeholder={
        absenType === 'izinKeluar' ? 'Masukkan keterangan izin keluar...' :
        absenType === 'sakit' ? 'Masukkan keterangan sakit...' :
        'Masukkan keterangan dinas luar...'
      }
      rows={3}
    />
  </div>
)}
```

#### e. Update Notifikasi

```typescript
<div className="flex items-center gap-2">
  <span className="text-sm font-semibold text-gray-600">Jenis:</span>
  <span className="text-sm font-bold text-green-700 capitalize">
    {absenType === 'datang' && '🌅 Datang'}
    {absenType === 'pulang' && '🌆 Pulang'}
    {absenType === 'izinKeluar' && '🚶 Izin Keluar'}
    {absenType === 'izinMasuk' && '🏠 Izin Masuk'}
    {absenType === 'sakit' && '🤒 Sakit (S)'}
    {absenType === 'tanpaKeterangan' && '❌ Tanpa Keterangan (TK)'}
    {absenType === 'dinasLuar' && '🚗 Dinas Luar (DL)'}
  </span>
</div>
```

## Struktur Tabel Baru

| No | Nama | Status | Datang | Izin Keluar | Izin Masuk | Pulang | Sakit (S) | Tanpa Ket. (TK) | Dinas Luar (DL) | Keterangan | Aksi |
|----|------|--------|--------|-------------|------------|--------|-----------|-----------------|-----------------|------------|------|
| 1 | Budi Santoso | ✅ Hadir | 07:30 | - | - | 15:00 | - | - | - | - | 🗑️ |
| 2 | Siti Nurhaliza | ✅ Hadir | 07:45 | 10:00 | 10:30 | 15:15 | - | - | - | - | 🗑️ |
| 3 | Ahmad Dahlan | ❌ Belum | - | - | - | - | 08:00 | - | - | Flu | 🗑️ |
| 4 | Dewi Lestari | ✅ Hadir | 07:20 | - | - | 14:45 | - | - | 09:00 | Rapat di Dinas | 🗑️ |
| 5 | Eko Prasetyo | ❌ Belum | - | - | - | - | - | 08:00 | - | - | 🗑️ |

## Cara Penggunaan

### 1. Mencatat Sakit (S)
1. Buka halaman **Absensi Pegawai**
2. Pilih jenis absensi **🤒 Sakit (S)**
3. Masukkan ID pegawai atau scan QR code
4. Isi keterangan sakit (opsional)
5. Klik **🚀 Proses Absensi**

### 2. Mencatat Tanpa Keterangan (TK)
1. Buka halaman **Absensi Pegawai**
2. Pilih jenis absensi **❌ Tanpa Ket. (TK)**
3. Masukkan ID pegawai atau scan QR code
4. Klik **🚀 Proses Absensi**

### 3. Mencatat Dinas Luar (DL)
1. Buka halaman **Absensi Pegawai**
2. Pilih jenis absensi **🚗 Dinas Luar (DL)**
3. Masukkan ID pegawai atau scan QR code
4. Isi keterangan dinas luar (opsional)
5. Klik **🚀 Proses Absensi**

### 4. Melihat di Rekap Harian
1. Buka halaman **Rekap Harian**
2. Pilih tanggal yang diinginkan
3. Lihat kolom **Sakit (S)**, **Tanpa Keterangan (TK)**, dan **Dinas Luar (DL)**
4. Data akan ditampilkan dengan warna sesuai jenis absensi

## Fitur Tambahan

### Audio Ucapan
Setiap kali absensi berhasil dicatat (termasuk S, TK, DL), sistem akan mengucapkan:
> "Terima Kasih [Nama Pegawai], Absen Anda Telah Berhasil"

### Visual Indicator
- **Sakit (S)**: Warna orange pada kolom header dan data
- **Tanpa Keterangan (TK)**: Warna red pada kolom header dan data
- **Dinas Luar (DL)**: Warna indigo pada kolom header dan data

### Form Keterangan Dinamis
- **Izin Keluar**: "Masukkan keterangan izin keluar..."
- **Sakit**: "Masukkan keterangan sakit..."
- **Dinas Luar**: "Masukkan keterangan dinas luar..."

## Status Absensi

| Status | Kode | Keterangan |
|--------|------|------------|
| Hadir | - | Pegawai hadir bekerja |
| Izin | izinKeluar/izinMasuk | Pegawai izin keluar/masuk |
| Sakit | sakit | Pegawai sakit |
| Alpha | tanpaKeterangan | Pegawai tidak hadir tanpa keterangan |
| Dinas Luar | dinasLuar | Pegawai dinas luar |

## Testing

### Test Cases
- ✅ Kolom Sakit (S) muncul di tabel Rekap Harian
- ✅ Kolom Tanpa Keterangan (TK) muncul di tabel Rekap Harian
- ✅ Kolom Dinas Luar (DL) muncul di tabel Rekap Harian
- ✅ Tombol Sakit (S) muncul di halaman Absensi
- ✅ Tombol Tanpa Keterangan (TK) muncul di halaman Absensi
- ✅ Tombol Dinas Luar (DL) muncul di halaman Absensi
- ✅ Data Sakit (S) tersimpan dengan benar
- ✅ Data Tanpa Keterangan (TK) tersimpan dengan benar
- ✅ Data Dinas Luar (DL) tersimpan dengan benar
- ✅ Form keterangan muncul untuk Sakit dan Dinas Luar
- ✅ Notifikasi menampilkan jenis absensi yang benar
- ✅ Audio ucapan berfungsi untuk semua jenis absensi
- ✅ Warna kolom sesuai dengan jenis absensi

### Edge Cases
- ✅ Pegawai dengan multiple absensi dalam satu hari
- ✅ Pegawai yang sakit dan juga dinas luar
- ✅ Data kosong untuk kolom S, TK, DL
- ✅ Export data dengan kolom baru

## Build Status

✅ **Build berhasil tanpa error**

```
✓ 1357 modules transformed.
✓ built in 16.26s
```

## Kesimpulan

Fitur kolom Sakit (S), Tanpa Keterangan (TK), dan Dinas Luar (DL) telah berhasil ditambahkan ke:
1. **Interface `AbsensiRecord`** - Menambahkan field baru
2. **Tabel Rekap Harian** - Menampilkan data S, TK, DL
3. **Halaman Absensi** - Menambahkan tombol dan form untuk input S, TK, DL
4. **Notifikasi** - Menampilkan jenis absensi yang benar
5. **Audio Ucapan** - Berfungsi untuk semua jenis absensi

Semua fitur berfungsi dengan baik dan build berhasil tanpa error.
