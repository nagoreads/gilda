const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");

// Añadir el estado mensajeRespuesta si no está presente en el componente
if (!code.includes("const [mensajeRespuesta, setMensajeRespuesta]")) {
  code = code.replace(
    "const [nuevoChat, setNuevoChat] = useState('');",
    "const [nuevoChat, setNuevoChat] = useState('');\n  const [mensajeRespuesta, setMensajeRespuesta] = useState(null);"
  );
  fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
  console.log("✅ Estado 'mensajeRespuesta' añadido correctamente a SeccionComunidad.jsx.");
} else {
  console.log("ℹ️ El estado ya estaba presente.");
}
