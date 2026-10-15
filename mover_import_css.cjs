const fs = require("fs");

if (fs.existsSync("src/index.css")) {
  let content = fs.readFileSync("src/index.css", "utf8");
  
  const importRegex = /@import\s+url\(['"]https:\/\/fonts\.googleapis\.com\/css2\?[^'"]+['"]\);?/g;
  const match = content.match(importRegex);

  if (match) {
    content = content.replace(importRegex, "").trim();
    content = `${match[0]}\n\n${content}`;
    fs.writeFileSync("src/index.css", content, "utf8");
    console.log("✅ Movido @import al principio de src/index.css sin alterar ninguna otra regla.");
  }
}
