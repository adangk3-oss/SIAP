import { User, Pegawai, AbsensiRecord, Settings, DailyActivity } from './types';

const DEFAULT_SETTINGS: Settings = {
  jamMasuk: '07:00',
  jamPulang: '14:00',
  kepalaSekolah: {
    nama: 'Dr. H. Ahmad Suryadi, M.Pd',
    nip: '196805151993031008',
    jabatan: 'Kepala Sekolah'
  },
  hariKerja: {},
  identitasSekolah: {
    nama: 'SMP NEGERI 61 BANDUNG',
    npsn: '20205678',
    alamat: 'Jl. Pendidikan No. 61, Bandung',
    logo: ''
  }
};

const DEFAULT_USERS: User[] = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
  { id: '2', username: 'operator', password: 'operator123', role: 'operator', name: 'Operator Sekolah' },
  { id: '3', username: 'user', password: 'user123', role: 'user', name: 'User Biasa' }
];

function getItem<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const store = {
  // Users
  getUsers: (): User[] => getItem('users', DEFAULT_USERS),
  setUsers: (users: User[]) => setItem('users', users),
  addUser: (user: User) => {
    const users = store.getUsers();
    users.push(user);
    store.setUsers(users);
  },
  deleteUser: (id: string) => {
    const users = store.getUsers().filter(u => u.id !== id);
    store.setUsers(users);
  },
  updateUser: (user: User) => {
    const users = store.getUsers().map(u => u.id === user.id ? user : u);
    store.setUsers(users);
    // Update currentUser jika user yang diedit adalah user yang sedang login
    const currentUser = store.getCurrentUser();
    if (currentUser && currentUser.id === user.id) {
      store.setCurrentUser(user);
    }
  },

  // Pegawai
  getPegawai: (): Pegawai[] => getItem('pegawai', []),
  setPegawai: (data: Pegawai[]) => setItem('pegawai', data),
  addPegawai: (p: Pegawai) => {
    const data = store.getPegawai();
    data.push(p);
    store.setPegawai(data);
  },
  updatePegawai: (p: Pegawai) => {
    const data = store.getPegawai().map(item => item.id === p.id ? p : item);
    store.setPegawai(data);
  },
  deletePegawai: (id: string) => {
    const data = store.getPegawai().filter(p => p.id !== id);
    store.setPegawai(data);
  },

  // Absensi
  getAbsensi: (): AbsensiRecord[] => getItem('absensi', []),
  setAbsensi: (data: AbsensiRecord[]) => setItem('absensi', data),
  addAbsensi: (record: AbsensiRecord) => {
    const data = store.getAbsensi();
    data.push(record);
    store.setAbsensi(data);
  },
  updateAbsensi: (record: AbsensiRecord) => {
    const data = store.getAbsensi().map(item => item.id === record.id ? record : item);
    store.setAbsensi(data);
  },
  deleteAbsensi: (id: string) => {
    const data = store.getAbsensi().filter(r => r.id !== id);
    store.setAbsensi(data);
  },

  // Daily Activities
  getActivities: (): DailyActivity[] => getItem('activities', []),
  setActivities: (data: DailyActivity[]) => setItem('activities', data),
  addActivity: (activity: DailyActivity) => {
    const data = store.getActivities();
    data.push(activity);
    store.setActivities(data);
  },
  updateActivity: (activity: DailyActivity) => {
    const data = store.getActivities().map(item => item.id === activity.id ? activity : item);
    store.setActivities(data);
  },
  deleteActivity: (id: string) => {
    const data = store.getActivities().filter(a => a.id !== id);
    store.setActivities(data);
  },

  // Settings
  getSettings: (): Settings => getItem('settings', DEFAULT_SETTINGS),
  setSettings: (settings: Settings) => setItem('settings', settings),

  // Auth
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  },

  // Backup
  exportData: () => {
    const data = {
      users: store.getUsers(),
      pegawai: store.getPegawai(),
      absensi: store.getAbsensi(),
      activities: store.getActivities(),
      settings: store.getSettings(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },
  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) store.setUsers(data.users);
      if (data.pegawai) store.setPegawai(data.pegawai);
      if (data.absensi) store.setAbsensi(data.absensi);
      if (data.activities) store.setActivities(data.activities);
      if (data.settings) store.setSettings(data.settings);
      return true;
    } catch {
      return false;
    }
  }
};
