# Fitur Audio Ucapan Absensi

## Deskripsi Fitur

Fitur audio ucapan (Text-to-Speech) yang akan mengucapkan **"Terima Kasih [nama pegawai], Absen Anda Telah Berhasil"** setiap kali pegawai berhasil melakukan absensi.

## Cara Kerja

### 1. **Teknologi yang Digunakan**
- **Web Speech API** (SpeechSynthesis) - bawaan browser
- Tidak memerlukan package tambahan
- Support untuk Bahasa Indonesia (id-ID)
- Fallback ke voice lain jika voice Indonesia tidak tersedia

### 2. **File yang Dibuat**
- `src/speech.ts` - Utility functions untuk Text-to-Speech

### 3. **Integrasi**
- Dimodifikasi di `src/App.tsx`
- Dipanggil di fungsi `processAbsen` setelah absensi berhasil
- Toggle untuk mengaktifkan/menonaktifkan audio

## Implementasi

### **File: src/speech.ts**

```typescript
// Fungsi utama untuk mengucapkan pengumuman absensi
export async function speakAbsenSuccess(namaPegawai: string): Promise<void> {
  // Format teks ucapan
  const text = `Terima Kasih ${namaPegawai}. Absen Anda Telah Berhasil.`;
  
  // Buat utterance dengan voice Bahasa Indonesia
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Ucapkan
  window.speechSynthesis.speak(utterance);
}
```

### **File: src/App.tsx**

```typescript
// Import
import { speakAbsenSuccess } from './speech';

// State untuk toggle audio
const [audioEnabled, setAudioEnabled] = useState(true);

// Di fungsi processAbsen
if (p && audioEnabled) {
  speakAbsenSuccess(p.nama);
}

// Toggle UI
<button
  onClick={() => setAudioEnabled(!audioEnabled)}
  className="..."
>
  <span>{audioEnabled ? '🔊' : '🔇'}</span>
  <span>{audioEnabled ? 'Audio ON' : 'Audio OFF'}</span>
</button>
```

## Fitur Toggle Audio

### **Lokasi Toggle**
- Di header halaman Absensi Pegawai
- Di sebelah judul "Absensi Pegawai"
- Mudah diakses dan terlihat jelas

### **Visual Toggle**
- **Aktif**: Background gradient ungu, ikon 🔊, teks "Audio ON"
- **Nonaktif**: Background abu-abu, ikon 🔇, teks "Audio OFF"
- Hover effect untuk feedback visual

### **Default State**
- Audio **aktif** secara default
- User bisa menonaktifkan kapan saja

## Flow Penggunaan

### **Saat Absensi Berhasil:**

1. Pegawai melakukan absensi (Manual/QR/Face)
2. Sistem memproses absensi
3. Data absensi disimpan
4. **Audio ucapan dipanggil** (jika diaktifkan)
5. Browser mengucapkan: "Terima Kasih [Nama Pegawai], Absen Anda Telah Berhasil"
6. Notifikasi visual muncul di layar

### **Contoh Ucapan:**
- "Terima Kasih Budi Santoso, Absen Anda Telah Berhasil"
- "Terima Kasih Siti Nurhaliza, Absen Anda Telah Berhasil"
- "Terima Kasih Ahmad Dahlan, Absen Anda Telah Berhasil"

## Konfigurasi Voice

### **Prioritas Voice:**
1. `id-ID` dengan localService (voice lokal)
2. `id-ID` (voice Indonesia apapun)
3. `id` (voice Indonesia umum)
4. Voice dengan nama "Indonesia" atau "Indonesian"
5. `ms-MY` (Malay sebagai fallback)
6. Voice perempuan dari bahasa apapun
7. Voice pertama yang tersedia

### **Parameter Voice:**
- **Rate**: 0.95 (sedikit lebih lambat untuk kejelasan)
- **Pitch**: 1.0 (normal)
- **Volume**: 1.0 (maksimal)
- **Language**: id-ID (Bahasa Indonesia)

## Kompatibilitas Browser

### **Browser yang Mendukung:**
- ✅ Chrome/Edge 33+
- ✅ Firefox 49+
- ✅ Safari 7+
- ✅ Opera 21+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### **Catatan:**
- Web Speech API didukung oleh semua browser modern
- Voice Bahasa Indonesia mungkin tidak tersedia di semua OS
- Fallback ke voice lain jika voice Indonesia tidak ada
- Beberapa browser memerlukan user interaction sebelum bisa speak

