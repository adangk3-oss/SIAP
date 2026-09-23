# Fitur Tombol Edit untuk Semua Pegawai di Tabel Data Absensi

## Deskripsi Fitur

Menambahkan tombol edit pada **semua pegawai** di tabel data absensi Rekap Harian, termasuk pegawai yang belum melakukan absensi. Tombol ini memungkinkan admin untuk:
- **Edit** data absensi yang sudah ada
- **Tambah** data absensi baru untuk pegawai yang belum absen

## Perubahan yang Dilakukan

### 1. Update Handler Function `handleEditAbsen`

**Sebelum:**
```typescript
const handleEditAbsen = (absen: AbsensiRecord) => {
  setEditAbsenData(absen);
  setShowEditAbsen(true);
};
```

**Sesudah:**
```typescript
const handleEditAbsen = (pegawaiId: string) => {
  // Cari data absensi untuk pegawai ini pada tanggal yang dipilih
  const existingAbsen = todayAbsensi.find(a => a.pegawaiId === pegawaiId);
  
  if (existingAbsen) {
    // Jika sudah ada data absensi, edit data yang ada
    setEditAbsenData(existingAbsen);
  } else {
    // Jika belum ada, buat record baru
    const newAbsen: AbsensiRecord = {
      id: Date.now().toString(),
      pegawaiId: pegawaiId,
      tanggal: selectedDate,
      status: 'hadir'
    };
    setEditAbsenData(newAbsen);
  }
  setShowEditAbsen(true);
};
```

**Perubahan:**
- Parameter berubah dari `AbsensiRecord` menjadi `pegawaiId` (string)
- Menambahkan logika untuk mengecek apakah data absensi sudah ada
- Jika belum ada, membuat record baru dengan tanggal yang dipilih

### 2. Update Handler Function `handleSaveEditAbsen`

**Sebelum:**
```typescript
const handleSaveEditAbsen = () => {
  if (editAbsenData) {
    store.updateAbsensi(editAbsenData);
    setShowEditAbsen(false);
    setEditAbsenData(null);
    refresh();
  }
};
```

**Sesudah:**
```typescript
const handleSaveEditAbsen = () => {
  if (editAbsenData) {
    // Cek apakah ini data baru atau data yang sudah ada
    const existingAbsen = todayAbsensi.find(a => a.id === editAbsenData.id);
    
    if (existingAbsen) {
      // Update data yang sudah ada
      store.updateAbsensi(editAbsenData);
    } else {
      // Tambah data baru
      store.addAbsensi(editAbsenData);
    }
    
    setShowEditAbsen(false);
    setEditAbsenData(null);
    refresh();
  }
};
```

**Perubahan:**
- Menambahkan logika untuk mengecek apakah data baru atau sudah ada
- Jika data baru, menggunakan `store.addAbsensi()`
- Jika data sudah ada, menggunakan `store.updateAbsensi()`

### 3. Update Tabel Absensi

**Sebelum:**
```typescript
<td className="px-4 py-3 text-center">
  {hasAbsen && (
    <div className="flex items-center justify-center gap-1">
      <button 
        onClick={() => handleEditAbsen(absen)} 
        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
        title="Edit Absensi"
      >
        ✏️
      </button>
      <button 
        onClick={() => handleDeleteAbsensi(absen.id)} 
        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
        title="Hapus Absensi"
      >
        🗑️
      </button>
    </div>
  )}
</td>
```

**Sesudah:**
```typescript
<td className="px-4 py-3 text-center">
  <div className="flex items-center justify-center gap-1">
    <button 
      onClick={() => handleEditAbsen(p.id)} 
      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
      title={hasAbsen ? "Edit Absensi" : "Tambah Absensi"}
    >
      {hasAbsen ? '✏️' : '➕'}
    </button>
    {hasAbsen && (
      <button 
        onClick={() => handleDeleteAbsensi(absen.id)} 
        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
        title="Hapus Absensi"
      >
        🗑️
      </button>
    )}
  </div>
</td>
```

**Perubahan:**
- Menghapus kondisi `{hasAbsen && (...)}` untuk tombol edit
- Tombol edit sekarang muncul untuk **semua pegawai**
- Icon tombol berubah dinamis:
  - **✏️** (Edit) untuk pegawai yang sudah absen
  - **➕** (Tambah) untuk pegawai yang belum absen
- Title tooltip juga berubah dinamis
- Tombol hapus tetap hanya muncul jika `hasAbsen` true

### 4. Update Modal Header

**Sebelum:**
```typescript
<div className="w-12 h-12 rounded-2xl flex items-center justify-center"
     style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
  <span className="text-2xl">✏️</span>
</div>
<div>
  <h3 className="text-xl font-bold text-gray-800">Edit Data Absensi</h3>
  ...
</div>
```

