'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from "motion/react";
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
  isComparing?: boolean;
  isCompared?: boolean;
}

const INITIAL_JOBS: Job[] = [];

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState('positions'); // 'positions' | 'saved'
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [viewState, setViewState] = useState<'hero' | 'compact'>('hero');
  const [hasSearched, setHasSearched] = useState(false);
  const [aiErrorToast, setAiErrorToast] = useState<{show: boolean, title: string, message: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Novedades: Para seleccionar CV a comparar
  const [savedCVs, setSavedCVs] = useState<any[]>([]);
  const [selectedCompareCvId, setSelectedCompareCvId] = useState<string | null>(null);
  const [showMyCVsModal, setShowMyCVsModal] = useState(false);
  const [showInfoBubble, setShowInfoBubble] = useState(false);
  const [comparingChunkIndex, setComparingChunkIndex] = useState(0);
  
  // Paginación
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

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
    setNextPageToken(null);
    setHasMoreJobs(true);
    try {
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`);
      const data = await res.json();
      if (data.jobs) {
        const savedIds = new Set(savedJobs.map(j => j.id));
        const initializedJobs = data.jobs.map((j: Job) => ({ 
          ...j, 
          isCompared: false, 
          isComparing: false,
          saved: savedIds.has(j.id)
        }));
        setJobs(initializedJobs);
        setNextPageToken(data.nextPageToken || null);
        if (!data.nextPageToken) setHasMoreJobs(false);
      } else {
        setHasMoreJobs(false);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMoreJobs = async () => {
    if (isFetchingMore || !hasMoreJobs || !hasSearched || !nextPageToken) return;
    setIsFetchingMore(true);
    
    try {
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}&pageToken=${encodeURIComponent(nextPageToken)}`);
      const data = await res.json();
      if (data.jobs && data.jobs.length > 0) {
        const savedIds = new Set(savedJobs.map(j => j.id));
        const initializedJobs = data.jobs.map((j: Job) => ({ 
          ...j, 
          isCompared: false, 
          isComparing: false,
          saved: savedIds.has(j.id)
        }));
        
        // Evitar duplicados revisando los IDs
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const newJobs = initializedJobs.filter((j: Job) => !existingIds.has(j.id));
          
          return [...prev, ...newJobs];
        });
        
        setNextPageToken(data.nextPageToken || null);
        if (!data.nextPageToken) {
          setHasMoreJobs(false);
        }
      } else {
        setHasMoreJobs(false);
      }
    } catch (err) {
      console.error('Failed to fetch more jobs:', err);
    } finally {
      setIsFetchingMore(false);
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

  // Fetch saved jobs on mount
  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const res = await fetch('/api/ofertas/guardadas');
        if (res.ok) {
          const { data } = await res.json();
          setSavedJobs(data || []);
          // Also sync INITIAL_JOBS if any of them are saved
          setJobs(prevJobs => {
            const savedIds = new Set((data || []).map((j: Job) => j.id));
            return prevJobs.map(j => ({ ...j, saved: savedIds.has(j.id) }));
          });
        }
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
      }
    };
    fetchSavedJobs();
  }, []);

  // Cargar CVs guardados para la comparación
  useEffect(() => {
    const loadCVs = async () => {
      try {
        const res = await fetch('/api/cv/lista');
        if (res.ok) {
          const { data } = await res.json();
          setSavedCVs(data || []);
          if (data && data.length > 0) {
            const savedSelectedId = localStorage.getItem('selectedCompareCvId');
            if (savedSelectedId && data.find((cv: any) => cv._id === savedSelectedId)) {
              setSelectedCompareCvId(savedSelectedId);
            } else {
              setSelectedCompareCvId(data[0]._id);
            }
            
            // Mostrar la burbuja flotante automáticamente por 5 segundos al entrar a la página
            setShowInfoBubble(true);
            setTimeout(() => setShowInfoBubble(false), 5000);
          }
        }
      } catch (e) {
        console.error('Error cargando CVs:', e);
      }
    };
    loadCVs();
  }, []);

  // Lógica para Procesamiento Batch de la IA (Lotes de 10)
  useEffect(() => {
    const processBatch = async () => {
      // Si no hay trabajos o no hay CV seleccionado, no hacemos nada
      if (jobs.length === 0 || !selectedCompareCvId) return;
      
      const needsComparison = jobs.filter(j => !j.isCompared && !j.isComparing).slice(0, 10);
      
      if (needsComparison.length === 0) return;

      // Marcamos este lote como "en proceso"
      setJobs(prev => prev.map(job => 
        needsComparison.find(nc => nc.id === job.id) ? { ...job, isComparing: true } : job
      ));

      try {
        const payload = {
          cv_id: selectedCompareCvId,
          jobs: needsComparison.map(j => ({ id: j.id, title: j.title, company: j.company, description: j.description }))
        };

        const res = await fetch('/api/jobs/compare-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const { results } = await res.json();
          // Actualizamos los puntajes y desmarcamos el flag isComparing
          setJobs(prev => prev.map(job => {
            const found = results.find((r: any) => r.id === job.id);
            if (found) {
              return { ...job, compatibility: found.compatibility, isComparing: false, isCompared: true };
            }
            // Si por alguna razón Gemini no lo devolvió, quitamos el flag para evitar infinite loops
            if (needsComparison.find(nc => nc.id === job.id)) {
               return { ...job, isComparing: false, isCompared: true };
            }
            return job;
          }));
        } else {
          // Lanzamos error si la API devuelve 429, 500, etc.
          throw new Error(`API Error: ${res.status}`);
        }
      } catch (err) {
        console.error("Error en comparación batch:", err);
        setJobs(prev => prev.map(job => 
          needsComparison.find(nc => nc.id === job.id) ? { ...job, isComparing: false, isCompared: true } : job
        ));
        
        // Mostrar alerta no intrusiva
        setAiErrorToast({
          show: true,
          title: "IA No Disponible",
          message: "Límite gratuito excedido o servicio de la IA ocupado. Revisa más tarde para calcular compatibilidad."
        });
        
        // Ocultar alerta después de 5 segundos
        setTimeout(() => {
          setAiErrorToast(null);
        }, 5000);
      }
    };
    
    // Evitamos ejecutarlo en cada render. Reactivará cuando lleguen nuevos jobs, o cambie el CV.
    processBatch();
  }, [jobs, selectedCompareCvId]);

  const handleSelectCompareCV = (id: string) => {
    setSelectedCompareCvId(id);
    localStorage.setItem('selectedCompareCvId', id);
    setShowMyCVsModal(false);
  };

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
  const handleToggleSave = async (job: Job) => {
    const isCurrentlySaved = job.saved;
    
    // Update jobs list optimistically
    setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? { ...j, saved: !job.saved } : j));
    
    // Update savedJobs list optimistically
    if (isCurrentlySaved) {
      setSavedJobs(prev => prev.filter(j => j.id !== job.id));
    } else {
      setSavedJobs(prev => [{ ...job, saved: true }, ...prev]);
    }

    try {
      const res = await fetch('/api/ofertas/guardadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job })
      });
      if (!res.ok) {
        throw new Error('Failed to toggle save');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      // Revert on error
      setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? { ...j, saved: isCurrentlySaved } : j));
      if (isCurrentlySaved) {
        setSavedJobs(prev => [{ ...job, saved: true }, ...prev]);
      } else {
        setSavedJobs(prev => prev.filter(j => j.id !== job.id));
      }
    }
  };

  // Filtrado de búsquedas
  const jobsSource = activeTab === 'saved' ? savedJobs : jobs;
  const filteredJobs = jobsSource.filter(job => {
    if (activeTab === 'saved') return true;
    
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className={`jobs-layout-container ${isDarkMode ? 'dark-theme' : ''}`} onMouseMove={handleMouseMove}>
      {/* 1. BARRA LATERAL (Sidebar) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. CONTENIDO PRINCIPAL */}
      <main 
        className="jobs-main-column" 
        ref={mainRef} 
        onWheel={handleWheel} 
        style={{ overflowY: (viewState === 'hero' && activeTab !== 'saved') ? 'hidden' : 'auto' }}
      >
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

            <div 
              className="relative"
              onMouseEnter={() => setShowInfoBubble(true)}
              onMouseLeave={() => setShowInfoBubble(false)}
            >
              <button 
                className="header-icon-btn" 
                title="Información"
                onClick={() => setShowMyCVsModal(true)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
              
              {/* Burbuja flotante */}
              {showInfoBubble && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl z-50 pointer-events-none animate-bounce-bubble">
                  <div className="absolute -top-1.5 right-3 w-3 h-3 bg-slate-800 transform rotate-45" />
                  <p className="relative z-10 font-semibold mb-1">Comparando empleos usando:</p>
                  <p className="relative z-10 text-slate-300 truncate">
                    {savedCVs.length > 0 && selectedCompareCvId 
                      ? savedCVs.find(cv => cv._id === selectedCompareCvId)?.nombre_cv || 'CV Sin Nombre'
                      : 'Ningún CV seleccionado'}
                  </p>
                  <p className="relative z-10 text-[10px] text-slate-400 mt-2 italic">Haz clic para cambiar de CV</p>
                </div>
              )}
            </div>

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
          <div className={`floating-search-wrapper state-${viewState} ${activeTab === 'saved' ? 'hide-search' : ''}`}>
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
          <div key="loading" className="jobs-loading-state">
            <GooeyLoader className="mb-4" />
            <p>Buscando las mejores oportunidades para ti...</p>
          </div>
        ) : (
          <div key="content" className={`jobs-content-transition state-${activeTab === 'saved' ? 'compact' : viewState}`}>
            {/* Tab Selectors de Sección */}
            {activeTab !== 'saved' && hasSearched && (
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
            )}

            {/* Contenido Grid */}
            <div className="jobs-grid-wrapper">
              {(hasSearched || activeTab === 'saved') && (filteredJobs.length > 0 ? (
                <>
                  <div className="jobs-grid">
                    {filteredJobs.map((job) => (
                      <div className={`w-full p-5 border rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col ${isDarkMode ? 'bg-[#1a1b2e] border-slate-700/60' : 'bg-white border-neutral-200/60'}`} key={job.id}>
                        {/* Cabecera: Logo, Empresa y Guardar */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="flex items-center justify-center w-12 h-12 text-white rounded-xl font-bold text-lg shadow-sm"
                              style={{ background: job.emblemBg || '#3b82f6' }}
                            >
                              {job.emblem}
                            </div>
                            <div>
                              <h3 className={`text-[13px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-neutral-500'}`}>{job.company}</h3>
                            </div>
                          </div>
                          <button 
                            className={`p-2 rounded-full transition-colors ${job.saved ? (isDarkMode ? 'text-violet-300 bg-violet-900/40' : 'text-violet-600 bg-violet-50') : (isDarkMode ? 'text-slate-500 hover:text-violet-400 hover:bg-slate-800' : 'text-neutral-400 hover:text-violet-600 hover:bg-violet-50')}`}
                            onClick={() => handleToggleSave(job)}
                            title={job.saved ? 'Quitar guardado' : 'Guardar empleo'}
                          >
                            <svg className="w-5 h-5" fill={job.saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                            </svg>
                          </button>
                        </div>

                        {/* Cuerpo: Título y Meta-datos */}
                        <div className="mb-5 flex-1">
                          <h2 className={`text-[17px] font-bold leading-snug mb-3 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`} title={job.title}>
                            {job.title}
                          </h2>
                          <div className={`flex flex-wrap items-center gap-x-2 gap-y-2 text-[12px] font-medium ${isDarkMode ? 'text-slate-300' : 'text-neutral-500'}`}>
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${isDarkMode ? 'bg-[#22243e]' : 'bg-neutral-100'}`}>
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> 
                              <span className="truncate max-w-[140px]">{job.location.split(',')[0]}</span>
                            </span>
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${isDarkMode ? 'bg-[#22243e]' : 'bg-neutral-100'}`}>{job.type}</span>
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-md ${isDarkMode ? 'bg-[#22243e]' : 'bg-neutral-100'}`}>{job.timePosted}</span>
                          </div>
                          <div className={`mt-3 text-[13px] font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {job.salary}
                          </div>
                        </div>

                        {/* Pie: IA y Call to Action */}
                        <div className={`flex items-center justify-between pt-4 border-t mt-auto ${isDarkMode ? 'border-slate-700/50' : 'border-neutral-100'}`}>
                          {/* Contenedor del Score IA */}
                          <div className={`analyzing-loader-container ${job.isComparing ? 'is-comparing' : ''}`} title={job.isComparing ? "IA analizando compatibilidad..." : "Compatibilidad IA"}>
                            <div className="relative flex items-center justify-center w-[44px] h-[44px]">
                              <svg viewBox="0 0 36 36" className="circular-progress-svg absolute inset-0">
                                <circle cx="18" cy="18" r="15.9155" className="circular-progress-bg" style={{ stroke: isDarkMode ? '#334155' : '#e2e8f0' }} />
                                <circle 
                                  cx="18" cy="18" r="15.9155" 
                                  className={`circular-progress-fill ${
                                    job.isComparing 
                                      ? 'text-violet-500' 
                                      : (job.compatibility && job.compatibility >= 70 
                                          ? 'text-emerald-400' 
                                          : job.compatibility && job.compatibility >= 50 
                                              ? 'text-amber-400' 
                                              : 'text-rose-400')
                                  }`} 
                                  style={job.isComparing ? undefined : { strokeDashoffset: 100 - (job.compatibility || 0) }}
                                />
                              </svg>
                              {!job.isComparing && (
                                <span className={`text-[11px] font-bold relative z-10 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                  {job.compatibility || 0}%
                               </span>
                              )}
                            </div>
                            
                            <div className="flex flex-col">
                              {job.isComparing ? (
                                <div className="analyzing-loader-text">
                                  {['A','n','a','l','i','z','a','n','d','o','.','.','.'].map((letter, i) => (
                                    <span key={i} className="analyzing-letter" style={{ animationDelay: `${i * 0.1}s` }}>{letter}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className={`text-[12px] font-bold ${job.compatibility && job.compatibility >= 70 ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : job.compatibility && job.compatibility >= 50 ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') : (isDarkMode ? 'text-rose-400' : 'text-rose-500')}`}>
                                  {job.compatibility && job.compatibility >= 70 ? 'Alta' : job.compatibility && job.compatibility >= 50 ? 'Media' : 'Baja'}
                                </span>
                              )}
                              <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-neutral-400'}`}>Compatibilidad</span>
                            </div>
                          </div>
                          
                          {/* Botón Principal */}
                          <button 
                            className={`px-4 py-2 text-[13px] font-bold rounded-xl transition-colors flex items-center gap-1.5 ${isDarkMode ? 'text-violet-300 bg-violet-900/30 hover:bg-violet-900/50' : 'text-violet-600 bg-violet-50 hover:bg-violet-100'}`}
                            onClick={() => setSelectedJob(job)}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                  ))}
                </div>
                
                {hasMoreJobs && activeTab !== 'saved' && (
                  <div className="w-full py-10 mt-2 flex flex-col items-center justify-center">
                    <button 
                      onClick={fetchMoreJobs} 
                      disabled={isFetchingMore}
                      className="btn-drawer-action btn-drawer-primary font-bold"
                      style={{ 
                        padding: '14px 28px', 
                        borderRadius: '12px', 
                        cursor: isFetchingMore ? 'wait' : 'pointer', 
                        opacity: isFetchingMore ? 0.7 : 1,
                        width: 'auto',
                        minWidth: '250px'
                      }}
                    >
                      {isFetchingMore ? (
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Cargando empleos...
                        </div>
                      ) : 'Cargar más empleos'}
                    </button>
                  </div>
                )}
                </>
              ) : (
                <div className="jobs-empty-state">
                  <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  <h3>No se encontraron empleos</h3>
                  <p>Prueba ajustando los términos de búsqueda o guarda algunos empleos primero.</p>
                </div>
              ))}
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
                  handleToggleSave(selectedJob);
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

      {/* MODAL DE SELECCIÓN DE CV PARA COMPARAR */}
      {showMyCVsModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-end p-4 sm:p-5">
          <div 
            className={`w-full max-w-md h-full flex flex-col p-6 shadow-2xl animate-slide-in-right rounded-3xl border
            ${isDarkMode ? 'bg-[#111c44] text-white border-white/10' : 'bg-[#f8fafc] text-slate-800 border-slate-200'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Elige el CV a comparar
              </h3>
              <button 
                onClick={() => setShowMyCVsModal(false)}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar pr-2 space-y-3">
              {savedCVs.length === 0 ? (
                <div className="text-center text-slate-400 mt-10">
                  <p>No tienes currículums guardados aún.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {savedCVs.map(cv => (
                    <div 
                      key={cv._id} 
                      onClick={() => handleSelectCompareCV(cv._id)}
                      className={`group relative flex items-stretch gap-6 py-4 cursor-pointer transition-all border-b ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'} ${selectedCompareCvId === cv._id ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}
                    >
                      <div className={`w-[120px] h-[169px] rounded-lg flex-shrink-0 shadow-sm overflow-hidden relative pointer-events-none select-none border border-slate-300 ml-2 bg-white`}>
                        <div className="absolute top-0 left-0 w-[800px] h-[1128px] origin-top-left bg-white" style={{ transform: 'scale(0.15)' }}>
                          <div 
                            className="ProseMirror w-full h-full p-8 text-black"
                            dangerouslySetInnerHTML={{ __html: cv.html_content }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col justify-center flex-1 pr-2">
                        <div className="mb-2">
                          <h4 className="font-bold text-[16px] truncate pr-4">{cv.nombre_cv || 'CV Sin Nombre'}</h4>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${isDarkMode ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
                            {cv.rol_aplicado || 'General'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Actualizado: {new Date(cv.updatedAt).toLocaleDateString()}
                        </div>
                        {selectedCompareCvId === cv._id && (
                          <div className="mt-3 text-xs font-bold text-violet-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Seleccionado
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Error de IA no intrusiva */}
      <AnimatePresence>
        {aiErrorToast && aiErrorToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            className="fixed bottom-8 right-8 bg-white rounded-[20px] shadow-2xl p-5 z-[9999] flex flex-col gap-1 border border-neutral-100 max-w-[340px]"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 flex items-center justify-center w-[46px] h-[46px] rounded-full bg-red-50 text-[#d94f4f] mt-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <path d="M12 9v4"/>
                  <path d="M12 17h.01"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-[#1e293b] text-[17px] m-0 mb-1 leading-tight tracking-tight">
                  {aiErrorToast.title}
                </h3>
                <p className="text-[13.5px] text-neutral-500 m-0 leading-snug pr-2">
                  {aiErrorToast.message}
                </p>
              </div>
            </div>
            <button 
              className="absolute top-4 right-4 text-neutral-300 hover:text-neutral-500 transition-colors"
              onClick={() => setAiErrorToast(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
