'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import RichTextEditor, { RichTextEditorRef } from './components/RichTextEditor';
import ChatAssistant from './components/ChatAssistant';
import { GooeyLoader } from '@/components/GooeyLoader';
import { Trash2, Copy, Clock, FileText, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
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

  const handleApplySuggestion = (text: string, mode: 'insert' | 'replace') => {
    if (editorRef.current) {
      editorRef.current.insertText(text, mode);
    }
  };

  // Estados de guardado
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalCvName, setModalCvName] = useState('');
  const [cvName, setCvName] = useState('');
  const [cvId, setCvId] = useState<string | null>(null);
  const [cvRole, setCvRole] = useState('');
  const [currentHtmlToSave, setCurrentHtmlToSave] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Estados de Mis CVs
  const [showMyCVsModal, setShowMyCVsModal] = useState(false);
  const [savedCVs, setSavedCVs] = useState<any[]>([]);
  const [isLoadingCVs, setIsLoadingCVs] = useState(false);
  const [cvToDelete, setCvToDelete] = useState<{ id: string, name: string } | null>(null);

  // Notificaciones flotantes
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadMyCVs = async () => {
    setIsLoadingCVs(true);
    try {
      const res = await fetch('/api/cv/lista');
      if (res.ok) {
        const { data } = await res.json();
        setSavedCVs(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCVs(false);
    }
  };

  const handleShowMyCVs = () => {
    setShowMyCVsModal(true);
    loadMyCVs();
  };

  const handleLoadCV = async (id: string) => {
    try {
      const res = await fetch(`/api/cv/cargar?id=${id}`);
      if (res.ok) {
        const { data } = await res.json();
        if (data && data.html_content) {
          setInitialContent(data.html_content);
          if (data._id) setCvId(data._id);
          if (data.nombre_cv) setCvName(data.nombre_cv);
          if (data.rol_aplicado) setCvRole(data.rol_aplicado);
          if (data.template_id) setSelectedTemplateId(data.template_id);
          setShowMyCVsModal(false);
        }
      } else {
        showNotification("Error al cargar el currículum", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error de conexión al cargar", "error");
    }
  };

  const handleDeleteCV = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCvToDelete({ id, name });
  };

  const confirmDeleteCV = async () => {
    if (!cvToDelete) return;
    try {
      const res = await fetch(`/api/cv/eliminar?id=${cvToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        loadMyCVs();
        showNotification("Currículum eliminado", "success");
      } else {
        showNotification("Error al eliminar el currículum", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error de conexión", "error");
    } finally {
      setCvToDelete(null);
    }
  };

  const handleDuplicateCV = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/cv/duplicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadMyCVs();
        showNotification("Currículum duplicado exitosamente", "success");
      } else {
        showNotification("Error al duplicar el currículum", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error de conexión", "error");
    }
  };

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
              
              const toArray = (val: any) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                if (typeof val === 'string') return val.split(',');
                return [];
              };
              
              // Recopilar habilidades blandas para incluirlas en el prompt
              const blandas = [
                ...toArray(finalData.habilidades?.blandas),
                ...toArray(finalData.habilidades?.blandas_seleccionadas),
                ...toArray(finalData.habilidades?.blandas_manuales)
              ].map((s: string) => s.trim()).filter(Boolean);
              
              const uniqueBlandas = Array.from(new Set(blandas));
              const blandasText = uniqueBlandas.length > 0 
                ? ` Además, quiero que el perfil destaque sutilmente mis siguientes habilidades blandas: ${uniqueBlandas.join(', ')}.` 
                : '';

              setIsGeneratingProfile(true);

              try {
                const chatRes = await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    messages: [{ role: 'user', content: `Actúa como un redactor experto de currículums. Escribe un ÚNICO párrafo persuasivo (máximo 4 líneas) para mi 'Perfil Profesional'. Debe estar redactado en primera persona, sonar natural y profesional.${blandasText} IMPORTANTE: Entrega SOLO el texto del párrafo listo para usar en el CV. NO me des múltiples opciones, NO incluyas títulos, NO incluyas saludos ni explicaciones. Mi rol objetivo es: ${rolObjetivo}.` }],
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

            if (!cvRole && finalData.perfil_profesional?.rol_objetivo) {
              setCvRole(finalData.perfil_profesional.rol_objetivo);
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
    setModalCvName(''); // Lo iniciamos vacío como solicitó el usuario
    setShowSaveModal(true);
  };

  const confirmSaveCV = async () => {
    if (!modalCvName.trim()) {
      showNotification("Por favor ingresa un nombre para el CV", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/cv/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // No enviamos cv_id aquí para forzar que sea un documento nuevo ("Guardar como") o que busque por nombre si ya existía otro con ese nombre
          nombre_cv: modalCvName,
          rol_aplicado: cvRole,
          html_content: currentHtmlToSave,
          template_id: selectedTemplateId
        })
      });
      
      if (response.ok) {
        const { cv_id } = await response.json();
        if (cv_id) setCvId(cv_id);
        setCvName(modalCvName); // Actualizamos el nombre general
        
        showNotification("¡Currículum guardado exitosamente!", "success");
        setShowSaveModal(false);
        loadMyCVs(); // Refrescamos lista en caso de que se haya creado uno nuevo
      } else {
        showNotification("Error al guardar el currículum", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error al conectar con el servidor", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverwriteCV = async (html: string) => {
    if (!cvName.trim()) {
      // Si no tiene nombre, actúa como "Guardar nuevo borrador" pidiendo el nombre
      handleSaveCV(html);
      return;
    }
    
    // Sobreescribir directamente sin modal
    setCurrentHtmlToSave(html);
    setIsSaving(true);
    try {
      const response = await fetch('/api/cv/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cv_id: cvId, // Pasamos el ID para que sobreescriba aunque hayamos cambiado el nombre
          nombre_cv: cvName,
          rol_aplicado: cvRole,
          html_content: html,
          template_id: selectedTemplateId
        })
      });
      
      if (response.ok) {
        const { cv_id } = await response.json();
        if (cv_id) setCvId(cv_id);
        
        showNotification("¡Currículum sobreescrito exitosamente!", "success");
        loadMyCVs(); // Actualizar la lista en segundo plano
      } else {
        showNotification("Error al guardar el currículum", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error al conectar con el servidor", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isGeneratingProfile) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]'}`}>
        <div className={`flex flex-col items-center ${isDarkMode ? 'text-[#e2e8f0]' : 'text-[#475569]'}`}>
          <GooeyLoader className="mb-4" />
          <p style={{ marginTop: '20px', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            {isGeneratingProfile ? 'Generando tu perfil profesional con IA...' : 'Cargando tus datos del perfil...'}
          </p>
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
            targetJob={cvRole}
            onTargetJobChange={setCvRole}
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
          onOverwriteCV={handleOverwriteCV}
          onShowMyCVs={handleShowMyCVs}
          cvName={cvName}
          onNameChange={setCvName}
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
                value={modalCvName} 
                onChange={e => setModalCvName(e.target.value)} 
                placeholder="Ej: Mi CV Principal" 
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 ${isDarkMode ? 'bg-[#0b1437] border-white/10' : 'bg-white border-slate-200'}`}
              />
              {modalCvName.trim() !== '' && savedCVs.some(cv => cv.nombre_cv === modalCvName.trim()) && (
                <p className="text-red-500 text-[11px] mt-1.5 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Ya tienes un archivo con este nombre. Se sobreescribirá si guardas.
                </p>
              )}
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

      {/* PANEL LATERAL DE MIS CVS */}
      {showMyCVsModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-end p-4 sm:p-5">
          <div 
            className={`w-full max-w-md h-full flex flex-col p-6 shadow-2xl animate-slide-in-right rounded-3xl border
            ${isDarkMode ? 'bg-[#111c44] text-white border-white/10' : 'bg-[#f8fafc] text-slate-800 border-slate-200'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-violet-500" />
                Mis Currículums
              </h3>
              <button 
                onClick={() => setShowMyCVsModal(false)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {isLoadingCVs ? (
                <div className="flex justify-center items-center py-10">
                  <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : savedCVs.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  No tienes currículums guardados todavía.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {savedCVs.map((cv) => (
                    <div 
                      key={cv._id} 
                      onClick={() => handleLoadCV(cv._id)}
                      className="group relative flex items-stretch gap-6 py-4 cursor-pointer transition-all"
                    >
                      {/* Miniatura del CV real - Más grande */}
                      <div className={`w-[200px] h-[282px] rounded-lg flex-shrink-0 border shadow-sm overflow-hidden relative pointer-events-none select-none
                        ${isDarkMode ? 'border-white/20' : 'border-slate-300'}`}
                      >
                        <div className="absolute top-0 left-0 w-[800px] h-[1128px] origin-top-left bg-white" style={{ transform: 'scale(0.25)' }}>
                          <div 
                            className="ProseMirror w-full h-full p-8 text-black"
                            dangerouslySetInnerHTML={{ __html: cv.html_content || '' }} 
                          />
                        </div>
                      </div>

                      {/* Detalles del CV */}
                      <div className="flex flex-col flex-1 min-w-0 py-1 justify-between">
                        <div>
                          <h4 className="font-bold text-lg truncate mb-2 leading-tight">{cv.nombre_cv}</h4>
                          <div className="flex flex-col gap-2 text-sm text-slate-500">
                            {cv.rol_aplicado && (
                              <span className={`inline-block truncate w-fit max-w-full px-2.5 py-1 rounded-md font-medium text-xs
                                ${isDarkMode ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-50 text-violet-700'}`}
                              >
                                {cv.rol_aplicado}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5 mt-1">
                              <Clock className="w-4 h-4" />
                              {new Date(cv.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex items-center gap-2 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleDuplicateCV(cv._id, e)}
                          className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                          title="Duplicar CV"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteCV(cv._id, cv.nombre_cv, e)}
                          className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-500 hover:text-red-600'}`}
                          title="Eliminar CV"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINAR CV */}
      {cvToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center transform transition-all ${isDarkMode ? 'bg-[#111c44] border border-white/10' : 'bg-white'}`}>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              ¿Eliminar currículum?
            </h3>
            
            <p className={`text-sm mb-8 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              ¿Estás seguro de que deseas eliminar el currículum <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{cvToDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            
            <div className="flex w-full gap-3">
              <button 
                onClick={() => setCvToDelete(null)}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteCV}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/25"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN TOAST FLOTANTE */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[300] animate-slide-in-right">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border ${
            notification.type === 'success' 
              ? (isDarkMode ? 'bg-[#0f2922] border-emerald-500/30 text-emerald-100' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
              : (isDarkMode ? 'bg-[#3b1212] border-red-500/30 text-red-100' : 'bg-red-50 border-red-200 text-red-800')
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            ) : (
              <XCircle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            )}
            <p className="font-semibold">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
