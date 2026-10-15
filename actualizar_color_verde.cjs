const fs = require('fs');

// 1. Actualizar el verde en src/MapaGilda.jsx
const mapaPath = 'src/MapaGilda.jsx';
if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');
  code = code.replace(/#58641d/gi, '#849673');
  code = code.replace(/fill="var\(--primary-olive\)"/gi, 'fill="#849673"');
  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ Color verde de las piruletas actualizado a #849673 en src/MapaGilda.jsx");
}

// 2. Actualizar la variable de color en los archivos CSS globales
['src/index.css', 'src/App.css'].forEach(cssPath => {
  if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');
    css = css.replace(/--primary-olive:\s*[^;]+;/g, '--primary-olive: #849673;');
    css = css.replace(/#58641d/gi, '#849673');
    fs.writeFileSync(cssPath, css, 'utf8');
    console.log(`✅ Variable de verde actualizada en ${cssPath}`);
  }
});
