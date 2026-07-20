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
  Palette,
  FileText,
  RotateCcw
} from 'lucide-react';

import { getAllTemplates, getTemplateById } from '@/lib/cv-templates';

interface MenuBarProps {
  editor: Editor;
  selectedTemplateId?: string;
  onTemplateChange?: (templateId: string) => void;
  onReloadFromProfile?: () => void;
  onSaveCV?: (html: string) => void;
  onOverwriteCV?: (html: string) => void;
  onDownloadPDF?: () => void;
  onShowMyCVs?: () => void;
  cvName?: string;
  onNameChange?: (name: string) => void;
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
  { label: '8', value: '8pt' },
  { label: '9', value: '9pt' },
  { label: '10', value: '10pt' },
  { label: '11', value: '11pt' },
  { label: '12', value: '12pt' },
  { label: '14', value: '14pt' },
  { label: '16', value: '16pt' },
  { label: '18', value: '18pt' },
  { label: '24', value: '24pt' },
  { label: '30', value: '30pt' }
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

export default function MenuBar({ editor, selectedTemplateId, onTemplateChange, onReloadFromProfile, onSaveCV, onOverwriteCV, onDownloadPDF, onShowMyCVs, cvName, onNameChange }: MenuBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const [tempSize, setTempSize] = useState('12');
  const [currentFont, setCurrentFont] = useState('Font');
  const [currentSize, setCurrentSize] = useState('12');
  const [currentBlockType, setCurrentBlockType] = useState('Normal text');
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Force MenuBar re-render and sync states on editor changes
  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      if (!editor) return;

      const textStyleAttrs = editor.getAttributes('textStyle');

      // Block type & Default Font Sizes
      let defaultSize = '12';
      if (editor.isActive('heading', { level: 1 })) {
        setCurrentBlockType('Título 1');
        defaultSize = '24';
      } else if (editor.isActive('heading', { level: 2 })) {
        setCurrentBlockType('Título 2');
        defaultSize = '18';
      } else if (editor.isActive('heading', { level: 3 })) {
        setCurrentBlockType('Título 3');
        defaultSize = '16';
      } else {
        setCurrentBlockType('Normal text');
        defaultSize = '12';
      }

      // Si no hay fuente aplicada, asume 'Arial' (o tu fuente por defecto)
      setCurrentFont(textStyleAttrs?.fontFamily || 'Arial');

      // Si hay tamaño aplicado explícitamente, úsalo, sino usa el tamaño por defecto del bloque
      if (textStyleAttrs && textStyleAttrs.fontSize) {
        const cleaned = textStyleAttrs.fontSize.replace(/[^0-9.]/g, '');
        setCurrentSize(cleaned);
        setTempSize(cleaned);
      } else {
        setCurrentSize(defaultSize);
        setTempSize(defaultSize);
      }

      setRenderTrigger(prev => prev + 1);
    };

    editor.on('transaction', updateMenu);
    editor.on('selectionUpdate', updateMenu);

    // Initial sync
    updateMenu();

