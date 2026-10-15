const fs = require('fs');

// 1. Inyectar animaciones fluidas en el CSS global (src/index.css)
const cssPath = fs.existsSync('src/index.css') ? 'src/index.css' : (fs.existsSync('src/App.css') ? 'src/App.css' : null);

if (cssPath) {
  let cssCode = fs.readFileSync(cssPath, 'utf8');

  const animacionesCSS = `
/* --- Animaciones Artesanales Gilda --- */
@keyframes fadeInSuave {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-transition, .animate-fade-in {
  animation: fadeInSuave 0.25s ease-out forwards;
}

/* Elevación táctil para botones */
.editorial-btn {
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease !important;
}
.editorial-btn:hover {
  transform: translateY(-1.5px);
}
.editorial-btn:active {
  transform: scale(0.97) !important;
}

/* Tarjetas vivas con tacto de papel */
.editorial-card, .interactive-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
}
.editorial-card:hover, .interactive-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px -4px rgba(35, 33, 30, 0.06);
}
.editorial-card:active, .interactive-lift:active {
  transform: scale(0.99);
}

/* Efecto para portadas e imágenes */
img {
  transition: transform 0.3s ease-out, filter 0.3s ease-out;
}
`;

  if (!cssCode.includes('fadeInSuave')) {
    cssCode += animacionesCSS;
    fs.writeFileSync(cssPath, cssCode, 'utf8');
    console.log(`✅ Estilos globales actualizados en ${cssPath}`);
  }
}

// 2. Añadir respuesta táctil al menú inferior flotante en src/App.jsx
const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  // Ajustar los botones del nav flotante inferior para que se eleven al pasar el ratón y respondan al clic
  code = code.replace(
    /className=\{\`px-3 py-1\.5 rounded-lg text-xs font-medium font-sans transition-all capitalize min-h-\[40px\]/g,
    'className={`px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-all duration-200 hover:-translate-y-0.5 active:scale-95 capitalize min-h-[40px]'
  );

  fs.writeFileSync(appPath, code, 'utf8');
  console.log('✅ Menú de navegación inferior actualizado con microinteracciones.');
}