## Error Handling

### **Jika Speech Tidak Didukung:**
```typescript
if (!isSpeechSupported()) {
  console.warn('Text-to-Speech tidak didukung di browser ini');
  return;
}
```

### **Jika Voice Tidak Ditemukan:**
- Fallback ke voice default browser
- Tetap berfungsi dengan voice bahasa lain
- Console warning untuk debug

### **Jika Error Terjadi:**
```typescript
utterance.onerror = (event) => {
  console.error('Error saat mengucapkan:', event.error);
  currentUtterance = null;
};
```

## Fungsi Utility

### **Exported Functions:**

1. **`speakAbsenSuccess(namaPegawai: string)`**
   - Fungsi utama untuk mengucapkan pengumuman
   - Async function
   - Otomatis memilih voice Indonesia

2. **`stopSpeaking()`**
   - Stop pengumuman yang sedang berjalan
   - Berguna untuk cancel utterance

3. **`isSpeaking()`**
   - Check apakah sedang berbicara
   - Returns boolean

4. **`isSpeechSupported()`**
   - Check apakah browser support TTS
   - Returns boolean

5. **`testVoice()`**
   - Test function untuk testing voice
   - Mengucapkan "Test Pegawai"

6. **`getAvailableVoices()`**
   - Get list available voices
   - Untuk debug

## Testing

### **Cara Test:**
1. Buka halaman Absensi Pegawai
2. Pastikan toggle audio aktif (🔊 Audio ON)
3. Lakukan absensi untuk salah satu pegawai
4. Dengarkan suara dari speaker/browser
5. Pastikan nama pegawai diucapkan dengan benar

### **Test Cases:**
- ✅ Audio aktif, absensi berhasil → suara terdengar
- ✅ Audio nonaktif, absensi berhasil → tidak ada suara
- ✅ Toggle audio berfungsi dengan baik
- ✅ Nama pegawai diucapkan dengan benar
- ✅ Multiple absensi tidak overlap suara
- ✅ Error handling jika browser tidak support

## Catatan Penting

### **Keamanan Browser:**
- Browser modern memerlukan HTTPS untuk beberapa fitur
- User interaction mungkin diperlukan sebelum speak pertama
- Beberapa browser memblokir auto-play audio

### **Performa:**
- Speech synthesis berjalan di background
- Tidak memblokir UI
- Otomatis cancel utterance sebelumnya jika ada yang baru
- Memory management yang baik

### **Aksesibilitas:**
- Fitur ini membantu pengguna tunanetra
- Memberikan feedback audio yang jelas
- Bisa dinonaktifkan jika tidak diperlukan
- Tidak mengganggu pengguna yang tidak ingin mendengar

### **Lingkungan Penggunaan:**
- **Kantor**: Mungkin perlu dimatikan agar tidak mengganggu
- **Rumah**: Bisa diaktifkan untuk feedback
- **Outdoor**: Sangat berguna untuk konfirmasi
- **Event**: Berguna untuk pengumuman otomatis

## Troubleshooting

### **Suara Tidak Keluar:**
1. Check volume browser
2. Check volume sistem operasi
3. Pastikan toggle audio aktif
4. Refresh halaman
5. Check console untuk error

### **Voice Tidak Jelas:**
1. Rate terlalu cepat → sudah di-set 0.95
2. Voice tidak cocok → coba browser lain
3. Quality speaker → gunakan speaker yang lebih baik

### **Voice Indonesia Tidak Ada:**
1. Browser menggunakan voice default
2. Coba install language pack di OS
3. Fallback ke voice lain tetap berfungsi

## Kesimpulan

Fitur audio ucapan telah berhasil diimplementasikan dengan:
- ✅ Menggunakan Web Speech API bawaan browser
- ✅ Tidak memerlukan package tambahan
- ✅ Support Bahasa Indonesia
- ✅ Toggle untuk mengaktifkan/menonaktifkan
- ✅ Error handling yang baik
- ✅ Kompatibel dengan semua browser modern
- ✅ Mudah digunakan dan dikonfigurasi

Fitur ini meningkatkan pengalaman pengguna dengan memberikan feedback audio yang jelas setiap kali absensi berhasil.
