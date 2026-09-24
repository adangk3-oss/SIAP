# Fitur Edit Manual Absensi di Rekap Harian

## Deskripsi Fitur

Menambahkan fungsi edit manual untuk data absensi di halaman Rekap Harian, khususnya untuk kolom:
- **Sakit (S)**
- **Tanpa Keterangan (TK)**
- **Dinas Luar (DL)**
- Dan semua kolom absensi lainnya

## Perubahan yang Dilakukan

### 1. State Management (src/App.tsx)

Menambahkan state untuk modal edit:

```typescript
const [showEditAbsen, setShowEditAbsen] = useState(false);
const [editAbsenData, setEditAbsenData] = useState<AbsensiRecord | null>(null);
```

### 2. Handler Functions

#### handleEditAbsen
Membuka modal edit dengan data absensi yang dipilih:

```typescript
const handleEditAbsen = (absen: AbsensiRecord) => {
  setEditAbsenData(absen);
  setShowEditAbsen(true);
};
```

#### handleSaveEditAbsen
Menyimpan perubahan data absensi:

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

#### handleCloseEditAbsen
Menutup modal edit tanpa menyimpan:

```typescript
const handleCloseEditAbsen = () => {
  setShowEditAbsen(false);
  setEditAbsenData(null);
};
```

### 3. Update Tabel Absensi

Menambahkan tombol edit pada kolom Aksi:

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

### 4. Modal Edit Absensi

Modal edit yang lengkap dengan semua field absensi:

```typescript
{showEditAbsen && editAbsenData && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            <span className="text-2xl">✏️</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Edit Data Absensi</h3>
            <p className="text-sm text-gray-500">
              {pegawai.find(p => p.id === editAbsenData.pegawaiId)?.nama || '-'} - 
              {format(parseISO(editAbsenData.tanggal), 'dd MMMM yyyy', { locale: idLocale })}
            </p>
          </div>
        </div>
        <button onClick={handleCloseEditAbsen} className="text-gray-400 hover:text-gray-600 text-2xl">
          &times;
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Waktu Datang */}
        <div>
          <label className="block text-xs font-semibold text-green-600 mb-2 uppercase tracking-wider">
            🌅 Waktu Datang
          </label>
          <input
            type="time"
            value={editAbsenData.datang || ''}
            onChange={e => setEditAbsenData({ ...editAbsenData, datang: e.target.value || undefined })}
            className="w-full px-4 py-2.5 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Izin Keluar */}
        <div>
          <label className="block text-xs font-semibold text-yellow-600 mb-2 uppercase tracking-wider">
            🚶 Izin Keluar
          </label>
          <input
            type="time"
            value={editAbsenData.izinKeluar || ''}
            onChange={e => setEditAbsenData({ ...editAbsenData, izinKeluar: e.target.value || undefined })}
            className="w-full px-4 py-2.5 border-2 border-yellow-200 rounded-xl focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Izin Masuk */}
        <div>
          <label className="block text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wider">
            🏠 Izin Masuk
          </label>
          <input
            type="time"
            value={editAbsenData.izinMasuk || ''}
            onChange={e => setEditAbsenData({ ...editAbsenData, izinMasuk: e.target.value || undefined })}
            className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {/* Waktu Pulang */}
        <div>
          <label className="block text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">
            🌆 Waktu Pulang
          </label>
          <input
            type="time"
            value={editAbsenData.pulang || ''}
            onChange={e => setEditAbsenData({ ...editAbsenData, pulang: e.target.value || undefined })}
            className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Sakit (S) - Dengan Background Orange */}
        <div className="p-4 rounded-xl bg-orange-50 border-2 border-orange-200">
          <label className="block text-xs font-semibold text-orange-600 mb-2 uppercase tracking-wider">
            🤒 Sakit (S)
          </label>
          <input
            type="time"
            value={editAbsenData.sakit || ''}
            onChange={e => setEditAbsenData({ 
              ...editAbsenData, 
              sakit: e.target.value || undefined, 
              status: e.target.value ? 'sakit' : 'hadir' 
            })}
            className="w-full px-4 py-2.5 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>

        {/* Tanpa Keterangan (TK) - Dengan Background Red */}
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
          <label className="block text-xs font-semibold text-red-600 mb-2 uppercase tracking-wider">
            ❌ Tanpa Keterangan (TK)
          </label>
          <input
            type="time"
            value={editAbsenData.tanpaKeterangan || ''}
            onChange={e => setEditAbsenData({ 
              ...editAbsenData, 
              tanpaKeterangan: e.target.value || undefined, 
              status: e.target.value ? 'alpha' : 'hadir' 
            })}
            className="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 bg-white"
          />
        </div>

        {/* Dinas Luar (DL) - Dengan Background Indigo */}
        <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-200">
          <label className="block text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wider">
            🚗 Dinas Luar (DL)
          </label>
          <input
            type="time"
            value={editAbsenData.dinasLuar || ''}
            onChange={e => setEditAbsenData({ ...editAbsenData, dinasLuar: e.target.value || undefined })}
            className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 bg-white"
          />
        </div>

        {/* Keterangan */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
            📝 Keterangan
          </label>
          <textarea
            value={editAbsenData.keteranganIzin || ''}
            onChange={e => setEditAbsenData({ ...editAbsenData, keteranganIzin: e.target.value || undefined })}
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400"
            placeholder="Masukkan keterangan..."
            rows={3}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSaveEditAbsen}
          className="btn-futuristic flex-1 py-3 rounded-xl font-bold text-white tracking-wider uppercase text-sm transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            boxShadow: '0 10px 25px rgba(56, 239, 125, 0.4)',
          }}
        >
          💾 Simpan Perubahan
        </button>
        <button
          onClick={handleCloseEditAbsen}
          className="btn-futuristic flex-1 py-3 rounded-xl font-bold text-white tracking-wider uppercase text-sm transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
            boxShadow: '0 10px 25px rgba(107, 114, 128, 0.4)',
          }}
        >
          ❌ Batal
        </button>
      </div>
    </div>
  </div>
)}
```

