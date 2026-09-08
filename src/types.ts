export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'operator' | 'user';
  name: string;
}

export interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  idAbsen: string;
}

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
}

export interface Settings {
  jamMasuk: string;
  jamPulang: string;
  kepalaSekolah: {
    nama: string;
    nip: string;
    jabatan: string;
  };
  hariKerja: Record<string, boolean>;
  identitasSekolah: {
    nama: string;
    npsn: string;
    alamat: string;
    logo: string;
  };
}

export interface DailyActivity {
  id: string;
  pegawaiId: string;
  tanggal: string;
  aktivitas: string;
  waktu: string;
}
