import React, { useState, useEffect, useCallback, useRef } from 'react';
import { store } from './store';
import { User, Pegawai, AbsensiRecord, Settings, DailyActivity } from './types';
import { QRCodeSVG } from 'qrcode.react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

// ============ QR CODE COMPONENT ============
function QRCodeDisplay({ value, size = 80, level = 'H' }: { value: string; size?: number; level?: 'L' | 'M' | 'Q' | 'H' }) {
  return (
    <QRCodeSVG 
      value={value} 
      size={size} 
      level={level}
      includeMargin={true}
      bgColor="#ffffff"
      fgColor="#000000"
    />
  );
}

// ============ AUTH CONTEXT ============
function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(store.getCurrentUser());
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const login = (username: string, password: string): boolean => {
    const users = store.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      store.setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    store.setCurrentUser(null);
    setPage('dashboard');
  };

  if (!currentUser) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentUser={currentUser} 
        page={page} 
        setPage={setPage} 
        onLogout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 overflow-auto">
        <Header currentUser={currentUser} setSidebarOpen={setSidebarOpen} />
        <main className="p-4 md:p-6">
          {page === 'dashboard' && <Dashboard currentUser={currentUser} setPage={setPage} />}
          {page === 'absen' && <AbsenPage />}
          {page === 'pegawai' && <PegawaiPage />}
          {page === 'rekap-harian' && <RekapHarianPage />}
          {page === 'rekap-bulanan' && <RekapBulananPage />}
          {page === 'users' && currentUser.role === 'admin' && <UserManagementPage />}
          {page === 'pengaturan' && <PengaturanPage />}
        </main>
      </div>
    </div>
  );
}

