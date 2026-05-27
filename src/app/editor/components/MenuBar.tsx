'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Eraser,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  FileCode,
  Quote,
  Minus,
  ChevronDown,
  Palette
} from 'lucide-react';

interface MenuBarProps {
  editor: Editor;
}

const FONTS = [
  { name: 'Arial', value: 'Arial' },
  { name: 'Helvetica', value: 'Helvetica' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Garamond', value: 'Garamond' },
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Open Sans', value: 'Open Sans' },
  { name: 'Verdana', value: 'Verdana' }
];

const FONT_SIZES = [
  { label: '8pt', value: '8pt' },
  { label: '9pt', value: '9pt' },
  { label: '10pt', value: '10pt' },
  { label: '11pt', value: '11pt' },
  { label: '12pt', value: '12pt' },
  { label: '14pt', value: '14pt' },
  { label: '16pt', value: '16pt' },
  { label: '18pt', value: '18pt' },
  { label: '24pt', value: '24pt' },
  { label: '30pt', value: '30pt' }
];

const PRESET_COLORS = [
  '#000000', // Negro puro
  '#2d3748', // Gris oscuro
  '#1a365d', // Azul marino
  '#2b6cb0', // Azul cobalto
  '#22543d', // Verde oscuro
  '#718096', // Gris medio
  '#e53e3e', // Rojo profesional
  '#dd6b20', // Naranja profesional
  '#319795', // Teal/Turquesa
  '#805ad5'  // Violeta/Púrpura
];

export default function MenuBar({ editor }: MenuBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const [tempSize, setTempSize] = useState('12pt');

  // Sync tempSize with active font size from editor
  const activeFontSize = editor.getAttributes('textStyle').fontSize || '12pt';
  useEffect(() => {
    setTempSize(activeFontSize);
  }, [activeFontSize]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const toggleDropdown = (e: React.MouseEvent, name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);
    
    // cancelled
    if (url === null) {
      return;
    }
    
    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('URL de la imagen:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Get active text alignment icon
  const getAlignIcon = () => {
    if (editor.isActive({ textAlign: 'center' })) return <AlignCenter className="w-4 h-4 text-slate-700" />;
    if (editor.isActive({ textAlign: 'right' })) return <AlignRight className="w-4 h-4 text-slate-700" />;
    if (editor.isActive({ textAlign: 'justify' })) return <AlignJustify className="w-4 h-4 text-slate-700" />;
    return <AlignLeft className="w-4 h-4 text-slate-700" />;
  };

  // Get active block type label
  const getBlockTypeLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Título 1';
    if (editor.isActive('heading', { level: 2 })) return 'Título 2';
    if (editor.isActive('heading', { level: 3 })) return 'Título 3';
    return 'Normal text';
  };

  // Get active Font Family label
  const getFontFamilyLabel = () => {
    const activeFont = editor.getAttributes('textStyle').fontFamily;
    const found = FONTS.find(f => f.value === activeFont);
    return found ? found.name : 'Font';
  };

  // Get active Font Size label
  const getFontSizeLabel = () => {
    const activeSize = editor.getAttributes('textStyle').fontSize;
    return activeSize || 'Size';
  };

  // Get active color
  const getActiveColor = () => {
    return editor.getAttributes('textStyle').color || '#000000';
  };

  return (
    <div ref={menuBarRef} className="flex flex-wrap items-center gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs w-full text-slate-700">
      
      {/* 1. Historial */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Deshacer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Rehacer"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Estilo y Tipografía (Pills Style) */}
      <div className="flex items-center gap-1.5 border-r border-slate-200 pr-1.5">
        {/* Block Type Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => toggleDropdown(e, 'blockType')}
            className="flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer min-w-[100px]"
          >
            <span>{getBlockTypeLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {activeDropdown === 'blockType' && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
              <button
                onClick={() => { editor.chain().focus().setParagraph().run(); setActiveDropdown(null); }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${!editor.isActive('heading') ? 'font-semibold text-violet-600 bg-slate-50' : ''}`}
              >
                Normal text
              </button>
              <button
                onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setActiveDropdown(null); }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${editor.isActive('heading', { level: 1 }) ? 'font-semibold text-violet-600 bg-slate-50' : ''}`}
              >
                Título 1
              </button>
              <button
                onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setActiveDropdown(null); }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${editor.isActive('heading', { level: 2 }) ? 'font-semibold text-violet-600 bg-slate-50' : ''}`}
              >
                Título 2
              </button>
              <button
                onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setActiveDropdown(null); }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${editor.isActive('heading', { level: 3 }) ? 'font-semibold text-violet-600 bg-slate-50' : ''}`}
              >
                Título 3
              </button>
            </div>
          )}
        </div>

        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => toggleDropdown(e, 'fontFamily')}
            className="flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer min-w-[90px]"
          >
            <span>{getFontFamilyLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {activeDropdown === 'fontFamily' && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
              <button
                onClick={() => {
                  editor.chain().focus().unsetFontFamily().run();
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-400"
              >
                Restablecer
              </button>
              {FONTS.map(f => (
                <button
                  key={f.name}
                  onClick={() => {
                    editor.chain().focus().setFontFamily(f.value).run();
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50"
                  style={{ fontFamily: f.value }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Dropdown / Input */}
        <div className="relative flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
          <input
            type="text"
            value={tempSize}
            onChange={(e) => setTempSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                let size = tempSize.trim();
                if (size) {
                  if (/^\d+$/.test(size)) size = size + 'pt';
                  editor.chain().focus().setFontSize(size).run();
                }
              }
            }}
            onBlur={() => {
              let size = tempSize.trim();
              if (size) {
                if (/^\d+$/.test(size)) size = size + 'pt';
                editor.chain().focus().setFontSize(size).run();
              }
            }}
            className="w-10 px-1 py-1.5 text-xs font-semibold text-center focus:outline-none border-r border-slate-200 rounded-l-lg bg-transparent"
            title="Tamaño de letra (escribe y presiona Enter)"
          />
          <button
            onClick={(e) => toggleDropdown(e, 'fontSize')}
            className="px-1.5 py-1.5 hover:bg-slate-50 rounded-r-lg transition-colors cursor-pointer flex items-center"
            title="Elegir tamaño"
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {activeDropdown === 'fontSize' && (
            <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs max-h-48 overflow-y-auto">
              <button
                onClick={() => {
                  editor.chain().focus().unsetFontSize().run();
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-400"
              >
                Reset
              </button>
              {FONT_SIZES.map(sz => (
                <button
                  key={sz.value}
                  onClick={() => {
                    editor.chain().focus().setFontSize(sz.value).run();
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50"
                >
                  {sz.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Párrafo y Color */}
      <div className="flex items-center gap-1.5 border-r border-slate-200 pr-1.5">
        {/* Alignment Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => toggleDropdown(e, 'alignment')}
            className="flex items-center justify-between gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer"
            title="Alineación"
          >
            {getAlignIcon()}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {activeDropdown === 'alignment' && (
            <div className="absolute top-full left-0 mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
              <button
                onClick={() => { editor.chain().focus().setTextAlign('left').run(); setActiveDropdown(null); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-50"
              >
                <AlignLeft className="w-3.5 h-3.5" /> Izquierda
              </button>
              <button
                onClick={() => { editor.chain().focus().setTextAlign('center').run(); setActiveDropdown(null); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-50"
              >
                <AlignCenter className="w-3.5 h-3.5" /> Centro
              </button>
              <button
                onClick={() => { editor.chain().focus().setTextAlign('right').run(); setActiveDropdown(null); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-50"
              >
                <AlignRight className="w-3.5 h-3.5" /> Derecha
              </button>
              <button
                onClick={() => { editor.chain().focus().setTextAlign('justify').run(); setActiveDropdown(null); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-50"
              >
                <AlignJustify className="w-3.5 h-3.5" /> Justificado
              </button>
            </div>
          )}
        </div>

        {/* Text Color Picker */}
        <div className="relative">
          <button
            onClick={(e) => toggleDropdown(e, 'textColor')}
            className="flex items-center justify-between gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer"
            title="Color de texto"
          >
            <Palette className="w-4 h-4" style={{ color: getActiveColor() }} />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {activeDropdown === 'textColor' && (
            <div className="absolute top-full left-0 mt-1 p-2.5 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-44 flex flex-col gap-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Colores profesionales</span>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      editor.chain().focus().setColor(c).run();
                      setActiveDropdown(null);
                    }}
                    className="w-6 h-6 rounded-md border border-slate-200 cursor-pointer shadow-xs"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              
              <div className="flex flex-col gap-1 border-t border-slate-100 pt-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Color personalizado</span>
                <input
                  type="color"
                  value={getActiveColor()}
                  onChange={(e) => {
                    editor.chain().focus().setColor(e.target.value).run();
                  }}
                  className="w-full h-8 cursor-pointer rounded border border-slate-200"
                />
              </div>

              <button
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setActiveDropdown(null);
                }}
                className="w-full text-center text-xs py-1.5 mt-1 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer text-slate-600 font-semibold"
              >
                Automático (Restablecer)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Formato de Texto */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('bold') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Negrita (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('italic') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('underline') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Subrayado (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('strike') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Tachado"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('code') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Código en línea"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            editor.chain().focus()
              .unsetAllMarks()
              .clearNodes()
              .unsetFontSize()
              .unsetFontFamily()
              .unsetColor()
              .run();
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-500"
          title="Borrar formato"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      {/* 5. Listas y Elementos */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('bulletList') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Lista de viñetas"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('orderedList') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={setLink}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('link') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Insertar enlace"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          onClick={addImage}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Insertar imagen"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('codeBlock') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Bloque de código"
        >
          <FileCode className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('blockquote') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Cita"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Línea horizontal"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* 6. CV Styles */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="relative">
          <button
            onClick={(e) => toggleDropdown(e, 'cvStyle')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors cursor-pointer"
          >
            <span>Estilo: Harvard (ATS)</span>
            <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
          </button>
          {activeDropdown === 'cvStyle' && (
            <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
              <button
                onClick={() => setActiveDropdown(null)}
                className="w-full text-left px-3 py-2 bg-slate-50 text-violet-700 font-semibold border-l-2 border-violet-600"
              >
                Harvard Layout (ATS)
              </button>
              <div className="px-3 py-1.5 text-[10px] text-slate-400">
                Próximamente más estilos...
              </div>
            </div>
          )}
        </div>

        <button 
          className="bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white border border-violet-950 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-md transition-all transform hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
        >
          Descargar PDF
        </button>
      </div>

    </div>
  );
}
