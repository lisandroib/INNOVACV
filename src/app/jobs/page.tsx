'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
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
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
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
    <div className="jobs-layout-container">
      {/* 1. BARRA LATERAL (Sidebar) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="jobs-main-column">
        {/* Gradientes decorativos de fondo al estilo premium del mockup */}
        <div className="jobs-decor-backdrop" />
        
        {/* Cabecera Superior */}
        <header className="jobs-top-header">
          <h1 className="jobs-page-title">Lista de Empleos</h1>
          
          <div className="jobs-header-actions">
            {/* Buscador */}
            <div className="jobs-search-box-wrapper">
              <svg viewBox="0 0 24 24" className="search-icon" width="18" height="18">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Iconos de cabecera */}
            <button className="header-icon-btn" title="Notificaciones">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
            
            <button className="header-icon-btn" title="Alternar tema">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
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

        {/* Panel lateral deslizante (Drawer) para ver descripción */}
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
                  onClick={() => alert(`¡Has aplicado al puesto de "${selectedJob.title}" con éxito!`)}
                >
                  Aplicar ahora
                </button>
              </footer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
