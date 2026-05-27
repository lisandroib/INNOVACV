'use client';

import React from 'react';
import Link from 'next/link';
import './landing.css';

export default function LandingPage() {
  // Lista de trabajos para el carrusel (se duplicará en el código para el scroll infinito)
  const jobOffers = [
    {
      companyInitials: 'MI',
      companyBg: '#6147FF',
      title: 'Senior UI/Full Stack Software Engi...',
      company: 'Motorola Solutions, Inc.',
      time: 'Hace 1 día',
      type: 'Full-time',
      salary: '130K - 170K por año',
      location: 'Vancouver, BC, Canada',
      matchScore: 84
    },
    {
      companyInitials: 'PC',
      companyBg: '#7A5AF8',
      title: 'Software Engineering Lead, Senior ...',
      company: 'PwC Canada',
      time: 'Hace 16 horas',
      type: 'Full-time',
      salary: '$ - No Especificado',
      location: 'Toronto, ON, Canada (+1 más)',
      matchScore: 85
    },
    {
      companyInitials: 'CA',
      companyBg: '#8F5BEE',
      title: 'Software Engineering Manager',
      company: 'Capgemini',
      time: 'Hace 22 horas',
      type: 'Full-time',
      salary: '$ - No Especificado',
      location: 'Mississauga, ON, Canada',
      matchScore: 92
    },
    {
      companyInitials: 'G',
      companyBg: '#ea4335',
      title: 'UX Researcher & Designer',
      company: 'Google Argentina',
      time: 'Hace 2 días',
      type: 'Full-time',
      salary: '120K - 140K por año',
      location: 'Buenos Aires, Argentina',
      matchScore: 90
    },
    {
      companyInitials: 'NF',
      companyBg: '#e50914',
      title: 'Senior Front End Engineer',
      company: 'Netflix',
      time: 'Hace 3 días',
      type: 'Full-time',
      salary: '200K - 240K por año',
      location: 'Remoto (USA)',
      matchScore: 88
    }
  ];

  return (
    <div className="landing-wrapper">
      {/* Cabecera / Navbar */}
      <header className="landing-header">
        <Link href="/" className="landing-logo">INNOVA<span>CV</span></Link>
        <nav className="header-links">
          <Link href="/signin" className="link-signin">Sign in</Link>
          <Link href="/signup" className="link-signup">Sign Up</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Optimizá tu CV,<br />optimizá tu futuro</h1>
          <p className="hero-subtitle">
            La plataforma inteligente que crea, personaliza y adapta tu currículum con ayuda de IA.
          </p>
          <Link href="/signup" className="btn-gradient">Start Now</Link>
        </div>
      </section>

      {/* ¿Qué es InnovaCV? */}
      <section className="info-section">
        <h2 className="section-title">¿Qué es InnovaCV?</h2>
        <p className="info-text">
          InnovaCV es una plataforma web pensada para estudiantes y egresados que quieren destacarse en el mundo laboral. Con la ayuda de inteligencia artificial, podés generar tu CV de forma automática, personalizarlo con plantillas profesionales y acceder a ofertas laborales alineadas a tu perfil.
        </p>
      </section>

      {/* Cómo funciona */}
      <section className="how-it-works-section">
        <div className="how-it-works-container">
          <div className="how-it-works-left">
            <h2 className="section-title">Cómo funciona</h2>
            <ul className="steps-list">
              <li className="step-item">
                <strong>Creá tu CV:</strong> cargá tus datos y la IA organiza todo automáticamente.
              </li>
              <li className="step-item">
                <strong>Personalizalo:</strong> elegí entre plantillas modernas y editá secciones a tu gusto.
              </li>
              <li className="step-item">
                <strong>Conectá con empleos:</strong> recibí recomendaciones de puestos y postulá en segundos.
              </li>
            </ul>

            <div className="cta-helper">
              <img src="/flecha.svg" alt="Flecha" className="curved-arrow" />
              <span className="helper-text">Charla con el asistente y ve sus recomendaciones!</span>
            </div>
          </div>

          <div className="how-it-works-right">
            <img 
              src="/demostracion_landing.png" 
              alt="Demostración de InnovaCV" 
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                display: 'block'
              }} 
            />
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="benefits-section">
        <h2 className="section-title">Beneficios</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <span className="benefit-text">Para alumnos y egresados:<br />Perfil único y centralizado</span>
          </div>
          <div className="benefit-card">
            <span className="benefit-text">Para empleadores y facultad:<br />Publicación de ofertas, búsqueda de candidatos y compatibilidad automática</span>
          </div>
          <div className="benefit-card">
            <span className="benefit-text">Para vos:<br />CV optimizado con palabras clave que pasan filtros de selección</span>
          </div>
        </div>
      </section>

      {/* Oportunidades Laborales (Carrusel Auto-deslizable) */}
      <section className="jobs-section">
        <h2 className="section-title">Oportunidades laborales</h2>
        
        <div className="jobs-carousel-container">
          <div className="jobs-carousel-track">
            {/* Renderizar primer grupo */}
            <div className="jobs-carousel-group">
              {jobOffers.map((job, idx) => (
                <div className="job-card" key={`group1-${idx}`}>
                  <div className="job-card-header">
                    <div className="company-logo-initials" style={{ backgroundColor: job.companyBg }}>
                      {job.companyInitials}
                    </div>
                    <div className="job-header-text">
                      <h3 className="job-title">{job.title}</h3>
                      <p className="company-name">{job.company}</p>
                    </div>
                  </div>
                  <div className="job-card-body">
                    <div className="job-tags-grid">
                      <span className="job-tag">{job.time}</span>
                      <span className="job-tag">{job.type}</span>
                      <span className="job-tag">{job.salary}</span>
                      <span className="job-tag location-tag">{job.location}</span>
                    </div>
                    <div className="compatibility-container">
                      <svg className="compatibility-circle" viewBox="0 0 36 36">
                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="circle-fill-green" strokeDasharray={`${job.matchScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.35" className="circle-text" textAnchor="middle">{job.matchScore}%</text>
                      </svg>
                    </div>
                  </div>
                  <div className="job-card-footer">
                    <button className="btn-view-desc">
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      <span>Ver Descripción</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Renderizar segundo grupo idéntico para crear el bucle infinito */}
            <div className="jobs-carousel-group">
              {jobOffers.map((job, idx) => (
                <div className="job-card" key={`group2-${idx}`}>
                  <div className="job-card-header">
                    <div className="company-logo-initials" style={{ backgroundColor: job.companyBg }}>
                      {job.companyInitials}
                    </div>
                    <div className="job-header-text">
                      <h3 className="job-title">{job.title}</h3>
                      <p className="company-name">{job.company}</p>
                    </div>
                  </div>
                  <div className="job-card-body">
                    <div className="job-tags-grid">
                      <span className="job-tag">{job.time}</span>
                      <span className="job-tag">{job.type}</span>
                      <span className="job-tag">{job.salary}</span>
                      <span className="job-tag location-tag">{job.location}</span>
                    </div>
                    <div className="compatibility-container">
                      <svg className="compatibility-circle" viewBox="0 0 36 36">
                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="circle-fill-green" strokeDasharray={`${job.matchScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.35" className="circle-text" textAnchor="middle">{job.matchScore}%</text>
                      </svg>
                    </div>
                  </div>
                  <div className="job-card-footer">
                    <button className="btn-view-desc">
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      <span>Ver Descripción</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Llamado a la Acción Bottom */}
      <section className="cta-bottom-section">
        <h2 className="cta-bottom-title">
          Dale forma a tu futuro profesional. Empezá hoy con un CV inteligente.
        </h2>
        <Link href="/signup" className="btn-gradient">Start Now</Link>
      </section>
    </div>
  );
}