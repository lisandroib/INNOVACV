'use client';

import React, { useState, useEffect, useLayoutEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import RichTextEditor from './components/RichTextEditor';
import ChatAssistant from './components/ChatAssistant';
import './editor.css';

export default function EditorPage() {
  const [activeSection, setActiveSection] = useState('General');
  const [resumeContext, setResumeContext] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && (window as any).__hydrated) {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const [isMounted, setIsMounted] = useState(false);

  useLayoutEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
    (window as any).__hydrated = true;
    // Re-enable transitions after theme is applied
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('theme-loading');
    });
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleSectionChange = (section: string, text: string) => {
    setActiveSection(section);
    setResumeContext(text);
  };

  return (
    <div className={`editor-page-container ${isDarkMode ? 'dark-theme' : ''}`}>
      {/* 1. BARRA LATERAL REUTILIZABLE (Sidebar) */}
      <Sidebar />

      {/* 2. COLUMNA CENTRAL (Asistente de IA) */}
      <section className="middle-column p-4 flex flex-col h-full overflow-hidden">
        <div className="middle-header mb-3 flex justify-between items-center w-full">
          <h2 className="middle-title">Asistente de IA</h2>
          <button className="editor-header-icon-btn" title="Alternar tema" onClick={toggleDarkMode}>
            {isDarkMode ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <ChatAssistant activeSection={activeSection} resumeContext={resumeContext} isDarkMode={isDarkMode} />
        </div>
      </section>

      {/* 3. COLUMNA DERECHA (Editor Tiptap de Documento) */}
      <section className="right-column px-6 py-4">
        <RichTextEditor onSectionChange={handleSectionChange} />
      </section>
    </div>
  );
}
