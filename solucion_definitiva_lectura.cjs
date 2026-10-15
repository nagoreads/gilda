const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Inyectar efecto de apagado instantáneo local + sincronización con Supabase
const efectoLecturaDirecta = `  useEffect(() => {
    if (chatModo === 'privado' && destinatarioPrivado) {
      const emailSocia = (destinatarioPrivado.email || '').toLowerCase().trim();
      const miEmail = (sesion?.email || '').toLowerCase().trim();

      // Apagado optimista local para eliminar el punto rojo al instante
      chatMsgs.forEach(m => {
        if (
          m.tipo === 'privado' &&
          (m.destinatario || '').toLowerCase().trim() === miEmail &&
          (m.remitente || m.email || '').toLowerCase().trim() === emailSocia
        ) {
          m.leido = true;
        }
      });

      const unreadMsgs = chatMsgs.filter(m =>
        m.tipo === 'privado' &&
        (m.destinatario || '').toLowerCase().trim() === miEmail &&
        (m.remitente || m.email || '').toLowerCase().trim() === emailSocia &&
        !m.leido
      );

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

if (!code.includes("Apagado optimista local")) {
  code = code.replace("  const chatEndRef = useRef(null);", `  const chatEndRef = useRef(null);\n${efectoLecturaDirecta}`);
}

// 2. Modificar el botón 'Gildas' para auto-abrir la conversación de quien te escribió
const clickBotonGildasViejo = `onClick={() => setChatModo('privado')}`;
const clickBotonGildasNuevo = `onClick={() => {
                setChatModo('privado');
                if (mensajesPrivadosNoLeidos.length > 0) {
                  const primerNoLeido = mensajesPrivadosNoLeidos[0];
                  const emailRemitente = (primerNoLeido.remitente || primerNoLeido.email || '').toLowerCase().trim();
                  const sociaDirecta = usuariasClub.find(u => (u.email || '').toLowerCase().trim() === emailRemitente);
                  if (sociaDirecta) setDestinatarioPrivado(sociaDirecta);
                }
              }}`;

code = code.replace(clickBotonGildasViejo, clickBotonGildasNuevo);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Auto-apertura y apagado instantáneo de notificaciones configurados.");
