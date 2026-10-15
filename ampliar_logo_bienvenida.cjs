const fs = require('fs');

const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  // Reemplazar cualquier tamaño anterior de la imagen en la pantalla de bienvenida por w-36 h-36 o w-40 h-40 para que sea más acogedor y grande
  code = code.replace(/<img src="\/icon-192\.png" alt="Gilda" className="[^"]*" \/>/g, '<img src="/icon-192.png" alt="Gilda" className="w-40 h-40 object-contain" />');

  fs.writeFileSync(appPath, code, 'utf8');
  console.log("✅ ¡Logo ampliado a un tamaño acogedor (w-40 h-40) con éxito en src/App.jsx!");
} else {
  console.log("❌ No se encontró el archivo src/App.jsx");
}
