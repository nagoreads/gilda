const fs = require('fs');
const path = require('path');

console.log("=== 🛠️ APLICANDO AJUSTES FINALES DE AUDITORÍA (GILDA) ===");

// 1. REVISAR Y CORREGIR WEBHOOK DE STRIPE SI EXISTE
const stripePaths = ['api/stripe-webhook.js', 'src/api/stripe-webhook.js', 'api/webhook.js'];
let stripeEncontrado = false;

for (const p of stripePaths) {
  if (fs.existsSync(p)) {
    stripeEncontrado = true;
    let code = fs.readFileSync(p, 'utf8');

    if (!code.includes('bodyParser: false')) {
      const configExport = `\nexport const config = {\n  api: {\n    bodyParser: false,\n  },\n};\n`;
      code = configExport + code;
      fs.writeFileSync(p, code, 'utf8');
      console.log(`✅ Configuración bodyParser: false añadida a: ${p}`);
    } else {
      console.log(`✅ Webhook de Stripe en ${p} ya cuenta con bodyParser deshabilitado.`);
    }
  }
}

if (!stripeEncontrado) {
  console.log("ℹ️ No se detectó archivo de webhook de Stripe local en la carpeta api/. Asegúrate de configurarlo si procesas suscripciones via Serverless.");
}

// 2. COMPROBAR CONFIGURACIÓN DEL MANIFEST.JSON PARA EL NUEVO ICONO
const manifestPath = 'public/manifest.json';
if (fs.existsSync(manifestPath)) {
  let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  manifest.name = "Gilda — Club de Lectura";
  manifest.short_name = "Gilda";
  manifest.theme_color = "#fbf9f5";
  manifest.background_color = "#fbf9f5";
  manifest.display = "standalone";

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log("✅ public/manifest.json verificado y alineado con la identidad visual #fbf9f5.");
}

// 3. AVISO DE CHECKLIST MANUAL DE ENTORNO
console.log("\n--- 📋 LISTA DE COMPROBACIÓN FINAL EN PANELES EXTERNOS ---");
console.log("1. Vercel Dashboard -> Settings -> Environment Variables:");
console.log("   - VITE_SUPABASE_URL");
console.log("   - VITE_SUPABASE_ANON_KEY");
console.log("   - VAPID_PUBLIC_KEY (o VITE_VAPID_PUBLIC_KEY)");
console.log("   - STRIPE_SECRET_KEY & STRIPE_WEBHOOK_SECRET");
console.log("   - CRON_SECRET");
console.log("2. Cron-Job.org:");
console.log("   - Añadir la cabecera HTTP: 'Authorization: Bearer <TU_CRON_SECRET>'");
console.log("3. Icono de App:");
console.log("   - Guarda la imagen de la 'G' floral como 'public/icon-192.png' y 'public/icon-512.png'.");

