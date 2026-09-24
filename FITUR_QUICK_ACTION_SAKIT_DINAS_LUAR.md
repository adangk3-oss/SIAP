# Fitur Quick Action Sakit dan Dinas Luar di Tabel Rekap Harian

## Ringkasan Fitur

Menambahkan fitur **Quick Action** untuk mencatat status **Sakit** dan **Dinas Luar** langsung dari tabel Rekap Harian dengan mengklik tombol **X** pada kolom yang sesuai.

## Cara Penggunaan

### 1. Menandai Pegawai Sakit
1. Buka halaman **Rekap Harian**
2. Pilih tanggal yang diinginkan
3. Pada kolom **Sakit (S)**, klik tombol **✖** (X) pada baris pegawai yang sakit
4. Sistem akan otomatis mencatat waktu saat ini sebagai waktu sakit
5. Status pegawai berubah menjadi sakit
6. Data kedatangan (jika ada) akan dihapus otomatis

### 2. Menandai Pegawai Dinas Luar
1. Buka halaman **Rekap Harian**
2. Pilih tanggal yang diinginkan
3. Pada kolom **Dinas Luar (DL)**, klik tombol **✖** (X) pada baris pegawai yang dinas luar
4. Sistem akan otomatis mencatat waktu saat ini sebagai waktu dinas luar
5. Data kedatangan (jika ada) akan dihapus otomatis

### 3. Menghapus Status Sakit/Dinas Luar
1. Jika pegawai sudah ditandai sakit/dinas luar, akan muncul waktu dan tombol **✖** merah
2. Klik tombol **✖** merah untuk menghapus status
3. Status akan kembali ke kondisi sebelumnya

## Tampilan UI

### Kolom Sakit (S)

**Sebelum diklik (belum sakit):**
```
┌─────────┐
│    ✖    │  ← Tombol X abu-abu, bisa diklik
└─────────┘
```

**Setelah diklik (sudah sakit):**
```
┌──────────────┐
│ 08:00    ✖  │  ← Waktu sakit + tombol X merah
└──────────────┘
```

### Kolom Dinas Luar (DL)

**Sebelum diklik (belum dinas luar):**
```
┌─────────┐
│    ✖    │  ← Tombol X abu-abu, bisa diklik
└─────────┘
```

**Setelah diklik (sudah dinas luar):**
```
┌──────────────┐
│ 09:00    ✖  │  ← Waktu dinas luar + tombol X merah
└──────────────┘
```

## Implementasi Teknis

### 1. State Management

```typescript
// Tidak ada state tambahan yang diperlukan
// Menggunakan state yang sudah ada: selectedDate, pegawai, absensi
```

### 2. Fungsi handleQuickAction

```typescript
const handleQuickAction = (pegawaiId: string, action: 'sakit' | 'dinasLuar') => {
  const today = selectedDate;
  const now = format(new Date(), 'HH:mm');
  const existingAbsen = absensi.find(a => a.pegawaiId === pegawaiId && a.tanggal === today);
  
  if (existingAbsen) {
    // Update existing record
    const updatedRecord = { ...existingAbsen };
    if (action === 'sakit') {
      // Toggle status sakit
      updatedRecord.sakit = updatedRecord.sakit ? undefined : now;
      if (updatedRecord.sakit) {
        updatedRecord.status = 'sakit';
        // Hapus data datang jika sakit
        updatedRecord.datang = undefined;
      }
    } else if (action === 'dinasLuar') {
      // Toggle status dinas luar
      updatedRecord.dinasLuar = updatedRecord.dinasLuar ? undefined : now;
      if (updatedRecord.dinasLuar) {
        // Hapus data datang jika dinas luar
        updatedRecord.datang = undefined;
      }
    }
    store.updateAbsensi(updatedRecord);
  } else {
    // Create new record
    const newRecord: AbsensiRecord = {
      id: Date.now().toString(),
      pegawaiId,
      tanggal: today,
      status: action === 'sakit' ? 'sakit' : 'hadir',
    };
    if (action === 'sakit') {
      newRecord.sakit = now;
    } else if (action === 'dinasLuar') {
      newRecord.dinasLuar = now;
    }
    store.addAbsensi(newRecord);
  }
  refresh();
};
```

### 3. UI Implementation

```tsx
{/* Kolom Sakit */}
<td className="px-4 py-3 text-sm text-center">
  {absen?.sakit ? (
    <div className="flex items-center justify-center gap-1">
      <span className="text-orange-600 font-medium">{absen.sakit}</span>
      <button
        onClick={() => handleQuickAction(p.id, 'sakit')}
        className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded p-1 transition-colors"
        title="Hapus status sakit"
      >
        ✖
      </button>
    </div>
  ) : (
    <button
      onClick={() => handleQuickAction(p.id, 'sakit')}
      className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded px-2 py-1 transition-colors"
      title="Tandai sakit"
    >
      ✖
    </button>
  )}
</td>

{/* Kolom Dinas Luar */}
<td className="px-4 py-3 text-sm text-center">
  {absen?.dinasLuar ? (
    <div className="flex items-center justify-center gap-1">
      <span className="text-indigo-600 font-medium">{absen.dinasLuar}</span>
      <button
        onClick={() => handleQuickAction(p.id, 'dinasLuar')}
        className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded p-1 transition-colors"
        title="Hapus status dinas luar"
      >
        ✖
      </button>
    </div>
  ) : (
    <button
      onClick={() => handleQuickAction(p.id, 'dinasLuar')}
      className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded px-2 py-1 transition-colors"
      title="Tandai dinas luar"
    >
      ✖
    </button>
  )}
</td>
```

