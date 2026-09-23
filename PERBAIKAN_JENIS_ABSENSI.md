# Perbaikan Jenis Absensi pada Halaman Absensi Pegawai

## Ringkasan Perubahan

Menghilangkan tombol dan fitur untuk:
1. **Sakit (S)** 🤒
2. **Tanpa Keterangan (TK)** ❌
3. **Dinas Luar (DL)** 🚗

## Detail Perubahan

### 1. State Type Definition

**Sebelum:**
```typescript
const [absenType, setAbsenType] = useState<
  'datang' | 'pulang' | 'izinKeluar' | 'izinMasuk' | 
  'sakit' | 'tanpaKeterangan' | 'dinasLuar'
>('datang');
```

**Sesudah:**
```typescript
const [absenType, setAbsenType] = useState<
  'datang' | 'pulang' | 'izinKeluar' | 'izinMasuk'
>('datang');
```

### 2. Logika processAbsen

**Sebelum:**
```typescript
if (absenType === 'datang') {
  record.datang = now;
  setMessage(`Absen Datang berhasil dicatat`);
  setMessageType('success');
} else if (absenType === 'pulang') {
  record.pulang = now;
  setMessage(`Absen Pulang berhasil dicatat`);
  setMessageType('success');
} else if (absenType === 'izinKeluar') {
  record.izinKeluar = now;
  record.keteranganIzin = keterangan;
  setMessage(`Izin Keluar berhasil dicatat`);
  setMessageType('success');
} else if (absenType === 'izinMasuk') {
  record.izinMasuk = now;
  setMessage(`Izin Masuk berhasil dicatat`);
  setMessageType('success');
} else if (absenType === 'sakit') {
  record.sakit = now;
  record.status = 'sakit';
  record.keteranganIzin = keterangan;
  setMessage(`Sakit (S) berhasil dicatat`);
  setMessageType('success');
} else if (absenType === 'tanpaKeterangan') {
  record.tanpaKeterangan = now;
  record.status = 'alpha';
  setMessage(`Tanpa Keterangan (TK) berhasil dicatat`);
  setMessageType('success');
} else if (absenType === 'dinasLuar') {
  record.dinasLuar = now;
  record.keteranganIzin = keterangan;
  setMessage(`Dinas Luar (DL) berhasil dicatat`);
  setMessageType('success');
}
```

**Sesudah:**
```typescript
if (absenType === 'datang') {
  record.datang = now;
  setMessage(`Absen Datang berhasil dicatat`);
  setMessageType('success');
} else if (absenType === 'pulang') {
  record.pulang = now;
  setMessage(`Absen Pulang berhasil dicatat`);
  setMessageType('success');
} else if (absenType === 'izinKeluar') {
  record.izinKeluar = now;
  record.keteranganIzin = keterangan;
  setMessage(`Izin Keluar berhasil dicatat`);
  setMessageType('success');
} else if (absenType === 'izinMasuk') {
  record.izinMasuk = now;
  setMessage(`Izin Masuk berhasil dicatat`);
  setMessageType('success');
}
```

### 3. Notifikasi Jenis Absensi

**Sebelum:**
```tsx
<span className="text-sm font-bold text-green-700 capitalize">
  {absenType === 'datang' && '🌅 Datang'}
  {absenType === 'pulang' && '🌆 Pulang'}
  {absenType === 'izinKeluar' && '🚶 Izin Keluar'}
  {absenType === 'izinMasuk' && '🏠 Izin Masuk'}
  {absenType === 'sakit' && '🤒 Sakit (S)'}
  {absenType === 'tanpaKeterangan' && '❌ Tanpa Keterangan (TK)'}
  {absenType === 'dinasLuar' && '🚗 Dinas Luar (DL)'}
</span>
```

**Sesudah:**
```tsx
<span className="text-sm font-bold text-green-700 capitalize">
  {absenType === 'datang' && '🌅 Datang'}
  {absenType === 'pulang' && '🌆 Pulang'}
  {absenType === 'izinKeluar' && '🚶 Izin Keluar'}
  {absenType === 'izinMasuk' && '🏠 Izin Masuk'}
</span>
```

### 4. Tombol Jenis Absensi

**Sebelum (7 tombol):**
```tsx
{[
  { value: 'datang', label: 'Datang', icon: '🌅', ... },
  { value: 'pulang', label: 'Pulang', icon: '🌆', ... },
  { value: 'izinKeluar', label: 'Izin Keluar', icon: '🚶', ... },
  { value: 'izinMasuk', label: 'Izin Masuk', icon: '🏠', ... },
  { value: 'sakit', label: 'Sakit (S)', icon: '🤒', ... },
  { value: 'tanpaKeterangan', label: 'Tanpa Ket. (TK)', icon: '❌', ... },
  { value: 'dinasLuar', label: 'Dinas Luar (DL)', icon: '🚗', ... },
].map(type => (...))}
```

