'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './Sidebar.css';

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function Sidebar({ activeTab = 'personal', setActiveTab }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Cargar estado colapsado desde localStorage de forma segura
  useEffect(() => {
    setIsMounted(true);
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', String(newState));
  };

  const handleLogout = () => {
    router.push('/signin');
  };

  const handleTabClick = (tab: string, e: React.MouseEvent) => {
    if (setActiveTab) {
      e.preventDefault();
      setActiveTab(tab);
    }
  };

  // Comprobar rutas activas
  const isProfileActive = pathname === '/profile';
  const isEditorActive = pathname === '/editor';
  const isJobsActive = pathname === '/jobs';

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="sidebar-top-wrapper">
        <div className="sidebar-logo-container">
          {!isCollapsed && (
            <Link href="/" className="sidebar-logo-link">
              INNOVA<span>CV</span>
            </Link>
          )}
          <button 
            className="btn-toggle-sidebar" 
            onClick={handleToggleCollapse}
            title={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            {/* Icono de paneles/columnas */}
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 16H5V5h7v14zm7 0h-5V5h5v14z" />
            </svg>
          </button>
        </div>

        <ul className="sidebar-menu">
          {/* Perfil */}
          <li className="menu-item">
            <Link href="/profile" className={`menu-link ${isProfileActive ? 'active' : ''}`}>
              <div className="menu-icon">
                <svg width="40" height="43" viewBox="0 0 40 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.7965 34.2599V25.4731H23.4631V34.2599C23.4631 35.2265 24.2131 36.0173 25.1298 36.0173H30.1298C31.0465 36.0173 31.7965 35.2265 31.7965 34.2599V21.9583H34.6298C35.3965 21.9583 35.7631 20.9566 35.1798 20.4294L21.2465 7.19642C20.6131 6.59891 19.6465 6.59891 19.0131 7.19642L5.0798 20.4294C4.51314 20.9566 4.86314 21.9583 5.6298 21.9583H8.46314V34.2599C8.46314 35.2265 9.21313 36.0173 10.1298 36.0173H15.1298C16.0465 36.0173 16.7965 35.2265 16.7965 34.2599Z" />
                </svg>
              </div>
              {!isCollapsed && <span>Perfil</span>}
            </Link>

            {/* Submenú de Perfil (Solo visible cuando perfil está activo y no está colapsado) */}
            {!isCollapsed && isProfileActive && (
              <ul className="sidebar-submenu">
                <li className="submenu-item">
                  <span 
                    onClick={(e) => handleTabClick('personal', e)} 
                    className={`submenu-link ${activeTab === 'personal' ? 'active' : ''}`}
                  >
                    Datos personales
                  </span>
                </li>
                <li className="submenu-item">
                  <span 
                    onClick={(e) => handleTabClick('education', e)} 
                    className={`submenu-link ${activeTab === 'education' ? 'active' : ''}`}
                  >
                    Educación
                  </span>
                </li>
                <li className="submenu-item">
                  <span 
                    onClick={(e) => handleTabClick('experience', e)} 
                    className={`submenu-link ${activeTab === 'experience' ? 'active' : ''}`}
                  >
                    Experiencia profesional
                  </span>
                </li>
                <li className="submenu-item">
                  <span 
                    onClick={(e) => handleTabClick('skills', e)} 
                    className={`submenu-link ${activeTab === 'skills' ? 'active' : ''}`}
                  >
                    Habilidades
                  </span>
                </li>
              </ul>
            )}
          </li>

          {/* Modificar CV */}
          <li className="menu-item">
            <Link href="/editor" className={`menu-link ${isEditorActive ? 'active' : ''}`}>
              <div className="menu-icon">
                <svg width="40" height="43" viewBox="0 0 40 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M32.1667 13.2681C32.0278 13.2681 31.9097 13.2388 31.8125 13.1802C31.7153 13.1216 31.6389 13.0191 31.5833 12.8727L30.375 9.88514L27.3333 8.47924C27.1944 8.42066 27.0972 8.34012 27.0417 8.2376C26.9861 8.13509 26.9583 8.01061 26.9583 7.86416C26.9583 7.71771 26.9861 7.59323 27.0417 7.49072C27.0972 7.38821 27.1944 7.30766 27.3333 7.24908L30.375 5.88712L31.5833 3.03139C31.6389 2.88495 31.7153 2.78243 31.8125 2.72385C31.9097 2.66528 32.0278 2.63599 32.1667 2.63599C32.3056 2.63599 32.4236 2.66528 32.5208 2.72385C32.6181 2.78243 32.6944 2.88495 32.75 3.03139L33.9583 5.88712L37 7.24908C37.1389 7.30766 37.2361 7.38821 37.2917 7.49072C37.3472 7.59323 37.375 7.71771 37.375 7.86416C37.375 8.01061 37.3472 8.13509 37.2917 8.2376C37.2361 8.34012 37.1389 8.42066 37 8.47924L33.9583 9.88514L32.75 12.8727C32.6944 13.0191 32.6181 13.1216 32.5208 13.1802C32.4236 13.2388 32.3056 13.2681 32.1667 13.2681ZM32.1667 39.4529C32.0556 39.4529 31.9444 39.4236 31.8333 39.365C31.7222 39.3064 31.6389 39.2039 31.5833 39.0575L30.375 36.2017L27.375 34.8398C27.2361 34.7812 27.1389 34.7007 27.0833 34.5981C27.0278 34.4956 27 34.3712 27 34.2247C27 34.0783 27.0278 33.9538 27.0833 33.8513C27.1389 33.7488 27.2361 33.6682 27.375 33.6096L30.375 32.2477L31.5833 29.2162C31.6389 29.0698 31.7153 28.9672 31.8125 28.9087C31.9097 28.8501 32.0278 28.8208 32.1667 28.8208C32.3056 28.8208 32.4236 28.8501 32.5208 28.9087C32.6181 28.9672 32.6944 29.0698 32.75 29.2162L33.9583 32.2477L36.9583 33.6096C37.0972 33.6682 37.1944 33.7488 37.25 33.8513C37.3056 33.9538 37.3333 34.0783 37.3333 34.2247C37.3333 34.3712 37.3056 34.4956 37.25 34.5981C37.1944 34.7007 37.0972 34.7812 36.9583 34.8398L33.9583 36.2017L32.75 39.0575C32.6944 39.2039 32.6111 39.3064 32.5 39.365C32.3889 39.4236 32.2778 39.4529 32.1667 39.4529ZM13.875 31.8523C13.6528 31.8523 13.4375 31.7864 13.2292 31.6546C13.0208 31.5228 12.8611 31.3397 12.75 31.1054L10.0417 24.9985L4.20833 22.2307C3.98611 22.1135 3.8125 21.9451 3.6875 21.7254C3.5625 21.5057 3.5 21.2788 3.5 21.0444C3.5 20.8101 3.5625 20.5831 3.6875 20.3635C3.8125 20.1438 3.98611 19.9754 4.20833 19.8582L10.0417 17.0904L12.75 11.0274C12.8611 10.7638 13.0208 10.5661 13.2292 10.4343C13.4375 10.3025 13.6528 10.2366 13.875 10.2366C14.0972 10.2366 14.3125 10.3025 14.5208 10.4343C14.7292 10.5661 14.8889 10.7492 15 10.9835L17.75 17.0904L23.5417 19.8582C23.7917 19.9754 23.9792 20.1438 24.1042 20.3635C24.2292 20.5831 24.2917 20.8101 24.2917 21.0444C24.2917 21.2788 24.2292 21.5057 24.1042 21.7254C23.9792 21.9451 23.7917 22.1135 23.5417 22.2307L17.75 24.9985L15 31.1054C14.8889 31.369 14.7292 31.5594 14.5208 31.6765C14.3125 31.7937 14.0972 31.8523 13.875 31.8523Z" />
                </svg>
              </div>
              {!isCollapsed && <span>Modifica tu CV</span>}
            </Link>
          </li>

          {/* Lista de Empleos */}
          <li className="menu-item">
            <Link href="/jobs" className={`menu-link ${isJobsActive ? 'active' : ''}`}>
              <div className="menu-icon">
                <svg width="29" height="33" viewBox="0 0 29 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5472 27.8031C14.9241 28.304 14.0413 28.304 13.4182 27.8031L2.77365 19.251C2.15055 18.7501 1.28514 18.7501 0.662041 19.251C-0.22068 19.9667 -0.22068 21.3443 0.662041 22.06L12.3624 31.4708C13.6086 32.4727 15.3568 32.4727 16.6203 31.4708L28.3207 22.06C29.2034 21.3443 29.2034 19.9667 28.3207 19.251L28.3033 19.2331C27.6802 18.7322 26.8148 18.7322 26.1917 19.2331L15.5472 27.8031ZM16.6376 22.3999L28.338 12.9891C29.2207 12.2734 29.2207 10.8779 28.338 10.1623L16.6376 0.751434C15.3914 -0.250478 13.6432 -0.250478 12.3797 0.751434L0.67935 10.1801C-0.203372 10.8958 -0.203372 12.2913 0.67935 13.007L12.3797 22.4178C13.6259 23.4197 15.3914 23.4197 16.6376 22.3999Z" />
                </svg>
              </div>
              {!isCollapsed && <span>Lista de Empleos</span>}
            </Link>

            {/* Submenú de Empleos (Solo visible cuando empleos está activo y no está colapsado) */}
            {!isCollapsed && isJobsActive && (
              <ul className="sidebar-submenu">
                <li className="submenu-item">
                  <span 
                    onClick={(e) => handleTabClick('positions', e)} 
                    className={`submenu-link ${activeTab === 'positions' ? 'active' : ''}`}
                  >
                    Posiciones
                  </span>
                </li>
                <li className="submenu-item">
                  <span 
                    onClick={(e) => handleTabClick('saved', e)} 
                    className={`submenu-link ${activeTab === 'saved' ? 'active' : ''}`}
                  >
                    Guardados
                  </span>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </div>

      <div className="sidebar-bottom-wrapper">
        <button className="btn-logout" onClick={handleLogout}>
          <div className="menu-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
