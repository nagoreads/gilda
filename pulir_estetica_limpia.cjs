const fs = require('fs');

const cssPath = fs.existsSync('src/index.css') ? 'src/index.css' : (fs.existsSync('src/App.css') ? 'src/App.css' : null);

if (cssPath) {
  let css = fs.readFileSync(cssPath, 'utf8');

  // 1. Eliminar bloque antiguo de animaciones exageradas si existe
  if (css.includes('ESTÉTICA Y ANIMACIONES ARTESANALES')) {
    css = css.split('/* ==========================================')[0];
  }

  // 2. Inyectar reglas limpias, elegantes y coherentes
  const estilosLimpios = `

/* ==========================================
   DISEÑO ARTESANAL GILDA - ESTILOS LIMPIOS
   ========================================== */

/* Entrada suave de contenido sin saltos bruscos */
.page-transition, .animate-fade-in {
  animation: fadeInEditorial 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInEditorial {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Tarjetas con acabado de papel cálido */
.editorial-card {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out !important;
}

.editorial-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 16px rgba(35, 33, 30, 0.04) !important;
  border-color: #23211e !important;
}

/* Portadas de libros con sombra suave */
img[alt*="Portada"], img[src*="portada"] {
  transition: transform 0.25s ease-out, filter 0.25s ease-out !important;
}

img[alt*="Portada"]:hover, img[src*="portada"]:hover {
  transform: translateY(-3px) !important;
  filter: drop-shadow(0 6px 12px rgba(35, 33, 30, 0.12)) !important;
}

/* Botones y pestañas elásticas */
.editorial-btn, button {
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease !important;
}

button:active {
  transform: scale(0.97) !important;
}

.editorial-btn:hover {
  transform: translateY(-1.5px) !important;
}
`;

  css += estilosLimpios;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log("✅ CSS pulido y estilizado sin deformaciones.");
}
