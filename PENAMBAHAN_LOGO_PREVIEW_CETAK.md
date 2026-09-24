# Penambahan Logo Sekolah pada Preview Cetak

## Ringkasan Perubahan

Menambahkan logo sekolah yang sudah diupload pada pengaturan identitas sekolah di sebelah kiri atas kertas pada preview cetak untuk:
1. **Detail Absensi Bulanan** (printDetailAbsensi)
2. **Rekap Bulanan** (printRekap)

## Perubahan yang Dilakukan

### **1. Fungsi printDetailAbsensi**

#### **Sebelum:**
```tsx
<div class="header">
  <h1>${settings.identitasSekolah.nama}</h1>
  <p>${settings.identitasSekolah.alamat}</p>
  <p>NPSN: ${settings.identitasSekolah.npsn}</p>
</div>
```

**CSS:**
```css
.header { text-align: center; margin-bottom: 20px; }
.header h1 { font-size: 14pt; margin: 0; }
.header p { font-size: 10pt; margin: 2px 0; }
```

#### **Sesudah:**
```tsx
<div class="header">
  <div class="header-logo">
    ${settings.identitasSekolah.logo ? `<img src="${settings.identitasSekolah.logo}" alt="Logo Sekolah">` : ''}
  </div>
  <div class="header-info">
    <h1>${settings.identitasSekolah.nama}</h1>
    <p>${settings.identitasSekolah.alamat}</p>
    <p>NPSN: ${settings.identitasSekolah.npsn}</p>
  </div>
</div>
```

**CSS:**
```css
.header { display: flex; align-items: center; margin-bottom: 20px; gap: 20px; }
.header-logo { flex-shrink: 0; }
.header-logo img { width: 80px; height: 80px; object-fit: contain; }
.header-info { flex: 1; text-align: center; }
.header-info h1 { font-size: 14pt; margin: 0; }
.header-info p { font-size: 10pt; margin: 2px 0; }
```

### **2. Fungsi printRekap**

Perubahan yang sama diterapkan pada fungsi printRekap dengan struktur yang identik.

## Detail Implementasi

### **1. Struktur HTML**

**Layout Flexbox:**
```html
<div class="header">
  <div class="header-logo">
    <img src="logo-url" alt="Logo Sekolah">
  </div>
  <div class="header-info">
    <h1>Nama Sekolah</h1>
    <p>Alamat Sekolah</p>
    <p>NPSN: xxxxxx</p>
  </div>
</div>
```

### **2. CSS Styling**

**Header Container:**
```css
.header { 
  display: flex;           /* Flexbox layout */
  align-items: center;     /* Vertically centered */
  margin-bottom: 20px; 
  gap: 20px;              /* Space between logo and info */
}
```

**Logo Container:**
```css
.header-logo { 
  flex-shrink: 0;         /* Prevent logo from shrinking */
}
.header-logo img { 
  width: 80px;            /* Fixed width */
  height: 80px;           /* Fixed height */
  object-fit: contain;    /* Maintain aspect ratio */
}
```

**Info Container:**
```css
.header-info { 
  flex: 1;                /* Take remaining space */
  text-align: center;     /* Center align text */
}
```

### **3. Conditional Rendering**

```tsx
${settings.identitasSekolah.logo ? `<img src="${settings.identitasSekolah.logo}" alt="Logo Sekolah">` : ''}
```

- Jika logo ada → tampilkan logo
- Jika logo tidak ada → tidak tampilkan apa-apa (info sekolah tetap center)

## Tampilan Preview Cetak

### **Sebelum:**
```
┌─────────────────────────────────────┐
│      SMP NEGERI 61 BANDUNG          │
│      Jl. Pendidikan No. 61          │
│      NPSN: 20205678                 │
└─────────────────────────────────────┘
```

### **Sesudah:**
```
┌─────────────────────────────────────┐
│ [LOGO]    SMP NEGERI 61 BANDUNG     │
│  80x80    Jl. Pendidikan No. 61     │
│           NPSN: 20205678            │
└─────────────────────────────────────┘
```

## Spesifikasi Logo

### **Ukuran:**
- Width: 80px
- Height: 80px
- Object-fit: contain (maintain aspect ratio)

### **Format yang Didukung:**
- PNG (dengan transparansi)
- JPG/JPEG
- SVG
- Rekomendasi: PNG dengan background transparan

### **Posisi:**
- Sebelah kiri atas kertas
- Jarak 20px dari info sekolah
- Vertically centered dengan info sekolah

## Keuntungan Perubahan

### **1. Profesionalisme**
✅ Logo sekolah memberikan kesan resmi dan profesional  
✅ Identitas sekolah lebih terlihat  
✅ Sesuai dengan standar dokumen resmi  

### **2. Branding**
✅ Branding sekolah lebih kuat  
✅ Mudah dikenali oleh pembaca  
✅ Konsisten dengan dokumen lain  

### **3. Visual Balance**
✅ Layout flexbox memberikan keseimbangan visual  
✅ Logo dan info sekolah sejajar  
✅ Spacing yang proporsional  

### **4. Fallback Handling**
✅ Jika logo belum diupload, info sekolah tetap center  
✅ Tidak ada error jika logo kosong  
✅ Graceful degradation  

## Testing

### Test Cases:
- ✅ Logo muncul di sebelah kiri atas pada printDetailAbsensi
- ✅ Logo muncul di sebelah kiri atas pada printRekap
- ✅ Ukuran logo 80x80px
- ✅ Logo maintain aspect ratio (object-fit: contain)
- ✅ Info sekolah tetap center jika logo tidak ada
- ✅ Spacing antara logo dan info 20px
- ✅ Layout responsive dan rapi
- ✅ Build berhasil tanpa error

## Build Status

✅ **Build berhasil tanpa error**

```
✓ 1357 modules transformed.
✓ built in 16.17s
```

## Catatan Penting

### **Kualitas Logo:**
- Rekomendasi upload logo minimal 200x200px untuk kualitas terbaik
- Logo akan di-resize ke 80x80px di preview cetak
- Gunakan PNG dengan background transparan untuk hasil terbaik

### **Konsistensi:**
- Layout yang sama digunakan di semua fungsi cetak
- Ukuran logo konsisten (80x80px)
- Spacing konsisten (20px gap)

### **Fallback Behavior:**
- Jika logo belum diupload → info sekolah tetap center
- Tidak ada placeholder atau icon default
- Tampilan tetap profesional tanpa logo

## Cara Upload Logo

1. Login sebagai **admin**
2. Buka menu **Pengaturan**
3. Scroll ke bagian **Identitas Sekolah**
4. Upload logo sekolah (PNG/JPG/SVG)
5. Klik **Simpan Pengaturan**
6. Logo akan otomatis muncul di preview cetak

## Kesimpulan

Logo sekolah telah berhasil ditambahkan di sebelah kiri atas kertas pada preview cetak untuk Detail Absensi Bulanan dan Rekap Bulanan. Layout menggunakan flexbox dengan logo 80x80px di kiri dan info sekolah di kanan (center). Tampilan lebih profesional, seimbang, dan sesuai dengan standar dokumen resmi. Fallback handling memastikan tampilan tetap baik meskipun logo belum diupload.
