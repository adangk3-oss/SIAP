// Text-to-Speech utility untuk pengumuman absensi
// Menggunakan Web Speech API bawaan browser

let currentUtterance: SpeechSynthesisUtterance | null = null;
let voices: SpeechSynthesisVoice[] = [];
let isVoicesLoaded = false;

// Load available voices
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    // Jika sudah ada voices, langsung resolve
    const currentVoices = window.speechSynthesis.getVoices();
    if (currentVoices.length > 0) {
      voices = currentVoices;
      isVoicesLoaded = true;
      resolve(voices);
      return;
    }

    // Set timeout untuk fallback
    const timeout = setTimeout(() => {
      const fallbackVoices = window.speechSynthesis.getVoices();
      voices = fallbackVoices;
      isVoicesLoaded = true;
      resolve(voices);
    }, 1000);

    // Listen untuk voiceschanged event
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout);
      voices = window.speechSynthesis.getVoices();
      isVoicesLoaded = true;
      resolve(voices);
    };
  });
}

// Cari voice Bahasa Indonesia yang terbaik
function getIndonesianVoice(): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) {
    voices = window.speechSynthesis?.getVoices() || [];
  }

  // Prioritas: id-ID > id > Bahasa Indonesia > Female voice
  const priorities = [
    (v: SpeechSynthesisVoice) => v.lang === 'id-ID' && v.localService,
    (v: SpeechSynthesisVoice) => v.lang === 'id-ID',
    (v: SpeechSynthesisVoice) => v.lang.startsWith('id'),
    (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('indonesia'),
    (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('indonesian'),
    (v: SpeechSynthesisVoice) => v.lang === 'ms-MY', // Malay sebagai fallback
    (v: SpeechSynthesisVoice) => v.lang.startsWith('ms'),
  ];

  for (const priority of priorities) {
    const found = voices.find(priority);
    if (found) return found;
  }

  // Fallback: voice perempuan dari bahasa apapun
  const femaleVoice = voices.find(v => 
    v.name.toLowerCase().includes('female') || 
    v.name.toLowerCase().includes('wanita')
  );
  if (femaleVoice) return femaleVoice;

  // Fallback terakhir: voice pertama
  return voices[0] || null;
}

// Check apakah speech synthesis didukung
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Fungsi utama untuk mengucapkan pengumuman absensi
export async function speakAbsenSuccess(namaPegawai: string): Promise<void> {
  if (!isSpeechSupported()) {
    console.warn('Text-to-Speech tidak didukung di browser ini');
    return;
  }

  try {
    // Cancel semua utterance yang sedang berjalan
    window.speechSynthesis.cancel();

    // Load voices jika belum
    if (!isVoicesLoaded) {
      await loadVoices();
    }

    // Format teks ucapan
    const text = `Terima Kasih ${namaPegawai}. Absen Anda Telah Berhasil.`;

    // Buat utterance baru
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice Bahasa Indonesia
    const voice = getIndonesianVoice();
    if (voice) {
      utterance.voice = voice;
    }

    // Konfigurasi parameter
    utterance.lang = 'id-ID';
    utterance.rate = 0.95; // Sedikit lebih lambat untuk kejelasan
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Simpan reference untuk bisa di-cancel
    currentUtterance = utterance;

    // Event handlers
    utterance.onstart = () => {
      console.log('🔊 Memulai pengumuman absensi untuk:', namaPegawai);
    };

    utterance.onend = () => {
      console.log('✅ Pengumuman absensi selesai');
      currentUtterance = null;
    };

    utterance.onerror = (event) => {
      console.error('❌ Error saat mengucapkan:', event.error);
      currentUtterance = null;
    };

    // Ucapkan
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Error dalam Text-to-Speech:', error);
  }
}

// Stop pengumuman yang sedang berjalan
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

// Check apakah sedang berbicara
export function isSpeaking(): boolean {
  if (!isSpeechSupported()) return false;
  return window.speechSynthesis.speaking;
}

// Test function untuk testing voice
export async function testVoice(): Promise<void> {
  await speakAbsenSuccess('Test Pegawai');
}

// Get list available voices (untuk debug)
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices();
}
