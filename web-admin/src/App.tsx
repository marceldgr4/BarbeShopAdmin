import { useState, useEffect, type FormEvent } from 'react';
import {
  BarChart3,
  Store,
  Users,
  Calendar,
  Settings,
  LogOut,
  Scissors,
  Menu,
  X,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { authApi, authStorage, dashboardApi } from './api/api';
import { BarbershopsManager } from './components/BarbershopsManager';
import { BarbersManager } from './components/BarbersManager';
import { ServicesManager } from './components/ServicesManager';
import { AppointmentsManager } from './components/AppointmentsManager';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(email, password);
      const payload = response.data?.data || response.data;
      const token = payload?.token || payload?.accessToken;

      if (!token) {
        throw new Error('La respuesta del servidor no incluye token de sesión.');
      }

      authStorage.setToken(token);
      authStorage.setUser(payload?.user || { email, role: 'admin' });
      onLoginSuccess();
    } catch (err: any) {
      console.error('Error during admin login:', err);
      const message = err.response?.data?.message || 'No se pudo iniciar sesión. Verifica tus credenciales de administrador.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-slate-950/60">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary-600 p-2 rounded-xl">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Acceso Administrador</h1>
            <p className="text-sm text-slate-400">Inicia sesión para gestionar la plataforma.</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="admin@barbershop.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(authStorage.getToken()));
  const [adminUser, setAdminUser] = useState<any>(authStorage.getUser());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardApi.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      if (err.response?.status === 401) {
        handleLogout();
        return;
      }
      setError('No se pudieron cargar los datos del dashboard. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab, isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setAdminUser(authStorage.getUser());
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    authStorage.clearSession();
    setIsAuthenticated(false);
    setAdminUser(null);
    setStats(null);
    setError(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 text-white">Bienvenido de nuevo</h2>
              <p className="text-slate-400">Aquí tienes un resumen de lo que está pasando hoy en tus barberías.</p>
            </div>

            {error && (
              <div className="mb-8 bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { label: 'Total Barberos', value: stats?.active_barbers || '0', change: 'Live', color: 'text-emerald-400' },
                { label: 'Servicios Activos', value: stats?.active_services || '0', change: 'Live', color: 'text-primary-400' },
                { label: 'Tasa Completado', value: stats?.completion_rate !== undefined ? `${stats.completion_rate}%` : '0%', change: 'Mes', color: 'text-slate-300' },
                { label: 'Total Citas', value: stats?.total_appointments || '0', change: 'Global', color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-primary-500/50 transition-colors cursor-default group relative overflow-hidden">
                  {loading && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-600/20 overflow-hidden">
                      <div className="h-full bg-primary-600 animate-[loading_1s_ease-in-out_infinite]" style={{ width: '30%' }}></div>
                    </div>
                  )}
                  <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full bg-slate-800 ${stat.color}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <Scissors size={20} className="text-emerald-400" />
                  Servicios Populares
                </h3>
                <div className="space-y-4">
                  {stats?.top_services?.length > 0 ? stats.top_services.map((svc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <span className="font-medium text-slate-200">{svc.service_name}</span>
                      <span className="text-emerald-400 font-bold">{svc.count} usos</span>
                    </div>
                  )) : (
                    <p className="text-slate-500 text-sm italic">No hay datos disponibles este mes</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <Users size={20} className="text-purple-400" />
                  Mejores Barberos
                </h3>
                <div className="space-y-4">
                  {stats?.top_barbers?.length > 0 ? stats.top_barbers.map((barber: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <span className="font-medium text-slate-200">{barber.full_name}</span>
                      <div className="text-right">
                        <p className="text-primary-400 font-bold">{barber.appointment_count} citas</p>
                        <p className="text-xs text-slate-500">⭐ {barber.avg_rating || 'N/A'}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-slate-500 text-sm italic">No hay datos disponibles este mes</p>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      case 'barbershops':
        return <BarbershopsManager />;
      case 'barbers':
        return <BarbersManager />;
      case 'appointments':
        return <AppointmentsManager />;
      case 'services':
        return <ServicesManager />;
      default:
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
            <Settings className="text-slate-500 mb-4" size={48} />
            <h3 className="text-xl font-bold mb-2 text-white">Configuración</h3>
            <p className="text-slate-500">Esta sección estará disponible próximamente.</p>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 w-full">
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-xl shadow-lg shadow-primary-900/20">
            <Scissors className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            BarberAdmin
          </h1>
        </div>

        <nav className="px-4 space-y-2 flex-1">
          <SidebarItem icon={BarChart3} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Store} label="Barberías" active={activeTab === 'barbershops'} onClick={() => setActiveTab('barbershops')} />
          <SidebarItem icon={Users} label="Barberos" active={activeTab === 'barbers'} onClick={() => setActiveTab('barbers')} />
          <SidebarItem icon={Scissors} label="Servicios" active={activeTab === 'services'} onClick={() => setActiveTab('services')} />
          <SidebarItem icon={Calendar} label="Citas" active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <SidebarItem icon={Settings} label="Configuración" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <SidebarItem icon={LogOut} label="Cerrar Sesión" onClick={handleLogout} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
          <button
            className="lg:hidden text-slate-400"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex items-center gap-4">
            {activeTab === 'dashboard' && (
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Sincronizar datos"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{adminUser?.full_name || adminUser?.name || adminUser?.email || 'Admin User'}</p>
              <p className="text-xs text-slate-500">{adminUser?.role || 'Super Admin'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary-400 font-bold">
              {(adminUser?.full_name || adminUser?.name || 'AD').toString().slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>
      </main>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}

export default App;
