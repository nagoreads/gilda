const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Añadir el useEffect de marcado automático al estar dentro de la conversación privada
const efectoMarcadoLectura = `  useEffect(() => {
    if (chatModo === 'privado' && destinatarioPrivado) {
      const unreadMsgs = chatMsgs.filter(m => 
        m.tipo === 'privado' &&
        (m.destinatario || '').toLowerCase().trim() === (sesion?.email || '').toLowerCase().trim() &&
        (m.remitente || m.email || '').toLowerCase().trim() === (destinatarioPrivado.email || '').toLowerCase().trim() &&
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

if (!code.includes("unreadMsgs")) {
  code = code.replace("  const chatEndRef = useRef(null);", `  const chatEndRef = useRef(null);\n${efectoMarcadoLectura}`);
}

// 2. Mostrar la etiqueta "1 nuevo" junto a la socia que ha enviado un mensaje
const renderSociaViejo = `<span className="text-xs text-[#23211e] font-medium bg-[#ffffee] px-2.5 py-1 rounded-lg border border-[#e8e4d9]">
                      Mensaje
                    </span>`;

const renderSociaNuevo = `{(() => {
                      const unreadFromSocia = chatMsgs.filter(m =>
                        m.tipo === 'privado' &&
                        (m.destinatario || '').toLowerCase().trim() === (sesion?.email || '').toLowerCase().trim() &&
                        (m.remitente || m.email || '').toLowerCase().trim() === (socia.email || '').toLowerCase().trim() &&
                        !m.leido
                      ).length;

                      return (
                        <div className="flex items-center gap-2">
                          {unreadFromSocia > 0 && (
                            <span className="px-2 py-0.5 text-[10px] bg-[#d9534f] text-white font-bold rounded-full animate-pulse">
                              {unreadFromSocia} nuevo{unreadFromSocia > 1 ? 's' : ''}
                            </span>
                          )}
                          <span className="text-xs text-[#23211e] font-medium bg-[#ffffee] px-2.5 py-1 rounded-lg border border-[#e8e4d9]">
                            Mensaje
                          </span>
                        </div>
                      );
                    })()}`;

code = code.replace(renderSociaViejo, renderSociaNuevo);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Sistema de lectura automática y badge por socia aplicados con éxito.");
