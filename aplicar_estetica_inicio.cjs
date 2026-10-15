const fs = require('fs');

const cssPath = fs.existsSync('src/index.css') ? 'src/index.css' : (fs.existsSync('src/App.css') ? 'src/App.css' : null);

if (cssPath) {
  let css = fs.readFileSync(cssPath, 'utf8');

  const estilosFanzineInicio = `

/* ==========================================
   ESTÉTICA Y ANIMACIONES ARTESANALES (INICIO)
   ========================================== */

/* 1. Transición de entrada fluida tipo página de diario */
.page-transition, .animate-fade-in {
  animation: entradaDiario 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes entradaDiario {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 2. Tarjetas con tacto de papel y leve giro artesanal */
.editorial-card {
  background-color: rgba(255, 255, 255, 0.85) !important;
  border: 1px dashed #e8e4d9 !important;
  border-radius: 1.25rem !important;
  box-shadow: 0 2px 10px rgba(35, 33, 30, 0.03) !important;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease !important;
}

.editorial-card:hover {
  transform: translateY(-2px) rotate(-0.2deg) !important;
  box-shadow: 0 8px 24px -4px rgba(35, 33, 30, 0.08) !important;
  border-color: #23211e !important;
}

/* 3. Sub-pestañas de Inicio con respuesta táctil elástica */
.editorial-subtab, [class*="subTabInicio"] {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

button {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, border-color 0.2s ease !important;
}

button:active {
  transform: scale(0.96) !important;
}

/* 4. Portadas de libros vivas */
img[alt*="Portada"], img[src*="portada"], .portada-container {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease !important;
}

img[alt*="Portada"]:hover, img[src*="portada"]:hover, .portada-container:hover {
  transform: translateY(-4px) rotate(1.5deg) scale(1.02) !important;
  filter: drop-shadow(0 10px 15px rgba(35, 33, 30, 0.15)) !important;
}

/* 5. Barra de avance como cinta de marcapáginas */
.bg-[#23211e] {
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

/* 6. Botones de acción principal */
.editorial-btn {
  background-color: #23211e !important;
  color: #ffffee !important;
  border-radius: 9999px !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.editorial-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 14px rgba(35, 33, 30, 0.2) !important;
}

.editorial-btn:active {
  transform: scale(0.95) !important;
}
`;

  if (!css.includes('ESTÉTICA Y ANIMACIONES ARTESANALES')) {
    css += estilosFanzineInicio;
    fs.writeFileSync(cssPath, css, 'utf8');
    console.log(`✅ Estilos artesanales inyectados con éxito en ${cssPath}`);
  } else {
    console.log(`ℹ️ Los estilos artesanales ya están presentes en ${cssPath}`);
  }
}
