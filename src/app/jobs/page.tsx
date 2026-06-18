'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { GooeyLoader } from '@/components/GooeyLoader';
import './jobs.css';

interface Job {
  id: string;
  title: string;
  company: string;
  emblem: string;
  emblemBg: string;
  timePosted: string;
  type: string;
  salary: string;
  location: string;
  compatibility: number;
  saved: boolean;
  description: string;
  applyUrl?: string;
}

const INITIAL_JOBS: Job[] = [
  {
    id: 'job1',
    title: 'Software Engineering Lead, Senior ...',
    company: 'Pwc Canada',
    emblem: 'PC',
    emblemBg: 'linear-gradient(135deg, #FF5A5F 0%, #FF7E82 100%)',
    timePosted: 'Hace 16 horas',
    type: 'Full-time',
    salary: '$ - No Especificado',
    location: 'Toronto, ON, Canada (+1 más)',
    compatibility: 85,
    saved: false,
    description: 'Como Software Engineering Lead en PwC Canadá, liderarás un equipo de ingenieros talentosos construyendo soluciones de software innovadoras. Desarrollarás arquitecturas escalables en la nube, coordinarás metodologías ágiles y colaborarás estrechamente con líderes del negocio para transformar requerimientos técnicos en productos excepcionales. Buscamos experiencia sólida en liderazgo técnico, nube (AWS/Azure) y stacks modernos de desarrollo.'
  },
  {
    id: 'job2',
    title: 'Software Engineering Lead - Senior S ...',
    company: 'Capgemini',
    emblem: 'CA',
    emblemBg: 'linear-gradient(135deg, #0070F3 0%, #3291FF 100%)',
    timePosted: 'Hace 22 horas',
    type: 'Full-time',
    salary: '$ - No Especificado',
    location: 'Mississauga, ON, Canada',
    compatibility: 85,
    saved: false,
    description: 'Capgemini busca un Senior Software Engineering Lead para guiar la transformación tecnológica de nuestros clientes más importantes. Diseñarás sistemas distribuidos complejos, optimizarás la entrega de software mediante prácticas robustas de DevOps e integraciones CI/CD, y mentorizarás a desarrolladores junior y middle en tecnologías modernas. Requisitos: 6+ años de experiencia y excelentes habilidades de comunicación.'
  },
  {
    id: 'job3',
    title: 'Senior UI/Full Stack Software Engi ...',
    company: 'Motorola Solutions, Inc.',
    emblem: 'MI',
    emblemBg: 'linear-gradient(135deg, #6147FF 0%, #8A70FF 100%)',
    timePosted: 'Hace 1 día',
    type: 'Full-time',
    salary: '130K - 170K por año',
    location: 'Vancouver, BC, Canada',
    compatibility: 84,
    saved: false,
    description: 'Únete a Motorola Solutions como Senior UI/Full Stack Engineer. Crearás interfaces seguras, intuitivas y de alto rendimiento para centros de comando de misiones críticas. Utilizarás React, TypeScript y microservicios en Node.js, colaborando en un entorno global de alta ingeniería enfocado en salvar vidas y mejorar la seguridad pública. Se valorará conocimiento en WebSockets y visualización de mapas en tiempo real.'
  },
  {
    id: 'job4',
    title: 'Software/Data Engineer',
    company: 'TEKsystems',
    emblem: 'TE',
    emblemBg: 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)',
    timePosted: 'Hace 2 días',
    type: 'Full-time',
    salary: 'CA$80 - CA$90 por hora',
    location: 'Montreal, Quebec, Canada',
    compatibility: 84,
    saved: false,
    description: 'TEKsystems está contratando un Software/Data Engineer senior para uno de nuestros principales socios del sector financiero. Construirás pipelines de datos robustos y escalables, optimizarás almacenes de datos analíticos en la nube (Snowflake/BigQuery) y diseñarás APIs de alta velocidad en Python y Java. Esencial poseer experiencia con SQL complejo y herramientas de orquestación de datos como Airflow.'
  }
];

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState('positions'); // 'positions' | 'saved'
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [viewState, setViewState] = useState<'hero' | 'compact'>('hero');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && (window as any).__hydrated) {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const mainRef = useRef<HTMLElement>(null);
  const lastWheelTime = useRef<number>(0);
  const topScrollIntent = useRef<number>(0);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    setViewState('compact');
    try {
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`);
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Si el panel de detalles está abierto, no interactuamos con el fondo
    if (selectedJob) return;

    const now = Date.now();
    const timeSinceLastWheel = now - lastWheelTime.current;
    lastWheelTime.current = now;

    // Reiniciar la intención si el usuario hace scroll hacia abajo en cualquier momento
    if (e.deltaY > 0) {
      topScrollIntent.current = 0;
    }

    // Si estamos en hero y hacemos scroll hacia abajo, mostramos compact (solo si ya se hizo una búsqueda real)
    if (viewState === 'hero' && e.deltaY > 0) {
      if (hasSearched) {
        setViewState('compact');
      }
    }
    // Si estamos en compact y hacemos scroll hacia arriba estando en el tope
    else if (viewState === 'compact' && e.deltaY < 0) {
      if (mainRef.current && mainRef.current.scrollTop <= 10) {
        // Detectar si es un gesto de scroll nuevo o separado (más de 100ms de pausa)
        if (timeSinceLastWheel > 50) {
          topScrollIntent.current += 1;

          if (topScrollIntent.current >= 2) {
            setViewState('hero');
            topScrollIntent.current = 0; // Reiniciar después de animar
          }
        } else {
          // Si es un scroll continuo rápido (inercia), asegurarnos de registrar el primer golpe
          if (topScrollIntent.current === 0) {
            topScrollIntent.current = 1;
          }
        }
      } else {
        // Si no hemos llegado al tope real, reiniciamos la intención
        topScrollIntent.current = 0;
      }
    }
  };


  // Cargar estado de modo oscuro desde localStorage de forma segura
  useLayoutEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
    (window as any).__hydrated = true;
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('theme-loading');
    });
  }, []);

  // Obtener ubicación automáticamente por IP
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.city && data.country_name) {
          setLocationQuery(`${data.city}, ${data.country_name}`);
        }
      } catch (error) {
        console.error('Error auto-detectando ubicación:', error);
      }
    };
    fetchLocation();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  // Referencia del cajón para clics externos y Escape
  const drawerRef = useRef<HTMLDivElement>(null);

  // Cerrar el Drawer al presionar Escape o hacer clic fuera
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedJob(null);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node) && !(e.target as HTMLElement).closest('.btn-view-desc')) {
        setSelectedJob(null);
      }
    }

    if (selectedJob) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedJob]);

  // Manejador del movimiento del ratón para que el orbe interactivo siga al cursor
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    document.documentElement.style.setProperty('--mouse-x', `${clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${clientY}px`);
  };

  // Manejar el toggle de guardar empleo
  const handleToggleSave = (id: string) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === id ? { ...job, saved: !job.saved } : job
      )
    );
  };

  // Filtrado de búsquedas
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'saved') {
      return matchesSearch && job.saved;
    }
    return matchesSearch;
  });

  return (
    <div className={`jobs-layout-container ${isDarkMode ? 'dark-theme' : ''}`} onMouseMove={handleMouseMove}>
      {/* 1. BARRA LATERAL (Sidebar) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="jobs-main-column" ref={mainRef} onWheel={handleWheel} style={{ overflowY: viewState === 'hero' ? 'hidden' : 'auto' }}>
        {/* Gradientes decorativos de fondo al estilo premium del mockup */}
        <div className="jobs-decor-backdrop">
          <div className="aurora-orb orb-violet" />
          <div className="aurora-orb orb-fuchsia" />
          <div className="aurora-orb orb-cyan" />
          <div className="aurora-orb orb-indigo" />
          <div className="aurora-orb orb-interactive" />
        </div>

        {/* Cabecera Superior */}
        <header className="jobs-top-header">
          <h1 className="jobs-page-title">Lista de Empleos</h1>

          <div className="jobs-header-actions">
            {/* Iconos de cabecera */}
            <button className="header-icon-btn" title="Notificaciones">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>

            <button className="header-icon-btn" title="Alternar tema" onClick={toggleDarkMode}>
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>

            <button className="header-icon-btn" title="Información">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>

            {/* Avatar del usuario */}
            <div className="header-avatar-circle" title="Mi Cuenta">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                alt="Avatar usuario"
              />
            </div>
          </div>
        </header>

        {/* =========================================
            BARRA DE BÚSQUEDA UNIFICADA FLOTANTE
           ========================================= */}
        {!isLoading && (
          <div className={`floating-search-wrapper state-${viewState}`}>
            <h1 className="jobs-hero-title">Encuentra tu próximo empleo</h1>
            <div className="jobs-hero-search-box">
              <div className="hero-input-group">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" className="hero-input-icon">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder={viewState === 'hero' ? "Puesto, empresa o palabra clave" : "Buscar empleos..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="hero-input-group secondary-input">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" className="hero-input-icon">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <input
                  type="text"
                  className="hero-search-input"
                  placeholder="Ciudad, estado o remoto"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <button className="hero-search-btn" onClick={performSearch}>
                Buscar
              </button>
            </div>
          </div>
        )}

        {/* LOADING O CONTENIDO GRID */}
        {isLoading ? (
          <div className="jobs-loading-state">
            <GooeyLoader className="mb-4" />
            <p>Buscando las mejores oportunidades para ti...</p>
          </div>
        ) : (
          <div className={`jobs-content-transition state-${viewState}`}>
            {/* Tab Selectors de Sección */}
            <div className="jobs-section-tabs">
              <button
                type="button"
                className={`jobs-tab-pill ${activeTab === 'positions' ? 'active' : ''}`}
                onClick={() => setActiveTab('positions')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span>Posiciones</span>
              </button>

              <button
                type="button"
                className={`jobs-tab-pill ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Guardados</span>
              </button>
            </div>

            {/* Contenido Grid */}
            <div className="jobs-grid-wrapper">
              {filteredJobs.length > 0 ? (
                <div className="jobs-grid">
                  {filteredJobs.map((job) => (
                    <div className="job-card" key={job.id}>
                      {/* Bookmark ribbon superior derecho */}
                      <button
                        className={`btn-save-bookmark ${job.saved ? 'saved' : ''}`}
                        onClick={() => handleToggleSave(job.id)}
                        title={job.saved ? 'Quitar guardado' : 'Guardar empleo'}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill={job.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </button>

                      {/* Logo/Emblema centralizado */}
                      <div className="job-company-emblem" style={{ background: job.emblemBg }}>
                        {job.emblem}
                      </div>

                      {/* Títulos */}
                      <h3 className="job-card-title" title={job.title}>{job.title}</h3>
                      <p className="job-card-company">{job.company}</p>

                      {/* Fila de Contenido inferior */}
                      <div className="job-card-footer-layout">
                        {/* Tags */}
                        <div className="job-tags-group">
                          <div className="tags-row-one">
                            <span className="job-tag-pill">{job.timePosted}</span>
                            <span className="job-tag-pill">{job.type}</span>
                            <span className="job-tag-pill">{job.salary}</span>
                          </div>
                          <div className="tags-row-two">
                            <span className="job-tag-pill location-pill">
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              {job.location}
                            </span>
                          </div>
                        </div>

                        {/* Medidor Circular de Compatibilidad SVG */}
                        <div className="job-compat-indicator">
                          <div className="svg-ring-container">
                            <svg width="56" height="56" viewBox="0 0 36 36">
                              {/* Fondo de vía */}
                              <path
                                className="ring-background-track"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="2.5"
                              />
                              {/* Anillo de progreso verde */}
                              <path
                                className="ring-progress-bar"
                                strokeDasharray={`${job.compatibility}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="3.2"
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="ring-text-centered">{job.compatibility}%</div>
                          </div>
                          <div className="compat-label-text">
                            <span>Alta</span>
                            <span>Compatibilidad</span>
                          </div>
                        </div>
                      </div>

                      {/* Botón Ver Descripción */}
                      <div className="job-card-action-bar">
                        <button
                          type="button"
                          className="btn-view-desc"
                          onClick={() => setSelectedJob(job)}
                        >
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                          Ver Descripción
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="jobs-empty-state">
                  <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  <h3>No se encontraron empleos</h3>
                  <p>Prueba ajustando los términos de búsqueda o guarda algunos empleos primero.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Panel lateral deslizante (Drawer) para ver descripción (MOVIDO FUERA DEL MAIN) */}
      {selectedJob && (
        <div className="drawer-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="job-detail-drawer" ref={drawerRef} onClick={(e) => e.stopPropagation()}>
            <header className="drawer-header">
              <div className="drawer-header-left">
                <div className="drawer-emblem" style={{ background: selectedJob.emblemBg }}>
                  {selectedJob.emblem}
                </div>
                <div>
                  <h3 className="drawer-job-title">{selectedJob.title}</h3>
                  <p className="drawer-job-company">{selectedJob.company}</p>
                </div>
              </div>
              <button className="btn-close-drawer" onClick={() => setSelectedJob(null)} title="Cerrar">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </header>

            <div className="drawer-content">
              {/* Meta de compatibilidad e info básica */}
              <div className="drawer-meta-section">
                <div className="drawer-meta-pill">
                  <strong>Compatibilidad:</strong> {selectedJob.compatibility}%
                </div>
                <div className="drawer-meta-pill">
                  <strong>Ubicación:</strong> {selectedJob.location}
                </div>
                <div className="drawer-meta-pill">
                  <strong>Horario:</strong> {selectedJob.type}
                </div>
                {selectedJob.salary !== '$ - No Especificado' && (
                  <div className="drawer-meta-pill salary-pill">
                    <strong>Salario:</strong> {selectedJob.salary}
                  </div>
                )}
              </div>

              {/* Detalle extenso */}
              <div className="drawer-body-text">
                <h4>Descripción del Puesto</h4>
                <p>{selectedJob.description}</p>

                <h4>Requisitos mínimos</h4>
                <ul>
                  <li>Experiencia certificable en posiciones similares de desarrollo de software.</li>
                  <li>Excelente capacidad de comunicación y trabajo colaborativo.</li>
                  <li>Comprensión profunda de arquitecturas distribuidas y APIs.</li>
                </ul>

                <h4>Lo que ofrecemos</h4>
                <ul>
                  <li>Esquema de trabajo flexible / Híbrido.</li>
                  <li>Sueldos competitivos y revisiones periódicas.</li>
                  <li>Presupuesto dedicado para capacitación técnica y certificaciones.</li>
                </ul>
              </div>
            </div>

            <footer className="drawer-footer">
              <button
                type="button"
                className="btn-drawer-action btn-drawer-secondary"
                onClick={() => {
                  handleToggleSave(selectedJob.id);
                  // Actualizar el estado temporal en el drawer
                  setSelectedJob(prev => prev ? { ...prev, saved: !prev.saved } : null);
                }}
              >
                {selectedJob.saved ? 'Quitar de Guardados' : 'Guardar Puesto'}
              </button>
              <button
                type="button"
                className="btn-drawer-action btn-drawer-primary"
                onClick={() => {
                  if (selectedJob.applyUrl) {
                    window.open(selectedJob.applyUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    alert(`El enlace para "${selectedJob.title}" no está disponible directamente.`);
                  }
                }}
              >
                Aplicar ahora
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
