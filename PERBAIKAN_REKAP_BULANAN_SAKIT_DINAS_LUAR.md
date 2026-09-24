# Perbaikan Tabel Rekap Bulanan - Penambahan Kolom Sakit (S) dan Dinas Luar (DL)

## Deskripsi Perubahan

Menambahkan kolom **Sakit (S)** dan **Dinas Luar (DL)** pada:
1. Tabel Summary Rekap Bulanan
2. Tabel Detail Absensi Bulanan
3. Fungsi Export (Excel, CSV, Print)

## Perubahan yang Dilakukan

### 1. Fungsi `getSummary()` (Baris 2070-2082)

**Sebelum:**
```typescript
const getSummary = (pegawaiId: string) => {
  let hadir = 0, izin = 0, sakit = 0, alpha = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
    const date = new Date(year, month - 1, d);
    if (!isWorkingDay(date, dateStr)) continue;
    const record = absensi.find(a => a.pegawaiId === pegawaiId && a.tanggal === dateStr);
    if (record?.datang) hadir++;
    else if (record?.keteranganIzin) izin++;
    else alpha++;
  }
  return { hadir, izin, sakit, alpha };
};
```

**Sesudah:**
```typescript
const getSummary = (pegawaiId: string) => {
  let hadir = 0, izin = 0, sakit = 0, alpha = 0, dinasLuar = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
    const date = new Date(year, month - 1, d);
    if (!isWorkingDay(date, dateStr)) continue;
    const record = absensi.find(a => a.pegawaiId === pegawaiId && a.tanggal === dateStr);
    if (record?.datang) hadir++;
    else if (record?.sakit) sakit++;
    else if (record?.dinasLuar) dinasLuar++;
    else if (record?.keteranganIzin) izin++;
    else alpha++;
  }
  return { hadir, izin, sakit, alpha, dinasLuar };
};
```

**Perubahan:**
- Menambahkan variabel `dinasLuar`
- Menambahkan logika untuk menghitung `record?.sakit` dan `record?.dinasLuar`
- Mengembalikan objek dengan properti `dinasLuar`

### 2. Tabel Summary Rekap Bulanan (Baris 2423-2459)

**Perubahan Header:**
```typescript
// Sebelum
<th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Hadir</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Izin</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Alpha</th>

// Sesudah
<th className="px-4 py-3 text-center text-sm font-semibold text-green-700">Hadir</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-yellow-700">Izin</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-orange-700">Sakit</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-indigo-700">Dinas Luar</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-red-700">Alpha</th>
```

**Perubahan Body:**
```typescript
// Sebelum
<td className="px-4 py-3 text-sm text-center">
  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">{summary.hadir}</span>
</td>
<td className="px-4 py-3 text-sm text-center">
  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">{summary.izin}</span>
</td>
<td className="px-4 py-3 text-sm text-center">
  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">{summary.alpha}</span>
</td>

// Sesudah
<td className="px-4 py-3 text-sm text-center">
  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">{summary.hadir}</span>
</td>
<td className="px-4 py-3 text-sm text-center">
  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">{summary.izin}</span>
</td>
<td className="px-4 py-3 text-sm text-center">
  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">{summary.sakit}</span>
</td>
<td className="px-4 py-3 text-sm text-center">
  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">{summary.dinasLuar}</span>
</td>
<td className="px-4 py-3 text-sm text-center">
  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">{summary.alpha}</span>
</td>
```

**Perubahan colSpan:**
```typescript
// Sebelum
<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>

// Sesudah
<tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
```

### 3. Tabel Detail Absensi Bulanan (Baris 2493-2545)

**Perubahan Header:**
```typescript
// Sebelum
<th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Datang</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Izin Keluar</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Izin Masuk</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Pulang</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Keterangan</th>

// Sesudah
<th className="px-4 py-3 text-center text-sm font-semibold text-green-700">Datang</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-yellow-700">Izin Keluar</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-purple-700">Izin Masuk</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-blue-700">Pulang</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-orange-700">Sakit (S)</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-indigo-700">Dinas Luar (DL)</th>
<th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Keterangan</th>
```

