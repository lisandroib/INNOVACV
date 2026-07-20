'use client';

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import './profile.css';
import { GooeyLoader } from '@/components/GooeyLoader';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar estado de modo oscuro desde localStorage de forma segura
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Cerrar todos los modales cuando el usuario cambia de pestaña/subsección
  useEffect(() => {
    setIsModalOpen(false);
    setIsEduModalOpen(false);
    setIsExpModalOpen(false);
    setIsSkillModalOpen(false);
    setIsUploadModalOpen(false);
    setIsDeleteModalOpen(false);
  }, [activeTab]);

  // Cargar perfil desde MongoDB
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/perfil');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const dbData = json.data;
            
            if (dbData.datos_personales) {
              const full = dbData.datos_personales.nombre_completo || '';
              const parts = full.split(' ');
              if (parts[0]) setNombre(parts[0]);
              if (parts.length > 1) setApellido(parts.slice(1).join(' '));
              
              if (dbData.datos_personales.fecha_nacimiento) setFechaNacimiento(dbData.datos_personales.fecha_nacimiento);
              if (dbData.datos_personales.telefono) setTelefono(dbData.datos_personales.telefono);
              if (dbData.datos_personales.linkedin) setLinkedin(dbData.datos_personales.linkedin);
              
              if (dbData.datos_personales.ubicacion) {
                const ciudadDB = dbData.datos_personales.ubicacion.ciudad || '';
                const provDB = dbData.datos_personales.ubicacion.provincia || '';
                const ub = `${ciudadDB}${ciudadDB && provDB ? ', ' : ''}${provDB}`;
                
                if (ub && ub.trim() !== '' && !ub.includes('{{')) {
                  setCiudad(ub);
                } else {
                  // Si no hay ubicación válida, intentar obtenerla automáticamente
                  fetch('https://ipapi.co/json/')
                    .then(r => r.json())
                    .then(geo => {
                      if (geo && geo.city && geo.country_name) {
                        setCiudad(`${geo.city}, ${geo.country_name}`);
                        fetch('/api/perfil', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            "datos_personales.ubicacion.ciudad": geo.city,
                            "datos_personales.ubicacion.provincia": geo.country_name 
                          })
                        }).catch(e => console.error("Error guardando ubicacion:", e));
                      }
                    })
                    .catch(e => console.error("Error obteniendo IP local:", e));
                }
              } else {
                // Si no hay objeto ubicación, intentar obtenerla automáticamente
                fetch('https://ipapi.co/json/')
                  .then(r => r.json())
                  .then(geo => {
                    if (geo && geo.city && geo.country_name) {
                      setCiudad(`${geo.city}, ${geo.country_name}`);
                      fetch('/api/perfil', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          "datos_personales.ubicacion.ciudad": geo.city,
                          "datos_personales.ubicacion.provincia": geo.country_name 
                        })
                      }).catch(e => console.error("Error guardando ubicacion:", e));
                    }
                  })
                  .catch(e => console.error("Error obteniendo IP local:", e));
              }
            }
            
            if (dbData.datos_personales?.correo_electronico || dbData.datos_personales?.email) {
              setMail(dbData.datos_personales.correo_electronico || dbData.datos_personales.email);
            } else if (dbData.email_registro) {
              setMail(dbData.email_registro);
            }

            if (dbData.experiencia_laboral && dbData.experiencia_laboral.trabajo_actual) {
              const ta = dbData.experiencia_laboral.trabajo_actual;
              if (ta.empresa && ta.puesto) {
                setExperiences([{
                  id: 'db_actual',
                  anioInicio: ta.fecha_inicio || '',
                  anioFin: ta.fecha_fin || 'actualidad',
                  position: ta.puesto,
                  company: ta.empresa,
                  desc: ta.descripcion || ''
                }]);
              }
            }

            if (dbData.habilidades) {
              let newSkills: any[] = [];
              const toArray = (val: any) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                if (typeof val === 'string') return val.split(',');
                return [];
              };
              
              if (dbData.habilidades.detalles && Array.isArray(dbData.habilidades.detalles)) {
                // Si ya existe la versión detallada, la usamos
                newSkills = dbData.habilidades.detalles;
              } else {
                // Modo retrocompatibilidad
                const duras = [
                  ...toArray(dbData.habilidades.duras),
                  ...toArray(dbData.habilidades.duras_seleccionadas),
                  ...toArray(dbData.habilidades.duras_manuales)
                ].map((s: string) => s.trim()).filter(Boolean);
                
                Array.from(new Set(duras)).forEach((s, i) => {
                  newSkills.push({ id: `d${i}`, nombre: s, tipo: 'Dura', origen: '' });
                });

                const blandas = [
                  ...toArray(dbData.habilidades.blandas),
                  ...toArray(dbData.habilidades.blandas_seleccionadas),
                  ...toArray(dbData.habilidades.blandas_manuales)
                ].map((s: string) => s.trim()).filter(Boolean);
                
                Array.from(new Set(blandas)).forEach((s, i) => {
                  newSkills.push({ id: `b${i}`, nombre: s, tipo: 'Blanda', origen: '' });
                });
              }

              if (newSkills.length > 0) setSkills(newSkills);
            }
            
            if (dbData.educacion) {
              let edu = [];
              if (dbData.educacion.grado && dbData.educacion.grado.titulo) {
                edu.push({ id: 'g1', institucion: dbData.educacion.grado.institucion || '', titulo: dbData.educacion.grado.carrera || dbData.educacion.grado.titulo, anioInicio: dbData.educacion.grado.ano_inicio || '', anioFin: dbData.educacion.grado.ano_fin || '' });
              }
              if (dbData.educacion.terciario && dbData.educacion.terciario.titulo) {
                edu.push({ id: 't1', institucion: dbData.educacion.terciario.institucion || '', titulo: dbData.educacion.terciario.carrera || dbData.educacion.terciario.titulo, anioInicio: dbData.educacion.terciario.ano_inicio || '', anioFin: dbData.educacion.terciario.ano_fin || '' });
              }
              if (dbData.educacion.secundario && dbData.educacion.secundario.titulo) {
                edu.push({ id: 's1', institucion: dbData.educacion.secundario.institucion || '', titulo: dbData.educacion.secundario.titulo, anioInicio: '', anioFin: dbData.educacion.secundario.ultimo_ano || '' });
              }
              if (edu.length > 0) setFormalEducation(edu);
            }

            const dbCursos = dbData.cursos || (dbData.educacion && dbData.educacion.cursos);
            if (dbCursos && Array.isArray(dbCursos)) {
              setCourses(dbCursos);
            }

            if (dbData.proyectos && Array.isArray(dbData.proyectos) && dbData.proyectos.length > 0) {
              setProyectos(dbData.proyectos);
            } else if (dbData.proyectos_alternativos && dbData.proyectos_alternativos.trim() !== '') {
              setProyectosAlternativos(dbData.proyectos_alternativos);
              setProyectos([{
                id: 'legacy_p1',
                nombre: 'Proyectos y Experiencia Alternativa',
                rol: '',
                fecha: '',
                desc: dbData.proyectos_alternativos
              }]);
            }
          } else {
            // Si el usuario no tiene perfil guardado en Mongo, lo obligamos a ir al chat
            window.location.href = '/chat';
          }
        }
      } catch (err) {
        console.error("Error cargando perfil", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Manejador del movimiento del ratón para crear el efecto Aurora Glow Mesh en el perfil
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    document.documentElement.style.setProperty('--mouse-x', `${clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${clientY}px`);
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const saveProfileToDB = async (overrides: {
    nextNombre?: string;
    nextApellido?: string;
    nextFechaNacimiento?: string;
    nextCiudad?: string;
    nextMail?: string;
    nextTelefono?: string;
    nextLinkedin?: string;
    nextAvatarUrl?: string;
    nextExperiences?: any[];
    nextFormalEducation?: any[];
    nextCourses?: any[];
    nextSkills?: any[];
    nextProyectos?: any[];
    nextProyectosAlternativos?: string;
  } = {}) => {
    const finalNombre = overrides.nextNombre !== undefined ? overrides.nextNombre : nombre;
    const finalApellido = overrides.nextApellido !== undefined ? overrides.nextApellido : apellido;
    const finalFechaNacimiento = overrides.nextFechaNacimiento !== undefined ? overrides.nextFechaNacimiento : fechaNacimiento;
    const finalCiudad = overrides.nextCiudad !== undefined ? overrides.nextCiudad : ciudad;
    const finalMail = overrides.nextMail !== undefined ? overrides.nextMail : mail;
    const finalTelefono = overrides.nextTelefono !== undefined ? overrides.nextTelefono : telefono;
    const finalLinkedin = overrides.nextLinkedin !== undefined ? overrides.nextLinkedin : linkedin;
    const finalExperiences = overrides.nextExperiences !== undefined ? overrides.nextExperiences : experiences;
    const finalFormalEducation = overrides.nextFormalEducation !== undefined ? overrides.nextFormalEducation : formalEducation;
    const finalSkills = overrides.nextSkills !== undefined ? overrides.nextSkills : skills;
    const finalCourses = overrides.nextCourses !== undefined ? overrides.nextCourses : courses;
    const finalProyectos = overrides.nextProyectos !== undefined ? overrides.nextProyectos : proyectos;
    const finalProyectosAlternativos = overrides.nextProyectosAlternativos !== undefined ? overrides.nextProyectosAlternativos : proyectosAlternativos;

    const cleanCiudad = finalCiudad.split(',')[0]?.trim() || '';
    const cleanProvincia = finalCiudad.split(',')[1]?.trim() || '';

    const ta = finalExperiences.find(e => e.anioFin === 'actualidad' || e.id === 'db_actual');
    const hist = finalExperiences.filter(e => e !== ta);

    const findEdu = (id: string, keyword: string) => {
      let found = finalFormalEducation.find(e => e.id === id);
      if (!found) {
        found = finalFormalEducation.find(e => e.titulo.toLowerCase().includes(keyword) || e.institucion.toLowerCase().includes(keyword));
      }
      return found;
    };

    const gradoObj = findEdu('g1', 'grad') || findEdu('g1', 'ingenier') || findEdu('g1', 'licenci') || finalFormalEducation.find(e => e.id !== 't1' && e.id !== 's1' && !e.titulo.toLowerCase().includes('secundar') && !e.titulo.toLowerCase().includes('terciar'));
    const terciarioObj = findEdu('t1', 'terciar') || findEdu('t1', 'tecnic') || finalFormalEducation.find(e => e.id === 't1');
    const secundarioObj = findEdu('s1', 'secundar') || findEdu('s1', 'colegio') || finalFormalEducation.find(e => e.id === 's1');

    const durasArr = finalSkills.filter((s: any) => s.tipo === 'Dura').map((s: any) => s.nombre);
    const blandasArr = finalSkills.filter((s: any) => s.tipo === 'Blanda').map((s: any) => s.nombre);

    const payload = {
      datos_personales: {
        nombre_completo: `${finalNombre} ${finalApellido}`.trim(),
        fecha_nacimiento: finalFechaNacimiento,
        correo_electronico: finalMail,
        telefono: finalTelefono,
        linkedin: finalLinkedin,
        ubicacion: {
          ciudad: cleanCiudad,
          provincia: cleanProvincia
        }
      },
      email_registro: finalMail,
      experiencia_laboral: {
        trabajo_actual: ta ? {
          empresa: ta.company,
          puesto: ta.position,
          fecha_inicio: ta.anioInicio ? String(ta.anioInicio).toUpperCase() : '',
          fecha_fin: ta.anioFin ? String(ta.anioFin).toUpperCase() : '',
          descripcion: ta.desc
        } : null,
        historial: hist.map(h => ({
          empresa: h.company,
          puesto: h.position,
          fecha_inicio: h.anioInicio ? String(h.anioInicio).toUpperCase() : '',
          fecha_fin: h.anioFin ? String(h.anioFin).toUpperCase() : '',
          descripcion: h.desc
        }))
      },
      educacion: {
        secundario: secundarioObj ? {
          institucion: secundarioObj.institucion,
          titulo: secundarioObj.titulo,
          ultimo_ano: secundarioObj.anioFin
        } : null,
        terciario: terciarioObj ? {
          institucion: terciarioObj.institucion,
          carrera: terciarioObj.titulo,
          titulo: terciarioObj.titulo,
          ano_inicio: terciarioObj.anioInicio,
          ano_fin: terciarioObj.anioFin
        } : null,
        grado: gradoObj ? {
          institucion: gradoObj.institucion,
          carrera: gradoObj.titulo,
          titulo: gradoObj.titulo,
          ano_inicio: gradoObj.anioInicio,
          ano_fin: gradoObj.anioFin
        } : null,
        cursos: finalCourses
      },
      habilidades: {
        duras: durasArr.join(', '),
        blandas: blandasArr.join(', '),
        detalles: finalSkills
      },
      cursos: finalCourses,
      proyectos: finalProyectos,
      proyectos_alternativos: finalProyectosAlternativos
    };

    try {
      await fetch('/api/perfil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('profile_updated', 'true');
      }
    } catch (err) {
      console.error('Error al guardar perfil en la base de datos:', err);
    }
  };

  // Estados de datos personales
  const [expFilterTab, setExpFilterTab] = useState<'laboral' | 'proyecto'>('laboral');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400');
  const [nombre, setNombre] = useState('Nombre');
  const [apellido, setApellido] = useState('Apellido');
  const [fechaNacimiento, setFechaNacimiento] = useState('dd/mm/aaaa');
  const [ciudad, setCiudad] = useState('...');
  const [mail, setMail] = useState('ejemplo@mail.com');
  const [telefono, setTelefono] = useState('+11 111 111 1111');
  const [linkedin, setLinkedin] = useState('...');
  const [proyectosAlternativos, setProyectosAlternativos] = useState('');
  const [proyectos, setProyectos] = useState<Array<{
    id: string;
    nombre: string;
    rol: string;
    fecha: string;
    desc: string;
  }>>([]);

  // Estado del modal de edición personal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados temporales del formulario personal
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');
  const [tempNombre, setTempNombre] = useState('');
  const [tempApellido, setTempApellido] = useState('');
  const [tempFechaNacimiento, setTempFechaNacimiento] = useState('');
  const [tempCiudad, setTempCiudad] = useState('');
  const [tempMail, setTempMail] = useState('');
  const [tempTelefono, setTempTelefono] = useState('');
  const [tempLinkedin, setTempLinkedin] = useState('');

  // Estados de errores para formularios
  const [errorsProfile, setErrorsProfile] = useState<{ mail?: string; telefono?: string }>({});
  const [errorsExp, setErrorsExp] = useState<{
    position?: string;
    company?: string;
    desc?: string;
    anioInicio?: string;
    anioFin?: string;
  }>({});

  // Estados de Educación
  const [formalEducation, setFormalEducation] = useState<any[]>([]);

  const [courses, setCourses] = useState<any[]>([]);

  // Estados del modal de educación
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [editingEduType, setEditingEduType] = useState<'formal' | 'course'>('formal');
  const [editingEduId, setEditingEduId] = useState<string | null>(null);

  // Estados temporales del formulario de educación
  const [eduInstitucion, setEduInstitucion] = useState('');
  const [eduTitulo, setEduTitulo] = useState('');
  const [eduAnioInicio, setEduAnioInicio] = useState('');
  const [eduAnioFin, setEduAnioFin] = useState('');

  const [courseTitulo, setCourseTitulo] = useState('');
  const [courseInstitucion, setCourseInstitucion] = useState('');
  const [courseAnio, setCourseAnio] = useState('');

  // Estado de errores para educación
  const [errorsEdu, setErrorsEdu] = useState<{
    eduInstitucion?: string;
    eduTitulo?: string;
    eduAnioInicio?: string;
    eduAnioFin?: string;
    courseTitulo?: string;
    courseInstitucion?: string;
    courseAnio?: string;
  }>({});

  // Carga e importación
  const [isImporting, setIsImporting] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const activeUploadIntervals = useRef<Record<string, NodeJS.Timeout>>({});

  // Estados de Habilidades
  const [skills, setSkills] = useState<Array<{
    id: string;
    nombre: string;
    descripcion?: string;
    tipo?: 'Dura' | 'Blanda' | '';
    origen?: string;
  }>>([]);

  // Estados de modal de habilidades
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  // Estados temporales de formulario de habilidades
  const [skillNombre, setSkillNombre] = useState('');
  const [skillTipo, setSkillTipo] = useState<'Dura' | 'Blanda' | ''>('');
  const [skillOrigen, setSkillOrigen] = useState('');

  // Estados para el dropdown custom de habilidades
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer click fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Estado de errores para habilidades
  const [errorsSkill, setErrorsSkill] = useState<{ nombre?: string; tipo?: string; origen?: string }>({});

  // --- ESTADOS PARA CONFIRMACIÓN DE ELIMINACIÓN CUSTOMIZADA (MEDIO DE LA PANTALLA) ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [itemToDeleteName, setItemToDeleteName] = useState('');
  const [itemToDeleteType, setItemToDeleteType] = useState<'skill' | 'formal' | 'course' | 'experience' | 'proyecto' | null>(null);

  // --- ESTADOS Y CONSTANTES PARA EL DATE PICKER CUSTOMIZADO (FECHA NACIMIENTO) ---
  const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [navDate, setNavDate] = useState<Date>(new Date(1995, 0, 1));
  const [isSelectingYear, setIsSelectingYear] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() + 1, 1));
  };

  const handlePrevYear = () => {
    setNavDate(new Date(navDate.getFullYear() - 1, navDate.getMonth(), 1));
  };

  const handleNextYear = () => {
    setNavDate(new Date(navDate.getFullYear() + 1, navDate.getMonth(), 1));
  };

  // Clics externos y tecla Escape para el Date Picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    }

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalendarOpen]);

  // Estado del giro del avatar (Código QR)
  const [isFlipped, setIsFlipped] = useState(false);

  // Referencia para la carga de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formatear fecha AAAA-MM-DD a DD/MM/AAAA para mostrar en la tarjeta
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'dd/mm/aaaa' || dateStr.indexOf('-') === -1) {
      return dateStr;
    }
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Abrir modal personal y pre-cargar datos
  const handleOpenModal = () => {
    setTempAvatarUrl(avatarUrl);
    setTempNombre('');
    setTempApellido('');
    
    const validDate = fechaNacimiento !== 'dd/mm/aaaa' ? fechaNacimiento : '';
    setTempFechaNacimiento(validDate);
    setTempCiudad('');
    setTempMail('');
    setTempTelefono('');
    setTempLinkedin('');
    setIsCalendarOpen(false);
    setIsSelectingYear(false);
    setIsDeleteModalOpen(false);
    setItemToDeleteId(null);
    setItemToDeleteName('');
    setItemToDeleteType(null);

    // Inicializar navDate con la fecha actual o 1995-01-01
    if (validDate && validDate.includes('-')) {
      const [yr, mn, dy] = validDate.split('-').map(Number);
      if (!isNaN(yr) && !isNaN(mn)) {
        setNavDate(new Date(yr, mn - 1, 1));
      } else {
        setNavDate(new Date(1995, 0, 1));
      }
    } else {
      setNavDate(new Date(1995, 0, 1));
    }

    setErrorsProfile({}); // Limpiar errores anteriores
    setIsModalOpen(true);
  };

  // Cerrar modal personal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Guardar cambios del formulario personal (usa fallback si el input quedó en blanco)
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errorsProfile = {};

    // Validar email si fue modificado
    if (tempMail.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(tempMail.trim())) {
        newErrors.mail = "Por favor, ingrese una dirección de correo electrónico válida (ejemplo@mail.com).";
      }
    }

    // Validar formato del teléfono argentino si fue modificado
    if (tempTelefono.trim() !== '') {
      const phoneRegex = /^[+]?[0-9\s()-]{7,20}$/;
      if (!phoneRegex.test(tempTelefono.trim())) {
        newErrors.telefono = "Formato de teléfono inválido (ej: +54 9 11 1234-5678, solo números y signos telefónicos).";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrorsProfile(newErrors);
      return;
    }

    const nextNombre = tempNombre.trim() || nombre;
    const nextApellido = tempApellido.trim() || apellido;
    const nextFechaNacimiento = tempFechaNacimiento.trim() || fechaNacimiento;
    const nextCiudad = tempCiudad.trim() || ciudad;
    const nextMail = tempMail.trim() || mail;
    const nextTelefono = tempTelefono.trim() || telefono;
    const nextLinkedin = tempLinkedin.trim() || linkedin;
    const nextAvatarUrl = tempAvatarUrl || avatarUrl;

    setAvatarUrl(nextAvatarUrl);
    setNombre(nextNombre);
    setApellido(nextApellido);
    setFechaNacimiento(nextFechaNacimiento);
    setCiudad(nextCiudad);
    setMail(nextMail);
    setTelefono(nextTelefono);
    setLinkedin(nextLinkedin);
    setErrorsProfile({});
    setIsModalOpen(false);

    saveProfileToDB({
      nextNombre,
      nextApellido,
      nextFechaNacimiento,
      nextCiudad,
      nextMail,
      nextTelefono,
      nextLinkedin,
      nextAvatarUrl
    });
  };

  // Disparar input de archivo
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Manejar cambio de archivo (Importar imagen)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejar clic en avatar para girar 3D
  const handleAvatarClick = (e: React.MouseEvent) => {
    // Si se hizo clic en el lápiz, ignorar el giro
    if ((e.target as HTMLElement).closest('.btn-edit-avatar')) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  // ----------------------------------------------------
  // ESTADOS Y HANDLERS PARA EXPERIENCIA PROFESIONAL
  // ----------------------------------------------------
  const [experiences, setExperiences] = useState<any[]>([]);

  // Estados del modal de experiencia
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingExpType, setEditingExpType] = useState<'laboral' | 'proyecto'>('laboral');
  const [tempProyectosAlternativos, setTempProyectosAlternativos] = useState('');

  // Estados temporales para formulario de proyectos/voluntariados
  const [proyectoNombre, setProyectoNombre] = useState('');
  const [proyectoRol, setProyectoRol] = useState('');
  const [proyectoFecha, setProyectoFecha] = useState('');
  const [proyectoDescripcion, setProyectoDescripcion] = useState('');

  // Estados temporales del formulario de experiencia
  const [expPosicion, setExpPosicion] = useState('');
  const [expEmpresa, setExpEmpresa] = useState('');
  const [expIndependiente, setExpIndependiente] = useState(false);
  const [expDescripcion, setExpDescripcion] = useState('');
  const [expAnioInicio, setExpAnioInicio] = useState('');
  const [expAnioFin, setExpAnioFin] = useState('');

  // Abrir modal de experiencia para agregar
  const handleOpenAddExp = () => {
    setEditingExpId(null);
    setEditingExpType('laboral');
    setTempProyectosAlternativos(proyectosAlternativos);
    setProyectoNombre('');
    setProyectoRol('');
    setProyectoFecha('');
    setProyectoDescripcion('');
    setExpPosicion('');
    setExpEmpresa('');
    setExpIndependiente(false);
    setExpDescripcion('');
    setExpAnioInicio('');
    setExpAnioFin('');
    setErrorsExp({}); // Limpiar errores
    setIsExpModalOpen(true);
  };

  // Abrir modal de proyectos para agregar
  const handleOpenAddProyecto = () => {
    setEditingExpId(null);
    setEditingExpType('proyecto');
    setProyectoNombre('');
    setProyectoRol('');
    setProyectoFecha('');
    setProyectoDescripcion('');
    setErrorsExp({});
    setIsExpModalOpen(true);
  };

  // Abrir modal para editar un proyecto específico
  const handleOpenEditProyecto = (id: string) => {
    const proj = proyectos.find((p) => p.id === id);
    if (proj) {
      setEditingExpId(id);
      setEditingExpType('proyecto');
      setProyectoNombre(proj.nombre || '');
      setProyectoRol(proj.rol || '');
      setProyectoFecha(proj.fecha || '');
      setProyectoDescripcion(proj.desc || '');
      setErrorsExp({});
      setIsExpModalOpen(true);
    }
  };

  // Abrir modal de eliminación customizada para proyecto
  const handleDeleteProyecto = (id: string, nombre: string) => {
    setItemToDeleteId(id);
    setItemToDeleteName(nombre);
    setItemToDeleteType('proyecto');
    setIsDeleteModalOpen(true);
  };

  // Abrir modal de experiencia para editar
  const handleOpenEditExp = (id: string) => {
    if (id === 'proyectos_alternativos') {
      handleOpenAddProyecto();
      return;
    }
    const exp = experiences.find((e) => e.id === id);
    if (exp) {
      setEditingExpId(id);
      setEditingExpType('laboral');
      setExpPosicion(exp.position);
      setExpEmpresa(exp.company === 'Independiente' ? '' : exp.company);
      setExpIndependiente(exp.company === 'Independiente');
      setExpDescripcion(exp.desc);
      setExpAnioInicio(exp.anioInicio);
      setExpAnioFin(exp.anioFin);
      setErrorsExp({}); // Limpiar errores
      setIsExpModalOpen(true);
    }
  };

  // Guardar experiencia (Agregar o Editar)
  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingExpType === 'proyecto') {
      const projErrors: typeof errorsExp = {};
      if (!proyectoNombre.trim()) {
        projErrors.company = "El nombre del proyecto u organización es obligatorio.";
      }
      if (!proyectoFecha.trim()) {
        projErrors.anioInicio = "El año o fecha es obligatorio.";
      }
      if (!proyectoDescripcion.trim()) {
        projErrors.desc = "La descripción del proyecto es obligatoria.";
      }

      if (Object.keys(projErrors).length > 0) {
        setErrorsExp(projErrors);
        return;
      }

      if (Object.keys(projErrors).length > 0) {
        setErrorsExp(projErrors);
        return;
      }

      let nextProyectos = [...proyectos];
      const newProj = {
        id: editingExpId && editingExpId !== 'proyectos_alternativos' ? editingExpId : String(Date.now()),
        nombre: proyectoNombre.trim(),
        rol: proyectoRol.trim(),
        fecha: proyectoFecha.trim(),
        desc: proyectoDescripcion.trim()
      };

      if (editingExpId === null || editingExpId === 'proyectos_alternativos') {
        nextProyectos = [newProj, ...proyectos];
      } else {
        nextProyectos = proyectos.map((p) => (p.id === editingExpId ? newProj : p));
      }

      setProyectos(nextProyectos);
      setErrorsExp({});
      setIsExpModalOpen(false);

      const nextText = nextProyectos.map(p => `${p.rol ? p.rol + ' en ' : ''}${p.nombre}${p.fecha ? ' (' + p.fecha + ')' : ''}: ${p.desc}`).join('\n\n');
      saveProfileToDB({ nextProyectos, nextProyectosAlternativos: nextText });
      return;
    }

    const newErrors: typeof errorsExp = {};

    if (!expPosicion.trim()) {
      newErrors.position = "La posición es obligatoria.";
    }
    if (!expIndependiente && !expEmpresa.trim()) {
      newErrors.company = "El nombre de la empresa es obligatorio.";
    }
    if (!expDescripcion.trim()) {
      newErrors.desc = "La descripción de la posición es obligatoria.";
    }

    // Función helper para extraer el año de 4 dígitos de un string
    const extractYear = (str: string) => {
      const match = str.match(/\b(19\d{2}|20\d{2})\b/);
      return match ? Number(match[1]) : NaN;
    };

    // Validar año de inicio (no puede ser en el futuro)
    const currentYear = new Date().getFullYear();
    const startYearNum = extractYear(expAnioInicio.trim());
    if (!expAnioInicio.trim()) {
      newErrors.anioInicio = "El año/mes de inicio es obligatorio.";
    } else if (isNaN(startYearNum) || startYearNum < 1900 || startYearNum > currentYear) {
      newErrors.anioInicio = `Ingrese un texto que contenga un año válido de 4 dígitos entre 1900 y ${currentYear} (ej: marzo 2024).`;
    }

    // Validar año de finalización (no puede ser en el futuro, salvo 'actualidad')
    const cleanAnioFin = expAnioFin.trim().toLowerCase();
    let finalAnioFin = expAnioFin.trim();
    let endYearNum: number = Infinity;

    if (!expAnioFin.trim()) {
      newErrors.anioFin = "El año/mes de finalización es obligatorio.";
    } else if (cleanAnioFin === 'actualidad' || cleanAnioFin === 'presente' || cleanAnioFin === 'hoy' || cleanAnioFin === 'actual') {
      finalAnioFin = 'actualidad';
      endYearNum = Infinity;
    } else {
      endYearNum = extractYear(cleanAnioFin);
      if (isNaN(endYearNum) || endYearNum < 1900 || endYearNum > currentYear) {
        newErrors.anioFin = `Ingrese un texto que contenga un año válido de 4 dígitos entre 1900 y ${currentYear} (ej: septiembre 2024) o escriba 'actualidad'.`;
      } else if (!isNaN(startYearNum) && endYearNum < startYearNum) {
        newErrors.anioFin = "El año de finalización no puede ser anterior al de inicio.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrorsExp(newErrors);
      return;
    }

    const finalCompany = expIndependiente ? 'Independiente' : expEmpresa.trim();

    let nextExperiences = [...experiences];
    if (editingExpId === null) {
      // Agregar al inicio de la lista
      const newExp = {
        id: String(Date.now()),
        anioInicio: expAnioInicio.trim(),
        anioFin: finalAnioFin,
        position: expPosicion.trim(),
        company: finalCompany,
        desc: expDescripcion.trim()
      };
      nextExperiences = [newExp, ...experiences];
      setExperiences(nextExperiences);
    } else {
      // Editar existente
      nextExperiences = experiences.map((exp) =>
        exp.id === editingExpId
          ? {
              ...exp,
              anioInicio: expAnioInicio.trim(),
              anioFin: finalAnioFin,
              position: expPosicion.trim(),
              company: finalCompany,
              desc: expDescripcion.trim()
            }
          : exp
      );
      setExperiences(nextExperiences);
    }

    setErrorsExp({});
    setIsExpModalOpen(false);
    saveProfileToDB({ nextExperiences });
  };

  // Controlar cambio en el checkbox independiente
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpIndependiente(e.target.checked);
    if (e.target.checked) {
      setExpEmpresa(''); // Limpiar empresa si se marca independiente
    }
  };

  // Eliminar experiencia profesional con confirmación custom
  const handleDeleteExp = (id: string, position: string, company: string) => {
    setItemToDeleteId(id);
    setItemToDeleteName(`${position} en ${company}`);
    setItemToDeleteType('experience');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProyectos = () => {
    setItemToDeleteId('proyectos_alternativos');
    setItemToDeleteName('Proyectos y Voluntariados');
    setItemToDeleteType('proyecto');
    setIsDeleteModalOpen(true);
  };

  // Obtener experiencias ordenadas (más actual primero)
  const sortedExperiences = [...experiences].sort((a, b) => {
    const yearA = a.anioFin === 'actualidad' ? Infinity : Number(a.anioFin);
    const yearB = b.anioFin === 'actualidad' ? Infinity : Number(b.anioFin);

    if (yearA !== yearB) {
      return yearB - yearA; // Más reciente primero
    }

    const startA = Number(a.anioInicio);
    const startB = Number(b.anioInicio);
    return startB - startA;
  });

  // --- CONTROLADORES DE EDUCACIÓN ---

  // Abrir modal de educación para agregar
  const handleOpenAddEdu = () => {
    setEditingEduId(null);
    setEditingEduType('formal');
    setEduInstitucion('');
    setEduTitulo('');
    setEduAnioInicio('');
    setEduAnioFin('');
    setCourseTitulo('');
    setCourseInstitucion('');
    setCourseAnio('');
    setErrorsEdu({});
    setIsEduModalOpen(true);
  };

  // Abrir modal de educación para editar
  const handleOpenEditEdu = (id: string, type: 'formal' | 'course') => {
    setEditingEduId(id);
    setEditingEduType(type);
    setErrorsEdu({});

    if (type === 'formal') {
      const edu = formalEducation.find((e) => e.id === id);
      if (edu) {
        setEduInstitucion(edu.institucion);
        setEduTitulo(edu.titulo);
        setEduAnioInicio(edu.anioInicio);
        setEduAnioFin(edu.anioFin);
      }
    } else {
      const c = courses.find((x) => x.id === id);
      if (c) {
        setCourseTitulo(c.titulo);
        setCourseInstitucion(c.institucion);
        setCourseAnio(c.anio);
      }
    }
    setIsEduModalOpen(true);
  };

  // Eliminar educación con confirmación custom
  const handleDeleteEdu = (id: string, type: 'formal' | 'course') => {
    if (type === 'formal') {
      const item = formalEducation.find(e => e.id === id);
      if (item) {
        setItemToDeleteId(id);
        setItemToDeleteName(item.institucion);
        setItemToDeleteType('formal');
        setIsDeleteModalOpen(true);
      }
    } else {
      const item = courses.find(c => c.id === id);
      if (item) {
        setItemToDeleteId(id);
        setItemToDeleteName(item.titulo);
        setItemToDeleteType('course');
        setIsDeleteModalOpen(true);
      }
    }
  };

  // Guardar cambios del modal de educación
  const handleSaveEdu = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errorsEdu = {};
    const currentYear = new Date().getFullYear();

    if (editingEduType === 'formal') {
      if (!eduInstitucion.trim()) {
        newErrors.eduInstitucion = "La institución es obligatoria.";
      }
      if (!eduTitulo.trim()) {
        newErrors.eduTitulo = "El título/carrera es obligatorio.";
      }

      // Validar año de inicio formal
      const startNum = Number(eduAnioInicio.trim());
      if (!eduAnioInicio.trim()) {
        newErrors.eduAnioInicio = "El año de inicio es obligatorio.";
      } else if (isNaN(startNum) || startNum < 1900 || startNum > currentYear) {
        newErrors.eduAnioInicio = `Ingrese un año válido entre 1900 y ${currentYear}.`;
      }

      // Validar año de finalización formal
      const cleanFin = eduAnioFin.trim().toLowerCase();
      let finalFin = eduAnioFin.trim();
      let endNum = Infinity;

      if (!eduAnioFin.trim()) {
        newErrors.eduAnioFin = "El año de finalización es obligatorio.";
      } else if (cleanFin === 'actualidad' || cleanFin === 'presente' || cleanFin === 'hoy') {
        finalFin = 'actualidad';
        endNum = Infinity;
      } else {
        endNum = Number(cleanFin);
        if (isNaN(endNum) || endNum < 1900 || endNum > currentYear) {
          newErrors.eduAnioFin = `Ingrese un año válido de 4 dígitos entre 1900 y ${currentYear} o escriba 'actualidad'.`;
        } else if (!isNaN(startNum) && endNum < startNum) {
          newErrors.eduAnioFin = "El año de finalización no puede ser anterior al de inicio.";
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrorsEdu(newErrors);
        return;
      }

      let nextFormalEducation = [...formalEducation];
      if (editingEduId === null) {
        // Agregar nuevo formal
        const newEdu = {
          id: String(Date.now()),
          institucion: eduInstitucion.trim(),
          titulo: eduTitulo.trim(),
          anioInicio: eduAnioInicio.trim(),
          anioFin: finalFin
        };
        nextFormalEducation = [newEdu, ...formalEducation];
        setFormalEducation(nextFormalEducation);
      } else {
        // Editar existente formal
        nextFormalEducation = formalEducation.map((x) =>
          x.id === editingEduId
            ? {
                ...x,
                institucion: eduInstitucion.trim(),
                titulo: eduTitulo.trim(),
                anioInicio: eduAnioInicio.trim(),
                anioFin: finalFin
              }
            : x
        );
        setFormalEducation(nextFormalEducation);
      }
      setErrorsEdu({});
      setIsEduModalOpen(false);
      saveProfileToDB({ nextFormalEducation });

    } else {
      // Validaciones para Curso/Certificación
      if (!courseTitulo.trim()) {
        newErrors.courseTitulo = "El nombre del curso/certificación es obligatorio.";
      }
      if (!courseInstitucion.trim()) {
        newErrors.courseInstitucion = "La institución emisora es obligatoria.";
      }

      const yearNum = Number(courseAnio.trim());
      if (!courseAnio.trim()) {
        newErrors.courseAnio = "El año de obtención es obligatorio.";
      } else if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        newErrors.courseAnio = `Ingrese un año válido de 4 dígitos entre 1900 y ${currentYear}.`;
      }

      if (Object.keys(newErrors).length > 0) {
        setErrorsEdu(newErrors);
        return;
      }

      let nextCourses = [...courses];
      if (editingEduId === null) {
        // Agregar nuevo curso
        const newC = {
          id: String(Date.now()),
          titulo: courseTitulo.trim(),
          institucion: courseInstitucion.trim(),
          anio: courseAnio.trim()
        };
        nextCourses = [newC, ...courses];
        setCourses(nextCourses);
      } else {
        // Editar existente curso
        nextCourses = courses.map((x) =>
          x.id === editingEduId
            ? {
                ...x,
                titulo: courseTitulo.trim(),
                institucion: courseInstitucion.trim(),
                anio: courseAnio.trim()
              }
            : x
        );
        setCourses(nextCourses);
      }
      setErrorsEdu({});
      setIsEduModalOpen(false);
      saveProfileToDB({ nextCourses });
    }
  };

  // Estados para el Modal de Carga de Archivos
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<Array<{
    id: string;
    name: string;
    size: string;
    progress: number;
    status: 'uploading' | 'completed';
    courseId?: string;
  }>>([]);

  // Disparar input de archivo oculto para documentación
  const triggerDocInput = () => {
    docInputRef.current?.click();
  };

  const handleUploadFileSelect = async (file: File) => {
    const fileId = String(Date.now());
    const fileSizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    const newUploadFile = {
      id: fileId,
      name: file.name,
      size: fileSizeStr,
      progress: 0,
      status: 'uploading' as const
    };

    setUploadFiles(prev => [newUploadFile, ...prev]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress > 90) progress = 90;
      setUploadFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress } : f));
    }, 200);

    activeUploadIntervals.current[fileId] = interval;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      clearInterval(interval);
      delete activeUploadIntervals.current[fileId];

      if (response.ok && data.id) {
        setUploadFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress: 100, status: 'completed', courseId: `c_ai_${fileId}` } : f));

        // Crear el curso/certificación
        let titulo = `Certificación en ${file.name.replace(/\.[^/.]+$/, "")}`;
        let institucion = 'InnovaCV';

        const mockCert = {
          id: `c_ai_${fileId}`,
          titulo,
          institucion,
          anio: new Date().getFullYear().toString(),
          pdf_id: data.id // Asociar el ID del PDF en la base de datos
        };

        setCourses(prev => [mockCert, ...prev]);
      } else {
        setUploadFiles(prev => prev.filter(f => f.id !== fileId));
        alert('Error al subir el archivo');
      }
    } catch (err) {
      clearInterval(interval);
      delete activeUploadIntervals.current[fileId];
      setUploadFiles(prev => prev.filter(f => f.id !== fileId));
      alert('Error de conexión al subir el archivo');
    }
  };

  // Manejar cambio en el input de archivo
  const handleImportDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFileSelect(file);
    }
  };

  // Eliminar o cancelar archivo de la carga (y de los cursos si ya se importó)
  const handleRemoveUploadFile = (id: string) => {
    // 1. Limpiar el temporizador de subida en curso si existiera
    if (activeUploadIntervals.current[id]) {
      clearInterval(activeUploadIntervals.current[id]);
      delete activeUploadIntervals.current[id];
    }

    // 2. Si el archivo ya se cargó y tiene un curso vinculado, removerlo del perfil
    const fileToRemove = uploadFiles.find(f => f.id === id);
    if (fileToRemove && fileToRemove.courseId) {
      setCourses(prev => prev.filter(c => c.id !== fileToRemove.courseId));
    }

    // 3. Quitar el archivo del modal de carga
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  // Obtener educación formal ordenada por fecha final descendente
  const sortedFormalEducation = [...formalEducation].sort((a, b) => {
    const valA = a.anioFin === 'actualidad' ? Infinity : Number(a.anioFin);
    const valB = b.anioFin === 'actualidad' ? Infinity : Number(b.anioFin);

    if (valA !== valB) {
      return valB - valA;
    }
    return Number(b.anioInicio) - Number(a.anioInicio);
  });

  // Obtener cursos ordenados por año descendente
  const sortedCourses = [...courses].sort((a, b) => Number(b.anio) - Number(a.anio));

  // --- CONTROLADORES DE HABILIDADES ---

  // Abrir modal de habilidad para agregar
  const handleOpenAddSkill = () => {
    setEditingSkillId(null);
    setSkillNombre('');
    setSkillTipo('');
    setSkillOrigen('');
    setIsDropdownOpen(false);
    setErrorsSkill({});
    setIsSkillModalOpen(true);
  };

  // Abrir modal de habilidad para editar
  const handleOpenEditSkill = (id: string) => {
    const sk = skills.find((s) => s.id === id);
    if (sk) {
      setEditingSkillId(id);
      setSkillNombre(sk.nombre);
      setSkillTipo(sk.tipo || '');
      setSkillOrigen(sk.origen || '');
      setIsDropdownOpen(false);
      setErrorsSkill({});
      setIsSkillModalOpen(true);
    }
  };

  // Eliminar habilidad con confirmación custom
  const handleDeleteSkill = (id: string) => {
    const sk = skills.find((s) => s.id === id);
    if (sk) {
      setItemToDeleteId(id);
      setItemToDeleteName(sk.nombre);
      setItemToDeleteType('skill');
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeleteGeneral = () => {
    if (!itemToDeleteId || !itemToDeleteType) return;
    
    if (itemToDeleteType === 'skill') {
      const nextSkills = skills.filter((s) => s.id !== itemToDeleteId);
      setSkills(nextSkills);
      saveProfileToDB({ nextSkills });
    } else if (itemToDeleteType === 'formal') {
      const nextFormalEducation = formalEducation.filter((e) => e.id !== itemToDeleteId);
      setFormalEducation(nextFormalEducation);
      saveProfileToDB({ nextFormalEducation });
    } else if (itemToDeleteType === 'course') {
      const nextCourses = courses.filter((c) => c.id !== itemToDeleteId);
      setCourses(nextCourses);
      saveProfileToDB({ nextCourses });
      // También desvincular o quitar el archivo de uploadFiles en el modal si ya se había cargado
      setUploadFiles(prev => prev.filter((f) => f.courseId !== itemToDeleteId));
    } else if (itemToDeleteType === 'experience') {
      const nextExperiences = experiences.filter((exp) => exp.id !== itemToDeleteId);
      setExperiences(nextExperiences);
      saveProfileToDB({ nextExperiences });
    } else if (itemToDeleteType === 'proyecto') {
      const nextProyectos = proyectos.filter((p) => p.id !== itemToDeleteId);
      setProyectos(nextProyectos);
      const nextText = nextProyectos.map(p => `${p.rol ? p.rol + ' en ' : ''}${p.nombre}${p.fecha ? ' (' + p.fecha + ')' : ''}: ${p.desc}`).join('\n\n');
      saveProfileToDB({ nextProyectos, nextProyectosAlternativos: nextText });
    }
    
    setIsDeleteModalOpen(false);
    setItemToDeleteId(null);
    setItemToDeleteName('');
    setItemToDeleteType(null);
  };

  // Guardar habilidad (Agregar o Editar)
  const handleSaveSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errorsSkill = {};

    if (!skillNombre.trim()) {
      newErrors.nombre = "El nombre de la habilidad es obligatorio.";
    }
    if (!skillTipo) {
      newErrors.tipo = "El tipo de habilidad es obligatorio.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrorsSkill(newErrors);
      return;
    }

    let nextSkills = [...skills];
    if (editingSkillId === null) {
      // Agregar al inicio
      const newSk = {
        id: String(Date.now()),
        nombre: skillNombre.trim(),
        tipo: skillTipo,
        origen: skillOrigen
      };
      nextSkills = [newSk, ...skills];
      setSkills(nextSkills);
    } else {
      // Editar
      nextSkills = skills.map((s) =>
        s.id === editingSkillId
          ? {
              ...s,
              nombre: skillNombre.trim(),
              tipo: skillTipo,
              origen: skillOrigen
            }
          : s
      );
      setSkills(nextSkills);
    }

    setErrorsSkill({});
    setIsSkillModalOpen(false);
    saveProfileToDB({ nextSkills });
  };


  if (isLoading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }}>
        <GooeyLoader />
        <p style={{ marginTop: '20px', fontFamily: 'Inter, sans-serif', color: isDarkMode ? '#e2e8f0' : '#475569', fontWeight: 500 }}>Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className={`profile-page-container ${isDarkMode ? 'dark-theme' : ''}`} onMouseMove={handleMouseMove}>
      {/* 1. BARRA LATERAL REUTILIZABLE (Sidebar) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. COLUMNA CENTRAL (Contenido de Perfil) */}
      <main className="profile-main-column">
        {/* Fondo decorativo con Orbes de Luz Aurora Mesh */}
        <div className="profile-decor-backdrop">
          <div className="aurora-orb orb-violet" />
          <div className="aurora-orb orb-fuchsia" />
          <div className="aurora-orb orb-cyan" />
          <div className="aurora-orb orb-indigo" />
          <div className="aurora-orb orb-interactive" />
        </div>

        {/* Cabecera Superior Homologada con Lista de Empleos */}
        <header className="profile-top-header">
          <h1 className="profile-page-title">Mi Perfil</h1>
          
          <div className="profile-header-actions">
            <button className="header-icon-btn" title="Alternar tema" onClick={toggleDarkMode}>
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            
            <div className="header-avatar-circle" title="Mi Cuenta" onClick={() => setActiveTab('personal')}>
              <img 
                src={avatarUrl} 
                alt="Avatar usuario" 
              />
            </div>
          </div>
        </header>

        {/* Renderizado dinámico según la pestaña seleccionada */}
        {activeTab === 'personal' && (
          <>
            <h1 className="profile-title-centered">Datos personales</h1>

            {/* Tarjeta de Perfil */}
            <div className="profile-card">
              {/* Avatar con Resplandor de Neón y Giro 3D */}
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar-glow" />
                
                <div 
                  className={`avatar-flip-card ${isFlipped ? 'flipped' : ''}`}
                  onClick={handleAvatarClick}
                  title="Haz clic para ver el código QR de compartir"
                >
                  {/* Frente: Foto de Perfil */}
                  <div className="avatar-face avatar-front">
                    <img
                      src={avatarUrl}
                      alt="Foto de perfil"
                    />
                  </div>

                  {/* Reverso: Código QR */}
                  <div className="avatar-face avatar-back">
                    <svg viewBox="0 0 100 100" width="120" height="120" style={{ color: 'var(--color-primary)' }}>
                      {/* Corner positioning squares */}
                      <rect x="10" y="10" width="22" height="22" fill="var(--color-primary)" rx="4" />
                      <rect x="14" y="14" width="14" height="14" fill="#ffffff" rx="2" />
                      <rect x="17.5" y="17.5" width="7" height="7" fill="var(--color-primary)" rx="1.5" />

                      <rect x="68" y="10" width="22" height="22" fill="var(--color-primary)" rx="4" />
                      <rect x="72" y="14" width="14" height="14" fill="#ffffff" rx="2" />
                      <rect x="75.5" y="17.5" width="7" height="7" fill="var(--color-primary)" rx="1.5" />

                      <rect x="10" y="68" width="22" height="22" fill="var(--color-primary)" rx="4" />
                      <rect x="14" y="72" width="14" height="14" fill="#ffffff" rx="2" />
                      <rect x="17.5" y="75.5" width="7" height="7" fill="var(--color-primary)" rx="1.5" />

                      {/* Stylized QR blocks */}
                      <rect x="38" y="10" width="6" height="12" fill="var(--color-text-dark)" rx="1" />
                      <rect x="48" y="10" width="14" height="6" fill="var(--color-text-dark)" rx="1" />
                      <rect x="38" y="26" width="24" height="6" fill="var(--color-primary)" rx="1" />
                      <rect x="10" y="38" width="12" height="6" fill="var(--color-text-dark)" rx="1" />
                      <rect x="26" y="38" width="6" height="18" fill="var(--color-text-dark)" rx="1" />
                      <rect x="68" y="38" width="12" height="6" fill="var(--color-text-dark)" rx="1" />
                      <rect x="84" y="38" width="6" height="12" fill="var(--color-primary)" rx="1" />
                      <rect x="38" y="38" width="24" height="24" fill="var(--color-primary)" rx="2" />
                      <rect x="44" y="44" width="12" height="12" fill="#ffffff" rx="1" />
                      <rect x="47.5" y="47.5" width="5" height="5" fill="var(--color-primary)" rx="1.5" />
                      
                      <rect x="68" y="52" width="12" height="6" fill="var(--color-text-dark)" rx="1" />
                      <rect x="10" y="60" width="6" height="4" fill="var(--color-text-dark)" rx="1" />
                      
                      <rect x="38" y="68" width="6" height="12" fill="var(--color-text-dark)" rx="1" />
                      <rect x="48" y="68" width="14" height="6" fill="var(--color-primary)" rx="1" />
                      <rect x="48" y="78" width="12" height="12" fill="var(--color-text-dark)" rx="1" />
                      <rect x="68" y="68" width="6" height="22" fill="var(--color-text-dark)" rx="1" />
                      <rect x="78" y="68" width="12" height="6" fill="var(--color-primary)" rx="1" />
                      <rect x="78" y="78" width="6" height="12" fill="var(--color-text-dark)" rx="1" />
                      <rect x="88" y="78" width="2" height="6" fill="var(--color-text-dark)" rx="1" />
                    </svg>
                    <span style={{ fontSize: '10px', marginTop: '6px', fontWeight: 600, color: 'var(--color-text-gray)' }}>
                      ESCANEAR CV
                    </span>
                  </div>
                </div>

                <button 
                  className="btn-edit-avatar" 
                  onClick={handleOpenModal} 
                  title="Editar datos personales"
                >
                  {/* Icono de lápiz */}
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
              </div>

              {/* Nombre y Apellido */}
              <h2 className="profile-name">{nombre} {apellido}</h2>

              {/* Lista de Detalles */}
              <div className="profile-details-list">
                <p className="profile-detail-item">
                  <strong>Fecha de Nacimiento:</strong> {formatDisplayDate(fechaNacimiento)}
                </p>
                <p className="profile-detail-item">
                  <strong>Ciudad:</strong> {ciudad}
                </p>
                <p className="profile-detail-item">
                  <strong>Mail:</strong> {mail}
                </p>
                <p className="profile-detail-item">
                  <strong>Teléfono:</strong> {telefono}
                </p>
                <p className="profile-detail-item">
                  <strong>Perfil de LinkedIn:</strong>{' '}
                  {linkedin !== '...' && linkedin !== '' ? (
                    <a 
                      href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="linkedin-profile-link"
                    >
                      {linkedin}
                    </a>
                  ) : (
                    '...'
                  )}
                </p>
              </div>
            </div>

            {/* Input de archivo oculto para importar imagen */}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />

            {/* MODAL DE EDICIÓN GLASSMORPHIC DE PERFIL */}
            {isModalOpen && (
              <div className="modal-backdrop" onClick={handleCloseModal}>
                <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Edita tus datos personales</h2>
                    <button className="btn-close-modal" onClick={handleCloseModal} title="Cerrar">
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 12c.29.29.29.77 0 1.06-.29.29-.77.29-1.06 0L12 13.06l-3.94 3.94c-.29.29-.77.29-1.06 0-.29-.29-.29-.77 0-1.06L10.94 12 7 8.06c-.29-.29-.29-.77 0-1.06.29-.29.77-.29 1.06 0L12 10.94l3.94-3.94c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06L13.06 12 17 15.94z" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleSaveProfile} className="modal-form">
                    {/* Foto de Perfil */}
                    <div className="form-row">
                      <label>Foto de Perfil</label>
                      <button type="button" className="btn-import-img" onClick={triggerFileInput}>
                        <span>Importar una imagen</span>
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                      </button>
                    </div>

                    {/* Nombre */}
                    <div className="form-row">
                      <label htmlFor="nombre">Nombre</label>
                      <input
                        type="text"
                        id="nombre"
                        placeholder={nombre}
                        value={tempNombre}
                        onChange={(e) => setTempNombre(e.target.value)}
                      />
                    </div>

                    {/* Apellido */}
                    <div className="form-row">
                      <label htmlFor="apellido">Apellido</label>
                      <input
                        type="text"
                        id="apellido"
                        placeholder={apellido}
                        value={tempApellido}
                        onChange={(e) => setTempApellido(e.target.value)}
                      />
                    </div>

                    {/* Fecha de Nacimiento (Custom Popover style like image) */}
                    <div className="form-row">
                      <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
                      <div className="input-group-wrapper">
                        <div className="custom-calendar-container" ref={calendarRef}>
                          <button
                            type="button"
                            id="fechaNacimiento"
                            className={`custom-calendar-trigger ${isCalendarOpen ? 'active' : ''}`}
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                          >
                            <div className="calendar-selected-value">
                              <span className="calendar-trigger-icon">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                              </span>
                              <span className="calendar-trigger-text">
                                {tempFechaNacimiento ? formatDisplayDate(tempFechaNacimiento) : 'Seleccione una fecha'}
                              </span>
                            </div>
                            <span className={`calendar-trigger-chevron ${isCalendarOpen ? 'rotated' : ''}`}>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </span>
                          </button>

                          {isCalendarOpen && (
                            <div className="custom-calendar-popup">
                              {/* Header navigations */}
                              <div className="calendar-popup-header">
                                <div className="calendar-nav-buttons-group">
                                  <button
                                    type="button"
                                    className="calendar-nav-btn"
                                    onClick={handlePrevYear}
                                    title="Año anterior"
                                    disabled={isSelectingYear}
                                    style={{ visibility: isSelectingYear ? 'hidden' : 'visible' }}
                                  >
                                    &laquo;
                                  </button>
                                  <button
                                    type="button"
                                    className="calendar-nav-btn"
                                    onClick={handlePrevMonth}
                                    title="Mes anterior"
                                    disabled={isSelectingYear}
                                    style={{ visibility: isSelectingYear ? 'hidden' : 'visible' }}
                                  >
                                    &lsaquo;
                                  </button>
                                </div>
                                <span 
                                  className={`calendar-month-year-label clickable ${isSelectingYear ? 'selecting-year' : ''}`}
                                  onClick={() => setIsSelectingYear(!isSelectingYear)}
                                  title={isSelectingYear ? "Volver al calendario" : "Hacer clic para cambiar año"}
                                >
                                  {isSelectingYear 
                                    ? 'Seleccione Año' 
                                    : `${MONTHS_ES[navDate.getMonth()]} ${navDate.getFullYear()}`
                                  }
                                </span>
                                <div className="calendar-nav-buttons-group">
                                  <button
                                    type="button"
                                    className="calendar-nav-btn"
                                    onClick={handleNextMonth}
                                    title="Mes siguiente"
                                    disabled={isSelectingYear}
                                    style={{ visibility: isSelectingYear ? 'hidden' : 'visible' }}
                                  >
                                    &rsaquo;
                                  </button>
                                  <button
                                    type="button"
                                    className="calendar-nav-btn"
                                    onClick={handleNextYear}
                                    title="Año siguiente"
                                    disabled={isSelectingYear}
                                    style={{ visibility: isSelectingYear ? 'hidden' : 'visible' }}
                                  >
                                    &raquo;
                                  </button>
                                </div>
                              </div>

                              {isSelectingYear ? (
                                <div className="calendar-years-grid-view">
                                  {Array.from({ length: new Date().getFullYear() - 1930 + 1 }).map((_, idx) => {
                                    const y = new Date().getFullYear() - idx;
                                    const isSelectedYear = navDate.getFullYear() === y;
                                    return (
                                      <button
                                        key={`year-opt-${y}`}
                                        type="button"
                                        className={`calendar-year-cell ${isSelectedYear ? 'selected' : ''}`}
                                        onClick={() => {
                                          setNavDate(new Date(y, navDate.getMonth(), 1));
                                          setIsSelectingYear(false);
                                        }}
                                      >
                                        {y}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <>
                                  {/* Weekdays header */}
                                  <div className="calendar-weekdays-row">
                                    <span>Do</span>
                                    <span>Lu</span>
                                    <span>Ma</span>
                                    <span>Mi</span>
                                    <span>Ju</span>
                                    <span>Vi</span>
                                    <span>Sá</span>
                                  </div>

                                  {/* Days grid */}
                                  <div className="calendar-days-grid">
                                    {/* Empty placeholders for offset */}
                                    {Array.from({ length: getFirstDayOfMonth(navDate.getFullYear(), navDate.getMonth()) }).map((_, idx) => (
                                      <span key={`empty-${idx}`} className="calendar-day-cell empty"></span>
                                    ))}
                                    
                                    {/* Real days */}
                                    {Array.from({ length: getDaysInMonth(navDate.getFullYear(), navDate.getMonth()) }).map((_, idx) => {
                                      const dayNum = idx + 1;
                                      const yearStr = String(navDate.getFullYear());
                                      const monthStr = String(navDate.getMonth() + 1).padStart(2, '0');
                                      const dayStr = String(dayNum).padStart(2, '0');
                                      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
                                      
                                      const isSelected = tempFechaNacimiento === dateStr;

                                      return (
                                        <button
                                          key={`day-${dayNum}`}
                                          type="button"
                                          className={`calendar-day-cell day-button ${isSelected ? 'selected' : ''}`}
                                          onClick={() => {
                                            setTempFechaNacimiento(dateStr);
                                            setIsCalendarOpen(false);
                                          }}
                                        >
                                          {dayNum}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ciudad */}
                    <div className="form-row">
                      <label htmlFor="ciudad">Ciudad</label>
                      <input
                        type="text"
                        id="ciudad"
                        placeholder={ciudad}
                        value={tempCiudad}
                        onChange={(e) => setTempCiudad(e.target.value)}
                      />
                    </div>

                     {/* Mail */}
                    <div className={`form-row ${errorsProfile.mail ? 'has-error' : ''}`}>
                      <label htmlFor="mail">Mail</label>
                      <div className="input-group-wrapper">
                        <input
                          type="email"
                          id="mail"
                          placeholder={mail}
                          value={tempMail}
                          onChange={(e) => {
                            setTempMail(e.target.value);
                            setErrorsProfile(prev => ({ ...prev, mail: undefined }));
                          }}
                        />
                        {errorsProfile.mail && <span className="error-message">{errorsProfile.mail}</span>}
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div className={`form-row ${errorsProfile.telefono ? 'has-error' : ''}`}>
                      <label htmlFor="telefono">Teléfono</label>
                      <div className="input-group-wrapper">
                        <input
                          type="tel"
                          id="telefono"
                          placeholder={telefono}
                          value={tempTelefono}
                          onChange={(e) => {
                            setTempTelefono(e.target.value);
                            setErrorsProfile(prev => ({ ...prev, telefono: undefined }));
                          }}
                        />
                        {errorsProfile.telefono && <span className="error-message">{errorsProfile.telefono}</span>}
                      </div>
                    </div>

                    {/* Perfil de LinkedIn */}
                    <div className="form-row">
                      <label htmlFor="linkedin">Perfil de LinkedIn</label>
                      <input
                        type="text"
                        id="linkedin"
                        placeholder={linkedin}
                        value={tempLinkedin}
                        onChange={(e) => setTempLinkedin(e.target.value)}
                      />
                    </div>

                    {/* Botón de Enviar */}
                    <div className="modal-footer">
                      <button type="submit" className="btn-save-profile">
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'experience' && (
          <>
            <h1 className="profile-title-centered">Experiencia profesional</h1>

            <div className="profile-header-container">
              {/* Filtro superior izquierdo para separar Experiencias de Proyectos */}
              <div className="exp-filter-tabs">
                <button
                  type="button"
                  className={`exp-filter-btn ${expFilterTab === 'laboral' ? 'active' : ''}`}
                  onClick={() => setExpFilterTab('laboral')}
                >
                  <svg className="exp-filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  <span>Experiencia Laboral</span>
                </button>
                <button
                  type="button"
                  className={`exp-filter-btn ${expFilterTab === 'proyecto' ? 'active' : ''}`}
                  onClick={() => setExpFilterTab('proyecto')}
                >
                  <svg className="exp-filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Proyectos / Voluntariado</span>
                </button>
              </div>

              <button className="btn-add-experience" onClick={handleOpenAddExp}>
                Agregar experiencia
              </button>
            </div>

            {/* Lista de experiencias profesionales filtrada */}
            <div className="experience-list">
              {expFilterTab === 'laboral' && (
                <>
                  {sortedExperiences.length > 0 ? (
                    sortedExperiences.map((exp) => (
                      <div className="experience-card" key={exp.id}>
                        <div className="experience-time-col">{exp.anioInicio} – {exp.anioFin}</div>
                        <div className="experience-info-col">
                          <h3 className="experience-position">{exp.position}</h3>
                          <p className="experience-company">{exp.company}</p>
                          <p className="experience-desc">{exp.desc}</p>
                        </div>
                        <div className="experience-card-actions">
                          <button 
                            className="btn-edit-experience" 
                            title="Editar experiencia"
                            onClick={() => handleOpenEditExp(exp.id)}
                          >
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                          </button>
                          <button 
                            className="btn-delete-experience" 
                            title="Eliminar experiencia"
                            onClick={() => handleDeleteExp(exp.id, exp.position, exp.company)}
                          >
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '14px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
                      No has agregado experiencias laborales todavía.
                    </div>
                  )}
                </>
              )}

              {expFilterTab === 'proyecto' && (
                <>
                  {proyectos.length > 0 ? (
                    proyectos.map((proj) => (
                      <div className="experience-card" key={proj.id}>
                        <div className="experience-time-col">{proj.fecha || 'Proyectos / Voluntariado'}</div>
                        <div className="experience-info-col">
                          <h3 className="experience-position">{proj.nombre}</h3>
                          {proj.rol && <p className="experience-company">{proj.rol}</p>}
                          <p className="experience-desc">{proj.desc}</p>
                        </div>
                        <div className="experience-card-actions">
                          <button 
                            className="btn-edit-experience" 
                            title="Editar proyecto o voluntariado"
                            onClick={() => handleOpenEditProyecto(proj.id)}
                          >
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                          </button>
                          <button 
                            className="btn-delete-experience" 
                            title="Eliminar proyecto o voluntariado"
                            onClick={() => handleDeleteProyecto(proj.id, proj.nombre)}
                          >
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: '14px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
                      No has agregado proyectos o voluntariados todavía.
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'education' && (
          <>
            <h1 className="profile-title-centered">Educación</h1>

            {/* Contenedor principal de Educación con doble columna */}
            <div className="education-main-card">
              <div className="education-columns-container">
                {/* Columna Izquierda: Secundaria / Terciario / Universitario */}
                <div className="education-column">
                  <h2 className="education-column-title">Secundario/ Terciario / Universitario</h2>
                  <div className="education-items-list">
                    {sortedFormalEducation.map((edu) => (
                      <div className="education-item-block" key={edu.id}>
                        <div className="education-item-header">
                          <h3 className="education-item-name">{edu.institucion}</h3>
                          <div className="education-item-actions">
                            <button 
                              className="btn-edit-education-small" 
                              title="Editar educación"
                              onClick={() => handleOpenEditEdu(edu.id, 'formal')}
                            >
                              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                              </svg>
                            </button>
                            <button 
                              className="btn-delete-education-small" 
                              title="Eliminar educación"
                              onClick={() => handleDeleteEdu(edu.id, 'formal')}
                            >
                              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="education-item-sub">{edu.titulo}</p>
                        <p className="education-item-years">{edu.anioInicio}{edu.anioInicio && edu.anioFin ? ' - ' : ''}{edu.anioFin}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna Derecha: Cursos y Certificaciones */}
                <div className="education-column">
                  <h2 className="education-column-title">Cursos y Certificaciones</h2>
                  <div className="education-items-list">
                    {sortedCourses.map((c) => (
                      <div className="education-item-block" key={c.id}>
                        <div className="education-item-header">
                          <h3 className="education-item-name">{c.titulo}</h3>
                          <div className="education-item-actions">
                            {c.pdf_id && (
                              <a 
                                href={`/api/pdf/${c.pdf_id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn-view-pdf-small"
                                title="Ver Certificado"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#3B82F6',
                                  padding: '4px',
                                  marginRight: '8px'
                                }}
                              >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z" />
                                  <path d="M14 2v6h6" />
                                  <circle cx="12" cy="13" r="3" />
                                </svg>
                              </a>
                            )}
                            <button 
                              className="btn-edit-education-small" 
                              title="Editar curso"
                              onClick={() => handleOpenEditEdu(c.id, 'course')}
                            >
                              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                              </svg>
                            </button>
                            <button 
                              className="btn-delete-education-small" 
                              title="Eliminar curso"
                              onClick={() => handleDeleteEdu(c.id, 'course')}
                            >
                              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="education-item-sub">{c.institucion}</p>
                        <p className="education-item-years">{c.anio}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botones inferiores */}
              <div className="education-footer-buttons">
                {/* Importar documentación */}
                <button 
                  className="btn-edu-action btn-edu-import" 
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <span>Importar documentación</span>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                </button>
                <input 
                  type="file" 
                  ref={docInputRef} 
                  style={{ display: 'none' }} 
                  accept=".pdf,image/*" 
                  onChange={handleImportDoc} 
                />

                {/* Agregar educación manualmente */}
                <button className="btn-edu-action btn-edu-manual" onClick={handleOpenAddEdu}>
                  Agregar educación manualmente
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'skills' && (
          <>
            <div className="skills-header-container">
              <h1 className="profile-title-centered">Habilidades</h1>
              <button className="btn-add-skill-top" onClick={handleOpenAddSkill}>
                Agregar habilidades
              </button>
            </div>

            {/* Grilla dinámica de tarjetas de Habilidad */}
            <div className="skills-grid">
              {skills.map((sk) => (
                <div className="skill-card" key={sk.id}>
                  <div className="skill-card-actions">
                    <button 
                      className="btn-edit-skill-small" 
                      title="Editar habilidad"
                      onClick={() => handleOpenEditSkill(sk.id)}
                    >
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                    </button>
                    <button 
                      className="btn-delete-skill-small" 
                      title="Eliminar habilidad"
                      onClick={() => handleDeleteSkill(sk.id)}
                    >
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </div>
                  <h3 className="skill-name">{sk.nombre}</h3>
                  <span className={`skill-badge badge-${sk.tipo ? sk.tipo.toLowerCase() : 'blanda'}`}>
                    Habilidad {sk.tipo || 'Blanda'}
                  </span>
                  
                  {sk.origen && (
                    <div 
                      className={`trigger-icon icon-${sk.origen.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                      style={{ position: 'absolute', bottom: '16px', right: '16px' }} 
                      title={`Aplicado en: ${sk.origen}`}
                    >
                      {sk.origen === 'Experiencia' && (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                      )}
                      {sk.origen === 'Educación' && (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                        </svg>
                      )}
                      {sk.origen === 'Curso' && (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="7"></circle>
                          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* MODAL DE AGREGAR / EDITAR EXPERIENCIA */}
        {isExpModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsExpModalOpen(false)}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingExpId === 'proyectos_alternativos' 
                    ? 'Editar Proyectos y Voluntariados' 
                    : (editingExpId === null ? 'Agregar experiencia' : 'Editar experiencia')}
                </h2>
                <button className="btn-close-modal" onClick={() => setIsExpModalOpen(false)} title="Cerrar">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 12c.29.29.29.77 0 1.06-.29.29-.77.29-1.06 0L12 13.06l-3.94 3.94c-.29.29-.77.29-1.06 0-.29-.29-.29-.77 0-1.06L10.94 12 7 8.06c-.29-.29-.29-.77 0-1.06.29-.29.77-.29 1.06 0L12 10.94l3.94-3.94c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06L13.06 12 17 15.94z" />
                  </svg>
                </button>
              </div>

              {editingExpId === null && (
                <div className="edu-modal-tabs">
                  <button 
                    type="button" 
                    className={`edu-tab-btn ${editingExpType === 'laboral' ? 'active' : ''}`}
                    onClick={() => {
                      setEditingExpType('laboral');
                      setErrorsExp({});
                    }}
                  >
                    Experiencia Laboral
                  </button>
                  <button 
                    type="button" 
                    className={`edu-tab-btn ${editingExpType === 'proyecto' ? 'active' : ''}`}
                    onClick={() => {
                      setEditingExpType('proyecto');
                      setErrorsExp({});
                    }}
                  >
                    Proyecto / Voluntariado
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveExp} className="modal-form">
                {editingExpType === 'laboral' ? (
                  <>
                {/* Posición */}
                <div className={`form-row ${errorsExp.position ? 'has-error' : ''}`}>
                  <label htmlFor="expPosicion">Posición*</label>
                  <div className="input-group-wrapper">
                    <input 
                      type="text" 
                      id="expPosicion" 
                      value={expPosicion} 
                      onChange={(e) => {
                        setExpPosicion(e.target.value);
                        setErrorsExp(prev => ({ ...prev, position: undefined }));
                      }}
                    />
                    {errorsExp.position && <span className="error-message">{errorsExp.position}</span>}
                  </div>
                </div>

                {/* Nombre de la empresa */}
                <div className={`form-row ${errorsExp.company ? 'has-error' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                  <div className="form-row-header-layout">
                    <label htmlFor="expEmpresa" style={{ flex: 'none' }}>Nombre de la empresa*</label>
                    <label className="company-checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        checked={expIndependiente} 
                        onChange={(e) => {
                          handleCheckboxChange(e);
                          setErrorsExp(prev => ({ ...prev, company: undefined }));
                        }}
                      />
                      <span>Independiente</span>
                    </label>
                  </div>
                  <div className="input-group-wrapper">
                    <input 
                      type="text" 
                      id="expEmpresa" 
                      value={expEmpresa} 
                      onChange={(e) => {
                        setExpEmpresa(e.target.value);
                        setErrorsExp(prev => ({ ...prev, company: undefined }));
                      }}
                      disabled={expIndependiente}
                      placeholder={expIndependiente ? 'Independiente' : ''}
                      style={{ width: '100%' }}
                    />
                    {errorsExp.company && <span className="error-message">{errorsExp.company}</span>}
                  </div>
                </div>

                {/* Descripción de la posición */}
                <div className={`form-row ${errorsExp.desc ? 'has-error' : ''}`}>
                  <label htmlFor="expDescripcion">Descripción de la posición*</label>
                  <div className="input-group-wrapper">
                    <input 
                      type="text" 
                      id="expDescripcion" 
                      value={expDescripcion} 
                      onChange={(e) => {
                        setExpDescripcion(e.target.value);
                        setErrorsExp(prev => ({ ...prev, desc: undefined }));
                      }}
                    />
                    {errorsExp.desc && <span className="error-message">{errorsExp.desc}</span>}
                  </div>
                </div>

                {/* Año de inicio */}
                <div className={`form-row ${errorsExp.anioInicio ? 'has-error' : ''}`}>
                  <label htmlFor="expAnioInicio">Fecha de inicio*</label>
                  <div className="input-group-wrapper">
                    <input 
                      type="text" 
                      id="expAnioInicio" 
                      value={expAnioInicio} 
                      onChange={(e) => {
                        setExpAnioInicio(e.target.value);
                        setErrorsExp(prev => ({ ...prev, anioInicio: undefined }));
                      }}
                      placeholder="Ej: marzo 2024 o 2024"
                    />
                    {errorsExp.anioInicio && <span className="error-message">{errorsExp.anioInicio}</span>}
                  </div>
                </div>

                {/* Año de finalización */}
                <div className={`form-row ${errorsExp.anioFin ? 'has-error' : ''}`}>
                  <label htmlFor="expAnioFin">Fecha de finalización*</label>
                  <div className="input-group-wrapper">
                    <input 
                      type="text" 
                      id="expAnioFin" 
                      value={expAnioFin} 
                      onChange={(e) => {
                        setExpAnioFin(e.target.value);
                        setErrorsExp(prev => ({ ...prev, anioFin: undefined }));
                      }}
                      placeholder="Ej: actualidad o septiembre 2024"
                    />
                    {errorsExp.anioFin && <span className="error-message">{errorsExp.anioFin}</span>}
                  </div>
                </div>

                  </>
                ) : (
                  <>
                    {/* Nombre del proyecto u organización */}
                    <div className={`form-row ${errorsExp.company ? 'has-error' : ''}`}>
                      <label htmlFor="proyectoNombre">Nombre del proyecto u organización*</label>
                      <div className="input-group-wrapper">
                        <input 
                          type="text" 
                          id="proyectoNombre" 
                          value={proyectoNombre} 
                          onChange={(e) => {
                            setProyectoNombre(e.target.value);
                            setErrorsExp(prev => ({ ...prev, company: undefined }));
                          }}
                          placeholder="Ej: Voluntariado ONG Techo / Sistema Web Freelance"
                        />
                        {errorsExp.company && <span className="error-message">{errorsExp.company}</span>}
                      </div>
                    </div>

                    {/* Rol o Posición */}
                    <div className="form-row">
                      <label htmlFor="proyectoRol">Rol o Posición</label>
                      <div className="input-group-wrapper">
                        <input 
                          type="text" 
                          id="proyectoRol" 
                          value={proyectoRol} 
                          onChange={(e) => setProyectoRol(e.target.value)}
                          placeholder="Ej: Coordinador de construcción / Desarrollador Web"
                        />
                      </div>
                    </div>

                    {/* Año o Fecha */}
                    <div className={`form-row ${errorsExp.anioInicio ? 'has-error' : ''}`}>
                      <label htmlFor="proyectoFecha">Año o Fecha*</label>
                      <div className="input-group-wrapper">
                        <input 
                          type="text" 
                          id="proyectoFecha" 
                          value={proyectoFecha} 
                          onChange={(e) => {
                            setProyectoFecha(e.target.value);
                            setErrorsExp(prev => ({ ...prev, anioInicio: undefined }));
                          }}
                          placeholder="Ej: 2024 o marzo 2024 - junio 2024"
                        />
                        {errorsExp.anioInicio && <span className="error-message">{errorsExp.anioInicio}</span>}
                      </div>
                    </div>

                    {/* Descripción del proyecto */}
                    <div className={`form-row ${errorsExp.desc ? 'has-error' : ''}`}>
                      <label htmlFor="proyectoDescripcion">Descripción del proyecto o tareas*</label>
                      <div className="input-group-wrapper">
                        <textarea
                          id="proyectoDescripcion"
                          value={proyectoDescripcion}
                          onChange={(e) => {
                            setProyectoDescripcion(e.target.value);
                            setErrorsExp(prev => ({ ...prev, desc: undefined }));
                          }}
                          placeholder="Describí brevemente de qué trataba el proyecto, las tecnologías usadas y tus logros..."
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            resize: 'none',
                            fontFamily: 'inherit',
                            color: '#1a1a1a',
                            background: '#ffffff'
                          }}
                        />
                        {errorsExp.desc && <span className="error-message">{errorsExp.desc}</span>}
                      </div>
                    </div>
                  </>
                )}

                {/* Botón de Enviar */}
                <div className="modal-footer">
                  <button type="submit" className="btn-save-profile">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE AGREGAR / EDITAR EDUCACIÓN */}
        {isEduModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsEduModalOpen(false)}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingEduId === null ? 'Agregar educación' : 'Editar educación'}
                </h2>
                <button className="btn-close-modal" onClick={() => setIsEduModalOpen(false)} title="Cerrar">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 12c.29.29.29.77 0 1.06-.29.29-.77.29-1.06 0L12 13.06l-3.94 3.94c-.29.29-.77.29-1.06 0-.29-.29-.29-.77 0-1.06L10.94 12 7 8.06c-.29-.29-.29-.77 0-1.06.29-.29.77-.29 1.06 0L12 10.94l3.94-3.94c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06L13.06 12 17 15.94z" />
                  </svg>
                </button>
              </div>

              {/* Selector de pestañas dinámico dentro del modal (solo visible si se está agregando uno nuevo) */}
              {editingEduId === null && (
                <div className="edu-modal-tabs">
                  <button 
                    type="button" 
                    className={`edu-tab-btn ${editingEduType === 'formal' ? 'active' : ''}`}
                    onClick={() => {
                      setEditingEduType('formal');
                      setErrorsEdu({});
                    }}
                  >
                    Educación Formal
                  </button>
                  <button 
                    type="button" 
                    className={`edu-tab-btn ${editingEduType === 'course' ? 'active' : ''}`}
                    onClick={() => {
                      setEditingEduType('course');
                      setErrorsEdu({});
                    }}
                  >
                    Curso / Certificación
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveEdu} className="modal-form">
                {editingEduType === 'formal' ? (
                  <>
                    {/* Institución */}
                    <div className={`form-row ${errorsEdu.eduInstitucion ? 'has-error' : ''}`}>
                      <label htmlFor="eduInstitucion">Institución*</label>
                      <div className="input-group-wrapper">
                        <input 
                          type="text" 
                          id="eduInstitucion" 
                          value={eduInstitucion} 
                          onChange={(e) => {
                            setEduInstitucion(e.target.value);
                            setErrorsEdu(prev => ({ ...prev, eduInstitucion: undefined }));
                          }}
                          placeholder="Ej: Universidad Nacional de Rosario"
                        />
                        {errorsEdu.eduInstitucion && <span className="error-message">{errorsEdu.eduInstitucion}</span>}
                      </div>
                    </div>

                    {/* Título / Carrera */}
                    <div className={`form-row ${errorsEdu.eduTitulo ? 'has-error' : ''}`}>
                      <label htmlFor="eduTitulo">Título o Carrera*</label>
                      <div className="input-group-wrapper">
                        <input 
                          type="text" 
                          id="eduTitulo" 
                          value={eduTitulo} 
                          onChange={(e) => {
                            setEduTitulo(e.target.value);
                            setErrorsEdu(prev => ({ ...prev, eduTitulo: undefined }));
                          }}
                          placeholder="Ej: Licenciatura en Administración"
                        />
                        {errorsEdu.eduTitulo && <span className="error-message">{errorsEdu.eduTitulo}</span>}
                      </div>
                    </div>

                    {/* Año de inicio */}
                    <div className={`form-row ${errorsEdu.eduAnioInicio ? 'has-error' : ''}`}>
                      <label htmlFor="eduAnioInicio">Año de inicio*</label>
                      <div className="input-group-wrapper">
                        <input 
                          type="text" 
                          id="eduAnioInicio" 
                          value={eduAnioInicio} 
                          onChange={(e) => {
                            setEduAnioInicio(e.target.value);
                            setErrorsEdu(prev => ({ ...prev, eduAnioInicio: undefined }));
                          }}
                          placeholder="Ej: 2020"
                        />
                        {errorsEdu.eduAnioInicio && <span className="error-message">{errorsEdu.eduAnioInicio}</span>}
                      </div>
                    </div>

                    {/* Año de finalización */}
                    <div className={`form-row ${errorsEdu.eduAnioFin ? 'has-error' : ''}`}>
                      <label htmlFor="eduAnioFin">Año de finalización*</label>
                      <div className="input-group-wrapper">
                        <input 
                          type="text" 
                          id="eduAnioFin" 
                          value={eduAnioFin} 
                          onChange={(e) => {
                            setEduAnioFin(e.target.value);
                            setErrorsEdu(prev => ({ ...prev, eduAnioFin: undefined }));
                          }}
                          placeholder="Ej: 2024 o actualidad"
                        />
                        {errorsEdu.eduAnioFin && <span className="error-message">{errorsEdu.eduAnioFin}</span>}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Nombre del curso / certificación */}
                    <div className={`form-row ${errorsEdu.courseTitulo ? 'has-error' : ''}`}>
                      <label htmlFor="courseTitulo">Nombre del curso*</label>
                      <div className="input-group-wrapper">
                        <input 
                          type="text" 
                          id="courseTitulo" 
                          value={courseTitulo} 
                          onChange={(e) => {
                            setCourseTitulo(e.target.value);
                            setErrorsEdu(prev => ({ ...prev, courseTitulo: undefined }));
                          }}
                          placeholder="Ej: Curso UX/UI Avanzado"
                        />
                        {errorsEdu.courseTitulo && <span className="error-message">{errorsEdu.courseTitulo}</span>}
                      </div>
                    </div>

                    {/* Institución emisora */}
                    <div className={`form-row ${errorsEdu.courseInstitucion ? 'has-error' : ''}`}>
                      <label htmlFor="courseInstitucion">Institución emisora*</label>
                      <div className="input-group-wrapper">
                        <input 
                          type="text" 
                          id="courseInstitucion" 
                          value={courseInstitucion} 
                          onChange={(e) => {
                            setCourseInstitucion(e.target.value);
                            setErrorsEdu(prev => ({ ...prev, courseInstitucion: undefined }));
                          }}
                          placeholder="Ej: Coursera / Google"
                        />
                        {errorsEdu.courseInstitucion && <span className="error-message">{errorsEdu.courseInstitucion}</span>}
                      </div>
                    </div>

                    {/* Año de obtención */}
                    <div className={`form-row ${errorsEdu.courseAnio ? 'has-error' : ''}`}>
                      <label htmlFor="courseAnio">Año de obtención*</label>
                      <div className="input-group-wrapper">
                        <input 
                          type="text" 
                          id="courseAnio" 
                          value={courseAnio} 
                          onChange={(e) => {
                            setCourseAnio(e.target.value);
                            setErrorsEdu(prev => ({ ...prev, courseAnio: undefined }));
                          }}
                          placeholder="Ej: 2024"
                        />
                        {errorsEdu.courseAnio && <span className="error-message">{errorsEdu.courseAnio}</span>}
                      </div>
                    </div>
                  </>
                )}

                {/* Botón de Enviar */}
                <div className="modal-footer">
                  <button type="submit" className="btn-save-profile">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE AGREGAR / EDITAR HABILIDADES */}
        {isSkillModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsSkillModalOpen(false)}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingSkillId === null ? 'Agregar habilidad' : 'Editar habilidad'}
                </h2>
                <button className="btn-close-modal" onClick={() => setIsSkillModalOpen(false)} title="Cerrar">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 12c.29.29.29.77 0 1.06-.29.29-.77.29-1.06 0L12 13.06l-3.94 3.94c-.29.29-.77.29-1.06 0-.29-.29-.29-.77 0-1.06L10.94 12 7 8.06c-.29-.29-.29-.77 0-1.06.29-.29.77-.29 1.06 0L12 10.94l3.94-3.94c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06L13.06 12 17 15.94z" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveSkill} className="modal-form">
                {/* Nombre de la Habilidad */}
                <div className={`form-row ${errorsSkill.nombre ? 'has-error' : ''}`}>
                  <label htmlFor="skillNombre">Habilidad*</label>
                  <div className="input-group-wrapper">
                    <input 
                      type="text" 
                      id="skillNombre" 
                      value={skillNombre} 
                      onChange={(e) => {
                        setSkillNombre(e.target.value);
                        setErrorsSkill(prev => ({ ...prev, nombre: undefined }));
                      }}
                      placeholder="Ej: React, Python, Liderazgo"
                    />
                    {errorsSkill.nombre && <span className="error-message">{errorsSkill.nombre}</span>}
                  </div>
                </div>

                {/* Tipo de Habilidad */}
                <div className={`form-row ${errorsSkill.tipo ? 'has-error' : ''}`}>
                  <label>Tipo de habilidad*</label>
                  <div style={{ display: 'flex', gap: '24px', marginTop: '12px', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                      <input 
                        type="radio" 
                        name="skillTipo" 
                        value="Dura" 
                        checked={skillTipo === 'Dura'} 
                        onChange={() => { setSkillTipo('Dura'); setErrorsSkill(prev => ({ ...prev, tipo: undefined })) }}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                      />
                      Habilidad Dura
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                      <input 
                        type="radio" 
                        name="skillTipo" 
                        value="Blanda" 
                        checked={skillTipo === 'Blanda'} 
                        onChange={() => { setSkillTipo('Blanda'); setErrorsSkill(prev => ({ ...prev, tipo: undefined })) }}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                      />
                      Habilidad Blanda
                    </label>
                  </div>
                  {errorsSkill.tipo && <span className="error-message">{errorsSkill.tipo}</span>}
                </div>

                {/* Dónde se aplicó esta habilidad */}
                <div className={`form-row ${errorsSkill.origen ? 'has-error' : ''}`}>
                  <label htmlFor="skillOrigen">¿Dónde aplicó esta habilidad? (Opcional)</label>
                  <div className="input-group-wrapper">
                    <div className="custom-dropdown-container" ref={dropdownRef}>
                      <button
                        type="button"
                        id="skillOrigen"
                        className={`custom-dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <div className="trigger-selected-value">
                          {skillOrigen === 'Experiencia' && (
                            <span className="trigger-icon icon-experiencia">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                              </svg>
                            </span>
                          )}
                          {skillOrigen === 'Educación' && (
                            <span className="trigger-icon icon-educacion">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                              </svg>
                            </span>
                          )}
                          {skillOrigen === 'Curso' && (
                            <span className="trigger-icon icon-curso">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="7"></circle>
                                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                              </svg>
                            </span>
                          )}
                          {!skillOrigen && (
                            <span className="trigger-icon icon-placeholder">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                              </svg>
                            </span>
                          )}
                          <span className="trigger-text">
                            {skillOrigen || 'Seleccione una opción'}
                          </span>
                        </div>
                        <span className={`trigger-chevron ${isDropdownOpen ? 'rotated' : ''}`}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </span>
                      </button>

                      {isDropdownOpen && (
                        <div className="custom-dropdown-menu">
                          <button
                            type="button"
                            className={`custom-dropdown-item item-experiencia ${skillOrigen === 'Experiencia' ? 'selected' : ''}`}
                            onClick={() => {
                              setSkillOrigen(skillOrigen === 'Experiencia' ? '' : 'Experiencia');
                              setErrorsSkill(prev => ({ ...prev, origen: undefined }));
                              setIsDropdownOpen(false);
                            }}
                          >
                            <span className="item-icon icon-experiencia">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                              </svg>
                            </span>
                            <div className="item-details">
                              <span className="item-label">Experiencia</span>
                              <span className="item-sub">Ámbito laboral y desarrollo profesional</span>
                            </div>
                            {skillOrigen === 'Experiencia' && (
                              <span className="item-check">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            className={`custom-dropdown-item item-educacion ${skillOrigen === 'Educación' ? 'selected' : ''}`}
                            onClick={() => {
                              setSkillOrigen(skillOrigen === 'Educación' ? '' : 'Educación');
                              setErrorsSkill(prev => ({ ...prev, origen: undefined }));
                              setIsDropdownOpen(false);
                            }}
                          >
                            <span className="item-icon icon-educacion">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                              </svg>
                            </span>
                            <div className="item-details">
                              <span className="item-label">Educación</span>
                              <span className="item-sub">Estudios primarios, secundarios u universitarios</span>
                            </div>
                            {skillOrigen === 'Educación' && (
                              <span className="item-check">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            className={`custom-dropdown-item item-curso ${skillOrigen === 'Curso' ? 'selected' : ''}`}
                            onClick={() => {
                              setSkillOrigen(skillOrigen === 'Curso' ? '' : 'Curso');
                              setErrorsSkill(prev => ({ ...prev, origen: undefined }));
                              setIsDropdownOpen(false);
                            }}
                          >
                            <span className="item-icon icon-curso">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="7"></circle>
                                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                              </svg>
                            </span>
                            <div className="item-details">
                              <span className="item-label">Curso</span>
                              <span className="item-sub">Certificaciones, bootcamps o cursos cortos</span>
                            </div>
                            {skillOrigen === 'Curso' && (
                              <span className="item-check">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    {errorsSkill.origen && <span className="error-message">{errorsSkill.origen}</span>}
                  </div>
                </div>

                {/* Botón de Enviar */}
                <div className="modal-footer">
                  <button type="submit" className="btn-save-profile">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN CUSTOM (Centrado en pantalla) */}
        {isDeleteModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
            <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirm-icon-wrapper">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3 className="delete-confirm-title">
                {itemToDeleteType === 'skill' ? '¿Eliminar habilidad?' : 
                 itemToDeleteType === 'formal' ? '¿Eliminar educación?' : 
                 itemToDeleteType === 'experience' ? '¿Eliminar experiencia?' : 
                 '¿Eliminar certificación?'}
              </h3>
              <p className="delete-confirm-text">
                {itemToDeleteType === 'skill' && (
                  <>¿Estás seguro de que deseas eliminar la habilidad <strong>{itemToDeleteName}</strong>?</>
                )}
                {itemToDeleteType === 'formal' && (
                  <>¿Estás seguro de que deseas eliminar la educación en <strong>{itemToDeleteName}</strong>?</>
                )}
                {itemToDeleteType === 'course' && (
                  <>¿Estás seguro de que deseas eliminar la certificación/curso <strong>{itemToDeleteName}</strong>?</>
                )}
                {itemToDeleteType === 'experience' && (
                  <>¿Estás seguro de que deseas eliminar la experiencia laboral de <strong>{itemToDeleteName}</strong>?</>
                )}
                {' '}Esta acción no se puede deshacer.
              </p>
              <div className="delete-confirm-actions">
                <button 
                  type="button" 
                  className="btn-delete-cancel" 
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn-delete-confirm" 
                  onClick={confirmDeleteGeneral}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PREMIUM DE CARGA DE ARCHIVOS (Importación de Educación) */}
        {isUploadModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsUploadModalOpen(false)}>
            <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
              {/* Cabecera del Modal */}
              <div className="upload-modal-header">
                <div className="upload-header-left">
                  <div className="upload-icon-wrapper">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <div className="upload-header-text">
                    <h2 className="upload-modal-title">Cargar archivos</h2>
                    <p className="upload-modal-subtitle">Selecciona y sube el certificado o diploma de tu elección</p>
                  </div>
                </div>
                <button className="btn-close-upload" onClick={() => setIsUploadModalOpen(false)} title="Cerrar modal">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Zona de Arrastre Drag & Drop */}
              <div 
                className="upload-drag-zone" 
                onClick={triggerDocInput}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('dragover');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('dragover');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('dragover');
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    handleUploadFileSelect(file);
                  }
                }}
              >
                <div className="drag-zone-content">
                  <button type="button" className="btn-drag-upload">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>Subir archivo</span>
                  </button>
                  <p className="drag-zone-text-primary">Elige un archivo o arrástralo y suéltalo aquí</p>
                  <p className="drag-zone-text-secondary">Tamaño máximo de archivo: 20 MB (PDF, JPG, PNG)</p>
                </div>
              </div>

              {/* Lista de archivos en carga / completados */}
              {uploadFiles.length > 0 && (
                <div className="upload-files-list">
                  {uploadFiles.map((file) => (
                    <div className="upload-file-item" key={file.id}>
                      {/* Icono de tipo de archivo (PDF/Doc) */}
                      <div className="file-item-icon-wrapper">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"></path>
                          <path d="M14 2v6h6"></path>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </div>

                      {/* Detalles e información */}
                      <div className="file-item-details">
                        <div className="file-item-header-info">
                          <span className="file-item-name">{file.name}</span>
                          {file.status === 'uploading' ? (
                            <span className="file-item-percent">{file.progress}%</span>
                          ) : (
                            <span className="file-item-status-completed">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '4px' }}>
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              Completado
                            </span>
                          )}
                        </div>

                        {/* Progreso / Stats */}
                        <div className="file-item-sub-info">
                          <span>{file.size}</span>
                          {file.status === 'uploading' && (
                            <>
                              <span className="info-dot">•</span>
                              <span className="info-uploading-text">Cargando...</span>
                            </>
                          )}
                        </div>

                        {/* Barra de progreso con gradiente */}
                        {file.status === 'uploading' && (
                          <div className="file-item-progress-bar-container">
                            <div 
                              className="file-item-progress-bar-fill" 
                              style={{ width: `${file.progress}%` }} 
                            />
                          </div>
                        )}
                      </div>

                      {/* Botón de acción (Eliminar/Cancelar) */}
                      <button 
                        className="btn-cancel-file-upload" 
                        onClick={() => handleRemoveUploadFile(file.id)}
                        title={file.status === 'uploading' ? "Cancelar subida" : "Eliminar archivo"}
                      >
                        {file.status === 'uploading' ? (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
