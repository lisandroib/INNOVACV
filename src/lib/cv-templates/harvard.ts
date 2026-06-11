import { CVTemplate } from './types';

export const harvardTemplate: CVTemplate = {
  id: 'harvard',
  name: 'Harvard Layout (ATS)',
  description: 'Un formato clásico, limpio y altamente compatible con sistemas ATS.',
  generateHTML: (data: any): string => {
    // Si no hay datos, retornamos un esqueleto por defecto
    if (!data) {
      return `
        <h1 style="text-align: center; font-size: 2.5em; font-weight: 800; margin-bottom: 20px; color: #1e293b;">Nombre Apellido</h1>
        <div class="cv-contact-info" style="display: flex; justify-content: center; gap: 15px; margin-bottom: 30px; font-size: 11px;">
          <span style="display: flex; align-items: center; gap: 5px;">📧 tu@email.com</span>
          <span style="display: flex; align-items: center; gap: 5px;">📞 +54 11 1234-5678</span>
          <span style="display: flex; align-items: center; gap: 5px;">📍 Dirección, Ciudad, Provincia</span>
        </div>

        <h2 style="font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 15px; letter-spacing: 1px;">Educación</h2>
        <div style="display: flex; gap: 20px; margin-bottom: 15px;">
          <div style="width: 150px; flex-shrink: 0; font-weight: 700; font-size: 12px;">Fecha de graduación</div>
          <div style="flex: 1;">
            <h3 style="margin: 0; font-size: 13px; font-weight: 700; text-transform: uppercase;">Título obtenido. Promedio [Opcional]</h3>
            <p style="margin: 2px 0 0 0; font-size: 12px;">Universidad de Harvard</p>
          </div>
        </div>

        <h2 style="font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 15px; letter-spacing: 1px;">Experiencia</h2>
        <div style="display: flex; gap: 20px; margin-bottom: 15px;">
          <div style="width: 150px; flex-shrink: 0; font-weight: 700; font-size: 12px;">Mes Año - Mes Año</div>
          <div style="flex: 1;">
            <h3 style="margin: 0; font-size: 13px; font-weight: 700; text-transform: uppercase;">Organización</h3>
            <p style="margin: 2px 0 8px 0; font-size: 12px; color: #475569;">Rol: Cargo o Título</p>
            <ul style="margin: 0; padding-left: 15px; font-size: 11px;">
              <li>Describe tu experiencia, habilidades y logros usando viñetas.</li>
              <li>Comienza cada línea con un verbo de acción.</li>
            </ul>
          </div>
        </div>
          <span>Cargo o Título</span>
          <span>Mes Año - Mes Año</span>
        </p>
        <ul>
          <li>Describe tu experiencia, habilidades y logros usando viñetas.</li>
          <li>Comienza cada línea con un verbo de acción.</li>
        </ul>
      `;
    }

    const dp = data.datos_personales || {};
    const nombre = dp.nombre_completo || data.nombre || data.name || 'Tu Nombre';
    const email = dp.email || data.email_registro || data.email || 'tu@email.com';
    const telefono = dp.telefono || data.telefono || data.phone || 'Tu Teléfono';
    const direccion = dp.ubicacion ? `${dp.ubicacion.ciudad || ''}, ${dp.ubicacion.provincia || ''}`.replace(/^, | , $/g, '') : (data.direccion || 'Tu Dirección');
    
    const educacion = data.educacion || {};
    
    // Experiencia puede venir como array, o como objeto { trabajo_actual: {...}, resumen_completo: ... }
    let experiencia = data.experiencia_laboral || data.experiencia || '';
    if (experiencia && typeof experiencia === 'object' && !Array.isArray(experiencia)) {
      const exps = [];
      if (experiencia.trabajo_actual) exps.push(experiencia.trabajo_actual);
      if (experiencia.historial) exps.push(...(Array.isArray(experiencia.historial) ? experiencia.historial : []));
      if (exps.length > 0) {
        experiencia = exps;
      } else if (experiencia.resumen_completo) {
        experiencia = experiencia.resumen_completo;
      }
    }

    const habilidades = data.habilidades || {};
    
    const sobreMi = data.sobre_mi || data.resumen || '';

    const formatHabilidades = (habilidades: any) => {
      if (typeof habilidades === 'string') return `<p>${habilidades.replace(/\n/g, '<br/>')}</p>`;
      if (Array.isArray(habilidades)) return `<ul>${habilidades.map(item => `<li>${item}</li>`).join('')}</ul>`;
      if (!habilidades || typeof habilidades !== 'object') return '';
      
      let html = '<ul>';
      if (habilidades.duras) html += `<li><strong>Habilidades Técnicas:</strong> ${habilidades.duras}</li>`;
      if (habilidades.blandas) html += `<li><strong>Habilidades Blandas:</strong> ${habilidades.blandas}</li>`;
      html += '</ul>';
      return html === '<ul></ul>' ? '' : html;
    };

    const formatEducacion = (educacion: any) => {
      if (typeof educacion === 'string') return `<p>${educacion.replace(/\n/g, '<br/>')}</p>`;
      if (Array.isArray(educacion)) return `<ul>${educacion.map(item => `<li>${JSON.stringify(item)}</li>`).join('')}</ul>`;
      if (!educacion || typeof educacion !== 'object') return '';
      
      let html = '';
      
      const formatLevel = (data: any, labelFallback: string) => {
        if (!data) return;
        if (data.institucion || data.carrera || data.titulo) {
          const dates = [data.ano_inicio, data.ano_fin || data.ultimo_ano].filter(Boolean).join(' - ');
          const title = [data.titulo, data.carrera].filter(Boolean).join(' - ') || labelFallback;
          const inst = data.institucion || 'Institución';
          
          html += `
          <p style="display: flex; justify-content: space-between; margin: 0 0 2px 0; align-items: baseline;">
            <strong style="font-size: 13px; text-transform: uppercase;">${title}</strong>
            <strong style="font-size: 12px;">${dates || 'Fecha'}</strong>
          </p>
          <p style="margin: 0 0 15px 0; font-size: 12px;">${inst}</p>
          `;
        }
      };

      formatLevel(educacion.secundario, 'Secundario');
      formatLevel(educacion.terciario, 'Terciario');
      formatLevel(educacion.grado, 'Grado Universitario');
      formatLevel(educacion.posgrado, 'Posgrado');

      return html;
    };

    const formatExperiencia = (experiencia: any) => {
      if (typeof experiencia === 'string') return `<p>${experiencia.replace(/\n/g, '<br/>')}</p>`;
      if (Array.isArray(experiencia)) {
        return experiencia.map(exp => {
          if (typeof exp === 'string') return `<p>${exp}</p>`;
          const emp = exp.empresa || exp.organizacion || 'Empresa';
          const cargo = exp.cargo || exp.puesto || exp.titulo || 'Cargo';
          const fechas = [exp.fecha_inicio || exp.ano_inicio, exp.fecha_fin || exp.ano_fin].filter(Boolean).join(' - ');
          const desc = exp.descripcion || exp.logros || '';
          
          return `
          <p style="display: flex; justify-content: space-between; margin: 0 0 2px 0; align-items: baseline;">
            <strong style="font-size: 13px;">${emp}</strong>
            <strong style="font-size: 12px;">${fechas || 'Fechas'}</strong>
          </p>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">Rol: ${cargo}</p>
          ${desc ? `<p style="margin: 0 0 15px 0; font-size: 11px; white-space: pre-wrap;">${desc}</p>` : '<p style="margin-bottom: 15px;"></p>'}
          `;
        }).join('');
      }
      return '';
    };

    const formatSobreMi = (sobreMi: any) => {
      if (typeof sobreMi === 'string') return `<p style="text-align: justify; font-size: 11px;">${sobreMi.replace(/\n/g, '<br/>')}</p>`;
      return '';
    };

    // Estilo general para los H2
    const h2Style = "font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-top: 25px; margin-bottom: 15px; letter-spacing: 1px;";

    const contactItems = [];
    if (direccion) contactItems.push(direccion);
    if (telefono) contactItems.push(telefono);
    if (email) contactItems.push(email);
    // if website exists in the future, push here.

    return `
      <div style="font-family: 'Inter', sans-serif; color: #1e293b;">
        <h1 style="text-align: center; font-size: 2.5em; font-weight: 800; margin-bottom: 5px; color: #1e293b; text-transform: uppercase;">
          ${nombre}
        </h1>
        <p style="text-align: center; margin-bottom: 30px; font-size: 11px; color: #475569;">
          ${contactItems.join(' | ')}
        </p>

        ${sobreMi ? `
        <h2 style="${h2Style}">Perfil Profesional</h2>
        ${formatSobreMi(sobreMi)}
        ` : ''}

        ${habilidades && (typeof habilidades === 'string' || Object.keys(habilidades).length > 0) ? `
        <h2 style="${h2Style}">Habilidades</h2>
        ${formatHabilidades(habilidades)}
        ` : ''}

        <h2 style="${h2Style}">Educación</h2>
        ${educacion && (typeof educacion === 'string' || Object.keys(educacion).length > 0) ? formatEducacion(educacion) : `
        <p style="display: flex; justify-content: space-between; margin: 0 0 2px 0; align-items: baseline;">
          <strong style="font-size: 13px; text-transform: uppercase;">Título obtenido</strong>
          <strong style="font-size: 12px;">Fecha de graduación</strong>
        </p>
        <p style="margin: 0 0 15px 0; font-size: 12px;">Institución Educativa</p>
        `}

        <h2 style="${h2Style}">Experiencia</h2>
        ${experiencia && (typeof experiencia === 'string' || (Array.isArray(experiencia) && experiencia.length > 0)) ? formatExperiencia(experiencia) : `
        <p style="display: flex; justify-content: space-between; margin: 0 0 2px 0; align-items: baseline;">
          <strong style="font-size: 13px;">Empresa / Organización</strong>
          <strong style="font-size: 12px;">Mes Año - Mes Año</strong>
        </p>
        <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">Rol: Cargo o Título</p>
        <ul style="margin: 0 0 15px 0; padding-left: 15px; font-size: 11px;">
          <li>Describe tu experiencia, habilidades y logros.</li>
        </ul>
        `}
      </div>
    `;
  }
};