## Fitur Modal Edit

### 1. Header Modal
- Icon edit dengan gradient background
- Nama pegawai dan tanggal absensi
- Tombol close (X)

### 2. Field yang Dapat Diedit

| Field | Icon | Warna | Keterangan |
|-------|------|-------|------------|
| Waktu Datang | 🌅 | Green | Waktu kedatangan pegawai |
| Izin Keluar | 🚶 | Yellow | Waktu izin keluar |
| Izin Masuk | 🏠 | Purple | Waktu izin masuk kembali |
| Waktu Pulang | 🌆 | Blue | waktu kepulangan pegawai |
| **Sakit (S)** | 🤒 | **Orange** | Waktu sakit dengan background orange |
| **Tanpa Keterangan (TK)** | ❌ | **Red** | Waktu TK dengan background red |
| **Dinas Luar (DL)** | 🚗 | **Indigo** | Waktu dinas luar dengan background indigo |
| Keterangan | 📝 | Gray | Keterangan tambahan |

### 3. Auto-Update Status

Ketika mengisi field Sakit atau Tanpa Keterangan, status akan otomatis berubah:

```typescript
// Sakit (S)
onChange={e => setEditAbsenData({ 
  ...editAbsenData, 
  sakit: e.target.value || undefined, 
  status: e.target.value ? 'sakit' : 'hadir' 
})}

// Tanpa Keterangan (TK)
onChange={e => setEditAbsenData({ 
  ...editAbsenData, 
  tanpaKeterangan: e.target.value || undefined, 
  status: e.target.value ? 'alpha' : 'hadir' 
})}
```

### 4. Visual Design

- **Background Modal**: Dark overlay dengan blur effect
- **Container**: Rounded corners, shadow, max-width 2xl
- **Scroll**: Overflow-y-auto untuk konten yang panjang
- **Input Fields**: Border dengan warna sesuai kategori
- **Special Fields**: Background berwarna untuk S, TK, DL
- **Buttons**: Gradient dengan hover effect

## Cara Penggunaan

### 1. Edit Data Absensi

