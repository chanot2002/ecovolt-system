import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { logout, currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString('en-PH'));
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const location = useLocation();

  const navItems = [
    { path: '/', icon: 'fas fa-chart-pie', label: 'Dashboard' },
    { path: '/agrowaste', icon: 'fas fa-seedling', label: 'Agrowaste' },
    { path: '/efo-analysis', icon: 'fas fa-microscope', label: 'EFO Analysis' },
    { path: '/reports', icon: 'fas fa-file-invoice', label: 'Reports' },
    { path: '/settings', icon: 'fas fa-user-shield', label: 'Settings' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('en-PH', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleExport = () => {
    const data = [{ id: 1, date: new Date().toLocaleDateString(), system: 'EcoVolt', status: 'Optimal' }];
    const csvContent = "data:text/csv;charset=utf-8," + ["ID,Date,System,Status", ...data.map(e => `${e.id},${e.date},${e.system},${e.status}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EcoVolt_Report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPageTitle = () => {
    const current = navItems.find(item => item.path === location.pathname);
    return current ? current.label : 'System';
  };

  return (
    <div className="min-vh-100 d-flex main-layout-container">
      
      {/* --- SIDEBAR --- */}
      <aside
        className={`sidebar-component border-end shadow-sm d-flex flex-column transition-all z-index-1020 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } position-fixed h-100 d-lg-flex translate-x-lg-0`}
        style={{ width: '280px', transition: '0.3s ease' }}
      >
        <div className="p-4 text-center">
          <img 
            src="/logo.png" 
            alt="EcoVolt Logo" 
            style={{ width: '120px', height: 'auto', marginBottom: '10px' }}
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <div className="fw-bold sidebar-text-primary letter-spacing-1">ECOVOLT MONITOR</div>
          <div className="badge bg-soft-success text-success mt-1" style={{ fontSize: '10px' }}>SYSTEM ONLINE</div>
        </div>

        <nav className="flex-grow-1 px-3 py-2">
          <small className="text-muted fw-bold mb-2 d-block px-3 opacity-50">MENU</small>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center px-3 py-3 mb-2 rounded-4 transition-all ${
                  isActive 
                  ? 'bg-primary text-white shadow-primary fw-bold' 
                  : 'text-secondary hover-bg-light custom-nav-item'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`${item.icon} me-3 fs-5`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Tinanggal na ang Hardware Health section dito */}

        <div className="p-3 border-top mx-2 mb-2">
          <button onClick={logout} className="btn btn-logout-custom w-100 rounded-4 fw-bold py-2 border-0">
            <i className="fas fa-sign-out-alt me-2"></i> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-grow-1 d-flex flex-column w-100" style={{ marginLeft: 'var(--sidebar-width)' }}>
        
        <header className="navbar navbar-expand header-component px-4 border-bottom sticky-top" style={{ height: '80px' }}>
          <div className="container-fluid p-0">
            <div className="d-flex align-items-center gap-3">
              <button className="btn border-0 p-0 d-lg-none" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'} fs-4 header-text-color`}></i>
              </button>
              <div>
                <h4 className="mb-0 fw-bold header-text-color">{getPageTitle()}</h4>
                <small className="text-muted">{currentTime}</small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="btn btn-theme-toggle rounded-circle p-2 shadow-none d-flex align-items-center justify-content-center"
              >
                <i className={`fas ${isDarkMode ? 'fa-sun text-warning' : 'fa-moon text-secondary'}`}></i>
              </button>
              
              <button onClick={handleExport} className="btn btn-primary d-none d-md-block px-4 rounded-pill fw-bold shadow-primary border-0">
                <i className="fas fa-download me-2"></i> Export Data
              </button>

              <div className="vr mx-2"></div>
              <div className="bg-primary text-white rounded-circle shadow-sm d-flex align-items-center justify-content-center fw-bold" style={{ width: '45px', height: '45px' }}>
                {currentUser?.displayName?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 flex-grow-1">
            <div className="fade-in">
               <Outlet />
            </div>
        </main>

        <footer className="px-4 py-3 footer-component border-top text-center text-muted small">
          <b>EcoVolt v2.0</b> • {new Date().getFullYear()}
        </footer>
      </div>

      <style>{`
        :root { 
          --sidebar-width: 280px; 
          --bg-main: #F4F7FE;
          --bg-sidebar: #FFFFFF;
          --bg-header: #FFFFFF;
          --text-main: #1B254B;
          --border-color: #E0E5F2;
          --card-bg-internal: #F4F7FE;
          --logout-btn: #f8f9fa;
        }

        [data-theme='dark'] {
          --bg-main: #0B1437;
          --bg-sidebar: #111C44;
          --bg-header: #111C44;
          --text-main: #FFFFFF;
          --border-color: #1B254B;
          --card-bg-internal: #1B254B;
          --logout-btn: #1B254B;
        }

        .main-layout-container { background-color: var(--bg-main) !important; color: var(--text-main) !important; }
        .sidebar-component { background-color: var(--bg-sidebar) !important; border-color: var(--border-color) !important; }
        .header-component { background-color: var(--bg-header) !important; border-color: var(--border-color) !important; }
        .footer-component { background-color: var(--bg-sidebar) !important; border-color: var(--border-color) !important; }
        .header-text-color, .sidebar-text-primary { color: var(--text-main) !important; }
        .bg-card-internal { background-color: var(--card-bg-internal) !important; }
        .btn-logout-custom { background-color: var(--logout-btn) !important; color: #dc3545 !important; }
        .btn-theme-toggle { background-color: var(--card-bg-internal) !important; width: 40px; height: 40px; }
        .custom-nav-item { color: var(--text-main) !important; opacity: 0.8; }
        .custom-nav-item:hover { background-color: var(--bg-main) !important; opacity: 1; }

        .bg-primary { background-color: #4318FF !important; }
        .shadow-primary { box-shadow: 0px 10px 20px rgba(67, 24, 255, 0.2); }
        .fade-in { animation: fadeIn 0.4s ease-in; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        @media (max-width: 991px) {
          :root { --sidebar-width: 0px; }
          .-translate-x-full { transform: translateX(-100%); }
          .translate-x-0 { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default Layout;