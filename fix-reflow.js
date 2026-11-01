const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let modifiedFiles = 0;

walkDir('src', (filePath) => {
  if (!/\.(jsx|js|tsx)$/.test(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;

  // Encapsular modificaciones directas de scroll en requestAnimationFrame
  updated = updated.replace(/([^a-zA-Z0-9_])(e|el|elem|ref|node|chatRef|messagesEndRef|div|container|muroRef)\.current\.(scrollTop\s*=\s*[^;]+;)/g, (match, p1, p2, p3) => {
    return `${p1}requestAnimationFrame(() => { if (${p2}.current) ${p2}.current.${p3} });`;
  });

  updated = updated.replace(/([^a-zA-Z0-9_])(e|el|elem|ref|node|chatRef|messagesEndRef|div|container|muroRef)\.current\.scrollTo\(([^)]+)\);/g, (match, p1, p2, p3) => {
    return `${p1}requestAnimationFrame(() => { if (${p2}.current) ${p2}.current.scrollTo(${p3}); });`;
  });

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('✅ Forced Reflow optimizado en:', filePath);
    modifiedFiles++;
  }
});

console.log(`\n🎉 Escaneo de rendimiento finalizado. Archivos actualizados: ${modifiedFiles}`);
