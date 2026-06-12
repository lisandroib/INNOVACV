'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import RichTextEditor, { RichTextEditorRef } from './components/RichTextEditor';
import ChatAssistant from './components/ChatAssistant';
import './editor.css';

import { getTemplateById } from '@/lib/cv-templates';

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
  const [userData, setUserData] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('harvard');
  const [initialContent, setInitialContent] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const editorRef = useRef<RichTextEditorRef>(null);

  const handleApplySuggestion = (text: string) => {
    if (editorRef.current) {
      editorRef.current.insertText(text);
    }
  };

  // Estados de guardado
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [cvName, setCvName] = useState('');
  const [cvRole, setCvRole] = useState('');
  const [currentHtmlToSave, setCurrentHtmlToSave] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Intentar cargar el último borrador del usuario primero
        const draftRes = await fetch('/api/cv/guardar');
        if (draftRes.ok) {
          const { data } = await draftRes.json();
          if (data && data.html_content) {
            setInitialContent(data.html_content);
            if (data.nombre_cv) setCvName(data.nombre_cv);
            if (data.rol_aplicado) setCvRole(data.rol_aplicado);
            if (data.template_id) setSelectedTemplateId(data.template_id);
            setIsLoading(false);
            return;
          }
        }

        // Si no hay borrador, auto-generar de perfil
        const res = await fetch('/api/perfil');
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            let finalData = { ...data };

            if (!finalData.sobre_mi && !finalData.resumen) {
              const rolObjetivo = finalData.perfil_profesional?.rol_objetivo || 'profesional';
              setIsGeneratingProfile(true);

              try {
                const chatRes = await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    messages: [{ role: 'user', content: `Actúa como un redactor experto de currículums. Escribe un ÚNICO párrafo persuasivo (máximo 4 líneas) para mi 'Perfil Profesional'. Debe estar redactado en primera persona, sonar natural y profesional. IMPORTANTE: Entrega SOLO el texto del párrafo listo para usar en el CV. NO me des múltiples opciones, NO incluyas títulos, NO incluyas saludos ni explicaciones. Mi rol objetivo es: ${rolObjetivo}.` }],
                  })
                });

                if (chatRes.ok) {
                  const chatData = await chatRes.json();
                  const generatedText = chatData.choices?.[0]?.message?.content;
                  if (generatedText) {
                    finalData.sobre_mi = generatedText.replace(/^"|"$/g, '').trim(); // Eliminar comillas si la IA las pone

                    await fetch('/api/perfil', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sobre_mi: finalData.sobre_mi })
                    });
                  }
                }
              } catch (genErr) {
                console.error('Error generando perfil automáticamente:', genErr);
              } finally {
                setIsGeneratingProfile(false);
              }
            }

            setUserData(finalData);
            setInitialContent(getTemplateById('harvard').generateHTML(finalData));
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSectionChange = (section: string, text: string) => {
    setActiveSection(section);
    setResumeContext(text);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setInitialContent(getTemplateById(templateId).generateHTML(userData));
  };

  const handleSaveCV = (html: string) => {
    setCurrentHtmlToSave(html);
    setShowSaveModal(true);
  };

  const confirmSaveCV = async () => {
    if (!cvName.trim()) {
      alert("Por favor ingresa un nombre para el CV");
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/cv/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_cv: cvName,
          rol_aplicado: cvRole,
          html_content: currentHtmlToSave,
          template_id: selectedTemplateId
        })
      });
      
      if (response.ok) {
        alert("¡Currículum guardado exitosamente!");
        setShowSaveModal(false);
      } else {
        alert("Error al guardar el currículum");
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con el servidor");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isGeneratingProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
        <div className="text-slate-500 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>{isGeneratingProfile ? 'Generando tu perfil profesional con IA...' : 'Cargando tus datos del perfil...'}</p>
        </div>
      </div>
    );
  }

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
          <ChatAssistant
            activeSection={activeSection}
            resumeContext={resumeContext}
            isDarkMode={isDarkMode}
            onApplySuggestion={handleApplySuggestion}
            initialTargetJob={userData?.perfil_profesional?.rol_objetivo || ''}
          />
        </div>
      </section>

      {/* 3. COLUMNA DERECHA (Editor Tiptap de Documento) */}
      <section className="right-column px-6 py-4">
        <RichTextEditor
          ref={editorRef}
          initialContent={initialContent}
          onSectionChange={handleSectionChange}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={handleTemplateChange}
          onSaveCV={handleSaveCV}
        />
      </section>

      {/* MODAL DE GUARDADO */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${isDarkMode ? 'bg-[#111c44] text-white border border-white/10' : 'bg-white text-slate-800'}`}>
            <h3 className="text-lg font-bold mb-4">Guardar Currículum</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Nombre del CV</label>
              <input 
                type="text" 
                value={cvName} 
                onChange={e => setCvName(e.target.value)} 
                placeholder="Ej: Mi CV Principal" 
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 ${isDarkMode ? 'bg-[#0b1437] border-white/10' : 'bg-white border-slate-200'}`}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-1">Rol a aplicar (Opcional)</label>
              <input 
                type="text" 
                value={cvRole} 
                onChange={e => setCvRole(e.target.value)} 
                placeholder="Ej: Desarrollador Frontend" 
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 ${isDarkMode ? 'bg-[#0b1437] border-white/10' : 'bg-white border-slate-200'}`}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmSaveCV}
                disabled={isSaving}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
