const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

const cleanRender = `{m.respuesta_a_texto && (
                <div className="mb-1.5 p-1.5 bg-[#23211e]/5 border-l-2 border-[#23211e] text-[10px] text-gray-600 rounded-r">
                  <span className="font-bold text-[#23211e]">{m.respuesta_a_nombre || 'gilda'}:</span>
                  <p className="truncate">{m.respuesta_a_texto}</p>
                </div>
              )}
              <span className="block pr-6 pb-0.5">{m.mensaje}</span>`;

// Reemplaza desde el primer {m.respuesta_a_texto hasta el </span> del mensaje, atrapando todas las repeticiones
const regexConCita = /(\{m\.respuesta_a_texto[\s\S]*?)(<span className="block pr-6 pb-0\.5">\{m\.mensaje\}<\/span>)/g;

if (regexConCita.test(code)) {
  code = code.replace(regexConCita, cleanRender);
  fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
  console.log("✅ Citas duplicadas eliminadas. Ahora solo queda 1 cita limpia por mensaje.");
} else {
  // Si no había citas en el código, inyectamos la cita limpia sobre el span
  code = code.split('<span className="block pr-6 pb-0.5">{m.mensaje}</span>').join(cleanRender);
  fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
  console.log("✅ Cita limpia inyectada correctamente.");
}
