const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Insertar el cálculo de mensajes no leídos después de 'cantidadGildasEnLinea'
const calculoBadge = `  const cantidadGildasEnLinea = usuariasClub.filter(u => {
    if (!u.ultima_conexion) return false;
    const diff = (new Date() - new Date(u.ultima_conexion)) / 1000 / 60;
    return diff < 3;
  }).length;

  // Conteo de mensajes privados no leídos dirigidos a la usuaria actual
  const mensajesPrivadosNoLeidos = chatMsgs.filter(m => 
    m.tipo === 'privado' && 
    (m.destinatario || '').toLowerCase().trim() === (sesion?.email || '').toLowerCase().trim() && 
    !m.leido
  );
  const totalPrivadosNoLeidos = mensajesPrivadosNoLeidos.length;`;

code = code.replace(/const cantidadGildasEnLinea =[\s\S]*?\}\)\.length;/, calculoBadge);

// 2. Modificar el botón "Gildas" para incluir el badge
const botonGildasViejo = `<button
                onClick={() => setChatModo('privado')}
                className={\`px-2.5 py-1 rounded text-[11px] font-medium transition-all \${
                  chatModo === 'privado' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'
                }\`}
              >
                Gildas
              </button>`;

const botonGildasNuevo = `<button
                onClick={() => setChatModo('privado')}
                className={\`px-2.5 py-1 rounded text-[11px] font-medium transition-all relative flex items-center gap-1.5 \${
                  chatModo === 'privado' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'
                }\`}
              >
                <span>Gildas</span>
                {totalPrivadosNoLeidos > 0 && chatModo !== 'privado' && (
                  <span className="w-2 h-2 rounded-full bg-[#d9534f] animate-pulse"></span>
                )}
              </button>`;

code = code.replace(botonGildasViejo, botonGildasNuevo);

// 3. Marcar como leídos al hacer clic en una socia para abrir el chat
const clickSociaViejo = `onClick={() => setDestinatarioPrivado(socia)}`;
const clickSociaNuevo = `onClick={async () => {
                    setDestinatarioPrivado(socia);
                    const noLeidosDeSocia = mensajesPrivadosNoLeidos.filter(
                      m => (m.remitente || m.email || '').toLowerCase().trim() === (socia.email || '').toLowerCase().trim()
                    );
                    if (noLeidosDeSocia.length > 0) {
                      const idsToUpdate = noLeidosDeSocia.map(m => m.id).filter(Boolean);
                      if (idsToUpdate.length > 0) {
                        await supabase.from('chat_messages').update({ leido: true }).in('id', idsToUpdate);
                        if (typeof cargarDatosSupabase === 'function') await cargarDatosSupabase();
                      }
                    }
                  }}`;

code = code.replace(clickSociaViejo, clickSociaNuevo);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Badge de mensajes no leídos y marcado de lectura aplicados con éxito.");