**Perubahan Body:**
```typescript
// Sebelum
<td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">{row.record?.datang || '-'}</td>
<td className="px-4 py-3 text-sm text-center text-yellow-600">{row.record?.izinKeluar || '-'}</td>
<td className="px-4 py-3 text-sm text-center text-purple-600">{row.record?.izinMasuk || '-'}</td>
<td className="px-4 py-3 text-sm text-center text-blue-600 font-semibold">{row.record?.pulang || '-'}</td>
<td className="px-4 py-3 text-sm text-center">{row.record?.keteranganIzin || '-'}</td>

// Sesudah
<td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">{row.record?.datang || '-'}</td>
<td className="px-4 py-3 text-sm text-center text-yellow-600">{row.record?.izinKeluar || '-'}</td>
<td className="px-4 py-3 text-sm text-center text-purple-600">{row.record?.izinMasuk || '-'}</td>
<td className="px-4 py-3 text-sm text-center text-blue-600 font-semibold">{row.record?.pulang || '-'}</td>
<td className="px-4 py-3 text-sm text-center text-orange-600 font-semibold">{row.record?.sakit || '-'}</td>
<td className="px-4 py-3 text-sm text-center text-indigo-600 font-semibold">{row.record?.dinasLuar || '-'}</td>
<td className="px-4 py-3 text-sm text-center">{row.record?.keteranganIzin || '-'}</td>
```

**Perubahan colSpan:**
```typescript
// Sebelum
<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Pegawai tidak ditemukan</td></tr>
<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada data absensi</td></tr>

// Sesudah
<tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Pegawai tidak ditemukan</td></tr>
<tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Belum ada data absensi</td></tr>
```

### 4. Fungsi `exportToExcel()` (Baris 2084-2109)

**Perubahan:**
```typescript
// Sebelum
const header = ['Tanggal', 'Datang', 'Izin Keluar', 'Izin Masuk', 'Pulang', 'Keterangan'];
data.push([dateStr, record.datang || '-', record.izinKeluar || '-', record.izinMasuk || '-', record.pulang || '-', record.keteranganIzin || '-']);

// Sesudah
const header = ['Tanggal', 'Datang', 'Izin Keluar', 'Izin Masuk', 'Pulang', 'Sakit (S)', 'Dinas Luar (DL)', 'Keterangan'];
data.push([dateStr, record.datang || '-', record.izinKeluar || '-', record.izinMasuk || '-', record.pulang || '-', record.sakit || '-', record.dinasLuar || '-', record.keteranganIzin || '-']);
```

### 5. Fungsi `exportToCSV()` (Baris 2111-2132)

**Perubahan:**
```typescript
// Sebelum
data.push(['Nama', 'NIP', 'Jabatan', 'Tanggal', 'Datang', 'Izin Keluar', 'Izin Masuk', 'Pulang', 'Keterangan']);
data.push([p.nama, p.nip, p.jabatan, dateStr, record.datang || '', record.izinKeluar || '', record.izinMasuk || '', record.pulang || '', record.keteranganIzin || '']);

// Sesudah
data.push(['Nama', 'NIP', 'Jabatan', 'Tanggal', 'Datang', 'Izin Keluar', 'Izin Masuk', 'Pulang', 'Sakit (S)', 'Dinas Luar (DL)', 'Keterangan']);
data.push([p.nama, p.nip, p.jabatan, dateStr, record.datang || '', record.izinKeluar || '', record.izinMasuk || '', record.pulang || '', record.sakit || '', record.dinasLuar || '', record.keteranganIzin || '']);
```

### 6. Fungsi `printDetailAbsensi()` (Baris 2134-2277)

**Perubahan Counter:**
```typescript
// Sebelum
let hadirCount = 0, izinCount = 0, alphaCount = 0;
if (record?.datang) hadirCount++;
else if (record?.keteranganIzin) izinCount++;
else alphaCount++;

// Sesudah
let hadirCount = 0, izinCount = 0, sakitCount = 0, dinasLuarCount = 0, alphaCount = 0;
if (record?.datang) hadirCount++;
else if (record?.sakit) sakitCount++;
else if (record?.dinasLuar) dinasLuarCount++;
else if (record?.keteranganIzin) izinCount++;
else alphaCount++;
```

