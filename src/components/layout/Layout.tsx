import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';
import { 
  LayoutDashboard, 
  Users, 
  User,
  Settings, 
  LogOut, 
  MonitorPlay, 
  Tv, 
  Landmark, 
  FileText, 
  Newspaper, 
  Smartphone, 
  LayoutTemplate,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  List,
  HelpCircle,
  Home,
  BarChart3
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [sysSettings, setSysSettings] = useState<any>({
    nome_painel: 'GrandMídia',
    logo_url: '',
    show_apk_banner: true,
    apk_banner_title: 'Player Android',
    apk_banner_desc: 'Baixe o APK para rodar suas playlists em Telas ou Totens.',
    apk_banner_btn_text: 'Instalar Player',
    apk_file_url: ''
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Auto-logout after 5 minutes of inactivity
  useEffect(() => {
    if (!isAuthenticated) return;
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        logout();
      }, 5 * 60 * 1000); // 5 minutes
    };
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timeout);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [isAuthenticated, logout]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await apiFetch('/api/admin/settings');
        if (data) setSysSettings(data);
      } catch (err) {
        console.error('Erro ao carregar configurações no layout:', err);
      }
    };
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  // Poll notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadNotifications = async () => {
      try {
        const [notifs, unread] = await Promise.all([
          apiFetch('/api/notificacoes'),
          apiFetch('/api/notificacoes/unread-count')
        ]);
        setNotifications(Array.isArray(notifs) ? notifs : []);
        setUnreadCount(unread?.count || 0);
      } catch (err) {
        // silent
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notificacoes/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (err) {}
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const isAgency = user?.nivel !== 'admin';

  type SubmenuItem = { name: string; path: string };
  type MenuItem = { name: string; path: string; icon: React.ElementType; category: string; submenus?: SubmenuItem[] };

  const adminLinks: MenuItem[] = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, category: 'MENU' },
    { name: 'Usuários & Licenças', path: '/admin/users', icon: Users, category: 'MENU' },
    { name: 'Totens Cadastrados', path: '/admin/totems', icon: Tv, category: 'MENU' },
    { name: 'Player Android', path: '/admin/integration', icon: Smartphone, category: 'MENU' },
    { name: 'Gestão de Widgets', path: '/admin/widgets', icon: LayoutTemplate, category: 'MENU' },
    { name: 'Configurações', path: '/admin/settings', icon: Settings, category: 'GERAL' },
  ];

  const agencyLinks: MenuItem[] = [
    { name: 'Início', path: '/agency', icon: Home, category: 'MENU' },
    { name: 'Telas', path: '/agency/totems', icon: Tv, category: 'MENU' },
    { name: 'Arquivos', path: '/agency/arquivos', icon: ImageIcon, category: 'MENU' },
    { name: 'Lista de Reprodução', path: '/agency/listas', icon: List, category: 'MENU' },
    { name: 'Relatórios', path: '/agency/relatorios', icon: BarChart3, category: 'MENU' },
  ];

  const rawLinks = isAgency ? agencyLinks : adminLinks;

  // Group links by category
  const menuLinks = rawLinks.filter(link => link.category === 'MENU');
  const generalLinks = rawLinks.filter(link => link.category === 'GERAL');

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  // Sidebar content component to dry up code
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-zinc-800">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Logo */}
        <div className="p-6 flex items-center justify-between relative border-b border-[#e8edf2]">
          <div className="flex items-center gap-2">
            {sysSettings.logo_url ? (
              <img src={sysSettings.logo_url} alt="Logo" className="h-16 max-w-[180px] object-contain shrink-0" />
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-emerald-50 border-2 border-emerald-600 flex items-center justify-center shadow-sm">
                  <div className="w-4 h-4 rounded-full border border-emerald-600 flex items-center justify-center font-bold text-[8px] text-[#0b462c]">
                    V
                  </div>
                </div>
                <div>
                  <h1 className="text-base font-extrabold tracking-tight text-[#0b462c] uppercase truncate max-w-[120px]">
                    {sysSettings.nome_painel || 'GRANDMÍDIA'}
                  </h1>
                  <p className="text-[9px] text-[#8b9aa5] uppercase tracking-widest font-bold">
                    {isAgency ? 'Agência' : 'Administrador'}
                  </p>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden absolute right-6 top-1/2 -translate-y-1/2 p-1 transition-colors text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 space-y-6 overflow-y-auto">
          {/* Category: MENU */}
          <div>
            <p className="px-7 text-[10px] font-bold text-[#8b9aa5] uppercase tracking-widest mb-3">Menu</p>
            <nav className="space-y-1">
              {menuLinks.map((link) => {
                const Icon = link.icon;
                const hasSubmenu = !!link.submenus;
                const isExpanded = expandedMenus[link.name] || (hasSubmenu && location.pathname.startsWith(link.path));
                const isActive = !hasSubmenu && (location.pathname === link.path || (link.path !== '/agency' && link.path !== '/admin' && location.pathname.startsWith(link.path + '/')));
                
                return (
                  <div key={link.path} className="px-4">
                    {hasSubmenu ? (
                      <button
                        onClick={() => toggleMenu(link.name)}
                        className={cn(
                          "w-full flex items-center justify-between py-2.5 transition-all cursor-pointer group relative px-3 rounded-xl",
                          isExpanded ? "bg-[#e8f5ed] text-[#0b462c] font-semibold" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("w-5 h-5", isExpanded ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600")} />
                          <span className="text-sm">{link.name}</span>
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                      </button>
                    ) : (
                      <Link
                        to={link.path}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 py-2.5 transition-all cursor-pointer group relative px-3 rounded-xl",
                          isActive ? "bg-[#e8f5ed] text-[#0b462c] font-semibold" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-600 rounded-r" />
                        )}
                        <Icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600")} />
                        <span className="text-sm">{link.name}</span>
                      </Link>
                    )}
                    
                    {hasSubmenu && isExpanded && (
                      <div className="mt-1 space-y-1 border-l-2 ml-6 pl-3 border-[#e8edf2]">
                        {link.submenus!.map(sub => {
                          const isSubActive = location.pathname === sub.path;
                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              onClick={() => setIsMobileSidebarOpen(false)}
                              className={cn(
                                "block px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                                isSubActive ? "bg-emerald-50 text-emerald-700 font-bold" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                              )}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Category: GERAL */}
          {generalLinks.length > 0 && (
            <div className="px-4">
              <p className="px-7 text-[10px] font-bold text-[#8b9aa5] uppercase tracking-widest mb-3">Geral</p>
              <nav className="space-y-1">
                {generalLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group relative",
                        isActive 
                          ? "bg-[#e8f5ed] text-[#0b462c] font-semibold" 
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-600 rounded-r" />
                      )}
                      <Icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600")} />
                      <span className="text-sm">{link.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Banner (Admin & Agency) */}
      {sysSettings.show_apk_banner && (
        <div className="px-4 py-2 shrink-0 border-t border-[#e8edf2] bg-zinc-50/50">
          <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-[#0b462c] to-[#082a1b] text-white text-xs relative overflow-hidden shadow-sm">
            <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-emerald-500/20 blur-lg"></div>
            <div className="relative z-10 space-y-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                📲
              </div>
              <p className="font-bold text-white text-xs leading-tight">{sysSettings.apk_banner_title || 'Player Android'}</p>
              <p className="text-[10px] text-emerald-200/80 leading-normal">
                {sysSettings.apk_banner_desc || 'Baixe o APK para rodar suas playlists em Telas ou Totens.'}
              </p>
              {sysSettings.apk_file_url ? (
                <a 
                  href={sysSettings.apk_file_url} 
                  download="totemplayer.apk"
                  className="block text-center bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[10px] uppercase py-2 rounded-xl transition-all shadow-sm"
                >
                  {sysSettings.apk_banner_btn_text || 'Instalar Player'}
                </a>
              ) : (
                <Link 
                  to="/admin/integration"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="block text-center bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[10px] uppercase py-2 rounded-xl transition-all shadow-sm"
                >
                  {sysSettings.apk_banner_btn_text || 'Instalar Player'}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f4f6f8] text-zinc-800 font-sans overflow-hidden">
      {/* Desktop Sidebar (visible only on lg screens and larger) */}
      <aside className="hidden lg:flex w-66 flex-col justify-between shrink-0 shadow-lg relative z-20 border-r border-[#e8edf2]">
        <SidebarContent />
      </aside>

      {/* Mobile/Tablet Sidebar Drawer (visible on mobile, animated slide) */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-66 z-50 flex flex-col justify-between shadow-xl transition-transform duration-300 lg:hidden",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header (Full header for both Admin and Agency) */}
        <header className="h-20 bg-white border-b border-[#e8edf2] flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-zinc-50 border border-zinc-200 text-zinc-600 transition-colors"
              title="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-50 border border-[#e8edf2] flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all relative"
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center border border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#e8edf2] rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8edf2]">
                      <span className="text-xs font-bold text-zinc-800 uppercase">Notificações</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700">
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-zinc-400 text-xs">
                          Nenhuma notificação
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((notif) => (
                          <div key={notif.id} className={`px-4 py-3 border-b border-[#e8edf2] last:border-0 ${!notif.lida ? 'bg-emerald-50/50' : ''}`}>
                            <div className="flex items-start gap-2">
                              <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.tipo === 'success' ? 'bg-emerald-500' : notif.tipo === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-zinc-800">{notif.titulo}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{notif.mensagem}</p>
                                <p className="text-[9px] text-zinc-400 mt-1">{notif.totem_nome && `${notif.totem_nome} · `}{new Date(notif.created_at).toLocaleString('pt-BR')}</p>
                              </div>
                              {!notif.lida && (
                                <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-1"></span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-zinc-200" />

            <div className="flex items-center gap-1.5 sm:gap-3 relative">
              <button 
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                className="hidden md:flex items-center gap-2 hover:bg-zinc-50 rounded-xl px-2 py-1.5 transition-colors cursor-pointer"
              >
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-800 leading-none">Olá, {user?.nome}</p>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-none truncate max-w-[120px]">{user?.email}</p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-emerald-500 to-[#0b462c] flex items-center justify-center text-xs font-extrabold text-white shadow-sm border border-emerald-100 relative shrink-0">
                  {user?.nome.substring(0, 2).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                </div>
              </button>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-emerald-500 to-[#0b462c] flex items-center justify-center text-xs font-extrabold text-white shadow-sm border border-emerald-100 relative shrink-0"
              >
                {user?.nome.substring(0, 2).toUpperCase()}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-1 sm:p-1.5 text-zinc-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50 shrink-0"
                title="Sair"
              >
                <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="fixed top-20 right-8 w-64 bg-white border border-[#e8edf2] rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-[#e8edf2] bg-gradient-to-r from-emerald-50 to-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-[#0b462c] flex items-center justify-center text-sm font-extrabold text-white shadow-sm">
                        {user?.nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-800">{user?.nome}</p>
                        <p className="text-[10px] text-zinc-400 truncate max-w-[140px]">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/agency/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-zinc-400" />
                      Meu Perfil
                    </Link>
                    <Link
                      to={isAgency ? "/agency" : "/admin"}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                      Dashboard
                    </Link>
                    <div className="border-t border-[#e8edf2] my-1"></div>
                    <button
                      onClick={() => { setShowProfileMenu(false); setShowLogoutConfirm(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da conta
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Body Container */}
        <div className="flex-1 overflow-y-auto relative p-4 sm:p-8">
          <Outlet />
        </div>
      </main>

      {/* Modal Confirmação de Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[20px] border border-[#e8edf2] max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-sm font-extrabold text-zinc-800">Sair da conta?</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              Tem certeza que deseja sair do painel? Você precisará fazer login novamente para acessar.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={logout}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}