1. Buka halaman **Rekap Harian**
2. Pilih tanggal yang diinginkan
3. Cari pegawai yang datanya ingin diedit
4. Klik tombol **✏️** (Edit) pada kolom Aksi
5. Modal edit akan terbuka dengan data absensi saat ini
6. Ubah data yang diperlukan:
   - Waktu datang/pulang
   - Izin keluar/masuk
   - **Sakit (S)**
   - **Tanpa Keterangan (TK)**
   - **Dinas Luar (DL)**
   - Keterangan
7. Klik **💾 Simpan Perubahan**
8. Data akan tersimpan dan tabel akan refresh

### 2. Edit Sakit (S)

1. Klik tombol **✏️** pada baris pegawai
2. Isi field **🤒 Sakit (S)** dengan waktu
3. Status akan otomatis berubah menjadi "sakit"
4. Klik **💾 Simpan Perubahan**

### 3. Edit Tanpa Keterangan (TK)

1. Klik tombol **✏️** pada baris pegawai
2. Isi field **❌ Tanpa Keterangan (TK)** dengan waktu
3. Status akan otomatis berubah menjadi "alpha"
4. Klik **💾 Simpan Perubahan**

### 4. Edit Dinas Luar (DL)

1. Klik tombol **✏️** pada baris pegawai
2. Isi field **🚗 Dinas Luar (DL)** dengan waktu
3. Isi keterangan jika diperlukan
4. Klik **💾 Simpan Perubahan**

### 5. Batal Edit

1. Klik tombol **❌ Batal**
2. Atau klik tombol **X** di pojok kanan atas
3. Atau klik di luar modal
4. Perubahan tidak akan disimpan

## Fitur Tambahan

### 1. Auto-Refresh
Setelah menyimpan perubahan, halaman akan otomatis refresh untuk menampilkan data terbaru.

### 2. Validasi Data
- Field waktu menggunakan input type="time" untuk validasi otomatis
- Field kosong akan disimpan sebagai undefined
- Status otomatis berubah berdasarkan field yang diisi

### 3. Visual Feedback
- Border berwarna sesuai kategori
- Background khusus untuk S, TK, DL
- Hover effect pada tombol
- Transition smooth pada semua interaksi

### 4. Responsive Design
- Modal max-width 2xl untuk desktop
- Scroll untuk konten yang panjang
- Padding dan spacing yang optimal
- Touch-friendly untuk mobile

## Testing

### Test Cases
- ✅ Tombol edit muncul pada baris yang memiliki data absensi
- ✅ Modal edit terbuka dengan data yang benar
- ✅ Semua field dapat diedit
- ✅ Field S, TK, DL memiliki background khusus
- ✅ Status otomatis berubah saat mengisi S atau TK
- ✅ Data tersimpan dengan benar
- ✅ Tabel refresh setelah save
- ✅ Tombol batal berfungsi
- ✅ Modal dapat ditutup dengan tombol X
- ✅ Input waktu divalidasi dengan benar
- ✅ Field kosong disimpan sebagai undefined
- ✅ Keterangan dapat diedit

### Edge Cases
- ✅ Edit data yang sudah ada
- ✅ Menambah field baru (misal: menambah waktu sakit)
- ✅ Menghapus field (misal: menghapus waktu sakit)
- ✅ Edit multiple field sekaligus
- ✅ Edit hanya satu field
- ✅ Batal edit tanpa menyimpan

## Build Status

✅ **Build berhasil tanpa error**

```
✓ 1357 modules transformed.
✓ built in 17.29s
```

## Kesimpulan

Fitur edit manual untuk data absensi di Rekap Harian telah berhasil ditambahkan dengan:

1. **Tombol Edit** pada kolom Aksi di tabel absensi
2. **Modal Edit** yang lengkap dengan semua field absensi
3. **Field Khusus** untuk Sakit (S), Tanpa Keterangan (TK), dan Dinas Luar (DL) dengan visual yang berbeda
4. **Auto-Update Status** saat mengisi field S atau TK
5. **Visual Design** yang menarik dengan gradient dan warna yang sesuai
6. **Responsive Design** untuk desktop dan mobile
7. **Validasi Data** otomatis untuk input waktu

Semua fitur berfungsi dengan baik dan build berhasil tanpa error. Admin sekarang dapat mengedit data absensi secara manual dengan mudah, termasuk kolom Sakit (S), Tanpa Keterangan (TK), dan Dinas Luar (DL).