**Perubahan Table Rows:**
```typescript
// Sebelum
<td style="text-align:center;color:#16a34a;font-weight:bold">${record?.datang || '-'}</td>
<td style="text-align:center;color:#ca8a04">${record?.izinKeluar || '-'}</td>
<td style="text-align:center;color:#9333ea">${record?.izinMasuk || '-'}</td>
<td style="text-align:center;color:#2563eb;font-weight:bold">${record?.pulang || '-'}</td>
<td style="text-align:center">${record?.keteranganIzin || '-'}</td>

// Sesudah
<td style="text-align:center;color:#16a34a;font-weight:bold">${record?.datang || '-'}</td>
<td style="text-align:center;color:#ca8a04">${record?.izinKeluar || '-'}</td>
<td style="text-align:center;color:#9333ea">${record?.izinMasuk || '-'}</td>
<td style="text-align:center;color:#2563eb;font-weight:bold">${record?.pulang || '-'}</td>
<td style="text-align:center;color:#ea580c;font-weight:bold">${record?.sakit || '-'}</td>
<td style="text-align:center;color:#4f46e5;font-weight:bold">${record?.dinasLuar || '-'}</td>
<td style="text-align:center">${record?.keteranganIzin || '-'}</td>
```

**Perubahan Table Header:**
```typescript
// Sebelum
<th style="width:30%">Tanggal</th>
<th style="width:12%">Datang</th>
<th style="width:14%">Izin Keluar</th>
<th style="width:14%">Izin Masuk</th>
<th style="width:12%">Pulang</th>
<th style="width:18%">Keterangan</th>

// Sesudah
<th style="width:22%">Tanggal</th>
<th style="width:10%">Datang</th>
<th style="width:11%">Izin Keluar</th>
<th style="width:11%">Izin Masuk</th>
<th style="width:10%">Pulang</th>
<th style="width:10%">Sakit (S)</th>
<th style="width:11%">Dinas Luar (DL)</th>
<th style="width:15%">Keterangan</th>
```

**Perubahan Summary:**
```typescript
// Sebelum
<tr>
  <td class="label">Total Hadir:</td>
  <td style="color:#16a34a;font-weight:bold;font-size:14pt">${hadirCount} hari</td>
  <td class="label">Total Izin:</td>
  <td style="color:#ca8a04;font-weight:bold;font-size:14pt">${izinCount} hari</td>
  <td class="label">Total Alpha:</td>
  <td style="color:#dc2626;font-weight:bold;font-size:14pt">${alphaCount} hari</td>
</tr>

// Sesudah
<tr>
  <td class="label">Total Hadir:</td>
  <td style="color:#16a34a;font-weight:bold;font-size:14pt">${hadirCount} hari</td>
  <td class="label">Total Izin:</td>
  <td style="color:#ca8a04;font-weight:bold;font-size:14pt">${izinCount} hari</td>
  <td class="label">Total Sakit:</td>
  <td style="color:#ea580c;font-weight:bold;font-size:14pt">${sakitCount} hari</td>
</tr>
<tr>
  <td class="label">Total Dinas Luar:</td>
  <td style="color:#4f46e5;font-weight:bold;font-size:14pt">${dinasLuarCount} hari</td>
  <td class="label">Total Alpha:</td>
  <td style="color:#dc2626;font-weight:bold;font-size:14pt">${alphaCount} hari</td>
  <td colspan="2"></td>
</tr>
```

### 7. Fungsi `printRekap()` (Baris 2279-2375)

**Perubahan Table Rows:**
```typescript
// Sebelum
<td style="text-align:center;color:green;font-weight:bold">${summary.hadir}</td>
<td style="text-align:center;color:orange">${summary.izin}</td>
<td style="text-align:center;color:red">${summary.alpha}</td>

// Sesudah
<td style="text-align:center;color:green;font-weight:bold">${summary.hadir}</td>
<td style="text-align:center;color:orange">${summary.izin}</td>
<td style="text-align:center;color:#ea580c;font-weight:bold">${summary.sakit}</td>
<td style="text-align:center;color:#4f46e5;font-weight:bold">${summary.dinasLuar}</td>
<td style="text-align:center;color:red">${summary.alpha}</td>
```

**Perubahan Table Header:**
```typescript
// Sebelum
<th>Hadir</th>
<th>Izin</th>
<th>Alpha</th>

// Sesudah
<th>Hadir</th>
<th>Izin</th>
<th>Sakit</th>
<th>Dinas Luar</th>
<th>Alpha</th>
```

## Struktur Tabel Baru

### Tabel Summary Rekap Bulanan

| No | Nama | NIP | Hadir | Izin | Sakit | Dinas Luar | Alpha |
|----|------|-----|-------|------|-------|------------|-------|
| 1 | Budi Santoso | 123456 | 20 | 2 | 1 | 3 | 0 |
| 2 | Siti Nurhaliza | 123457 | 22 | 1 | 0 | 2 | 1 |

