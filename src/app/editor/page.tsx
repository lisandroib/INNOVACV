'use client';

'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import RichTextEditor from './components/RichTextEditor';
import ChatAssistant from './components/ChatAssistant';
import './editor.css';

import { getTemplateById } from '@/lib/cv-templates';

export default function EditorPage() {
  const [activeSection, setActiveSection] = useState('General');
  const [resumeContext, setResumeContext] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('harvard');
  const [initialContent, setInitialContent] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/perfil');
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            setUserData(data);
            setInitialContent(getTemplateById('harvard').generateHTML(data));
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSectionChange = (section: string, text: string) => {
    setActiveSection(section);
    setResumeContext(text);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setInitialContent(getTemplateById(templateId).generateHTML(userData));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
        <div className="text-slate-500 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Cargando tus datos del perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page-container">
      {/* 1. BARRA LATERAL REUTILIZABLE (Sidebar) */}
      <Sidebar />

      {/* 2. COLUMNA CENTRAL (Asistente de IA) */}
      <section className="middle-column p-4 flex flex-col h-full overflow-hidden">
        <div className="middle-header mb-3">
          <h2 className="middle-title">Asistente de IA</h2>
        </div>

        <div className="flex-1 min-h-0">
          <ChatAssistant activeSection={activeSection} resumeContext={resumeContext} />
        </div>
      </section>

      {/* 3. COLUMNA DERECHA (Editor Tiptap de Documento) */}
      <section className="right-column px-6 py-4">
        <RichTextEditor 
          initialContent={initialContent} 
          onSectionChange={handleSectionChange} 
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={handleTemplateChange}
        />
      </section>
    </div>
  );
}