    return () => {
      editor.off('transaction', updateMenu);
      editor.off('selectionUpdate', updateMenu);
    };
  }, [editor]);

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



  // Get active text alignment icon
  const getAlignIcon = () => {
    if (editor.isActive({ textAlign: 'center' })) return <AlignCenter className="w-4 h-4 text-slate-700" />;
    if (editor.isActive({ textAlign: 'right' })) return <AlignRight className="w-4 h-4 text-slate-700" />;
    if (editor.isActive({ textAlign: 'justify' })) return <AlignJustify className="w-4 h-4 text-slate-700" />;
    return <AlignLeft className="w-4 h-4 text-slate-700" />;
  };

  // Get active color
  const getActiveColor = () => {
    return editor.getAttributes('textStyle').color || '#000000';
  };

  // Helper to restrict input to numbers and dots only
  const handleSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setTempSize(value);
  };

  const handleSizeChange = (newSize: string) => {
    if (!editor || !newSize) return;
    const cleanNumber = newSize.replace(/[^0-9.]/g, '');
    // MUY IMPORTANTE: Agregar 'pt' o 'px' al final
    editor.chain().focus().setFontSize(`${cleanNumber}pt`).run(); 
  };

  return (
    <div ref={menuBarRef} className="menu-bar-container flex flex-wrap items-center gap-1.5 p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs w-full text-slate-700">
      
      {/* 1. Historial */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          onMouseDown={(e) => e.preventDefault()}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Deshacer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          onMouseDown={(e) => e.preventDefault()}
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
            onMouseDown={(e) => { e.preventDefault(); toggleDropdown(e, 'blockType'); }}
            className="flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer w-28"
          >
            <span className="truncate text-left flex-1">{currentBlockType}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>
          {activeDropdown === 'blockType' && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setParagraph().run(); setActiveDropdown(null); }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${!editor.isActive('heading') ? 'font-semibold text-violet-600 bg-slate-50' : ''}`}
              >
                Normal text
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); setActiveDropdown(null); }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${editor.isActive('heading', { level: 1 }) ? 'font-semibold text-violet-600 bg-slate-50' : ''}`}
              >
                Título 1
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); setActiveDropdown(null); }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${editor.isActive('heading', { level: 2 }) ? 'font-semibold text-violet-600 bg-slate-50' : ''}`}
              >
                Título 2
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); setActiveDropdown(null); }}
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
            onMouseDown={(e) => { e.preventDefault(); toggleDropdown(e, 'fontFamily'); }}
            className="flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer w-32"
          >
            <span className="truncate text-left flex-1">{currentFont}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>
          {activeDropdown === 'fontFamily' && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
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
                  onMouseDown={(e) => {
                    e.preventDefault();
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
            onChange={handleSizeInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSizeChange(tempSize);
                editor.commands.focus();
              }
            }}
            onBlur={() => handleSizeChange(tempSize)}
            className="w-10 px-1 py-1.5 text-xs font-semibold text-center focus:outline-none border-r border-slate-200 rounded-l-lg bg-transparent"
            title="Tamaño de letra (escribe y presiona Enter)"
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); toggleDropdown(e, 'fontSize'); }}
            className="px-1.5 py-1.5 hover:bg-slate-50 rounded-r-lg transition-colors cursor-pointer flex items-center"
            title="Elegir tamaño"
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {activeDropdown === 'fontSize' && (
            <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs max-h-48 overflow-y-auto">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSizeChange(sz.value);
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
            onMouseDown={(e) => { e.preventDefault(); toggleDropdown(e, 'alignment'); }}
            className="flex items-center justify-between gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer"
            title="Alineación"
          >
            {getAlignIcon()}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {activeDropdown === 'alignment' && (
            <div className="absolute top-full left-0 mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); setActiveDropdown(null); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-50"
              >
                <AlignLeft className="w-3.5 h-3.5" /> Izquierda
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); setActiveDropdown(null); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-50"
              >
                <AlignCenter className="w-3.5 h-3.5" /> Centro
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); setActiveDropdown(null); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-50"
              >
                <AlignRight className="w-3.5 h-3.5" /> Derecha
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('justify').run(); setActiveDropdown(null); }}
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
            onMouseDown={(e) => { e.preventDefault(); toggleDropdown(e, 'textColor'); }}
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
                    onMouseDown={(e) => {
                      e.preventDefault();
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
                onMouseDown={(e) => {
                  e.preventDefault();
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
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('bold') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Negrita (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('italic') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('underline') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Subrayado (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('strike') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Tachado"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleCode().run(); }}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('code') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Código en línea"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
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

        {/* Restaurar Perfil Icon Button */}
        {onReloadFromProfile && (
          <button
            onMouseDown={(e) => { e.preventDefault(); onReloadFromProfile(); }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer ml-1"
            title="Restaurar el contenido del CV con la información de tu perfil"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 5. Listas y Elementos */}
      <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5">
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('bulletList') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Lista de viñetas"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('orderedList') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); setLink(); }}
          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${editor.isActive('link') ? 'bg-slate-100 text-violet-600' : ''}`}
          title="Insertar enlace"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          title="Línea horizontal"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* 6. Opciones, Nombre y Estilo */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Document Name */}
        {onNameChange !== undefined && (
          <div className="flex items-center px-2 py-1.5 border border-transparent hover:border-slate-200 hover:bg-slate-50 rounded-lg transition-colors group">
            <FileText className="w-3.5 h-3.5 text-slate-400 mr-1.5 group-hover:text-violet-500 transition-colors" />
            <input
              type="text"
              value={cvName || ''}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Documento sin título"
              className="bg-transparent border-none outline-none text-xs font-semibold w-32 truncate text-slate-700 placeholder:text-slate-400 focus:ring-0 p-0"
            />
          </div>
        )}
        
        <div className="relative">
          <button
            onMouseDown={(e) => { e.preventDefault(); toggleDropdown(e, 'cvStyle'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors cursor-pointer"
          >
            <span>Estilo: {selectedTemplateId ? getTemplateById(selectedTemplateId).name : 'Seleccionar'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
          </button>
          {activeDropdown === 'cvStyle' && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
              {getAllTemplates().map((template) => (
                <button
                  key={template.id}
                  onMouseDown={(e) => { 
                    e.preventDefault(); 
                    if (onTemplateChange) onTemplateChange(template.id);
                    setActiveDropdown(null); 
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors ${
                    selectedTemplateId === template.id 
                      ? 'bg-slate-50 text-violet-700 font-semibold border-l-2 border-violet-600' 
                      : 'text-slate-700'
                  }`}
                >
                  {template.name}
                </button>
              ))}
              <div className="px-3 py-1.5 text-[10px] text-slate-400 mt-1 border-t border-slate-100">
                Próximamente más estilos...
              </div>
            </div>
          )}
        </div>

        {/* Save & Download Options Split Button */}
        <div className="relative flex items-stretch">
          <button
            onMouseDown={(e) => { 
              e.preventDefault(); 
              if (onOverwriteCV && editor) onOverwriteCV(editor.getHTML());
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 border border-violet-600 rounded-l-lg transition-colors cursor-pointer"
            title="Guardar cambios (Sobreescribir)"
          >
            <span>Guardar</span>
          </button>
          <button
            onMouseDown={(e) => { 
              e.preventDefault(); 
              toggleDropdown(e, 'saveOptions'); 
            }}
            className="flex items-center justify-center px-1.5 py-1.5 bg-violet-600 text-white hover:bg-violet-700 border border-violet-600 border-l-violet-700 rounded-r-lg transition-colors cursor-pointer"
            title="Opciones de guardado"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          
          {activeDropdown === 'saveOptions' && (
            <div className="absolute top-full right-0 pt-1 w-48 z-50">
              <div className="bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-xs">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setActiveDropdown(null);
                    if (onSaveCV && editor) {
                      onSaveCV(editor.getHTML());
                    }
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                >
                  Guardar nuevo borrador
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setActiveDropdown(null);
                    if (onDownloadPDF) {
                      onDownloadPDF();
                    }
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium transition-colors border-t border-slate-100"
                >
                  Descargar como PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
