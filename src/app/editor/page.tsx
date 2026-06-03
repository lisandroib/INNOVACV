'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import RichTextEditor from './components/RichTextEditor';
import ChatAssistant from './components/ChatAssistant';
import './editor.css';

export default function EditorPage() {
  const [activeSection, setActiveSection] = useState('General');
  const [resumeContext, setResumeContext] = useState('');

  const handleSectionChange = (section: string, text: string) => {
    setActiveSection(section);
    setResumeContext(text);
  };

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
        <RichTextEditor onSectionChange={handleSectionChange} />
      </section>
    </div>
  );
}
