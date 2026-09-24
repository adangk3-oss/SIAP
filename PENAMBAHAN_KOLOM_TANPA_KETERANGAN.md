# Penambahan Kolom "Tanpa Keterangan (TK)" pada Tabel Rekap Bulanan

## Ringkasan Perubahan

Menambahkan kolom **"Tanpa Keterangan (TK)"** pada:
1. Tabel Detail Absensi Bulanan
2. Tabel Summary Rekap Bulanan
3. Fungsi Cetak Detail (`printDetailAbsensi`)
4. Fungsi Cetak Rekap (`printRekap`)
5. Fungsi Export Excel (`exportToExcel`)
6. Fungsi Export CSV (`exportToCSV`)
7. Fungsi Summary (`getSummary`)

## Detail Perubahan

### 1. Tabel Detail Absensi Bulanan

**Header Tabel:**
```tsx
<thead className="bg-gray-50">
  <tr>
    <th>Tanggal</th>
    <th>Datang</th>
    <th>Izin Keluar</th>
    <th>Izin Masuk</th>
    <th>Pulang</th>
    <th>Sakit (S)</th>
    <th>Dinas Luar (DL)</th>
    <th style="color: text-red-700">Tanpa Keterangan (TK)</th>  {/* BARU */}
    <th>Keterangan</th>
  </tr>
</thead>
```

**Data Baris:**
```tsx
<td className="text-red-600 font-semibold">{row.record?.tanpaKeterangan || '-'}</td>
```

**ColSpan:** Diperbarui dari 8 menjadi 9 untuk pesan kosong

### 2. Tabel Summary Rekap Bulanan

**Header Tabel:**
```tsx
<thead className="bg-gray-50">
  <tr>
    <th>No</th>
    <th>Nama</th>
    <th>NIP</th>
    <th>Hadir</th>
    <th>Izin</th>
    <th>Sakit</th>
    <th>Dinas Luar</th>
    <th style="color: text-red-700">Tanpa Keterangan</th>  {/* BARU */}
    <th>Alpha</th>
  </tr>
</thead>
```

**Data Baris:**
```tsx
<td>
  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
    {summary.tanpaKeterangan}
  </span>
</td>
```

**ColSpan:** Diperbarui dari 8 menjadi 9 untuk pesan "Tidak ada data"

### 3. Fungsi `getSummary()`

**Sebelum:**
```typescript
const getSummary = (pegawaiId: string) => {
  let hadir = 0, izin = 0, sakit = 0, alpha = 0, dinasLuar = 0;
  // ...
  return { hadir, izin, sakit, alpha, dinasLuar };
};
```

**Sesudah:**
```typescript
const getSummary = (pegawaiId: string) => {
  let hadir = 0, izin = 0, sakit = 0, alpha = 0, dinasLuar = 0, tanpaKeterangan = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    // ...
    if (record?.datang) hadir++;
    else if (record?.sakit) sakit++;
    else if (record?.dinasLuar) dinasLuar++;
    else if (record?.tanpaKeterangan) tanpaKeterangan++;  // BARU
    else if (record?.keteranganIzin) izin++;
    else alpha++;
  }
  return { hadir, izin, sakit, alpha, dinasLuar, tanpaKeterangan };  // BARU
};
```

### 4. Fungsi `printDetailAbsensi()`

**Variabel Counter:**
```typescript
let hadirCount = 0, izinCount = 0, sakitCount = 0, dinasLuarCount = 0, 
    tanpaKeteranganCount = 0, alphaCount = 0;  // BARU
```

**Logika Perhitungan:**
```typescript
if (record?.datang) hadirCount++;
else if (record?.sakit) sakitCount++;
else if (record?.dinasLuar) dinasLuarCount++;
else if (record?.tanpaKeterangan) tanpaKeteranganCount++;  // BARU
else if (record?.keteranganIzin) izinCount++;
else alphaCount++;
```

**Header Tabel Cetak:**
```html
<th style="width:10%">Tanpa Ket. (TK)</th>
```

**Data Baris Cetak:**
```html
<td style="text-align:center;color:#dc2626;font-weight:bold">${record?.tanpaKeterangan || '-'}</td>
```

**Summary Cetak:**
```html
<tr>
  <td class="label">Total Tanpa Ket.:</td>
  <td style="color:#dc2626;font-weight:bold;font-size:14pt">${tanpaKeteranganCount} hari</td>
</tr>
```

### 5. Fungsi `printRekap()`

**Header Tabel Cetak:**
```html
<th>Tanpa Ket.</th>
```

**Data Baris Cetak:**
```html
<td style="text-align:center;color:#dc2626;font-weight:bold">${s.tanpaKeterangan}</td>
```

### 6. Fungsi `exportToExcel()`

**Header:**
```typescript
const header = ['Tanggal', 'Datang', 'Izin Keluar', 'Izin Masuk', 'Pulang', 
                'Sakit (S)', 'Dinas Luar (DL)', 'Tanpa Keterangan (TK)', 'Keterangan'];
```

**Data:**
```typescript
data.push([dateStr, record.datang || '-', record.izinKeluar || '-', 
           record.izinMasuk || '-', record.pulang || '-', record.sakit || '-', 
           record.dinasLuar || '-', record.tanpaKeterangan || '-',  // BARU
           record.keteranganIzin || '-']);
```

### 7. Fungsi `exportToCSV()`