// ============ LOGIN PAGE ============
function LoginPage({ onLogin }: { onLogin: (u: string, p: string) => boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(username, password)) {
      setError('Username atau password salah!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">SMP NEGERI 61 BANDUNG</h1>
          <p className="text-gray-500 mt-1">Sistem Absensi Digital</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan password"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Masuk
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Default: admin/admin123 | operator/operator123 | user/user123</p>
        </div>
      </div>
    </div>
  );
}

// ============ SIDEBAR ============
function Sidebar({ currentUser, page, setPage, onLogout, sidebarOpen, setSidebarOpen }: any) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'operator', 'user'] },
    { id: 'absen', label: 'Absensi', icon: '✅', roles: ['admin', 'operator', 'user'] },
    { id: 'pegawai', label: 'Data Pegawai', icon: '👥', roles: ['admin', 'operator'] },
    { id: 'rekap-harian', label: 'Rekap Harian', icon: '📋', roles: ['admin', 'operator', 'user'] },
    { id: 'rekap-bulanan', label: 'Rekap Bulanan', icon: '📅', roles: ['admin', 'operator'] },
    { id: 'users', label: 'Manajemen User', icon: '🔐', roles: ['admin'] },
    { id: 'pengaturan', label: 'Pengaturan', icon: '⚙️', roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed md:static z-30 h-full w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
        <div className="p-4 border-b border-blue-700">
          <h2 className={`font-bold text-lg ${!sidebarOpen && 'md:hidden'}`}>SMPN 61 Bandung</h2>
          <p className={`text-xs text-blue-300 ${!sidebarOpen && 'md:hidden'}`}>Sistem Absensi Digital</p>
        </div>
        <nav className="p-2 space-y-1">
          {filteredMenu.map(item => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${page === item.id ? 'bg-blue-600 shadow-lg' : 'hover:bg-blue-700'}`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors">
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span className="text-sm font-medium">Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ============ HEADER ============
function Header({ currentUser, setSidebarOpen }: any) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
      <button onClick={() => setSidebarOpen((p: boolean) => !p)} className="p-2 rounded-lg hover:bg-gray-100">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">{format(currentTime, 'EEEE, dd MMMM yyyy', { locale: idLocale })}</p>
          <p className="text-lg font-bold text-blue-600">{format(currentTime, 'HH:mm:ss')}</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
            <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============ DASHBOARD ============
function Dashboard({ currentUser, setPage }: { currentUser: User; setPage: (p: string) => void }) {
  const pegawai = store.getPegawai();
  const absensi = store.getAbsensi();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAbsensi = absensi.filter(a => a.tanggal === today);
  const settings = store.getSettings();

  const stats = [
    { label: 'Total Pegawai', value: pegawai.length, color: 'from-blue-500 to-blue-600', icon: '👥' },
    { label: 'Hadir Hari Ini', value: todayAbsensi.filter(a => a.datang).length, color: 'from-green-500 to-green-600', icon: '✅' },
    { label: 'Izin Hari Ini', value: todayAbsensi.filter(a => a.keteranganIzin).length, color: 'from-yellow-500 to-yellow-600', icon: '📝' },
    { label: 'Belum Absen', value: pegawai.length - todayAbsensi.length, color: 'from-red-500 to-red-600', icon: '⚠️' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Selamat Datang, {currentUser.name}!</h1>
        <p className="text-blue-200 mt-1">Sistem Absensi Digital SMP Negeri 61 Bandung</p>
        <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
          <span className="text-3xl font-mono font-bold">{format(new Date(), 'HH:mm:ss')}</span>
          <span className="text-blue-200">| Jam Masuk: {settings.jamMasuk} - Jam Pulang: {settings.jamPulang}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl p-5 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <span className="text-4xl opacity-80">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span> Akses Cepat
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPage('absen')} className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center">
              <span className="text-2xl">✅</span>
              <p className="text-sm font-medium text-blue-800 mt-1">Absensi</p>
            </button>
            <button onClick={() => setPage('pegawai')} className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-center">
              <span className="text-2xl">👥</span>
              <p className="text-sm font-medium text-green-800 mt-1">Pegawai</p>
            </button>
            <button onClick={() => setPage('rekap-harian')} className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-center">
              <span className="text-2xl">📋</span>
              <p className="text-sm font-medium text-purple-800 mt-1">Rekap Harian</p>
            </button>
            <button onClick={() => setPage('rekap-bulanan')} className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-center">
              <span className="text-2xl">📅</span>
              <p className="text-sm font-medium text-orange-800 mt-1">Rekap Bulanan</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📈</span> Absensi Hari Ini
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todayAbsensi.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Belum ada absensi hari ini</p>
            ) : (
              todayAbsensi.map(a => {
                const p = pegawai.find(pg => pg.id === a.pegawaiId);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{p?.nama || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{p?.jabatan}</p>
                    </div>
                    <div className="text-right">
                      {a.datang && <p className="text-xs text-green-600">Datang: {a.datang}</p>}
                      {a.pulang && <p className="text-xs text-blue-600">Pulang: {a.pulang}</p>}
                      {a.keteranganIzin && <p className="text-xs text-yellow-600">Izin: {a.keteranganIzin}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ABSEN PAGE ============
function AbsenPage() {
  const [scanMode, setScanMode] = useState(false);
  const [manualId, setManualId] = useState('');
  const [absenType, setAbsenType] = useState<'datang' | 'pulang' | 'izinKeluar' | 'izinMasuk'>('datang');
  const [keterangan, setKeterangan] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const pegawai = store.getPegawai();
  const settings = store.getSettings();

  const processAbsen = useCallback((pegawaiId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');
    const absensi = store.getAbsensi();
    
    let record = absensi.find(a => a.pegawaiId === pegawaiId && a.tanggal === today);
    const p = pegawai.find(pg => pg.id === pegawaiId);

    if (!record) {
      record = {
        id: Date.now().toString(),
        pegawaiId,
        tanggal: today,
        status: 'hadir'
      };
    }

    if (absenType === 'datang') {
      record.datang = now;
      setMessage(`✅ ${p?.nama} - Absen Datang: ${now}`);
      setMessageType('success');
    } else if (absenType === 'pulang') {
      record.pulang = now;
      setMessage(`✅ ${p?.nama} - Absen Pulang: ${now}`);
      setMessageType('success');
    } else if (absenType === 'izinKeluar') {
      record.izinKeluar = now;
      record.keteranganIzin = keterangan;
      setMessage(`✅ ${p?.nama} - Izin Keluar: ${now} (${keterangan})`);
      setMessageType('success');
    } else if (absenType === 'izinMasuk') {
      record.izinMasuk = now;
      setMessage(`✅ ${p?.nama} - Izin Masuk: ${now}`);
      setMessageType('success');
    }

    if (absensi.find(a => a.id === record!.id)) {
      store.updateAbsensi(record);
    } else {
      store.addAbsensi(record);
    }
    setManualId('');
    setKeterangan('');
  }, [absenType, keterangan, pegawai]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId) {
      setMessage('❌ Masukkan ID Absen pegawai!');
      setMessageType('error');
      return;
    }
    const p = pegawai.find(pg => pg.idAbsen === manualId);
    if (!p) {
      setMessage('❌ ID Absen tidak ditemukan!');
      setMessageType('error');
      return;
    }
    processAbsen(p.id);
  };

  const handleScan = (result: string) => {
    const p = pegawai.find(pg => pg.idAbsen === result);
    if (p) {
      processAbsen(p.id);
    } else {
      setMessage('❌ ID tidak ditemukan!');
      setMessageType('error');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">✅ Absensi Pegawai</h2>
      
      {message && (
        <div className={`p-4 rounded-lg ${messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Selection */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">Jenis Absensi</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'datang', label: 'Datang', icon: '🌅', color: 'green' },
              { value: 'pulang', label: 'Pulang', icon: '🌆', color: 'blue' },
              { value: 'izinKeluar', label: 'Izin Keluar', icon: '🚶', color: 'yellow' },
              { value: 'izinMasuk', label: 'Izin Masuk', icon: '🏠', color: 'purple' },
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setAbsenType(type.value as any)}
                className={`p-4 rounded-xl border-2 transition-all ${absenType === type.value ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <span className="text-2xl">{type.icon}</span>
                <p className="text-sm font-medium mt-1">{type.label}</p>
              </button>
            ))}
          </div>

          {(absenType === 'izinKeluar') && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Izin</label>
              <textarea
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan keterangan izin keluar..."
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Input Method */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">Input Absensi</h3>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setScanMode(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${!scanMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Manual
            </button>
            <button
              onClick={() => setScanMode(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${scanMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Scan QR Code
            </button>
          </div>

          {!scanMode ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Absen Pegawai</label>
                <input
                  type="text"
                  value={manualId}
                  onChange={e => setManualId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Masukkan ID Absen..."
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                Proses Absensi
              </button>
            </form>
          ) : (
            <BarcodeScanner onScan={handleScan} />
          )}
        </div>
      </div>

      {/* Quick Select */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-bold text-gray-800 mb-4">Pilih Pegawai (Quick Access)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pegawai.map(p => (
            <button
              key={p.id}
              onClick={() => processAbsen(p.id)}
              className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <p className="font-medium text-sm">{p.nama}</p>
              <p className="text-xs text-gray-500">{p.jabatan} | ID: {p.idAbsen}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ BARCODE SCANNER ============
function BarcodeScanner({ onScan }: { onScan: (result: string) => void }) {
  const [scanning, setScanning] = useState(false);

  const startScan = async () => {
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('barcode-reader');
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().then(() => setScanning(false));
        },
        () => {}
      );
    } catch (err) {
      console.error(err);
      setScanning(false);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  return (
    <div className="space-y-4">
      <div id="barcode-reader" className="w-full rounded-lg overflow-hidden bg-gray-900 min-h-[200px] flex items-center justify-center">
        {!scanning && (
          <div className="text-center text-gray-400">
            <p className="text-4xl mb-2">📷</p>
            <p>Klik tombol di bawah untuk mulai scan</p>
          </div>
        )}
      </div>
      <button
        onClick={startScan}
        disabled={scanning}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
      >
        {scanning ? 'Scanning...' : '🔍 Mulai Scan QR Code'}
      </button>
    </div>
  );
}

// ============ PEGAWAI PAGE ============
function PegawaiPage() {
  const [pegawai, setPegawai] = useState<Pegawai[]>(store.getPegawai());
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Pegawai | null>(null);
  const [form, setForm] = useState({ nama: '', nip: '', jabatan: '', idAbsen: '' });
  const [showCard, setShowCard] = useState<Pegawai | null>(null);
  const [previewBarcode, setPreviewBarcode] = useState<Pegawai | null>(null);

  const refresh = () => setPegawai(store.getPegawai());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      store.updatePegawai({ ...editItem, ...form });
    } else {
      store.addPegawai({ id: Date.now().toString(), ...form });
    }
    refresh();
    setShowForm(false);
    setEditItem(null);
    setForm({ nama: '', nip: '', jabatan: '', idAbsen: '' });
  };

  const handleEdit = (p: Pegawai) => {
    setEditItem(p);
    setForm({ nama: p.nama, nip: p.nip, jabatan: p.jabatan, idAbsen: p.idAbsen });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus data pegawai ini?')) {
      store.deletePegawai(id);
      refresh();
    }
  };

  const generateQRCodeDataUrl = async (value: string): Promise<string> => {
    try {
      const dataUrl = await QRCode.toDataURL(value, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      return dataUrl;
    } catch (e) {
      return '';
    }
  };

  const downloadQRCode = async (p: Pegawai, format: 'png' | 'jpg' | 'jpeg' | 'pdf') => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw card background
    const gradient = ctx.createLinearGradient(0, 0, 400, 600);
    gradient.addColorStop(0, '#eff6ff');
    gradient.addColorStop(1, '#dbeafe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 600);

    // Draw border
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 396, 596);

    // Draw header
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SMP NEGERI 61 BANDUNG', 200, 40);
    ctx.font = '14px Arial';
    ctx.fillText('Kartu Pegawai', 200, 60);

    // Draw photo circle
    ctx.beginPath();
    ctx.arc(200, 120, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#1e40af';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(p.nama.charAt(0), 200, 130);

    // Draw info
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(p.nama, 200, 190);
    ctx.font = '14px Arial';
    ctx.fillText(`NIP: ${p.nip}`, 200, 215);
    ctx.fillText(`Jabatan: ${p.jabatan}`, 200, 240);
    ctx.fillText(`ID: ${p.idAbsen}`, 200, 265);

    // Generate and draw QR Code
    try {
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, p.idAbsen, {
        width: 180,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      ctx.drawImage(qrCanvas, 110, 290, 180, 180);
    } catch (e) {
      // Fallback: draw white rectangle if QR generation fails
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(110, 290, 180, 180);
    }

    // Draw ID text below QR
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.fillText(`ID Absen: ${p.idAbsen}`, 200, 500);

    // Download based on format
    if (format === 'pdf') {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [60, 90]
      });
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 60, 90);
      doc.save(`Kartu_Pegawai_${p.nama.replace(/\s+/g, '_')}.pdf`);
    } else {
      const dataUrl = canvas.toDataURL(`image/${format}`, 1.0);
      const link = document.createElement('a');
      link.download = `Kartu_Pegawai_${p.nama.replace(/\s+/g, '_')}.${format}`;
      link.href = dataUrl;
      link.click();
    }
  };

  const printCard = async (p: Pegawai) => {
    const settings = store.getSettings();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const barcodeDataUrl = await generateQRCodeDataUrl(p.idAbsen);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Kartu Pegawai - ${p.nama}</title>
          <style>
            @page { size: 6cm 9cm; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .card { 
              width: 6cm; height: 9cm; 
              border: 2px solid #1e40af; 
              border-radius: 8px;
              padding: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              box-sizing: border-box;
              background: linear-gradient(135deg, #eff6ff, #dbeafe);
            }
            .header { text-align: center; font-size: 7pt; }
            .header h3 { margin: 0; font-size: 8pt; color: #1e40af; }
            .photo { width: 40px; height: 40px; background: #1e40af; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16pt; font-weight: bold; }
            .info { text-align: center; font-size: 7pt; }
            .info p { margin: 2px 0; }
            .info .name { font-weight: bold; font-size: 8pt; }
            .barcode { margin-top: 4px; text-align: center; }
            .barcode img { max-width: 100%; height: auto; }
            .footer { font-size: 5pt; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h3>${settings.identitasSekolah.nama}</h3>
              <p>Kartu Pegawai</p>
            </div>
            <div class="photo">${p.nama.charAt(0)}</div>
            <div class="info">
              <p class="name">${p.nama}</p>
              <p>NIP: ${p.nip}</p>
              <p>Jabatan: ${p.jabatan}</p>
              <p>ID: ${p.idAbsen}</p>
            </div>
            <div class="barcode">
              ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="QR Code ${p.idAbsen}" />` : `<p>${p.idAbsen}</p>`}
            </div>
            <div class="footer">
              <p>ID Absen: ${p.idAbsen}</p>
            </div>
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printAllCards = async () => {
    const settings = store.getSettings();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = (await Promise.all(pegawai.map(async (p) => {
      const barcodeDataUrl = await generateQRCodeDataUrl(p.idAbsen);
      return `
        <div class="card">
          <div class="header">
            <h3>${settings.identitasSekolah.nama}</h3>
            <p>Kartu Pegawai</p>
          </div>
          <div class="photo">${p.nama.charAt(0)}</div>
          <div class="info">
            <p class="name">${p.nama}</p>
            <p>NIP: ${p.nip}</p>
            <p>Jabatan: ${p.jabatan}</p>
            <p>ID: ${p.idAbsen}</p>
          </div>
          <div class="barcode">
            ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="QR Code ${p.idAbsen}" />` : `<p>${p.idAbsen}</p>`}
          </div>
          <div class="footer">
            <p>ID Absen: ${p.idAbsen}</p>
          </div>
        </div>
      `;
    }))).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kartu Pegawai - ${settings.identitasSekolah.nama}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            .cards-container { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
            .card { 
              width: 6cm; height: 9cm; 
              border: 2px solid #1e40af; 
              border-radius: 8px;
              padding: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              box-sizing: border-box;
              background: linear-gradient(135deg, #eff6ff, #dbeafe);
              page-break-inside: avoid;
            }
            .header { text-align: center; font-size: 7pt; }
            .header h3 { margin: 0; font-size: 8pt; color: #1e40af; }
            .photo { width: 40px; height: 40px; background: #1e40af; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16pt; font-weight: bold; }
            .info { text-align: center; font-size: 7pt; }
            .info p { margin: 2px 0; }
            .info .name { font-weight: bold; font-size: 8pt; }
            .barcode { margin-top: 4px; text-align: center; }
            .barcode img { max-width: 100%; height: auto; }
            .footer { font-size: 5pt; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="cards-container">
            ${cardsHtml}
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); }, 1000); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">👥 Data Pegawai</h2>
        <div className="flex gap-2">
          {pegawai.length > 0 && (
            <button onClick={printAllCards}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">
              🖨️ Cetak Semua Kartu
            </button>
          )}
          <button onClick={() => { setShowForm(true); setEditItem(null); setForm({ nama: '', nip: '', jabatan: '', idAbsen: '' }); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            + Tambah Pegawai
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">{editItem ? 'Edit' : 'Tambah'} Pegawai</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <input type="text" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
              <input type="text" value={form.nip} onChange={e => setForm({...form, nip: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
              <input type="text" value={form.jabatan} onChange={e => setForm({...form, jabatan: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Absen</label>
              <input type="text" value={form.idAbsen} onChange={e => setForm({...form, idAbsen: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                {editItem ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Nama</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">NIP</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Jabatan</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">ID Absen</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-800">QR Code</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-800">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pegawai.map((p, i) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium">{p.nama}</td>
                  <td className="px-4 py-3 text-sm">{p.nip}</td>
                  <td className="px-4 py-3 text-sm">{p.jabatan}</td>
                  <td className="px-4 py-3 text-sm font-mono">{p.idAbsen}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <QRCodeDisplay value={p.idAbsen} size={60} level="H" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button onClick={() => setPreviewBarcode(p)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200" title="Preview QR Code">
                        👁️ Preview
                      </button>
                      <button onClick={() => printCard(p)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200" title="Cetak Kartu">
                        🖨️ Kartu
                      </button>
                      <button onClick={() => downloadQRCode(p, 'pdf')} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200" title="Download PDF">
                        📄 PDF
                      </button>
                      <button onClick={() => downloadQRCode(p, 'png')} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200" title="Download PNG">
                        🖼️ PNG
                      </button>
                      <button onClick={() => downloadQRCode(p, 'jpg')} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs hover:bg-indigo-200" title="Download JPG">
                        🖼️ JPG
                      </button>
                      <button onClick={() => handleEdit(p)} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">
                        🗑️ Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pegawai.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Belum ada data pegawai</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview QR Code Modal */}
      {previewBarcode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Preview QR Code</h3>
              <button onClick={() => setPreviewBarcode(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="text-center space-y-3">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-bold text-blue-800 text-lg">{previewBarcode.nama}</p>
                <p className="text-sm text-gray-600">NIP: {previewBarcode.nip}</p>
                <p className="text-sm text-gray-600">{previewBarcode.jabatan}</p>
              </div>
              <div className="bg-white border-2 border-blue-200 rounded-lg p-4 flex justify-center">
                <QRCodeDisplay value={previewBarcode.idAbsen} size={150} level="H" />
              </div>
              <p className="text-sm text-gray-500">ID Absen: <span className="font-mono font-bold">{previewBarcode.idAbsen}</span></p>
              <div className="flex gap-2 justify-center pt-2 flex-wrap">
                <button onClick={() => { printCard(previewBarcode); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                  🖨️ Cetak Kartu
                </button>
                <button onClick={() => downloadQRCode(previewBarcode, 'pdf')} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
                  📄 PDF
                </button>
                <button onClick={() => downloadQRCode(previewBarcode, 'png')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                  🖼️ PNG
                </button>
                <button onClick={() => downloadQRCode(previewBarcode, 'jpg')} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
                  🖼️ JPG
                </button>
                <button onClick={() => setPreviewBarcode(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ REKAP HARIAN ============
function RekapHarianPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activities, setActivities] = useState<DailyActivity[]>(store.getActivities());
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<DailyActivity | null>(null);
  const [form, setForm] = useState({ pegawaiId: '', aktivitas: '', waktu: '' });
  const pegawai = store.getPegawai();
  const absensi = store.getAbsensi();

  const refresh = () => setActivities(store.getActivities());

  const todayAbsensi = absensi.filter(a => a.tanggal === selectedDate);
  const todayActivities = activities.filter(a => a.tanggal === selectedDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) {
      store.updateActivity({ ...editItem, ...form });
    } else {
      store.addActivity({ id: Date.now().toString(), tanggal: selectedDate, ...form });
    }
    refresh();
    setShowForm(false);
    setEditItem(null);
    setForm({ pegawaiId: '', aktivitas: '', waktu: '' });
  };

  const handleDeleteActivity = (id: string) => {
    if (confirm('Hapus aktivitas ini?')) {
      store.deleteActivity(id);
      refresh();
    }
  };

  const handleDeleteAbsensi = (id: string) => {
    if (confirm('Hapus data absensi ini?')) {
      store.deleteAbsensi(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800">📋 Rekap Harian</h2>
        <div className="flex items-center gap-3">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Tambah Aktivitas
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">Tambah/Edit Aktivitas</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pegawai</label>
              <select value={form.pegawaiId} onChange={e => setForm({...form, pegawaiId: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Pilih Pegawai</option>
                {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aktivitas</label>
              <input type="text" value={form.aktivitas} onChange={e => setForm({...form, aktivitas: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waktu</label>
              <input type="time" value={form.waktu} onChange={e => setForm({...form, waktu: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                {editItem ? 'Update' : 'Simpan'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Absensi Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-blue-50 border-b">
          <h3 className="font-bold text-blue-800">Data Absensi - {format(parseISO(selectedDate), 'dd MMMM yyyy', { locale: idLocale })}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Datang</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Izin Keluar</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Izin Masuk</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Pulang</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Keterangan</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {todayAbsensi.map(a => {
                const p = pegawai.find(pg => pg.id === a.pegawaiId);
                return (
                  <tr key={a.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{p?.nama || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-green-600">{a.datang || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-yellow-600">{a.izinKeluar || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-purple-600">{a.izinMasuk || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-blue-600">{a.pulang || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">{a.keteranganIzin || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDeleteAbsensi(a.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {todayAbsensi.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Belum ada data absensi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-green-50 border-b">
          <h3 className="font-bold text-green-800">Aktivitas Harian</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pegawai</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aktivitas</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Waktu</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {todayActivities.map((a, i) => {
                const p = pegawai.find(pg => pg.id === a.pegawaiId);
                return (
                  <tr key={a.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{p?.nama || '-'}</td>
                    <td className="px-4 py-3 text-sm">{a.aktivitas}</td>
                    <td className="px-4 py-3 text-sm text-center">{a.waktu}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setEditItem(a); setForm({ pegawaiId: a.pegawaiId, aktivitas: a.aktivitas, waktu: a.waktu }); setShowForm(true); }}
                          className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200">✏️</button>
                        <button onClick={() => handleDeleteActivity(a.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {todayActivities.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada aktivitas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ REKAP BULANAN ============
function RekapBulananPage() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedPegawai, setSelectedPegawai] = useState<string>('all');
  const pegawai = store.getPegawai();
  const absensi = store.getAbsensi();
  const settings = store.getSettings();

  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const filteredPegawai = selectedPegawai === 'all' ? pegawai : pegawai.filter(p => p.id === selectedPegawai);

  const getAbsensiForDay = (pegawaiId: string, day: number) => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    return absensi.find(a => a.pegawaiId === pegawaiId && a.tanggal === dateStr);
  };

  const isWorkingDay = (date: Date, dateStr: string): boolean => {
    // 1. Cek apakah ada pengaturan khusus (override) untuk tanggal ini
    if (settings.hariKerja[dateStr] !== undefined) {
      return settings.hariKerja[dateStr];
    }
    
    // 2. Dapatkan dayOfWeek dari Date object
    // getDay(): 0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
    const dayOfWeek = date.getDay();
    
    // 3. Jika hari Minggu (0), selalu libur
    if (dayOfWeek === 0) {
      return false;
    }
    
    // 4. Konversi dayOfWeek ke weekdayKey yang akurat:
    //    getDay() → weekdayKey
    //    0 (Minggu) → weekday_7 (tidak pernah dipakai karena sudah ditangani di atas)
    //    1 (Senin)  → weekday_1
    //    2 (Selasa) → weekday_2
    //    3 (Rabu)   → weekday_3
    //    4 (Kamis)  → weekday_4
    //    5 (Jumat)  → weekday_5
    //    6 (Sabtu)  → weekday_6
    const weekdayKey = `weekday_${dayOfWeek}`;
    
    // 5. Default true (hari kerja) jika tidak diset
    return settings.hariKerja[weekdayKey] !== false;
  };

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

  const exportToExcel = () => {
    const data: any[] = [];
    data.push(['REKAP ABSENSI BULANAN']);
    data.push([settings.identitasSekolah.nama]);
    data.push([`Bulan: ${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: idLocale })}`]);
    data.push([]);
    
    filteredPegawai.forEach(p => {
      data.push([p.nama, `NIP: ${p.nip}`, p.jabatan]);
      const header = ['Tanggal', 'Datang', 'Izin Keluar', 'Izin Masuk', 'Pulang', 'Keterangan'];
      data.push(header);
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
        const record = getAbsensiForDay(p.id, d);
        if (record) {
          data.push([dateStr, record.datang || '-', record.izinKeluar || '-', record.izinMasuk || '-', record.pulang || '-', record.keteranganIzin || '-']);
        }
      }
      data.push([]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Bulanan');
    XLSX.writeFile(wb, `Rekap_Bulanan_${selectedMonth}.xlsx`);
  };

  const exportToCSV = () => {
    const data: string[][] = [];
    data.push(['Nama', 'NIP', 'Jabatan', 'Tanggal', 'Datang', 'Izin Keluar', 'Izin Masuk', 'Pulang', 'Keterangan']);
    
    filteredPegawai.forEach(p => {
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
        const record = getAbsensiForDay(p.id, d);
        if (record) {
          data.push([p.nama, p.nip, p.jabatan, dateStr, record.datang || '', record.izinKeluar || '', record.izinMasuk || '', record.pulang || '', record.keteranganIzin || '']);
        }
      }
    });

    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Bulanan_${selectedMonth}.csv`;
    a.click();
  };

  const printDetailAbsensi = () => {
    if (selectedPegawai === 'all' || !filteredPegawai[0]) return;
    
    const p = filteredPegawai[0];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableRows = '';
    let hadirCount = 0, izinCount = 0, alphaCount = 0;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const date = new Date(year, month - 1, d);
      const isWorking = isWorkingDay(date, dateStr);
      const record = absensi.find(a => a.pegawaiId === p.id && a.tanggal === dateStr);
      
      if (isWorking) {
        if (record?.datang) hadirCount++;
        else if (record?.keteranganIzin) izinCount++;
        else alphaCount++;
      }
      
      tableRows += `
        <tr${!isWorking ? ' style="background-color:#f3f4f6"' : ''}>
          <td style="font-weight:${!isWorking ? 'bold' : 'normal'}">${format(date, 'EEEE, dd MMMM yyyy', { locale: idLocale })}${!isWorking ? ' <span style="color:#ef4444;font-size:9pt">(Libur)</span>' : ''}</td>
          <td style="text-align:center;color:#16a34a;font-weight:bold">${record?.datang || '-'}</td>
          <td style="text-align:center;color:#ca8a04">${record?.izinKeluar || '-'}</td>
          <td style="text-align:center;color:#9333ea">${record?.izinMasuk || '-'}</td>
          <td style="text-align:center;color:#2563eb;font-weight:bold">${record?.pulang || '-'}</td>
          <td style="text-align:center">${record?.keteranganIzin || '-'}</td>
        </tr>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Detail Absensi - ${p.nama}</title>
          <style>
            @page { size: A4; margin: 1.5cm; }
            body { font-family: 'Times New Roman', serif; font-size: 11pt; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 14pt; margin: 0; }
            .header h2 { font-size: 12pt; margin: 5px 0; }
            .header p { font-size: 10pt; margin: 2px 0; }
            .pegawai-info { margin: 15px 0; padding: 10px; border: 1px solid #333; background: #f9fafb; }
            .pegawai-info table { width: 100%; }
            .pegawai-info td { padding: 3px 0; }
            .title { text-align: center; margin: 15px 0; font-size: 12pt; font-weight: bold; }
            table.absensi { width: 100%; border-collapse: collapse; margin: 15px 0; }
            table.absensi th, table.absensi td { border: 1px solid #333; padding: 6px 8px; font-size: 10pt; }
            table.absensi th { background: #1e40af; color: white; text-align: center; }
            .summary { margin: 20px 0; padding: 10px; border: 1px solid #333; background: #eff6ff; }
            .summary table { width: 100%; }
            .summary td { padding: 5px; text-align: center; }
            .summary .label { font-weight: bold; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .sig-block { text-align: center; width: 45%; }
            .sig-block .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
            .sig-block .nip { font-size: 10pt; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${settings.identitasSekolah.nama}</h1>
            <p>${settings.identitasSekolah.alamat}</p>
            <p>NPSN: ${settings.identitasSekolah.npsn}</p>
          </div>
          
          <div class="pegawai-info">
            <table>
              <tr>
                <td style="width:100px"><strong>Nama</strong></td>
                <td>: ${p.nama}</td>
              </tr>
              <tr>
                <td><strong>NIP</strong></td>
                <td>: ${p.nip}</td>
              </tr>
              <tr>
                <td><strong>Jabatan</strong></td>
                <td>: ${p.jabatan}</td>
              </tr>
              <tr>
                <td><strong>Bulan</strong></td>
                <td>: ${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: idLocale })}</td>
              </tr>
            </table>
          </div>
          
          <div class="title">
            DETAIL ABSENSI PEGAWAI
          </div>
          
          <table class="absensi">
            <thead>
              <tr>
                <th style="width:30%">Tanggal</th>
                <th style="width:12%">Datang</th>
                <th style="width:14%">Izin Keluar</th>
                <th style="width:14%">Izin Masuk</th>
                <th style="width:12%">Pulang</th>
                <th style="width:18%">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="summary">
            <table>
              <tr>
                <td class="label">Total Hadir:</td>
                <td style="color:#16a34a;font-weight:bold;font-size:14pt">${hadirCount} hari</td>
                <td class="label">Total Izin:</td>
                <td style="color:#ca8a04;font-weight:bold;font-size:14pt">${izinCount} hari</td>
                <td class="label">Total Alpha:</td>
                <td style="color:#dc2626;font-weight:bold;font-size:14pt">${alphaCount} hari</td>
              </tr>
            </table>
          </div>
          
          <div class="signatures">
            <div class="sig-block">
              <p>Mengetahui,</p>
              <p>${settings.kepalaSekolah.jabatan}</p>
              <p class="name">${settings.kepalaSekolah.nama}</p>
              <p class="nip">NIP. ${settings.kepalaSekolah.nip}</p>
            </div>
            <div class="sig-block">
              <p>Bandung, ${format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}</p>
              <p>${p.jabatan}</p>
              <p class="name">${p.nama}</p>
              <p class="nip">NIP. ${p.nip}</p>
            </div>
          </div>
          
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printRekap = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableRows = '';
    filteredPegawai.forEach(p => {
      const summary = getSummary(p.id);
      tableRows += `
        <tr>
          <td>${p.nama}</td>
          <td>${p.nip}</td>
          <td>${p.jabatan}</td>
          <td style="text-align:center;color:green;font-weight:bold">${summary.hadir}</td>
          <td style="text-align:center;color:orange">${summary.izin}</td>
          <td style="text-align:center;color:red">${summary.alpha}</td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Rekap Bulanan - ${settings.identitasSekolah.nama}</title>
          <style>
            @page { size: A4; margin: 1.5cm; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 14pt; margin: 0; }
            .header h2 { font-size: 12pt; margin: 5px 0; }
            .header p { font-size: 10pt; margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #333; padding: 6px 8px; font-size: 10pt; }
            th { background: #1e40af; color: white; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .sig-block { text-align: center; width: 40%; }
            .sig-block .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
            .sig-block .nip { font-size: 10pt; }
            .title { text-align: center; margin: 10px 0; font-size: 12pt; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${settings.identitasSekolah.nama}</h1>
            <p>${settings.identitasSekolah.alamat}</p>
            <p>NPSN: ${settings.identitasSekolah.npsn}</p>
          </div>
          <div class="title">
            REKAP ABSENSI PEGAWAI<br>
            Bulan ${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: idLocale })}
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>NIP</th>
                <th>Jabatan</th>
                <th>Hadir</th>
                <th>Izin</th>
                <th>Alpha</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPegawai.map((p, i) => {
                const s = getSummary(p.id);
                return `<tr>
                  <td style="text-align:center">${i + 1}</td>
                  <td>${p.nama}</td>
                  <td>${p.nip}</td>
                  <td>${p.jabatan}</td>
                  <td style="text-align:center;color:green;font-weight:bold">${s.hadir}</td>
                  <td style="text-align:center;color:orange">${s.izin}</td>
                  <td style="text-align:center;color:red">${s.alpha}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          <div class="signatures">
            <div class="sig-block">
              <p>Mengetahui,</p>
              <p>${settings.kepalaSekolah.jabatan}</p>
              <p class="name">${settings.kepalaSekolah.nama}</p>
              <p class="nip">NIP. ${settings.kepalaSekolah.nip}</p>
            </div>
            <div class="sig-block">
              <p>Bandung, ${format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}</p>
              <p>Koordinator Guru/TU</p>
              <p class="name">${pegawai[0]?.nama || '________________'}</p>
              <p class="nip">NIP. ${pegawai[0]?.nip || '________________'}</p>
            </div>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800">📅 Rekap Bulanan</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <select value={selectedPegawai} onChange={e => setSelectedPegawai(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="all">Semua Pegawai</option>
            {pegawai.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={printRekap} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          🖨️ Cetak PDF
        </button>
        <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
          📊 Export Excel
        </button>
        <button onClick={exportToCSV} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2">
          📄 Export CSV
        </button>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-blue-50 border-b">
          <h3 className="font-bold text-blue-800">
            Rekap - {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: idLocale })}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NIP</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Hadir</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Izin</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Alpha</th>
              </tr>
            </thead>
            <tbody>
              {filteredPegawai.map((p, i) => {
                const summary = getSummary(p.id);
                return (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{p.nama}</td>
                    <td className="px-4 py-3 text-sm">{p.nip}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">{summary.hadir}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">{summary.izin}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">{summary.alpha}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredPegawai.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail per day - hanya muncul ketika memilih pegawai spesifik */}
      {selectedPegawai === 'all' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">👆</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Pilih Pegawai untuk Melihat Detail</h3>
            <p className="text-gray-500">Gunakan dropdown "Semua Pegawai" di atas untuk memilih pegawai spesifik dan melihat detail absensi bulanan.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-green-50 border-b flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-green-800">
              Detail Absensi Bulanan - {filteredPegawai[0]?.nama}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {(() => {
                  let count = 0;
                  for (let d = 1; d <= daysInMonth; d++) {
                    if (getAbsensiForDay(filteredPegawai[0]?.id || '', d)) count++;
                  }
                  return count;
                })()} data absensi
              </span>
              <button onClick={printDetailAbsensi} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2">
                🖨️ Cetak Detail
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50">Tanggal</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Datang</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Izin Keluar</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Izin Masuk</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Pulang</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows: { date: string; record: AbsensiRecord | undefined }[] = [];
                  const p = filteredPegawai[0];
                  if (!p) return <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Pegawai tidak ditemukan</td></tr>;
                  
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
                    const date = new Date(year, month - 1, d);
                    const isWorking = isWorkingDay(date, dateStr);
                    const record = absensi.find(a => a.pegawaiId === p.id && a.tanggal === dateStr);
                    if (record || isWorking) {
                      rows.push({ date: dateStr, record });
                    }
                  }
                  
                  if (rows.length === 0) {
                    return <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada data absensi</td></tr>;
                  }
                  
                  return rows.map((row, idx) => {
                    const dateObj = parseISO(row.date);
                    const isWorking = isWorkingDay(dateObj, row.date);
                    return (
                      <tr key={idx} className={`border-t hover:bg-gray-50 ${!isWorking ? 'bg-gray-50' : ''}`}>
                        <td className="px-4 py-3 text-sm font-medium sticky left-0 bg-white whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-blue-900 font-bold">{format(dateObj, 'EEEE', { locale: idLocale })}</span>
                            <span className="text-xs text-gray-500">{format(dateObj, 'dd MMMM yyyy', { locale: idLocale })}</span>
                            {!isWorking && <span className="text-xs text-red-500 font-semibold">(Libur)</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">{row.record?.datang || '-'}</td>
                        <td className="px-4 py-3 text-sm text-center text-yellow-600">{row.record?.izinKeluar || '-'}</td>
                        <td className="px-4 py-3 text-sm text-center text-purple-600">{row.record?.izinMasuk || '-'}</td>
                        <td className="px-4 py-3 text-sm text-center text-blue-600 font-semibold">{row.record?.pulang || '-'}</td>
                        <td className="px-4 py-3 text-sm text-center">{row.record?.keteranganIzin || '-'}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ USER MANAGEMENT ============
function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(store.getUsers());
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'user' as User['role'] });
  const [editForm, setEditForm] = useState({ username: '', password: '', name: '', role: 'user' as User['role'] });

  const refresh = () => setUsers(store.getUsers());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.addUser({ id: Date.now().toString(), ...form });
    refresh();
    setShowForm(false);
    setForm({ username: '', password: '', name: '', role: 'user' });
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ username: user.username, password: user.password, name: user.name, role: user.role });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUser) {
      store.updateUser({ ...editUser, ...editForm });
      refresh();
      setEditUser(null);
      setEditForm({ username: '', password: '', name: '', role: 'user' });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus user ini?')) {
      store.deleteUser(id);
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">🔐 Manajemen User</h2>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Tambah User
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">Tambah User</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value as User['role']})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Simpan</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Batal</button>
            </div>
          </form>
        </div>
      )}

      {editUser && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-bold text-gray-800 mb-4">✏️ Edit User - {editUser.name}</h3>
          <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value as User['role']})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Update</button>
              <button type="button" onClick={() => { setEditUser(null); setEditForm({ username: '', password: '', name: '', role: 'user' }); }} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Nama</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Username</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">Role</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-blue-800">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{i + 1}</td>
                <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                <td className="px-4 py-3 text-sm">{u.username}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'operator' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(u)} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">
                      🗑️ Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ PENGATURAN PAGE ============
function PengaturanPage() {
  const [settings, setSettings] = useState<Settings>(store.getSettings());
  const [activeTab, setActiveTab] = useState('waktu');
  const [saved, setSaved] = useState(false);

  const save = () => {
    store.setSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSettings({ ...settings, identitasSekolah: { ...settings.identitasSekolah, logo: ev.target?.result as string } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackup = () => {
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_smpn61_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const success = store.importData(ev.target?.result as string);
        if (success) {
          alert('Data berhasil dipulihkan!');
          window.location.reload();
        } else {
          alert('Gagal memulihkan data!');
        }
      };
      reader.readAsText(file);
    }
  };

  // Working days configuration
  const [selectedMonthHari, setSelectedMonthHari] = useState(format(new Date(), 'yyyy-MM'));
  const [year, month] = selectedMonthHari.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const toggleHariKerja = (dateStr: string) => {
    const newHariKerja = { ...settings.hariKerja };
    
    // Hitung status saat ini untuk tanggal ini
    const dateParts = dateStr.split('-').map(Number);
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayOfWeek = date.getDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu
    
    // Konversi akurat ke weekdayKey
    const weekdayKey = `weekday_${dayOfWeek === 0 ? 7 : dayOfWeek}`;
    const isDefaultWorking = settings.hariKerja[weekdayKey] !== false;
    
    // Tentukan status saat ini
    let currentIsWorking: boolean;
    if (newHariKerja[dateStr] !== undefined) {
      // Ada override khusus
      currentIsWorking = newHariKerja[dateStr];
    } else {
      // Gunakan default berdasarkan hari
      currentIsWorking = dayOfWeek !== 0 && isDefaultWorking;
    }
    
    // Toggle: jika saat ini kerja → set override ke false (libur)
    //         jika saat ini libur → set override ke true (kerja)
    //         jika override sudah sama dengan default → hapus override
    if (newHariKerja[dateStr] !== undefined) {
      // Sudah ada override, toggle nilainya
      if (newHariKerja[dateStr] === isDefaultWorking && dayOfWeek !== 0) {
        // Override sudah sama dengan default, hapus override
        delete newHariKerja[dateStr];
      } else {
        newHariKerja[dateStr] = !newHariKerja[dateStr];
      }
    } else {
      // Belum ada override, set ke kebalikan dari status saat ini
      newHariKerja[dateStr] = !currentIsWorking;
    }
    
    setSettings({ ...settings, hariKerja: newHariKerja });
  };

  const tabs = [
    { id: 'waktu', label: '⏰ Waktu' },
    { id: 'kepsek', label: '👤 Kepala Sekolah' },
    { id: 'harikerja', label: '📆 Hari Kerja' },
    { id: 'identitas', label: '🏫 Identitas Sekolah' },
    { id: 'konfigurasi', label: '💾 Konfigurasi' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">⚙️ Pengaturan</h2>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg">
          ✅ Pengaturan berhasil disimpan!
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {activeTab === 'waktu' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800">Pengaturan Waktu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Masuk</label>
                <input type="time" value={settings.jamMasuk} onChange={e => setSettings({...settings, jamMasuk: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Pulang</label>
                <input type="time" value={settings.jamPulang} onChange={e => setSettings({...settings, jamPulang: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kepsek' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800">Data Kepala Sekolah (Penandatangan)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input type="text" value={settings.kepalaSekolah.nama} onChange={e => setSettings({...settings, kepalaSekolah: {...settings.kepalaSekolah, nama: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                <input type="text" value={settings.kepalaSekolah.nip} onChange={e => setSettings({...settings, kepalaSekolah: {...settings.kepalaSekolah, nip: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label>
                <input type="text" value={settings.kepalaSekolah.jabatan} onChange={e => setSettings({...settings, kepalaSekolah: {...settings.kepalaSekolah, jabatan: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'harikerja' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-gray-800">Pengaturan Hari Kerja</h3>
            
            {/* Hari Kerja Mingguan */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">📅 Hari Kerja Mingguan</h4>
              <p className="text-sm text-gray-600 mb-4">Atur hari kerja default untuk Senin - Sabtu. Minggu otomatis libur. Konversi DayOfWeek: Senin=1, Selasa=2, Rabu=3, Kamis=4, Jumat=5, Sabtu=6, Minggu=7.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day, idx) => {
                  // Konversi akurat: idx 0=Senin→weekday_1, 1=Selasa→weekday_2, ..., 5=Sabtu→weekday_6
                  const dayKey = `weekday_${idx + 1}`;
                  const isWorkingDay = settings.hariKerja[dayKey] !== false; // Default true jika tidak diset
                  return (
                    <div key={day} className={`bg-white rounded-lg p-3 border-2 ${isWorkingDay ? 'border-green-300' : 'border-red-300'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800 text-sm">{day}</span>
                        <button
                          onClick={() => {
                            const newHariKerja = { ...settings.hariKerja };
                            newHariKerja[dayKey] = !isWorkingDay;
                            setSettings({ ...settings, hariKerja: newHariKerja });
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isWorkingDay ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isWorkingDay ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <div className={`text-xs font-semibold ${isWorkingDay ? 'text-green-600' : 'text-red-600'}`}>
                        {isWorkingDay ? '✓ Hari Kerja' : '✗ Libur'}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">Key: {dayKey}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300 max-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-600">Minggu</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">LIBUR</span>
                  </div>
                  <div className="text-xs text-gray-500">Otomatis libur (tidak bisa diubah)</div>
                </div>
              </div>
            </div>

            {/* Kalender Bulanan */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">📆 Pengaturan Khusus per Bulan</h4>
              <p className="text-sm text-gray-600 mb-4">Atur hari libur khusus atau hari kerja tambahan untuk bulan tertentu (misal: libur nasional, cuti bersama). Klik tanggal untuk toggle status.</p>
              <input type="month" value={selectedMonthHari} onChange={e => setSelectedMonthHari(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4" />
              <div className="grid grid-cols-7 gap-2">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                  <div key={d} className={`text-center text-xs font-bold py-1 ${d === 'Min' || d === 'Sab' ? 'text-red-500' : 'text-gray-500'}`}>{d}</div>
                ))}
                {/* Offset kosong untuk menyelaraskan hari pertama bulan dengan kolom hari yang benar */}
                {(() => {
                  const firstDayOffset = new Date(year, month - 1, 1).getDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu
                  return Array.from({ length: firstDayOffset }, (_, i) => (
                    <div key={`empty-${i}`} className="p-2"></div>
                  ));
                })()}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const date = new Date(year, month - 1, day);
                  const dateStr = `${selectedMonthHari}-${String(day).padStart(2, '0')}`;
                  const dayOfWeek = date.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
                  
                  // Cek apakah ini hari Minggu (selalu libur, tidak bisa diubah)
                  const isSunday = dayOfWeek === 0;
                  
                  // Konversi dayOfWeek ke weekdayKey yang akurat:
                  // getDay() → weekdayKey mapping:
                  //   0 (Minggu) → weekday_7
                  //   1 (Senin)  → weekday_1
                  //   2 (Selasa) → weekday_2
                  //   3 (Rabu)   → weekday_3
                  //   4 (Kamis)  → weekday_4
                  //   5 (Jumat)  → weekday_5
                  //   6 (Sabtu)  → weekday_6
                  const weekdayKey = `weekday_${dayOfWeek === 0 ? 7 : dayOfWeek}`;
                  const isDefaultWorkingDay = settings.hariKerja[weekdayKey] !== false;
                  
                  // Cek apakah ada override khusus untuk tanggal ini
                  const isOverridden = settings.hariKerja[dateStr] !== undefined;
                  
                  // Tentukan status libur/kerja:
                  // 1. Jika ada override khusus, gunakan nilai override
                  // 2. Jika hari Minggu, selalu libur
                  // 3. Jika Sabtu, cek apakah Sabtu di-set sebagai hari kerja (weekday_6)
                  // 4. Untuk hari kerja biasa (Sen-Jum), gunakan pengaturan mingguan
                  let isOff: boolean;
                  if (isOverridden) {
                    isOff = settings.hariKerja[dateStr] === false;
                  } else if (isSunday) {
                    isOff = true; // Minggu selalu libur
                  } else {
                    isOff = !isDefaultWorkingDay;
                  }
                  
                  // Hari yang tidak bisa di-toggle (hanya Minggu)
                  const isDisabled = isSunday;
                  
                  // Nama hari dalam Bahasa Indonesia
                  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                  const dayNameShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                  const dayName = dayNameShort[dayOfWeek];
                  
                  return (
                    <button 
                      key={day} 
                      onClick={() => !isDisabled && toggleHariKerja(dateStr)}
                      disabled={isDisabled}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors relative ${
                        isDisabled
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : isOff 
                            ? 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200' 
                            : 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100'
                      }`}
                      title={`${dayNames[dayOfWeek]}, ${day} ${format(date, 'MMMM yyyy', { locale: idLocale })}${isOverridden ? ' (Pengaturan Khusus)' : ''}`}
                    >
                      <div className="text-xs font-bold">{day}</div>
                      <div className="text-[9px] opacity-75">{dayName}</div>
                      {isOverridden && !isDisabled && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
                  <span className="text-gray-600">Hari Kerja</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                  <span className="text-gray-600">Libur/Non-kerja</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span className="text-gray-600">Minggu (Otomatis Libur)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Pengaturan Khusus</span>
                </div>
              </div>
            </div>

            <button onClick={save} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold">
              💾 Simpan Pengaturan Hari Kerja
            </button>
          </div>
        )}

        {activeTab === 'identitas' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800">Identitas Sekolah</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Instansi</label>
                <input type="text" value={settings.identitasSekolah.nama} onChange={e => setSettings({...settings, identitasSekolah: {...settings.identitasSekolah, nama: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NPSN</label>
                <input type="text" value={settings.identitasSekolah.npsn} onChange={e => setSettings({...settings, identitasSekolah: {...settings.identitasSekolah, npsn: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea value={settings.identitasSekolah.alamat} onChange={e => setSettings({...settings, identitasSekolah: {...settings.identitasSekolah, alamat: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo Sekolah</label>
                <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleLogoUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                {settings.identitasSekolah.logo && (
                  <img src={settings.identitasSekolah.logo} alt="Logo" className="mt-2 w-20 h-20 object-contain border rounded" />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'konfigurasi' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800">Konfigurasi & Backup Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">📥 Backup Data</h4>
                <p className="text-sm text-blue-600 mb-3">Download semua data aplikasi dalam format JSON</p>
                <button onClick={handleBackup} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                  Download Backup
                </button>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">📤 Restore Data</h4>
                <p className="text-sm text-green-600 mb-3">Upload file backup untuk memulihkan data</p>
                <input type="file" accept=".json" onChange={handleRestore}
                  className="w-full text-sm" />
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 md:col-span-2">
                <h4 className="font-medium text-purple-800 mb-2">📊 Statistik Data</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">{store.getUsers().length}</p>
                    <p className="text-xs text-purple-600">Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">{store.getPegawai().length}</p>
                    <p className="text-xs text-purple-600">Pegawai</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">{store.getAbsensi().length}</p>
                    <p className="text-xs text-purple-600">Absensi</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">{store.getActivities().length}</p>
                    <p className="text-xs text-purple-600">Aktivitas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
            💾 Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
