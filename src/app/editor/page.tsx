'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import RichTextEditor from './components/RichTextEditor';
import './editor.css';

export default function EditorPage() {
  return (
    <div className="editor-page-container">
      {/* 1. BARRA LATERAL REUTILIZABLE (Sidebar) */}
      <Sidebar />

      {/* 2. COLUMNA CENTRAL (Espacio Reservado para el Asistente) */}
      <section className="middle-column">
        <div className="middle-header">
          <h2 className="middle-title">Modifica tu CV</h2>
        </div>

        {/* Espacio en blanco reservado para el chatbot */}
        <div className="blank-assistant-area">
          <span>El asistente de chat se integrará en este espacio próximamente.</span>
        </div>
      </section>

      {/* 3. COLUMNA DERECHA (Editor Tiptap de Documento) */}
      <section className="right-column px-6 py-4">
        <RichTextEditor />
      </section>
    </div>
  );
}