### Tabel Detail Absensi Bulanan

| Tanggal | Datang | Izin Keluar | Izin Masuk | Pulang | Sakit (S) | Dinas Luar (DL) | Keterangan |
|---------|--------|-------------|------------|--------|-----------|-----------------|------------|
| Senin, 01 Januari 2024 | 07:30 | - | - | 15:00 | - | - | - |
| Selasa, 02 Januari 2024 | - | - | - | - | 08:00 | - | Flu |
| Rabu, 03 Januari 2024 | - | - | - | - | - | 09:00 | Rapat di Dinas |

## Warna yang Digunakan

| Kolom | Warna Header | Warna Badge/Text |
|-------|--------------|------------------|
| Hadir | `text-green-700` | `bg-green-100 text-green-700` / `text-green-600` |
| Izin | `text-yellow-700` | `bg-yellow-100 text-yellow-700` / `text-yellow-600` |
| Sakit | `text-orange-700` | `bg-orange-100 text-orange-700` / `text-orange-600` |
| Dinas Luar | `text-indigo-700` | `bg-indigo-100 text-indigo-700` / `text-indigo-600` |
| Alpha | `text-red-700` | `bg-red-100 text-red-700` / `text-red-600` |

## Fitur yang Ditambahkan

### 1. Perhitungan Statistik
- ✅ Menghitung total Sakit (S) per pegawai
- ✅ Menghitung total Dinas Luar (DL) per pegawai
- ✅ Prioritas perhitungan: Hadir → Sakit → Dinas Luar → Izin → Alpha

### 2. Visual Indikator
- ✅ Badge berwarna untuk summary (orange untuk Sakit, indigo untuk Dinas Luar)
- ✅ Text berwarna untuk detail absensi
- ✅ Header tabel dengan warna yang sesuai

### 3. Export Data
- ✅ Excel: Kolom Sakit (S) dan Dinas Luar (DL) ditambahkan
- ✅ CSV: Kolom Sakit (S) dan Dinas Luar (DL) ditambahkan
- ✅ Print Detail: Kolom dan summary ditambahkan
- ✅ Print Rekap: Kolom ditambahkan

### 4. Print Layout
- ✅ Detail Absensi: 8 kolom (Tanggal, Datang, Izin Keluar, Izin Masuk, Pulang, Sakit, Dinas Luar, Keterangan)
- ✅ Rekap Summary: 9 kolom (No, Nama, NIP, Jabatan, Hadir, Izin, Sakit, Dinas Luar, Alpha)
- ✅ Summary statistics: Total Hadir, Izin, Sakit, Dinas Luar, Alpha

## Testing

### Test Cases
- ✅ Tabel summary menampilkan kolom Sakit dan Dinas Luar
- ✅ Tabel detail menampilkan kolom Sakit dan Dinas Luar
- ✅ Perhitungan statistik benar
- ✅ Export Excel menyertakan kolom baru
- ✅ Export CSV menyertakan kolom baru
- ✅ Print detail menyertakan kolom baru
- ✅ Print rekap menyertakan kolom baru
- ✅ Warna header dan badge sesuai
- ✅ colSpan updated untuk pesan kosong

### Edge Cases
- ✅ Pegawai dengan data sakit
- ✅ Pegawai dengan data dinas luar
- ✅ Pegawai dengan data sakit dan dinas luar
- ✅ Pegawai tanpa data sakit/dinas luar
- ✅ Export dengan data kosong
- ✅ Print dengan data kosong

## Build Status

✅ **Build berhasil tanpa error**

```
✓ 1357 modules transformed.
✓ built in 16.84s
```

## Kesimpulan

Tabel rekap bulanan telah berhasil diperbaiki dengan menambahkan kolom **Sakit (S)** dan **Dinas Luar (DL)** pada:

1. **Tabel Summary Rekap Bulanan** - Menampilkan total sakit dan dinas luar per pegawai
2. **Tabel Detail Absensi Bulanan** - Menampilkan data sakit dan dinas luar per hari
3. **Fungsi Export** - Excel, CSV, dan Print semua menyertakan kolom baru
4. **Print Layout** - Header dan summary statistics diperbarui

Semua fitur berfungsi dengan baik dan build berhasil tanpa error.
