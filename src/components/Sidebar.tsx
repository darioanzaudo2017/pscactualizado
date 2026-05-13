import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/dashboard', label: 'Inicio', icon: 'dashboard' },
    { to: '/psc', label: 'Listado de Personas', icon: 'group' },
    { to: '/psc/nuevo', label: 'Registro Nuevo', icon: 'person_add' },
    { to: '/configuracion', label: 'Configuración', icon: 'settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-40 bg-slate-100 dark:bg-slate-950 flex flex-col border-r border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none font-body text-sm font-medium transition-all">
      <div className="px-6 py-8">
        <h2 className="text-blue-900 dark:text-blue-200 font-black uppercase tracking-widest text-xs mb-8">Gestión Social</h2>
        
        <div className="flex items-center gap-3 mb-10 p-2 bg-slate-200 dark:bg-slate-800 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold">
            {profile?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-blue-900 dark:text-blue-400 font-bold truncate">
              {profile ? `${profile.nombre} ${profile.apellido}` : 'Usuario'}
            </span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
              {profile?.rol || 'Operador'}
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-lg ${
                isActive(link.to)
                  ? 'bg-blue-900 dark:bg-blue-700 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-200 hover:bg-slate-200 dark:hover:bg-slate-800 hover:translate-x-1'
              }`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-8 px-2">
          <button className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold shadow-md active:scale-95 duration-150 transition-all hover:brightness-110">
            <span className="material-symbols-outlined">add</span>
            Nuevo Reporte
          </button>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 p-4">
        <Link to="/ayuda" className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-blue-900 px-4 py-3 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all rounded-lg">
          <span className="material-symbols-outlined">help</span>
          <span>Ayuda</span>
        </Link>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 text-error px-4 py-3 hover:bg-error-container/20 transition-all rounded-lg text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
