const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Leer variables de entorno desde .env o .env.local
let envContent = '';
if (fs.existsSync('.env.local')) envContent = fs.readFileSync('.env.local', 'utf8');
else if (fs.existsSync('.env')) envContent = fs.readFileSync('.env', 'utf8');

const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim().replace(/['"]/g, '') : '';
const key = keyMatch ? keyMatch[1].trim().replace(/['"]/g, '') : '';

if (!url || !key) {
  console.log("❌ No se encontraron VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function probar() {
  console.log("🔍 Probando inserción en 'chat_messages' con campos de respuesta...");
  const { data, error } = await supabase.from('chat_messages').insert([{
    mensaje: "Mensaje de prueba de respuesta",
    usuario: "test_gilda",
    tipo: "global",
    timestamp: new Date().toISOString(),
    respuesta_a_id: "123",
    respuesta_a_texto: "Texto de prueba citado",
    respuesta_a_nombre: "gilda_test"
  }]);

  if (error) {
    console.log("\n❌ ERROR DE SUPABASE ENCONTRADO:");
    console.log("Mensaje de error:", error.message);
    console.log("Código de error:", error.code);
    console.log("Detalles:", error.details);
    console.log("Sugerencia:", error.hint);
  } else {
    console.log("\n✅ ¡La inserción en Supabase ha funcionado correctamente sin errores!");
  }
}

probar();
