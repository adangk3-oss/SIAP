import React, { useState, useEffect, useCallback, useRef } from 'react';
import { store } from './store';
import { User, Pegawai, AbsensiRecord, Settings, DailyActivity } from './types';
import { QRCodeSVG } from 'qrcode.react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import JsBarcode from 'jsbarcode';

// ============ BARCODE COMPONENT ============
function BarcodeDisplay({ value, width = 1.5, height = 40, fontSize = 10, showText = true }: { value: string; width?: number; height?: number; fontSize?: number; showText?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: showText,
          fontSize: fontSize,
          margin: 2,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (e) {
        // fallback if barcode generation fails
      }
    }
  }, [value, width, height, fontSize, showText]);

  return <svg ref={svgRef} />;
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
              Scan Barcode
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
        {scanning ? 'Scanning...' : '🔍 Mulai Scan Barcode'}
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

  const generateBarcodeSVG = (value: string): string => {
    // Generate barcode SVG string using JsBarcode
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, value, {
        format: 'CODE128',
        width: 1.5,
        height: 50,
        displayValue: true,
        fontSize: 12,
        margin: 5,
        background: '#ffffff',
        lineColor: '#000000'
      });
      return canvas.toDataURL('image/png');
    } catch (e) {
      return '';
    }
  };

  const printCard = (p: Pegawai) => {
    const settings = store.getSettings();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const barcodeDataUrl = generateBarcodeSVG(p.idAbsen);
    
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
              ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="Barcode ${p.idAbsen}" />` : `<p>${p.idAbsen}</p>`}
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

  const printAllCards = () => {
    const settings = store.getSettings();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = pegawai.map(p => {
      const barcodeDataUrl = generateBarcodeSVG(p.idAbsen);
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
            ${barcodeDataUrl ? `<img src="${barcodeDataUrl}" alt="Barcode ${p.idAbsen}" />` : `<p>${p.idAbsen}</p>`}
          </div>
          <div class="footer">
            <p>ID Absen: ${p.idAbsen}</p>
          </div>
        </div>
      `;
    }).join('');

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
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-800">Barcode</th>
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
                      <BarcodeDisplay value={p.idAbsen} width={1.2} height={30} fontSize={8} showText={true} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button onClick={() => setPreviewBarcode(p)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200" title="Preview Barcode">
                        👁️ Preview
                      </button>
                      <button onClick={() => printCard(p)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200" title="Cetak Kartu">
                        🖨️ Kartu
                      </button>
                      <button onClick={() => handleEdit(p)} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">
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

      {/* Preview Barcode Modal */}
      {previewBarcode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Preview Barcode</h3>
              <button onClick={() => setPreviewBarcode(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="text-center space-y-3">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-bold text-blue-800 text-lg">{previewBarcode.nama}</p>
                <p className="text-sm text-gray-600">NIP: {previewBarcode.nip}</p>
                <p className="text-sm text-gray-600">{previewBarcode.jabatan}</p>
              </div>
              <div className="bg-white border-2 border-blue-200 rounded-lg p-4 flex justify-center">
                <BarcodeDisplay value={previewBarcode.idAbsen} width={2} height={60} fontSize={14} showText={true} />
              </div>
              <p className="text-sm text-gray-500">ID Absen: <span className="font-mono font-bold">{previewBarcode.idAbsen}</span></p>
              <div className="flex gap-2 justify-center pt-2">
                <button onClick={() => { printCard(previewBarcode); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                  🖨️ Cetak Kartu
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

  const getSummary = (pegawaiId: string) => {
    let hadir = 0, izin = 0, sakit = 0, alpha = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const date = new Date(year, month - 1, d);
      if (isWeekend(date)) continue;
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

      {/* Detail per day */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-green-50 border-b">
          <h3 className="font-bold text-green-800">Detail Harian</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left sticky left-0 bg-gray-50">Nama</th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i} className="px-1 py-2 text-center min-w-[30px]">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPegawai.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-2 py-2 font-medium sticky left-0 bg-white whitespace-nowrap">{p.nama}</td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const record = getAbsensiForDay(p.id, i + 1);
                    const date = new Date(year, month - 1, i + 1);
                    const isWeekendDay = isWeekend(date);
                    let bg = isWeekendDay ? 'bg-gray-100' : '';
                    let text = isWeekendDay ? '🔵' : '-';
                    if (record?.datang) { bg = 'bg-green-50'; text = '✅'; }
                    if (record?.keteranganIzin) { bg = 'bg-yellow-50'; text = '📝'; }
                    return <td key={i} className={`px-1 py-2 text-center ${bg}`}>{text}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ USER MANAGEMENT ============
function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(store.getUsers());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'user' as User['role'] });

  const refresh = () => setUsers(store.getUsers());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.addUser({ id: Date.now().toString(), ...form });
    refresh();
    setShowForm(false);
    setForm({ username: '', password: '', name: '', role: 'user' });
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
                  <button onClick={() => handleDelete(u.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">
                    🗑️ Hapus
                  </button>
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
    newHariKerja[dateStr] = !newHariKerja[dateStr];
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
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-800">Pengaturan Hari Kerja</h3>
            <p className="text-sm text-gray-500">Klik tanggal untuk menandai sebagai hari libur/non-kerja</p>
            <input type="month" value={selectedMonthHari} onChange={e => setSelectedMonthHari(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            <div className="grid grid-cols-7 gap-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                <div key={d} className="text-center text-xs font-bold text-gray-500 py-1">{d}</div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const date = new Date(year, month - 1, i + 1);
                const dateStr = `${selectedMonthHari}-${String(i + 1).padStart(2, '0')}`;
                const isOff = settings.hariKerja[dateStr] === false;
                const isWeekendDay = isWeekend(date);
                return (
                  <button key={i} onClick={() => toggleHariKerja(dateStr)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${isOff ? 'bg-red-100 text-red-700 border-2 border-red-300' : isWeekendDay ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100'}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400">🟢 = Hari Kerja | 🔴 = Libur/Non-kerja | Abu = Weekend</p>
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
