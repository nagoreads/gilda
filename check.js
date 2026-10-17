import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk('src');
files.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const importLines = content.split('\n').filter(l => l.trim().startsWith('import')).join('\n');
  const bodyCode = content.split('\n').filter(l => !l.trim().startsWith('import')).join('\n');

  ['useState', 'useEffect', 'useMemo', 'useRef'].forEach((hook) => {
    const isUsedInBody = bodyCode.includes(hook) && !bodyCode.includes(`React.${hook}`);
    const isImported = importLines.includes(hook);
    if (isUsedInBody && !isImported) {
      console.log(`FALTA ${hook} EN: ${filePath}`);
    }
  });
});