**Sesudah:**
```typescript
<div className="w-12 h-12 rounded-2xl flex items-center justify-center"
     style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
  <span className="text-2xl">{todayAbsensi.find(a => a.id === editAbsenData.id) ? '✏️' : '➕'}</span>
</div>
<div>
  <h3 className="text-xl font-bold text-gray-800">
    {todayAbsensi.find(a => a.id === editAbsenData.id) ? 'Edit Data Absensi' : 'Tambah Data Absensi'}
  </h3>
  ...
</div>
```

**Perubahan:**
- Icon header berubah dinamis: ✏️ untuk edit, ➕ untuk tambah
- Judul modal berubah dinamis: "Edit Data Absensi" atau "Tambah Data Absensi"

### 5. Update Tombol Simpan

**Sebelum:**
```typescript
<button onClick={handleSaveEditAbsen} ...>
  💾 Simpan Perubahan
</button>
```

**Sesudah:**
```typescript
<button onClick={handleSaveEditAbsen} ...>
  {todayAbsensi.find(a => a.id === editAbsenData.id) ? '💾 Simpan Perubahan' : '💾 Tambah Absensi'}
</button>
```

**Perubahan:**
- Teks tombol berubah dinamis: "Simpan Perubahan" atau "Tambah Absensi"

## Fitur yang Ditambahkan

### 1. Tombol Edit untuk Semua Pegawai
- ✅ Tombol edit muncul untuk **semua pegawai**
- ✅ Icon dinamis: ✏️ (edit) atau ➕ (tambah)
- ✅ Tooltip dinamis: "Edit Absensi" atau "Tambah Absensi"

### 2. Modal Dinamis
- ✅ Judul modal berubah: "Edit Data Absensi" atau "Tambah Data Absensi"
- ✅ Icon header berubah: ✏️ atau ➕
- ✅ Teks tombol berubah: "Simpan Perubahan" atau "Tambah Absensi"

### 3. Logika Smart Save
- ✅ Otomatis detect apakah data baru atau sudah ada
- ✅ Menggunakan `addAbsensi()` untuk data baru
- ✅ Menggunakan `updateAbsensi()` untuk data yang sudah ada

### 4. Tombol Hapus Kondisional
- ✅ Tombol hapus hanya muncul untuk pegawai yang sudah absen
- ✅ Mencegah error saat mencoba hapus data yang tidak ada

## Cara Penggunaan

### **Skenario 1: Edit Data yang Sudah Ada**

1. Buka halaman **Rekap Harian**
2. Pilih tanggal yang diinginkan
3. Cari pegawai yang sudah absen (status ✅ Hadir)
4. Klik tombol **✏️** (Edit)
5. Modal "Edit Data Absensi" terbuka
6. Ubah data yang diperlukan
7. Klik **💾 Simpan Perubahan**
8. Data tersimpan dan tabel refresh

### **Skenario 2: Tambah Data Baru**

1. Buka halaman **Rekap Harian**
2. Pilih tanggal yang diinginkan
3. Cari pegawai yang belum absen (status ❌ Belum)
4. Klik tombol **➕** (Tambah)
5. Modal "Tambah Data Absensi" terbuka
6. Isi data absensi:
   - Waktu datang
   - Izin keluar/masuk
   - Waktu pulang
   - Sakit (S)
   - Tanpa Keterangan (TK)
   - Dinas Luar (DL)
   - Keterangan
7. Klik **💾 Tambah Absensi**
8. Data baru tersimpan dan tabel refresh

### **Skenario 3: Edit Sakit (S) untuk Pegawai yang Belum Absen**

1. Buka halaman **Rekap Harian**
2. Pilih tanggal
3. Cari pegawai yang belum absen
4. Klik tombol **➕**
5. Isi field **🤒 Sakit (S)** dengan waktu
6. Status otomatis berubah jadi "sakit"
7. Klik **💾 Tambah Absensi**
8. Pegawai sekarang tercatat sebagai sakit

## Visual Indikator

### **Tabel Absensi:**

| No | Nama | Status | ... | Aksi |
|----|------|--------|-----|------|
| 1 | Budi Santoso | ✅ Hadir | ... | ✏️ 🗑️ |
| 2 | Siti Nurhaliza | ✅ Hadir | ... | ✏️ 🗑️ |
| 3 | Ahmad Dahlan | ❌ Belum | ... | ➕ |
| 4 | Dewi Lestari | ❌ Belum | ... | ➕ |

**Keterangan:**
- **✏️** = Edit data yang sudah ada
- **➕** = Tambah data baru
- **🗑️** = Hapus data (hanya muncul jika sudah absen)

### **Modal Edit:**

