const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Modificar el mapeo para ORDENAR las socias situando a las que tienen mensajes no leídos ARRIBA DEL TODO
const mapViejo = `{usuariasClub.filter(u => (u.email || '').toLowerCase().trim() !== sesion?.email?.toLowerCase()).map((socia, sIdx) => {`;

const mapNuevo = `{usuariasClub
                .filter(u => (u.email || '').toLowerCase().trim() !== sesion?.email?.toLowerCase())
                .sort((a, b) => {
                  const unreadA = chatMsgs.filter(m => m.tipo === 'privado' && (m.destinatario || '').toLowerCase().trim() === (sesion?.email || '').toLowerCase().trim() && (m.remitente || m.email || '').toLowerCase().trim() === (a.email || '').toLowerCase().trim() && !m.leido).length;
                  const unreadB = chatMsgs.filter(m => m.tipo === 'privado' && (m.destinatario || '').toLowerCase().trim() === (sesion?.email || '').toLowerCase().trim() && (m.remitente || m.email || '').toLowerCase().trim() === (b.email || '').toLowerCase().trim() && !m.leido).length;
                  return unreadB - unreadA; // Muestra las socias con mensajes no leídos arriba
                })
                .map((socia, sIdx) => {`;

code = code.replace(mapViejo, mapNuevo);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Socias con mensajes no leídos reordenadas a la parte superior.");