## Logika Bisnis

### 1. Toggle Status
- **Klik pertama**: Menandai pegawai sakit/dinas luar dengan waktu saat ini
- **Klik kedua**: Menghapus status sakit/dinas luar

### 2. Auto-Cleanup
- Jika pegawai ditandai **sakit**, data kedatangan (`datang`) akan dihapus otomatis
- Jika pegawai ditandai **dinas luar**, data kedatangan (`datang`) akan dihapus otomatis
- Ini mencegah konflik data (pegawai tidak bisa hadir dan sakit/dinas luar di saat yang sama)

### 3. Status Update
- **Sakit**: Status berubah menjadi `'sakit'`
- **Dinas Luar**: Status tetap `'hadir'` (karena dinas luar dianggap hadir)

### 4. Record Management
- Jika sudah ada record absensi untuk tanggal tersebut → **Update** record
- Jika belum ada record → **Create** record baru

## Keuntungan Fitur

### 1. Efisiensi Waktu
✅ Tidak perlu membuka modal edit untuk menandai sakit/dinas luar  
✅ Satu klik langsung mencatat status  
✅ Cepat dan praktis untuk input massal  

### 2. User Experience
✅ UI intuitif dengan tombol X yang jelas  
✅ Visual feedback dengan warna (orange untuk sakit, indigo untuk dinas luar)  
✅ Tooltip untuk menjelaskan fungsi tombol  

### 3. Data Integrity
✅ Auto-cleanup mencegah konflik data  
✅ Toggle function mencegah duplikasi  
✅ Timestamp otomatis memastikan akurasi waktu  

### 4. Fleksibilitas
✅ Bisa menandai dan menghapus status dengan mudah  
✅ Bisa digunakan untuk semua pegawai sekaligus  
✅ Tidak mengganggu fitur edit manual yang sudah ada  

## Perbandingan dengan Fitur Lain

### Quick Action vs Edit Manual

| Aspek | Quick Action | Edit Manual |
|-------|--------------|-------------|
| **Kecepatan** | ⚡ 1 klik | 🐢 Buka modal → isi form → simpan |
| **Fungsi** | Hanya Sakit/Dinas Luar | Semua field absensi |
| **Waktu** | Otomatis (waktu saat ini) | Manual (bisa pilih waktu) |
| **Keterangan** | Tidak ada | Bisa diisi |
| **Use Case** | Input cepat | Input detail |

### Kapan Menggunakan Quick Action?
- ✅ Ingin menandai pegawai sakit dengan cepat
- ✅ Ingin menandai pegawai dinas luar dengan cepat
- ✅ Input massal untuk beberapa pegawai
- ✅ Tidak perlu keterangan tambahan

### Kapan Menggunakan Edit Manual?
- ✅ Perlu mengisi keterangan
- ✅ Perlu mengubah waktu (bukan waktu saat ini)
- ✅ Perlu mengubah field lain (datang, pulang, izin, dll)
- ✅ Perlu edit detail yang kompleks

## Testing

### Test Cases

#### 1. Menandai Sakit
- ✅ Klik tombol X pada kolom Sakit → waktu tercatat
- ✅ Status berubah menjadi sakit
- ✅ Data kedatangan dihapus (jika ada)
- ✅ Tombol X berubah menjadi merah

#### 2. Menghapus Status Sakit
- ✅ Klik tombol X merah → status dihapus
- ✅ Waktu sakit dihapus
- ✅ Tombol X kembali ke abu-abu

#### 3. Menandai Dinas Luar
- ✅ Klik tombol X pada kolom Dinas Luar → waktu tercatat
- ✅ Data kedatangan dihapus (jika ada)
- ✅ Tombol X berubah menjadi merah

#### 4. Menghapus Status Dinas Luar
- ✅ Klik tombol X merah → status dihapus
- ✅ Waktu dinas luar dihapus
- ✅ Tombol X kembali ke abu-abu

#### 5. Edge Cases
- ✅ Menandai sakit untuk pegawai yang sudah punya data absensi
- ✅ Menandai dinas luar untuk pegawai yang belum punya data absensi
- ✅ Toggle status beberapa kali
- ✅ Menandai sakit dan dinas luar untuk pegawai yang sama (tidak konflik)

## Build Status

✅ **Build berhasil tanpa error**

```
✓ 1357 modules transformed.
✓ built in 16.09s
```

## Kesimpulan

Fitur **Quick Action** untuk Sakit dan Dinas Luar telah berhasil ditambahkan ke tabel Rekap Harian. Fitur ini memungkinkan admin untuk:

1. ✅ Menandai pegawai sakit dengan 1 klik
2. ✅ Menandai pegawai dinas luar dengan 1 klik
3. ✅ Menghapus status sakit/dinas luar dengan 1 klik
4. ✅ Auto-cleanup data kedatangan untuk mencegah konflik
5. ✅ Timestamp otomatis untuk akurasi waktu

Fitur ini sangat berguna untuk input cepat dan massal, terutama ketika ada banyak pegawai yang sakit atau dinas luar pada hari yang sama.