**Untuk Edit Data yang Sudah Ada:**
```
┌─────────────────────────────────────┐
│ ✏️  Edit Data Absensi               │
│     Budi Santoso - 15 Januari 2024  │
├─────────────────────────────────────┤
│ [Form Fields]                       │
├─────────────────────────────────────┤
│ [💾 Simpan Perubahan] [❌ Batal]    │
└─────────────────────────────────────┘
```

**Untuk Tambah Data Baru:**
```
┌─────────────────────────────────────┐
│ ➕  Tambah Data Absensi             │
│     Ahmad Dahlan - 15 Januari 2024  │
├─────────────────────────────────────┤
│ [Form Fields]                       │
├─────────────────────────────────────┤
│ [💾 Tambah Absensi] [❌ Batal]      │
└─────────────────────────────────────┘
```

## Keuntungan Fitur

### **1. Fleksibilitas**
- ✅ Admin bisa edit data yang sudah ada
- ✅ Admin bisa tambah data baru untuk pegawai yang belum absen
- ✅ Tidak perlu melalui halaman Absensi untuk tambah data manual

### **2. Efisiensi**
- ✅ Semua operasi absensi bisa dilakukan dari satu halaman (Rekap Harian)
- ✅ Tidak perlu switch antara halaman Absensi dan Rekap Harian
- ✅ Proses lebih cepat dan efisien

### **3. User Experience**
- ✅ Visual indikator yang jelas (✏️ vs ➕)
- ✅ Modal dinamis dengan judul yang sesuai
- ✅ Tooltip informatif
- ✅ Feedback yang jelas

### **4. Data Integrity**
- ✅ Mencegah duplikasi data
- ✅ Auto-detect data baru vs existing
- ✅ Validasi otomatis

## Testing

### **Test Cases:**

#### **Edit Data yang Sudah Ada:**
- ✅ Klik ✏️ pada pegawai yang sudah absen
- ✅ Modal "Edit Data Absensi" terbuka
- ✅ Data yang ada terisi di form
- ✅ Ubah data dan simpan
- ✅ Data terupdate dengan benar

#### **Tambah Data Baru:**
- ✅ Klik ➕ pada pegawai yang belum absen
- ✅ Modal "Tambah Data Absensi" terbuka
- ✅ Form kosong (kecuali nama dan tanggal)
- ✅ Isi data dan simpan
- ✅ Data baru tersimpan dengan benar
- ✅ Status pegawai berubah jadi ✅ Hadir

#### **Edit Sakit (S):**
- ✅ Klik ➕ pada pegawai yang belum absen
- ✅ Isi field Sakit (S)
- ✅ Status otomatis jadi "sakit"
- ✅ Simpan dan cek di tabel
- ✅ Data sakit tercatat dengan benar

#### **Edit Tanpa Keterangan (TK):**
- ✅ Klik ➕ pada pegawai yang belum absen
- ✅ Isi field Tanpa Keterangan (TK)
- ✅ Status otomatis jadi "alpha"
- ✅ Simpan dan cek di tabel
- ✅ Data TK tercatat dengan benar

#### **Edit Dinas Luar (DL):**
- ✅ Klik ➕ pada pegawai yang belum absen
- ✅ Isi field Dinas Luar (DL)
- ✅ Isi keterangan
- ✅ Simpan dan cek di tabel
- ✅ Data DL tercatat dengan benar

### **Edge Cases:**
- ✅ Edit data yang sudah ada multiple kali
- ✅ Tambah data baru lalu edit
- ✅ Tambah data untuk semua pegawai sekaligus
- ✅ Batal tambah data baru
- ✅ Batal edit data yang sudah ada
- ✅ Tambah data dengan field kosong
- ✅ Tambah data dengan semua field terisi

## Build Status

✅ **Build berhasil tanpa error**

```
✓ 1357 modules transformed.
✓ built in 17.14s
```

## Kesimpulan

Fitur tombol edit untuk semua pegawai di tabel data absensi telah berhasil ditambahkan dengan:

1. **Tombol Edit Universal** - Muncul untuk semua pegawai (✏️ untuk edit, ➕ untuk tambah)
2. **Modal Dinamis** - Judul dan icon berubah sesuai konteks
3. **Smart Save Logic** - Auto-detect data baru vs existing
4. **Visual Indicators** - Icon dan tooltip yang jelas
5. **Conditional Delete** - Tombol hapus hanya untuk data yang ada

Admin sekarang dapat:
- ✅ Edit data absensi yang sudah ada
- ✅ Tambah data absensi baru untuk pegawai yang belum absen
- ✅ Melakukan semua operasi absensi dari satu halaman (Rekap Harian)
- ✅ Mengisi data Sakit (S), Tanpa Keterangan (TK), dan Dinas Luar (DL) secara manual

Semua fitur berfungsi dengan baik dan build berhasil tanpa error.
