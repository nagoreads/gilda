const fs = require("fs");
let code = fs.readFileSync("vite.config.js", "utf8");

if (!code.includes("envPrefix")) {
  code = code.replace(
    "defineConfig({",
    "defineConfig({\n  envPrefix: ['VITE_', 'VAPID_'],"
  );
  fs.writeFileSync("vite.config.js", code);
  console.log("✅ vite.config.js actualizado para reconocer VAPID_PUBLIC_KEY.");
} else {
  console.log("ℹ️ envPrefix ya estaba configurado.");
}