**Header:**
```typescript
data.push(['Nama', 'NIP', 'Jabatan', 'Tanggal', 'Datang', 'Izin Keluar', 
           'Izin Masuk', 'Pulang', 'Sakit (S)', 'Dinas Luar (DL)', 
           'Tanpa Keterangan (TK)', 'Keterangan']);  // BARU
```

**Data:**
```typescript
data.push([p.nama, p.nip, p.jabatan, dateStr, record.datang || '', 
           record.izinKeluar || '', record.izinMasuk || '', record.pulang || '', 
           record.sakit || '', record.dinasLuar || '', 
           record.tanpaKeterangan || '',  // BARU
           record.keteranganIzin || '']);
```

## Prioritas Perhitungan Status

Urutan prioritas perhitungan status absensi:
1. **Hadir** (`datang`) - Pegawai hadir bekerja
2. **Sakit** (`sakit`) - Pegawai sakit
3. **Dinas Luar** (`dinasLuar`) - Pegawai dinas luar
4. **Tanpa Keterangan** (`tanpaKeterangan`) - Pegawai tidak hadir tanpa keterangan
5. **Izin** (`keteranganIzin`) - Pegawai izin
6. **Alpha** - Pegawai tidak hadir dan tidak ada data

## Warna yang Digunakan

| Kolom | Warna Header | Warna Badge/Text |
|-------|--------------|------------------|
| Hadir | `text-green-700` | `bg-green-100 text-green-700` |
| Izin | `text-yellow-700` | `bg-yellow-100 text-yellow-700` |
| Sakit | `text-orange-700` | `bg-orange-100 text-orange-700` |
| Dinas Luar | `text-indigo-700` | `bg-indigo-100 text-indigo-700` |
| **Tanpa Keterangan** | **`text-red-700`** | **`bg-red-100 text-red-700`** |
| Alpha | `text-gray-700` | `bg-gray-100 text-gray-700` |

## Struktur Tabel Baru

### Tabel Detail Absensi Bulanan (9 kolom)

| Tanggal | Datang | Izin Keluar | Izin Masuk | Pulang | Sakit (S) | Dinas Luar (DL) | **Tanpa Keterangan (TK)** | Keterangan |
|---------|--------|-------------|------------|--------|-----------|-----------------|---------------------------|------------|
| Senin, 01 Januari 2024 | 07:30 | - | - | 15:00 | - | - | - | - |
| Selasa, 02 Januari 2024 | - | - | - | - | - | - | **08:00** | - |

### Tabel Summary Rekap Bulanan (9 kolom)

| No | Nama | NIP | Hadir | Izin | Sakit | Dinas Luar | **Tanpa Keterangan** | Alpha |
|----|------|-----|-------|------|-------|------------|----------------------|-------|
| 1 | Budi Santoso | 123456 | 20 | 2 | 1 | 3 | **0** | 0 |
| 2 | Siti Nurhaliza | 123457 | 22 | 1 | 0 | 2 | **1** | 0 |

## Testing

### Test Cases

#### Tabel Detail Absensi Bulanan
- ✅ Kolom "Tanpa Keterangan (TK)" muncul dengan warna merah
- ✅ Data `tanpaKeterangan` ditampilkan dengan benar
- ✅ ColSpan diperbarui untuk pesan kosong
- ✅ Urutan kolom: Tanggal → Datang → Izin Keluar → Izin Masuk → Pulang → Sakit → Dinas Luar → **Tanpa Keterangan** → Keterangan

#### Tabel Summary Rekap Bulanan
- ✅ Kolom "Tanpa Keterangan" muncul dengan warna merah
- ✅ Perhitungan `tanpaKeterangan` akurat
- ✅ Badge merah ditampilkan dengan benar
- ✅ ColSpan diperbarui untuk pesan "Tidak ada data"

#### Fungsi Cetak
- ✅ `printDetailAbsensi()` menampilkan kolom "Tanpa Ket. (TK)"
- ✅ `printDetailAbsensi()` menghitung total `tanpaKeteranganCount`
- ✅ `printRekap()` menampilkan kolom "Tanpa Ket."
- ✅ Summary cetak menampilkan "Total Tanpa Ket."

#### Fungsi Export
- ✅ `exportToExcel()` menyertakan kolom "Tanpa Keterangan (TK)"
- ✅ `exportToCSV()` menyertakan kolom "Tanpa Keterangan (TK)"
- ✅ Data diekspor dengan benar

#### Prioritas Perhitungan
- ✅ Hadir dihitung pertama
- ✅ Sakit dihitung kedua
- ✅ Dinas Luar dihitung ketiga
- ✅ **Tanpa Keterangan dihitung keempat**
- ✅ Izin dihitung kelima
- ✅ Alpha dihitung terakhir

## Build Status

✅ **Build berhasil tanpa error**

```
✓ 1357 modules transformed.
✓ built in 16.44s
```

## Kesimpulan

Kolom **"Tanpa Keterangan (TK)"** telah berhasil ditambahkan ke:
1. ✅ Tabel Detail Absensi Bulanan
2. ✅ Tabel Summary Rekap Bulanan
3. ✅ Fungsi Cetak Detail
4. ✅ Fungsi Cetak Rekap
5. ✅ Fungsi Export Excel
6. ✅ Fungsi Export CSV
7. ✅ Fungsi Summary

Semua fitur berfungsi dengan baik dan build berhasil tanpa error. Kolom ini menggunakan warna merah untuk konsistensi dengan jenis absensi lainnya yang menunjukkan ketidakhadiran.