**Sesudah (4 tombol):**
```tsx
{[
  { value: 'datang', label: 'Datang', icon: '🌅', ... },
  { value: 'pulang', label: 'Pulang', icon: '🌆', ... },
  { value: 'izinKeluar', label: 'Izin Keluar', icon: '🚶', ... },
  { value: 'izinMasuk', label: 'Izin Masuk', icon: '🏠', ... },
].map(type => (...))}
```

### 5. Form Keterangan

**Sebelum:**
```tsx
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

**Sesudah:**
```tsx
{absenType === 'izinKeluar' && (
  <div className="mt-5 animate-fade-in-up">
    <label className="block text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wider">
      Keterangan Izin
    </label>
    <textarea
      value={keterangan}
      onChange={e => setKeterangan(e.target.value)}
      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
      placeholder="Masukkan keterangan izin keluar..."
      rows={3}
    />
  </div>
)}
```

## Jenis Absensi yang Tersisa

### 1. 🌅 Datang
- **Icon**: 🌅
- **Fungsi**: Mencatat waktu kedatangan pegawai
- **Field**: `datang`
- **Keterangan**: Tidak ada

### 2. 🌆 Pulang
- **Icon**: 🌆
- **Fungsi**: Mencatat waktu kepulangan pegawai
- **Field**: `pulang`
- **Keterangan**: Tidak ada

### 3. 🚶 Izin Keluar
- **Icon**: 🚶
- **Fungsi**: Mencatat izin keluar sementara
- **Field**: `izinKeluar`
- **Keterangan**: Ada (wajib diisi)

### 4. 🏠 Izin Masuk
- **Icon**: 🏠
- **Fungsi**: Mencatat waktu masuk kembali setelah izin keluar
- **Field**: `izinMasuk`
- **Keterangan**: Tidak ada

## Alasan Perubahan

### 1. Penyederhanaan UI
- Mengurangi jumlah tombol dari 7 menjadi 4
- UI lebih clean dan tidak overwhelming
- Fokus pada absensi utama (datang/pulang/izin)

### 2. Pemisahan Fungsi
- **Absensi Pegawai**: Fokus pada absensi harian (datang, pulang, izin)
- **Rekap Harian/Bulanan**: Untuk mencatat Sakit, Tanpa Keterangan, dan Dinas Luar
- Pemisahan yang lebih jelas antara fungsi absensi dan rekap

### 3. Workflow yang Lebih Jelas
- Absensi harian dilakukan di halaman **Absensi Pegawai**
- Data Sakit, TK, dan DL diinput melalui **Rekap Harian** atau **Edit Manual**
- Tidak ada duplikasi fungsi

## Dampak Perubahan

### Positif:
✅ UI lebih sederhana dan mudah digunakan  
✅ Fokus pada fungsi utama absensi  
✅ Tidak ada kebingungan antara absensi dan rekap  
✅ Workflow lebih jelas  

### Negatif:
❌ Tidak bisa langsung input Sakit/TK/DL dari halaman absensi  
❌ Perlu navigate ke halaman Rekap Harian untuk input data tersebut  

### Solusi Alternatif:
- Data Sakit, TK, dan DL tetap dapat diinput melalui:
  - Halaman **Rekap Harian** → Tombol Edit Manual (✏️)
  - Halaman **Rekap Bulanan** → Edit Detail Absensi
  - Export dan import data

## Testing

### Test Cases:
- ✅ Hanya 4 tombol jenis absensi yang muncul
- ✅ Tombol Sakit, TK, DL tidak muncul
- ✅ Form keterangan hanya muncul untuk Izin Keluar
- ✅ Notifikasi hanya menampilkan 4 jenis absensi
- ✅ State type hanya menerima 4 nilai
- ✅ Build berhasil tanpa error

## Build Status

✅ **Build berhasil tanpa error**

```
✓ 1357 modules transformed.
✓ built in 16.68s
```

## Kesimpulan

Halaman Absensi Pegawai telah disederhanakan dengan menghilangkan tombol Sakit, Tanpa Keterangan, dan Dinas Luar. Sekarang hanya ada 4 jenis absensi utama:

1. 🌅 **Datang** - Mencatat waktu kedatangan
2. 🌆 **Pulang** - Mencatat waktu kepulangan
3. 🚶 **Izin Keluar** - Mencatat izin keluar sementara
4. 🏠 **Izin Masuk** - Mencatat waktu masuk kembali

Data Sakit, Tanpa Keterangan, dan Dinas Luar tetap dapat diinput melalui halaman Rekap Harian atau Rekap Bulanan dengan fitur edit manual.
