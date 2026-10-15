const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Asegurar importación de useEffect
if (!code.includes("useEffect")) {
  code = code.replace(
    "import { useState, useRef } from 'react';",
    "import { useState, useRef, useEffect } from 'react';"
  );
}

// 2. Inyectar lógica de conteo y efectos tras 'chatEndRef'
const anchorRef = "const chatEndRef = useRef(null);";
const idxRef = code.indexOf(anchorRef);

if (idxRef !== -1) {
  const hooksBlock = `const chatEndRef = useRef(null);

  // Conteo global de mensajes privados no leídos
  const mensajesPrivadosNoLeidos = chatMsgs.filter(m => 
    m.tipo === 'privado' && 
    (m.destinatario || '').toLowerCase().trim() === (sesion?.email || '').toLowerCase().trim() && 
    !m.leido
  );
  const totalPrivadosNoLeidos = mensajesPrivadosNoLeidos.length;

  // Scroll automático
  useEffect(() => {
    if (subTabComunidad === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMsgs, chatModo, subTabComunidad, destinatarioPrivado]);

  // Marcado de leídos al abrir conversación
  useEffect(() => {
    if (chatModo === 'privado' && destinatarioPrivado) {
      const emailSocia = (destinatarioPrivado.email || '').toLowerCase().trim();
      const miEmail = (sesion?.email || '').toLowerCase().trim();

      // Apagado optimista local
      chatMsgs.forEach(m => {
        const rem = (m.remitente || m.email || '').toLowerCase().trim();
        const dest = (m.destinatario || '').toLowerCase().trim();
        if (m.tipo === 'privado' && dest === miEmail && rem === emailSocia) {
          m.leido = true;
        }
      });

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

  // Reemplazar la declaración simple de chatEndRef por el bloque completo si no está ya
  if (!code.includes("const mensajesPrivadosNoLeidos =")) {
    code = code.replace(anchorRef, hooksBlock);
  }
}

// 3. Reemplazar el botón "Gildas" para mantener el punto rojo visible mientras haya mensajes sin leer
const botonViejoPattern = /<button\s+onClick=\{\(\)\s*=>\s*setChatModo\('privado'\)\}[\s\S]*?<\/button>/;
const botonNuevo = `<button
                onClick={() => {
                  setChatModo('privado');
                  if (mensajesPrivadosNoLeidos.length > 0) {
                    const primerNoLeido = mensajesPrivadosNoLeidos[0];
                    const emailRemitente = (primerNoLeido.remitente || primerNoLeido.email || '').toLowerCase().trim();
                    const sociaDirecta = usuariasClub.find(u => (u.email || '').toLowerCase().trim() === emailRemitente);
                    if (sociaDirecta) setDestinatarioPrivado(sociaDirecta);
                  }
                }}
                className={\`px-2.5 py-1 rounded text-[11px] font-medium transition-all relative flex items-center gap-1.5 \${
                  chatModo === 'privado' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'
                }\`}
              >
                <span>Gildas</span>
                {totalPrivadosNoLeidos > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#d9534f] animate-pulse"></span>
                )}
              </button>`;

code = code.replace(botonViejoPattern, botonNuevo);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Sistema de badge y notificación reconstruido con éxito.");
