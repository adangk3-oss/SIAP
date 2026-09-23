import React, { useState, useEffect, useCallback, useRef } from 'react';
import { store } from './store';
import { User, Pegawai, AbsensiRecord, Settings, DailyActivity } from './types';
import { QRCodeSVG } from 'qrcode.react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { FaceScanner } from './FaceScanner';
import { Scanner } from '@yudiel/react-qr-scanner';
import { speakAbsenSuccess } from './speech';

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
    <div className="flex h-screen relative"
         style={{
           background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf5 50%, #f0e6ff 100%)',
         }}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />
      
      <Sidebar 
        currentUser={currentUser} 
        page={page} 
        setPage={setPage} 
        onLogout={logout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 overflow-auto relative z-10">
        <Header currentUser={currentUser} setSidebarOpen={setSidebarOpen} />
        <main className="p-4 md:p-6 relative">
          {/* Global watermark for all pages */}
          <div className="watermark animate-watermark" style={{ color: 'rgba(99, 102, 241, 0.03)' }}>
            Dunks"3
          </div>
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      {/* Animated background orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-30 animate-float"
             style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20 animate-float"
             style={{ background: 'radial-gradient(circle, #ec4899, transparent 70%)', animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-20 animate-float"
             style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', animationDelay: '4s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

      {/* Watermark */}
      <div className="watermark animate-watermark" style={{ color: 'rgba(139, 92, 246, 0.08)' }}>
        Dunks"3
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="glass rounded-3xl p-8 shadow-2xl animate-pulse-glow">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float"
                   style={{
                     background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                     boxShadow: '0 10px 40px rgba(139, 92, 246, 0.5)',
                   }}>
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"
                   style={{ boxShadow: '0 0 10px rgba(74, 222, 128, 0.8)' }} />
            </div>
            <h1 className="text-2xl font-black text-white neon-text tracking-wide">SMP NEGERI 61</h1>
            <h2 className="text-lg font-bold text-purple-300 tracking-widest">BANDUNG</h2>
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-purple-200 font-medium tracking-wide">SISTEM ABSENSI DIGITAL</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm backdrop-blur-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-2 uppercase tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300">👤</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 glass rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                  placeholder="Masukkan username"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 glass rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                  placeholder="Masukkan password"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-futuristic w-full py-4 rounded-xl font-bold text-white tracking-wider uppercase text-sm transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
              }}
            >
              🚀 Masuk Sistem
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-purple-300/60">© 2024 SMP Negeri 61 Bandung</p>
          </div>
        </div>

        {/* Watermark bottom */}
        <div className="mt-6 text-center">
          <p className="text-xs font-bold tracking-[0.3em] text-purple-400/40">
            POWERED BY <span className="text-pink-400/60">DUNKS"3</span>
          </p>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed md:static z-30 h-full w-64 text-white transform transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}`}
             style={{
               background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
               boxShadow: '4px 0 30px rgba(0, 0, 0, 0.3)',
             }}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <span className="text-lg">🏫</span>
            </div>
            <div className={`${!sidebarOpen && 'md:hidden'}`}>
              <h2 className="font-bold text-sm tracking-wide">SMPN 61</h2>
              <p className="text-[10px] text-purple-300 tracking-wider">BANDUNG</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1 mt-2">
          {filteredMenu.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                page === item.id
                  ? 'text-white'
                  : 'text-purple-200/80 hover:text-white hover:bg-white/5'
              }`}
              style={page === item.id ? {
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              } : {}}
            >
              {page === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                     style={{ background: 'linear-gradient(180deg, #6366f1, #ec4899)' }} />
              )}
              <span className="text-xl transition-transform group-hover:scale-110">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all group border border-transparent hover:border-red-500/30">
            <span className="text-xl transition-transform group-hover:scale-110">🚪</span>
            {sidebarOpen && <span className="text-sm font-medium text-red-300">Keluar</span>}
          </button>
          {sidebarOpen && (
            <div className="mt-3 text-center">
              <p className="text-[9px] text-purple-400/40 tracking-[0.2em] font-bold">DUNKS"3</p>
            </div>
          )}
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
    <header className="glass-card shadow-lg border-b border-purple-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <button onClick={() => setSidebarOpen((p: boolean) => !p)}
              className="p-2 rounded-xl hover:bg-purple-50 transition-all group">
        <svg className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-purple-800">{format(currentTime, 'EEEE, dd MMMM yyyy', { locale: idLocale })}</p>
          <p className="text-xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {format(currentTime, 'HH:mm:ss')}
          </p>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
             style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
               style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-gray-800">{currentUser.name}</p>
            <p className="text-xs text-purple-600 capitalize font-medium">{currentUser.role}</p>
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
    { label: 'Total Pegawai', value: pegawai.length, icon: '👥', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', glow: 'rgba(102, 126, 234, 0.4)' },
    { label: 'Hadir Hari Ini', value: todayAbsensi.filter(a => a.datang).length, icon: '✅', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', glow: 'rgba(56, 239, 125, 0.4)' },
    { label: 'Izin Hari Ini', value: todayAbsensi.filter(a => a.keteranganIzin).length, icon: '📝', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', glow: 'rgba(245, 87, 108, 0.4)' },
    { label: 'Belum Absen', value: pegawai.length - todayAbsensi.length, icon: '⚠️', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', glow: 'rgba(250, 112, 154, 0.4)' },
  ];

  return (
    <div className="space-y-6 relative">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white animate-fade-in-up"
           style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"
             style={{ background: 'radial-gradient(circle, #fff, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
              {format(new Date(), 'EEEE', { locale: idLocale })}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
              {format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black">Selamat Datang, {currentUser.name}! 👋</h1>
          <p className="text-white/80 mt-2 text-sm md:text-base">Sistem Absensi Digital SMP Negeri 61 Bandung</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="glass rounded-2xl px-5 py-3 flex items-center gap-3">
              <span className="text-3xl font-mono font-black bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                {format(new Date(), 'HH:mm:ss')}
              </span>
            </div>
            <div className="glass rounded-2xl px-5 py-3 flex items-center gap-2">
              <span className="text-xs text-white/70">JAM KERJA</span>
              <span className="font-bold">{settings.jamMasuk}</span>
              <span className="text-white/50">—</span>
              <span className="font-bold">{settings.jamPulang}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i}
               className="card-hover relative overflow-hidden rounded-2xl p-5 text-white animate-fade-in-up"
               style={{
                 background: stat.gradient,
                 boxShadow: `0 10px 30px ${stat.glow}`,
                 animationDelay: `${i * 0.1}s`,
               }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"
                 style={{ background: 'radial-gradient(circle, #fff, transparent 70%)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-90">{stat.label}</p>
                  <p className="text-4xl font-black mt-2">{stat.value}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-3xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Access */}
        <div className="glass-card rounded-2xl p-6 shadow-lg animate-fade-in-up">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2 text-lg">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              <span className="text-white text-sm">🚀</span>
            </span>
            Akses Cepat
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'absen', icon: '✅', label: 'Absensi', gradient: 'linear-gradient(135deg, #667eea20, #764ba220)', border: '#667eea40', textColor: '#667eea' },
              { id: 'pegawai', icon: '👥', label: 'Pegawai', gradient: 'linear-gradient(135deg, #11998e20, #38ef7d20)', border: '#11998e40', textColor: '#11998e' },
              { id: 'rekap-harian', icon: '📋', label: 'Rekap Harian', gradient: 'linear-gradient(135deg, #f093fb20, #f5576c20)', border: '#f5576c40', textColor: '#f5576c' },
              { id: 'rekap-bulanan', icon: '📅', label: 'Rekap Bulanan', gradient: 'linear-gradient(135deg, #fa709a20, #fee14020)', border: '#fa709a40', textColor: '#fa709a' },
            ].map(item => (
              <button key={item.id} onClick={() => setPage(item.id)}
                      className="card-hover p-4 rounded-xl text-center transition-all hover:scale-105"
                      style={{ background: item.gradient, border: `1px solid ${item.border}` }}>
                <span className="text-3xl">{item.icon}</span>
                <p className="text-sm font-bold mt-2" style={{ color: item.textColor }}>{item.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="glass-card rounded-2xl p-6 shadow-lg animate-fade-in-up">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2 text-lg">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)' }}>
              <span className="text-white text-sm">📈</span>
            </span>
            Absensi Hari Ini
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {todayAbsensi.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3 opacity-50">📭</div>
                <p className="text-gray-400 text-sm">Belum ada absensi hari ini</p>
              </div>
            ) : (
              todayAbsensi.map((a, idx) => {
                const p = pegawai.find(pg => pg.id === a.pegawaiId);
                return (
                  <div key={a.id}
                       className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
                       style={{
                         background: `linear-gradient(135deg, rgba(99, 102, 241, ${0.03 + idx * 0.01}), rgba(168, 85, 247, ${0.03 + idx * 0.01}))`,
                         border: '1px solid rgba(139, 92, 246, 0.1)',
                       }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                           style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                        {p?.nama?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{p?.nama || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{p?.jabatan}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs space-y-0.5">
                      {a.datang && <p className="text-green-600 font-semibold">🟢 {a.datang}</p>}
                      {a.pulang && <p className="text-blue-600 font-semibold">🔵 {a.pulang}</p>}
                      {a.keteranganIzin && <p className="text-yellow-600 font-semibold">🟡 Izin</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer watermark */}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs font-bold tracking-[0.3em] text-purple-300/40">
          POWERED BY <span className="text-pink-400/50">DUNKS"3</span>
        </p>
      </div>
    </div>
  );
}

// ============ ABSEN PAGE ============
function AbsenPage() {
  const [inputMode, setInputMode] = useState<'manual' | 'qr' | 'face'>('manual');
  const [manualId, setManualId] = useState('');
  const [absenType, setAbsenType] = useState<'datang' | 'pulang' | 'izinKeluar' | 'izinMasuk' | 'sakit' | 'tanpaKeterangan' | 'dinasLuar'>('datang');
  const [keterangan, setKeterangan] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [lastScannedPegawai, setLastScannedPegawai] = useState<Pegawai | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
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

    // Simpan informasi pegawai yang terakhir scan
    if (p) {
      setLastScannedPegawai(p);
    }

    if (absenType === 'datang') {
      record.datang = now;
      setMessage(`Absen Datang berhasil dicatat`);
      setMessageType('success');
    } else if (absenType === 'pulang') {
      record.pulang = now;
      setMessage(`Absen Pulang berhasil dicatat`);
      setMessageType('success');
    } else if (absenType === 'izinKeluar') {
      record.izinKeluar = now;
      record.keteranganIzin = keterangan;
      setMessage(`Izin Keluar berhasil dicatat`);
      setMessageType('success');
    } else if (absenType === 'izinMasuk') {
      record.izinMasuk = now;
      setMessage(`Izin Masuk berhasil dicatat`);
      setMessageType('success');
    } else if (absenType === 'sakit') {
      record.sakit = now;
      record.status = 'sakit';
      record.keteranganIzin = keterangan;
      setMessage(`Sakit (S) berhasil dicatat`);
      setMessageType('success');
    } else if (absenType === 'tanpaKeterangan') {
      record.tanpaKeterangan = now;
      record.status = 'alpha';
      setMessage(`Tanpa Keterangan (TK) berhasil dicatat`);
      setMessageType('success');
    } else if (absenType === 'dinasLuar') {
      record.dinasLuar = now;
      record.keteranganIzin = keterangan;
      setMessage(`Dinas Luar (DL) berhasil dicatat`);
      setMessageType('success');
    }

    if (absensi.find(a => a.id === record!.id)) {
      store.updateAbsensi(record);
    } else {
      store.addAbsensi(record);
    }
    setManualId('');
    setKeterangan('');

    // Panggil audio ucapan untuk pengumuman absensi berhasil (jika diaktifkan)
    if (p && audioEnabled) {
      speakAbsenSuccess(p.nama);
    }
  }, [absenType, keterangan, pegawai, audioEnabled]);

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
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)', boxShadow: '0 8px 20px rgba(56, 239, 125, 0.3)' }}>
            <span className="text-2xl">✅</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Absensi Pegawai</h2>
            <p className="text-sm text-gray-500">Catat kehadiran pegawai dengan mudah</p>
          </div>
        </div>
        
        {/* Audio Toggle */}
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 ${
            audioEnabled 
              ? 'text-white shadow-lg' 
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
          }`}
          style={audioEnabled 
            ? { background: 'linear-gradient(135deg, #667eea, #764ba2)', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)' }
            : {}}
          title={audioEnabled ? 'Audio ucapan aktif' : 'Audio ucapan nonaktif'}
        >
          <span className="text-lg">{audioEnabled ? '🔊' : '🔇'}</span>
          <span className="hidden sm:inline">{audioEnabled ? 'Audio ON' : 'Audio OFF'}</span>
        </button>
      </div>
      
      {message && lastScannedPegawai && messageType === 'success' && (
        <div className="p-6 rounded-3xl backdrop-blur-sm animate-fade-in-up relative overflow-hidden"
             style={{
               background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.1), rgba(56, 239, 125, 0.1))',
               border: '2px solid rgba(56, 239, 125, 0.3)',
               boxShadow: '0 10px 40px rgba(56, 239, 125, 0.2)'
             }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"
               style={{ background: 'radial-gradient(circle, #38ef7d, transparent 70%)' }} />
          
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 animate-float"
                   style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)', boxShadow: '0 8px 20px rgba(56, 239, 125, 0.4)' }}>
                <span className="text-3xl">✅</span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-black text-green-800 mb-1">Absensi Berhasil!</h3>
                <p className="text-sm text-green-700 mb-3">{message}</p>
                
                <div className="bg-white/60 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Nama:</span>
                    <span className="text-sm font-bold text-gray-800">{lastScannedPegawai.nama}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">NIP:</span>
                    <span className="text-sm text-gray-700">{lastScannedPegawai.nip}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Jabatan:</span>
                    <span className="text-sm text-gray-700">{lastScannedPegawai.jabatan}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Jenis:</span>
                    <span className="text-sm font-bold text-green-700 capitalize">
                      {absenType === 'datang' && '🌅 Datang'}
                      {absenType === 'pulang' && '🌆 Pulang'}
                      {absenType === 'izinKeluar' && '🚶 Izin Keluar'}
                      {absenType === 'izinMasuk' && '🏠 Izin Masuk'}
                      {absenType === 'sakit' && '🤒 Sakit (S)'}
                      {absenType === 'tanpaKeterangan' && '❌ Tanpa Keterangan (TK)'}
                      {absenType === 'dinasLuar' && '🚗 Dinas Luar (DL)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600">Waktu:</span>
                    <span className="text-sm font-bold text-purple-700">{format(new Date(), 'HH:mm:ss')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => { setMessage(''); setLastScannedPegawai(null); }}
              className="mt-4 w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)' }}
            >
              ✓ Tutup Notifikasi
            </button>
          </div>
        </div>
      )}
      
      {message && messageType === 'error' && (
        <div className="p-4 rounded-2xl backdrop-blur-sm flex items-center gap-3 animate-fade-in-up"
             style={{
               background: 'rgba(239, 68, 68, 0.1)',
               border: '2px solid rgba(239, 68, 68, 0.3)'
             }}>
          <span className="text-2xl">❌</span>
          <span className="font-medium text-red-700">{message}</span>
          <button
            onClick={() => setMessage('')}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Selection */}
        <div className="glass-card rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
              <span className="text-white text-sm">📋</span>
            </span>
            Jenis Absensi
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'datang', label: 'Datang', icon: '🌅', gradient: 'linear-gradient(135deg, #11998e20, #38ef7d20)', active: 'linear-gradient(135deg, #11998e, #38ef7d)' },
              { value: 'pulang', label: 'Pulang', icon: '🌆', gradient: 'linear-gradient(135deg, #667eea20, #764ba220)', active: 'linear-gradient(135deg, #667eea, #764ba2)' },
              { value: 'izinKeluar', label: 'Izin Keluar', icon: '🚶', gradient: 'linear-gradient(135deg, #f093fb20, #f5576c20)', active: 'linear-gradient(135deg, #f093fb, #f5576c)' },
              { value: 'izinMasuk', label: 'Izin Masuk', icon: '🏠', gradient: 'linear-gradient(135deg, #fa709a20, #fee14020)', active: 'linear-gradient(135deg, #fa709a, #fee140)' },
              { value: 'sakit', label: 'Sakit (S)', icon: '🤒', gradient: 'linear-gradient(135deg, #fb923c20, #f97316 20)', active: 'linear-gradient(135deg, #fb923c, #f97316)' },
              { value: 'tanpaKeterangan', label: 'Tanpa Ket. (TK)', icon: '❌', gradient: 'linear-gradient(135deg, #ef444420, #dc262620)', active: 'linear-gradient(135deg, #ef4444, #dc2626)' },
              { value: 'dinasLuar', label: 'Dinas Luar (DL)', icon: '🚗', gradient: 'linear-gradient(135deg, #6366f120, #4f46e520)', active: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setAbsenType(type.value as any)}
                className={`p-4 rounded-2xl border-2 transition-all card-hover ${
                  absenType === type.value 
                    ? 'text-white border-transparent scale-105' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                style={absenType === type.value 
                  ? { background: type.active, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }
                  : { background: type.gradient }}
              >
                <span className="text-3xl">{type.icon}</span>
                <p className="text-sm font-bold mt-2">{type.label}</p>
              </button>
            ))}
          </div>

          {(absenType === 'izinKeluar' || absenType === 'sakit' || absenType === 'dinasLuar') && (
            <div className="mt-5 animate-fade-in-up">
              <label className="block text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wider">
                {absenType === 'izinKeluar' && 'Keterangan Izin'}
                {absenType === 'sakit' && 'Keterangan Sakit'}
                {absenType === 'dinasLuar' && 'Keterangan Dinas Luar'}
              </label>
              <textarea
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                placeholder={
                  absenType === 'izinKeluar' ? 'Masukkan keterangan izin keluar...' :
                  absenType === 'sakit' ? 'Masukkan keterangan sakit...' :
                  'Masukkan keterangan dinas luar...'
                }
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Input Method */}
        <div className="glass-card rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)' }}>
              <span className="text-white text-sm">⌨️</span>
            </span>
            Input Absensi
          </h3>
          <div className="flex gap-1 mb-5 p-1 rounded-xl"
               style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))' }}>
            <button
              onClick={() => setInputMode('manual')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-xs transition-all ${
                inputMode === 'manual' 
                  ? 'text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={inputMode === 'manual' ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}
            >
              ⌨️ Manual
            </button>
            <button
              onClick={() => setInputMode('qr')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-xs transition-all ${
                inputMode === 'qr' 
                  ? 'text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={inputMode === 'qr' ? { background: 'linear-gradient(135deg, #11998e, #38ef7d)' } : {}}
            >
              📷 QR
            </button>
            <button
              onClick={() => setInputMode('face')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-xs transition-all ${
                inputMode === 'face' 
                  ? 'text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={inputMode === 'face' ? { background: 'linear-gradient(135deg, #f093fb, #f5576c)' } : {}}
            >
              👤 Wajah
            </button>
          </div>

          {inputMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wider">ID Absen Pegawai</label>
                <input
                  type="text"
                  value={manualId}
                  onChange={e => setManualId(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-lg font-mono transition-all"
                  placeholder="Masukkan ID Absen..."
                />
              </div>
              <button type="submit"
                      className="btn-futuristic w-full py-4 rounded-xl font-bold text-white tracking-wider uppercase text-sm transition-all hover:scale-[1.02] active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)',
                      }}>
                🚀 Proses Absensi
              </button>
            </form>
          )}

          {inputMode === 'qr' && (
            <BarcodeScanner 
              onScan={handleScan}
              onScanComplete={() => {
                setTimeout(() => {
                  setInputMode('manual');
                }, 1500);
              }}
            />
          )}

          {inputMode === 'face' && (
            <FaceScanAbsen
              pegawaiList={pegawai}
              onRecognize={(pegawaiId: string, nama: string) => {
                processAbsen(pegawaiId);
                setTimeout(() => {
                  setInputMode('manual');
                }, 1500);
              }}
              onError={(error: string) => {
                setMessage(error);
                setMessageType('error');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============ FACE SCAN ABSEN ============
function FaceScanAbsen({ 
  pegawaiList, 
  onRecognize, 
  onError 
}: { 
  pegawaiList: Pegawai[]; 
  onRecognize: (pegawaiId: string, nama: string) => void;
  onError: (error: string) => void;
}) {
  const pegawaiWithFaces = pegawaiList.filter(p => p.faceDescriptor && p.faceDescriptor.length > 0);

  if (pegawaiWithFaces.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">👤</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Belum Ada Data Wajah</h3>
        <p className="text-sm text-gray-500 mb-4">
          Belum ada pegawai yang mendaftarkan wajah.<br/>
          Silakan daftarkan wajah di menu Data Pegawai terlebih dahulu.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
          <span>💡</span>
          <span>{pegawaiList.length} pegawai terdaftar, {pegawaiWithFaces.length} sudah enroll wajah</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
        <span className="text-sm">✅</span>
        <span className="text-xs font-semibold text-green-800">
          {pegawaiWithFaces.length} pegawai sudah terdaftar wajah
        </span>
      </div>
      <FaceScanner
        mode="recognize"
        pegawaiList={pegawaiWithFaces}
        onRecognizeComplete={onRecognize}
        onError={onError}
      />
    </div>
  );
}

// ============ BARCODE SCANNER ============
function BarcodeScanner({ onScan, onScanComplete }: { onScan: (result: string) => void; onScanComplete?: () => void }) {
  const [cameraType, setCameraType] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string>('');
  const isProcessingRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onScanCompleteRef = useRef(onScanComplete);

  // Keep refs updated
  useEffect(() => {
    onScanRef.current = onScan;
    onScanCompleteRef.current = onScanComplete;
  }, [onScan, onScanComplete]);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
      } catch (err) {
        console.error('Error getting cameras:', err);
      }
    };
    getCameras();
  }, []);

  const handleScan = (detectedCodes: any[]) => {
    if (isProcessingRef.current || !detectedCodes || detectedCodes.length === 0) return;
    isProcessingRef.current = true;
    
    // Get the first detected QR code
    const decodedText = detectedCodes[0]?.rawValue || '';
    
    if (decodedText) {
      onScanRef.current(decodedText);
      
      // Call completion callback
      if (onScanCompleteRef.current) {
        setTimeout(() => {
          onScanCompleteRef.current!();
        }, 100);
      }
    }
  };

  const handleError = (err: any) => {
    console.error('Scanner error:', err);
    const errorMessage = err?.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.';
    setError(errorMessage);
  };

  const switchCamera = () => {
    setCameraType(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="space-y-4">
      {/* Camera Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setCameraType('environment')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
            cameraType === 'environment'
              ? 'text-white shadow-lg'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          style={cameraType === 'environment' 
            ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' }
            : { background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
        >
          📷 Kamera Belakang
        </button>
        <button
          onClick={() => setCameraType('user')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
            cameraType === 'user'
              ? 'text-white shadow-lg'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          style={cameraType === 'user'
            ? { background: 'linear-gradient(135deg, #f093fb, #f5576c)' }
            : { background: 'rgba(240, 147, 251, 0.1)', border: '1px solid rgba(240, 147, 251, 0.2)' }}
        >
          🤳 Kamera Depan
        </button>
      </div>

      {/* Camera Info */}
      {availableCameras.length > 0 && (
        <div className="text-xs text-center text-gray-500">
          {availableCameras.length} kamera tersedia
        </div>
      )}

      {/* Scanner Container */}
      <div 
        className="w-full rounded-2xl overflow-hidden relative"
        style={{ 
          background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
          minHeight: '300px'
        }}
      >
        {error ? (
          <div className="flex items-center justify-center h-[300px] text-center p-4">
            <div className="text-white">
              <div className="text-5xl mb-3">⚠️</div>
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={() => setError('')}
                className="mt-3 px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        ) : (
          <>
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={{
                facingMode: cameraType,
                width: { ideal: 640 },
                height: { ideal: 480 }
              }}
              styles={{
                container: { 
                  width: '100%', 
                  height: '300px'
                },
                video: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }
              }}
              scanDelay={500}
              sound={false}
            />
            
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-48 h-48 border-4 border-green-400 rounded-2xl"
                   style={{ boxShadow: '0 0 30px rgba(74, 222, 128, 0.5)' }} />
            </div>
            
            {/* Camera indicator */}
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full glass text-white text-xs font-semibold z-10">
              {cameraType === 'environment' ? '📷 Belakang' : '🤳 Depan'}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={switchCamera}
          className="btn-futuristic flex-1 py-4 rounded-xl font-bold text-white tracking-wider uppercase text-sm transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)',
          }}
        >
          🔄 Ganti Kamera
        </button>
      </div>
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
  const [enrollFace, setEnrollFace] = useState<Pegawai | null>(null);

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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)' }}>
            <span className="text-2xl">👥</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Data Pegawai</h2>
            <p className="text-sm text-gray-500">Kelola data pegawai sekolah</p>
          </div>
        </div>
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
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-800">Wajah</th>
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
                    {p.faceDescriptor && p.faceDescriptor.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        ✅ Terdaftar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                        ❌ Belum
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button onClick={() => setEnrollFace(p)} className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs hover:bg-pink-200" title="Enroll Wajah">
                        👤 Wajah
                      </button>
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
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Belum ada data pegawai</td></tr>
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

      {/* Enroll Face Modal */}
      {enrollFace && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Enroll Wajah</h3>
                  <p className="text-xs text-gray-500">{enrollFace.nama}</p>
                </div>
              </div>
              <button onClick={() => setEnrollFace(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <FaceScanner
              mode="enroll"
              pegawai={enrollFace}
              onEnrollComplete={(descriptor) => {
                // Save face descriptor to pegawai
                const updatedPegawai = { ...enrollFace, faceDescriptor: descriptor };
                store.updatePegawai(updatedPegawai);
                refresh();
                
                // Show success message
                alert(`✅ Wajah ${enrollFace.nama} berhasil didaftarkan!`);
                setEnrollFace(null);
              }}
              onError={(error) => {
                alert(`❌ Error: ${error}`);
              }}
            />
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
  const [showEditAbsen, setShowEditAbsen] = useState(false);
  const [editAbsenData, setEditAbsenData] = useState<AbsensiRecord | null>(null);
  const pegawai = store.getPegawai();
  const absensi = store.getAbsensi();

  const refresh = () => {
    setActivities(store.getActivities());
    window.location.reload();
  };

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

  const handleCloseEditAbsen = () => {
    setShowEditAbsen(false);
    setEditAbsenData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', boxShadow: '0 8px 20px rgba(245, 87, 108, 0.3)' }}>
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Rekap Harian</h2>
            <p className="text-sm text-gray-500">Pantau absensi dan aktivitas harian</p>
          </div>
        </div>
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
          <div className="mt-2 flex gap-4 text-sm">
            <span className="text-gray-600">Total Pegawai: <strong className="text-blue-700">{pegawai.length}</strong></span>
            <span className="text-gray-600">Sudah Absen: <strong className="text-green-700">{todayAbsensi.length}</strong></span>
            <span className="text-gray-600">Belum Absen: <strong className="text-red-700">{pegawai.length - todayAbsensi.length}</strong></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Datang</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Izin Keluar</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Izin Masuk</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Pulang</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-orange-700">Sakit (S)</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-red-700">Tanpa Keterangan (TK)</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-indigo-700">Dinas Luar (DL)</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Keterangan</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pegawai.map((p, index) => {
                const absen = todayAbsensi.find(a => a.pegawaiId === p.id);
                const hasAbsen = !!absen;
                
                return (
                  <tr key={p.id} className={`border-t hover:bg-gray-50 ${!hasAbsen ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{p.nama}</td>
                    <td className="px-4 py-3 text-center">
                      {hasAbsen ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          ✅ Hadir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                          ❌ Belum
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">{absen?.datang || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-yellow-600 font-medium">{absen?.izinKeluar || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-purple-600 font-medium">{absen?.izinMasuk || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-blue-600 font-medium">{absen?.pulang || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-orange-600 font-medium">{absen?.sakit || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">{absen?.tanpaKeterangan || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-indigo-600 font-medium">{absen?.dinasLuar || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{absen?.keteranganIzin || '-'}</td>
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
                  </tr>
                );
              })}
              {pegawai.length === 0 && (
                <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">Belum ada data pegawai</td></tr>
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

      {/* Modal Edit Absensi */}
      {showEditAbsen && editAbsenData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  <span className="text-2xl">{todayAbsensi.find(a => a.id === editAbsenData.id) ? '✏️' : '➕'}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {todayAbsensi.find(a => a.id === editAbsenData.id) ? 'Edit Data Absensi' : 'Tambah Data Absensi'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {pegawai.find(p => p.id === editAbsenData.pegawaiId)?.nama || '-'} - {format(parseISO(editAbsenData.tanggal), 'dd MMMM yyyy', { locale: idLocale })}
                  </p>
                </div>
              </div>
              <button onClick={handleCloseEditAbsen} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="space-y-4">
              {/* Waktu Datang */}
              <div>
                <label className="block text-xs font-semibold text-green-600 mb-2 uppercase tracking-wider">🌅 Waktu Datang</label>
                <input
                  type="time"
                  value={editAbsenData.datang || ''}
                  onChange={e => setEditAbsenData({ ...editAbsenData, datang: e.target.value || undefined })}
                  className="w-full px-4 py-2.5 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>

              {/* Izin Keluar */}
              <div>
                <label className="block text-xs font-semibold text-yellow-600 mb-2 uppercase tracking-wider">🚶 Izin Keluar</label>
                <input
                  type="time"
                  value={editAbsenData.izinKeluar || ''}
                  onChange={e => setEditAbsenData({ ...editAbsenData, izinKeluar: e.target.value || undefined })}
                  className="w-full px-4 py-2.5 border-2 border-yellow-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>

              {/* Izin Masuk */}
              <div>
                <label className="block text-xs font-semibold text-purple-600 mb-2 uppercase tracking-wider">🏠 Izin Masuk</label>
                <input
                  type="time"
                  value={editAbsenData.izinMasuk || ''}
                  onChange={e => setEditAbsenData({ ...editAbsenData, izinMasuk: e.target.value || undefined })}
                  className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>

              {/* Waktu Pulang */}
              <div>
                <label className="block text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">🌆 Waktu Pulang</label>
                <input
                  type="time"
                  value={editAbsenData.pulang || ''}
                  onChange={e => setEditAbsenData({ ...editAbsenData, pulang: e.target.value || undefined })}
                  className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              {/* Sakit (S) */}
              <div className="p-4 rounded-xl bg-orange-50 border-2 border-orange-200">
                <label className="block text-xs font-semibold text-orange-600 mb-2 uppercase tracking-wider">🤒 Sakit (S)</label>
                <input
                  type="time"
                  value={editAbsenData.sakit || ''}
                  onChange={e => setEditAbsenData({ ...editAbsenData, sakit: e.target.value || undefined, status: e.target.value ? 'sakit' : 'hadir' })}
                  className="w-full px-4 py-2.5 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                />
              </div>

              {/* Tanpa Keterangan (TK) */}
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
                <label className="block text-xs font-semibold text-red-600 mb-2 uppercase tracking-wider">❌ Tanpa Keterangan (TK)</label>
                <input
                  type="time"
                  value={editAbsenData.tanpaKeterangan || ''}
                  onChange={e => setEditAbsenData({ ...editAbsenData, tanpaKeterangan: e.target.value || undefined, status: e.target.value ? 'alpha' : 'hadir' })}
                  className="w-full px-4 py-2.5 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white"
                />
              </div>

              {/* Dinas Luar (DL) */}
              <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-200">
                <label className="block text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wider">🚗 Dinas Luar (DL)</label>
                <input
                  type="time"
                  value={editAbsenData.dinasLuar || ''}
                  onChange={e => setEditAbsenData({ ...editAbsenData, dinasLuar: e.target.value || undefined })}
                  className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">📝 Keterangan</label>
                <textarea
                  value={editAbsenData.keteranganIzin || ''}
                  onChange={e => setEditAbsenData({ ...editAbsenData, keteranganIzin: e.target.value || undefined })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                {todayAbsensi.find(a => a.id === editAbsenData.id) ? '💾 Simpan Perubahan' : '💾 Tambah Absensi'}
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
    let hadir = 0, izin = 0, sakit = 0, alpha = 0, dinasLuar = 0, tanpaKeterangan = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const date = new Date(year, month - 1, d);
      if (!isWorkingDay(date, dateStr)) continue;
      const record = absensi.find(a => a.pegawaiId === pegawaiId && a.tanggal === dateStr);
      if (record?.datang) hadir++;
      else if (record?.sakit) sakit++;
      else if (record?.dinasLuar) dinasLuar++;
      else if (record?.tanpaKeterangan) tanpaKeterangan++;
      else if (record?.keteranganIzin) izin++;
      else alpha++;
    }
    return { hadir, izin, sakit, alpha, dinasLuar, tanpaKeterangan };
  };

  const exportToExcel = () => {
    const data: any[] = [];
    data.push(['REKAP ABSENSI BULANAN']);
    data.push([settings.identitasSekolah.nama]);
    data.push([`Bulan: ${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: idLocale })}`]);
    data.push([]);
    
    filteredPegawai.forEach(p => {
      data.push([p.nama, `NIP: ${p.nip}`, p.jabatan]);
      const header = ['Tanggal', 'Datang', 'Izin Keluar', 'Izin Masuk', 'Pulang', 'Sakit (S)', 'Dinas Luar (DL)', 'Tanpa Keterangan (TK)', 'Keterangan'];
      data.push(header);
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
        const record = getAbsensiForDay(p.id, d);
        if (record) {
          data.push([dateStr, record.datang || '-', record.izinKeluar || '-', record.izinMasuk || '-', record.pulang || '-', record.sakit || '-', record.dinasLuar || '-', record.tanpaKeterangan || '-', record.keteranganIzin || '-']);
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
    data.push(['Nama', 'NIP', 'Jabatan', 'Tanggal', 'Datang', 'Izin Keluar', 'Izin Masuk', 'Pulang', 'Sakit (S)', 'Dinas Luar (DL)', 'Tanpa Keterangan (TK)', 'Keterangan']);
    
    filteredPegawai.forEach(p => {
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
        const record = getAbsensiForDay(p.id, d);
        if (record) {
          data.push([p.nama, p.nip, p.jabatan, dateStr, record.datang || '', record.izinKeluar || '', record.izinMasuk || '', record.pulang || '', record.sakit || '', record.dinasLuar || '', record.tanpaKeterangan || '', record.keteranganIzin || '']);
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
    let hadirCount = 0, izinCount = 0, sakitCount = 0, dinasLuarCount = 0, tanpaKeteranganCount = 0, alphaCount = 0;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const date = new Date(year, month - 1, d);
      const isWorking = isWorkingDay(date, dateStr);
      const record = absensi.find(a => a.pegawaiId === p.id && a.tanggal === dateStr);
      
      // Hanya tampilkan hari kerja (skip hari libur)
      if (isWorking) {
        // Hitung statistik
        if (record?.datang) hadirCount++;
        else if (record?.sakit) sakitCount++;
        else if (record?.dinasLuar) dinasLuarCount++;
        else if (record?.tanpaKeterangan) tanpaKeteranganCount++;
        else if (record?.keteranganIzin) izinCount++;
        else alphaCount++;
        
        // Tambahkan baris hanya untuk hari kerja
        tableRows += `
          <tr>
            <td>${format(date, 'EEEE, dd MMMM yyyy', { locale: idLocale })}</td>
            <td style="text-align:center;color:#16a34a;font-weight:bold">${record?.datang || '-'}</td>
            <td style="text-align:center;color:#ca8a04">${record?.izinKeluar || '-'}</td>
            <td style="text-align:center;color:#9333ea">${record?.izinMasuk || '-'}</td>
            <td style="text-align:center;color:#2563eb;font-weight:bold">${record?.pulang || '-'}</td>
            <td style="text-align:center;color:#ea580c;font-weight:bold">${record?.sakit || '-'}</td>
            <td style="text-align:center;color:#4f46e5;font-weight:bold">${record?.dinasLuar || '-'}</td>
            <td style="text-align:center;color:#dc2626;font-weight:bold">${record?.tanpaKeterangan || '-'}</td>
            <td style="text-align:center">${record?.keteranganIzin || '-'}</td>
          </tr>
        `;
      }
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
                <th style="width:18%">Tanggal</th>
                <th style="width:9%">Datang</th>
                <th style="width:10%">Izin Keluar</th>
                <th style="width:10%">Izin Masuk</th>
                <th style="width:9%">Pulang</th>
                <th style="width:9%">Sakit (S)</th>
                <th style="width:10%">Dinas Luar (DL)</th>
                <th style="width:10%">Tanpa Ket. (TK)</th>
                <th style="width:15%">Keterangan</th>
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
                <td class="label">Total Sakit:</td>
                <td style="color:#ea580c;font-weight:bold;font-size:14pt">${sakitCount} hari</td>
              </tr>
              <tr>
                <td class="label">Total Dinas Luar:</td>
                <td style="color:#4f46e5;font-weight:bold;font-size:14pt">${dinasLuarCount} hari</td>
                <td class="label">Total Tanpa Ket.:</td>
                <td style="color:#dc2626;font-weight:bold;font-size:14pt">${tanpaKeteranganCount} hari</td>
                <td class="label">Total Alpha:</td>
                <td style="color:#991b1b;font-weight:bold;font-size:14pt">${alphaCount} hari</td>
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
          <td style="text-align:center;color:#ea580c;font-weight:bold">${summary.sakit}</td>
          <td style="text-align:center;color:#4f46e5;font-weight:bold">${summary.dinasLuar}</td>
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
                <th>Sakit</th>
                <th>Dinas Luar</th>
                <th>Tanpa Ket.</th>
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
                  <td style="text-align:center;color:#ea580c;font-weight:bold">${s.sakit}</td>
                  <td style="text-align:center;color:#4f46e5;font-weight:bold">${s.dinasLuar}</td>
                  <td style="text-align:center;color:#dc2626;font-weight:bold">${s.tanpaKeterangan}</td>
                  <td style="text-align:center;color:#6b7280">${s.alpha}</td>
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)', boxShadow: '0 8px 20px rgba(250, 112, 154, 0.3)' }}>
            <span className="text-2xl">📅</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Rekap Bulanan</h2>
            <p className="text-sm text-gray-500">Laporan absensi bulanan pegawai</p>
          </div>
        </div>
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
                <th className="px-4 py-3 text-center text-sm font-semibold text-green-700">Hadir</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-yellow-700">Izin</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-orange-700">Sakit</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-indigo-700">Dinas Luar</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-red-700">Tanpa Keterangan</th>
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
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">{summary.sakit}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">{summary.dinasLuar}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">{summary.tanpaKeterangan}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">{summary.alpha}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredPegawai.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
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
                  <th className="px-4 py-3 text-center text-sm font-semibold text-green-700">Datang</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-yellow-700">Izin Keluar</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-purple-700">Izin Masuk</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-blue-700">Pulang</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-orange-700">Sakit (S)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-indigo-700">Dinas Luar (DL)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-red-700">Tanpa Keterangan (TK)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows: { date: string; record: AbsensiRecord | undefined }[] = [];
                  const p = filteredPegawai[0];
                  if (!p) return <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Pegawai tidak ditemukan</td></tr>;
                  
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
                    return <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Belum ada data absensi</td></tr>;
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
                        <td className="px-4 py-3 text-sm text-center text-orange-600 font-semibold">{row.record?.sakit || '-'}</td>
                        <td className="px-4 py-3 text-sm text-center text-indigo-600 font-semibold">{row.record?.dinasLuar || '-'}</td>
                        <td className="px-4 py-3 text-sm text-center text-red-600 font-semibold">{row.record?.tanpaKeterangan || '-'}</td>
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)' }}>
            <span className="text-2xl">🔐</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Manajemen User</h2>
            <p className="text-sm text-gray-500">Kelola akun pengguna sistem</p>
          </div>
        </div>
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
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, #11998e, #38ef7d)', boxShadow: '0 8px 20px rgba(56, 239, 125, 0.3)' }}>
          <span className="text-2xl">⚙️</span>
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800">Pengaturan</h2>
          <p className="text-sm text-gray-500">Konfigurasi sistem absensi</p>
        </div>
      </div>

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
