'use client';

import React, { useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';

import { FontSize } from './FontSize';
import MenuBar from './MenuBar';

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
}

const DEFAULT_CV_CONTENT = `
  <h1>Firstname Lastname</h1>
  <div class="cv-contact-info">
    <span>Home Street Address</span> | 
    <span>City, State Zip</span> | 
    <span>Your email</span> | 
    <span>phone number</span>
  </div>

  <h2>Education</h2>
  <h3>Harvard University</h3>
  <p style="display: flex; justify-content: space-between; font-weight: 700; margin: 0;">
    <span>Degree, Concentration. GPA [Note: Optional]</span>
    <span>Graduation Date</span>
  </p>
  <p>Thesis [Note: Optional]</p>
  <p>Relevant Coursework: [Note: Optional. Awards and honors can also be listed here.]</p>

  <h3>Study Abroad [Note: If Applicable]</h3>
  <p style="display: flex; justify-content: space-between; font-weight: 700; margin: 0;">
    <span>Study abroad coursework in...</span>
    <span>Month Year - Month Year</span>
  </p>

  <h2>Experience</h2>
  <h3>Organization</h3>
  <p style="display: flex; justify-content: space-between; font-weight: 700; margin: 0;">
    <span>Position Title</span>
    <span>Month Year - Month Year</span>
  </p>
  <ul>
    <li>Beginning with your most recent position, describe your experience, skills, and resulting outcomes in bullet or paragraph form.</li>
    <li>Begin each line with an action verb and include details that will help the reader understand your accomplishments, skills, knowledge, abilities, or achievements.</li>
    <li>Quantify where possible.</li>
    <li>Do not use personal pronouns; each line should be a phrase rather than a full sentence.</li>
  </ul>

  <h2>Leadership & Activities</h2>
  <h3>Organization</h3>
  <p style="display: flex; justify-content: space-between; font-weight: 700; margin: 0;">
    <span>Role</span>
    <span>Month Year - Month Year</span>
  </p>
  <ul>
    <li>This section can be formatted similarly to the Experience section, or you can omit descriptions for activities.</li>
    <li>If this section is more relevant to the opportunity you are applying for, consider moving this above your Experience section.</li>
  </ul>
`;

export default function RichTextEditor({ initialContent, onChange }: RichTextEditorProps) {
  const extensions = useMemo(() => [
    StarterKit.configure({
      history: {
        depth: 100,
        newGroupDelay: 500,
      },
    }),
    Underline,
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
  ], []);

  const editor = useEditor({
    extensions,
    content: initialContent || DEFAULT_CV_CONTENT,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[1120px] ProseMirror text-slate-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1',
      },
    },
  });

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        Cargando editor de texto...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Barra de Herramientas */}
      <div className="sticky top-0 z-30 bg-[#f1f5f9] pb-3 border-b border-slate-200">
        <MenuBar editor={editor} />
      </div>

      {/* Contenedor de la Hoja A4 Scrollable */}
      <div className="document-scroll-container">
        <div className="a4-sheet mt-4">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
