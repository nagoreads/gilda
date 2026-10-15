const fs = require('fs');

const cssPath = fs.existsSync('src/index.css') ? 'src/index.css' : (fs.existsSync('src/App.css') ? 'src/App.css' : null);

if (cssPath) {
  let css = fs.readFileSync(cssPath, 'utf8');

  const nuevoEstiloArtesanal = `

/* --- Transformación Estética Artesanal (Sin alterar JS) --- */

/* Quitar el aspecto de tarjetas corporativas cuadradas */
.editorial-card {
  background-color: rgba(255, 255, 255, 0.6) !important;
  border: 1px dashed #e8e4d9 !important;
  box-shadow: none !important;
  border-radius: 1rem !important;
}

.editorial-card:hover {
  background-color: rgba(255, 255, 255, 0.95) !important;
  border-color: #23211e !important;
}

/* Suavizar barras de navegación e insignias */
.bg-white {
  background-color: rgba(255, 255, 255, 0.75) !important;
}

/* Transformar botones rígidos en etiquetas tipo fanzine */
button {
  letter-spacing: -0.01em;
}

/* Líneas separadoras con tacto de lápiz/papel */
.border-[#e8e4d9] {
  border-color: #e8e4d9 !important;
}
`;

  if (!css.includes('Transformación Estética Artesanal')) {
    css += nuevoEstiloArtesanal;
    fs.writeFileSync(cssPath, css, 'utf8');
    console.log("✅ CSS global actualizado con la estética artesanal.");
  }
}
