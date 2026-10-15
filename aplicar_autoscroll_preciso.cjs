const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Añadir useEffect a las importaciones de React
code = code.replace(
  "import { useState, useRef } from 'react';",
  "import { useState, useRef, useEffect } from 'react';"
);

// 2. Añadir el hook useEffect justo después de chatEndRef
const efectoScroll = `  const chatEndRef = useRef(null);

  useEffect(() => {
    if (subTabComunidad === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMsgs, chatModo, subTabComunidad, destinatarioPrivado]);`;

code = code.replace("  const chatEndRef = useRef(null);", efectoScroll);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Scroll automático configurado con precisión.");
