const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// Reemplazar la lógica de coincidencia para que abarque cualquier variante de email/remitente
const viejoEfecto = /useEffect\(\(\) => \{[\s\S]*?if \(chatModo === 'privado' && destinatarioPrivado\)[\s\S]*?\}, [chatModo, destinatarioPrivado, chatMsgs]\);/;

const nuevoEfecto = `useEffect(() => {
    if (chatModo === 'privado' && destinatarioPrivado) {
      const emailSocia = (destinatarioPrivado.email || '').toLowerCase().trim();
      const miEmail = (sesion?.email || '').toLowerCase().trim();

      // 1. Apagado optimista local de la socia actual
      chatMsgs.forEach(m => {
        const rem = (m.remitente || m.email || '').toLowerCase().trim();
        const dest = (m.destinatario || '').toLowerCase().trim();
        if (m.tipo === 'privado' && dest === miEmail && rem === emailSocia) {
          m.leido = true;
        }
      });

      // 2. Actualizar en Supabase los mensajes de esta socia
      const unreadMsgs = chatMsgs.filter(m => {
        const rem = (m.remitente || m.email || '').toLowerCase().trim();
        const dest = (m.destinatario || '').toLowerCase().trim();
        return m.tipo === 'privado' && dest === miEmail && rem === emailSocia && !m.leido;
      });

      if (unreadMsgs.length > 0) {
        const ids = unreadMsgs.map(m => m.id).filter(Boolean);
        if (ids.length > 0) {
          supabase.from('chat_messages').update({ leido: true }).in('id', ids).then(() => {
            if (typeof cargarDatosSupabase === 'function') cargarDatosSupabase();
          });
        }
      }
    }
  }, [chatModo, destinatarioPrivado, chatMsgs]);`;

if (viejoEfecto.test(code)) {
  code = code.replace(viejoEfecto, nuevoEfecto);
  fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
  console.log("✅ Lógica de apagar notificación global actualizada.");
} else {
  console.log("ℹ️ No se detectó la estructura previa.");
}
